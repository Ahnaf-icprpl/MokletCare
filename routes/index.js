var express = require('express');
var router = express.Router();
var db = require('../db');
var multer = require('multer');
var path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const rateLimit = require('express-rate-limit');
const { clerkClient, getAuth } = require('@clerk/express');

// Rate limiter for image uploads (10 per hour per user)
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => {
    return (req.user && req.user.emails && req.user.emails[0]) ? req.user.emails[0].value : 'anonymous';
  },
  message: { error: 'Too many uploads. Please try again in an hour.' }
});

// Rate limiter for submitting reports (10 per hour per user)
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => {
    return (req.user && req.user.emails && req.user.emails[0]) ? req.user.emails[0].value : 'anonymous';
  },
  message: 'You have submitted too many reports recently. Please wait an hour before submitting another.'
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'mokletcare_reports',
    allowedFormats: ['jpg', 'png', 'jpeg', 'webp'],
  },
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
    }
  }
});

// In-memory cache for Clerk user profile data (TTL: 5 minutes)
const userProfileCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getCachedClerkUser(userId) {
  const cached = userProfileCache.get(userId);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.clerkUser;
  }
  const clerkUser = await clerkClient.users.getUser(userId);
  userProfileCache.set(userId, { clerkUser, expiresAt: Date.now() + CACHE_TTL_MS });
  return clerkUser;
}

function clearUserCache(userId) {
  if (userId) {
    userProfileCache.delete(userId);
  } else {
    userProfileCache.clear();
  }
}

async function ensureAuthenticated(req, res, next) {
  const auth = getAuth(req);
  if (!auth || !auth.userId) {
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }
    return res.redirect('/login');
  }

  try {
    let primaryEmail = '';
    let fullName = '';

    // Fast path: Extract user profile directly from verified JWT session claims
    if (auth.sessionClaims) {
      primaryEmail = auth.sessionClaims.email || auth.sessionClaims.primary_email || (auth.sessionClaims.email_addresses && auth.sessionClaims.email_addresses[0]) || '';
      fullName = (auth.sessionClaims.first_name || auth.sessionClaims.last_name)
        ? `${auth.sessionClaims.first_name || ''} ${auth.sessionClaims.last_name || ''}`.trim()
        : (auth.sessionClaims.username || (primaryEmail ? primaryEmail.split('@')[0] : ''));
    }

    // Fallback to cached Clerk user if claims were not embedded
    if (!primaryEmail) {
      const clerkUser = await getCachedClerkUser(auth.userId);
      const primaryEmailObj = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId) 
        || clerkUser.emailAddresses[0];
      primaryEmail = primaryEmailObj ? primaryEmailObj.emailAddress : '';
      fullName = (clerkUser.firstName || clerkUser.lastName)
        ? `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim()
        : (clerkUser.username || (primaryEmail ? primaryEmail.split('@')[0] : 'User'));
    }

    // Check if user's email is an admin email from process.env (ADMIN_EMAIL or ADMIN_EMAILS)
    const adminEmails = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);

    const isAdminEmail = primaryEmail && adminEmails.includes(primaryEmail.toLowerCase());

    let userRole = 'reporter';

    const userDbRes = await db.query('SELECT role FROM users WHERE id = $1', [auth.userId]);
    if (userDbRes.rows.length > 0) {
      userRole = userDbRes.rows[0].role || 'reporter';
      if (isAdminEmail && userRole !== 'admin') {
        userRole = 'admin';
        await db.query('UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2', ['admin', auth.userId]);
      }
    } else {
      userRole = isAdminEmail ? 'admin' : 'reporter';
      await db.query(
        `INSERT INTO users (id, email, name, role) VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, role = EXCLUDED.role`,
        [auth.userId, primaryEmail, fullName || 'User', userRole]
      );
    }

    req.user = {
      id: auth.userId,
      displayName: fullName || 'User',
      emails: [{ value: primaryEmail }],
      role: userRole
    };
    return next();
  } catch (err) {
    console.error('Error in authentication middleware:', err);
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.status(401).json({ error: 'Authentication failed.' });
    }
    return res.redirect('/login');
  }
}

function ensureRole(...allowedRoles) {
  return function(req, res, next) {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
        return res.status(403).json({ error: 'Forbidden: Insufficient privileges.' });
      }
      return res.redirect('/?error=' + encodeURIComponent('Access denied. You do not have permission to view that page.'));
    }
    next();
  };
}

router.get('/login', function(req, res, next) {
  const auth = getAuth(req);
  if (auth && auth.userId) {
    return res.redirect('/');
  }
  res.render('login', { 
    title: 'Login | MokletCare',
    clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''
  });
});

router.get('/sso-callback', function(req, res, next) {
  res.render('sso-callback', {
    title: 'Authenticating | MokletCare',
    clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''
  });
});

router.get('/', ensureAuthenticated, async function(req, res, next) {
  try {
    const result = await db.query('SELECT * FROM dropdown_options ORDER BY sort_order ASC');
    const facilities = result.rows.filter(r => r.category === 'facility');
    const items = result.rows.filter(r => r.category === 'item');
    const damageTypes = result.rows.filter(r => r.category === 'damage_type');
    const urgencies = result.rows.filter(r => r.category === 'urgency');
    res.render('index', { 
      user: req.user,
      facilities,
      items,
      damageTypes,
      urgencies,
      clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
      error: req.query.error || null
    });
  } catch (err) {
    next(err);
  }
});

// In-memory option map cache for dropdown options (TTL: 10 minutes)
let cachedOptionMap = null;
let optionMapExpiresAt = 0;

async function getOptionLabelMap() {
  if (cachedOptionMap && Date.now() < optionMapExpiresAt) {
    return cachedOptionMap;
  }
  try {
    const result = await db.query('SELECT value, label FROM dropdown_options');
    const map = {};
    result.rows.forEach(row => {
      map[row.value] = row.label;
    });
    cachedOptionMap = map;
    optionMapExpiresAt = Date.now() + (10 * 60 * 1000);
    return map;
  } catch (err) {
    return cachedOptionMap || {};
  }
}

function formatOptionText(val, optionMap) {
  if (!val) return '';
  if (optionMap && optionMap[val]) {
    return optionMap[val];
  }
  return val
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

router.get('/dashboard', ensureAuthenticated, ensureRole('admin', 'staff'), async function(req, res, next) {
  try {
    const optionMap = await getOptionLabelMap();

    // 1. Parse query parameters for Reports
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;
    const statusFilter = typeof req.query.status === 'string' ? req.query.status.trim() : 'unresolved';
    const searchQuery = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    // 2. Build Reports SQL query with dynamic WHERE, LIMIT, OFFSET, COUNT(*) OVER()
    let reportWhere = [];
    let reportParams = [];
    let paramIdx = 1;

    const allowedStatuses = ['pending', 'in_progress', 'resolved', 'rejected'];
    if (statusFilter === 'unresolved' || statusFilter === 'all_except_resolved') {
      reportWhere.push(`status != $${paramIdx++}`);
      reportParams.push('resolved');
    } else if (allowedStatuses.includes(statusFilter)) {
      reportWhere.push(`status = $${paramIdx++}`);
      reportParams.push(statusFilter);
    }

    if (searchQuery) {
      reportWhere.push(`(room_location ILIKE $${paramIdx} OR item_type ILIKE $${paramIdx} OR facility_type ILIKE $${paramIdx} OR damage_type ILIKE $${paramIdx} OR reporter_name ILIKE $${paramIdx} OR reporter_email ILIKE $${paramIdx} OR damage_description ILIKE $${paramIdx})`);
      reportParams.push(`%${searchQuery}%`);
      paramIdx++;
    }

    const reportWhereClause = reportWhere.length > 0 ? 'WHERE ' + reportWhere.join(' AND ') : '';

    reportParams.push(limit, offset);
    const reportsSql = `
      SELECT *, COUNT(*) OVER()::int as full_count 
      FROM reports 
      ${reportWhereClause} 
      ORDER BY created_at DESC 
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `;

    const [reportsRes, statsRes] = await Promise.all([
      db.query(reportsSql, reportParams),
      db.query(`
        SELECT 
          COUNT(*)::int as total,
          COUNT(*) FILTER (WHERE status = 'pending')::int as pending,
          COUNT(*) FILTER (WHERE status = 'in_progress')::int as in_progress,
          COUNT(*) FILTER (WHERE status = 'resolved')::int as resolved,
          COUNT(*) FILTER (WHERE status = 'rejected')::int as rejected
        FROM reports;
      `)
    ]);

    const reports = reportsRes.rows;
    const totalReportsMatching = reports.length > 0 ? reports[0].full_count : 0;
    const totalReportPages = Math.ceil(totalReportsMatching / limit) || 1;
    const stats = statsRes.rows[0];

    // 3. User Management Pagination & Fuzzy Search (Admin only)
    let users = [];
    let userPage = 1;
    let userLimit = 10;
    let totalUserMatching = 0;
    let totalUserPages = 1;
    let userSearchQuery = '';

    if (req.user.role === 'admin') {
      userPage = Math.max(1, parseInt(req.query.user_page, 10) || 1);
      userLimit = Math.max(1, Math.min(100, parseInt(req.query.user_limit, 10) || 10));
      const userOffset = (userPage - 1) * userLimit;
      userSearchQuery = typeof req.query.user_q === 'string' ? req.query.user_q.trim() : '';

      let userWhere = [];
      let userParams = [];
      let uParamIdx = 1;

      if (userSearchQuery) {
        userWhere.push(`(name ILIKE $${uParamIdx} OR email ILIKE $${uParamIdx} OR role ILIKE $${uParamIdx})`);
        userParams.push(`%${userSearchQuery}%`);
        uParamIdx++;
      }

      const userWhereClause = userWhere.length > 0 ? 'WHERE ' + userWhere.join(' AND ') : '';

      userParams.push(userLimit, userOffset);
      const usersSql = `
        SELECT id, email, name, role, created_at, COUNT(*) OVER()::int as full_count 
        FROM users 
        ${userWhereClause} 
        ORDER BY created_at DESC 
        LIMIT $${uParamIdx++} OFFSET $${uParamIdx++}
      `;

      const usersRes = await db.query(usersSql, userParams);
      users = usersRes.rows;
      totalUserMatching = users.length > 0 ? users[0].full_count : 0;
      totalUserPages = Math.ceil(totalUserMatching / userLimit) || 1;
    }

    res.render('dashboard', {
      user: req.user,
      reports,
      stats,
      reportPagination: {
        page,
        limit,
        totalItems: totalReportsMatching,
        totalPages: totalReportPages,
        status: statusFilter,
        q: searchQuery
      },
      users,
      userPagination: {
        page: userPage,
        limit: userLimit,
        totalItems: totalUserMatching,
        totalPages: totalUserPages,
        q: userSearchQuery
      },
      error: req.query.error || null,
      success: req.query.success || null,
      optionMap,
      formatOptionText,
      clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''
    });
  } catch (err) {
    next(err);
  }
});

router.post('/dashboard/reports/:id/status', ensureAuthenticated, ensureRole('admin', 'staff'), async function(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowedStatuses = ['pending', 'in_progress', 'resolved', 'rejected'];

    if (!allowedStatuses.includes(status)) {
      return res.redirect('/dashboard?error=' + encodeURIComponent('Invalid status specified.'));
    }

    await db.query('UPDATE reports SET status = $1, updated_at = NOW() WHERE id = $2', [status, id]);
    const referer = req.get('Referer');
    if (referer && referer.includes('/dashboard')) {
      return res.redirect(referer);
    }
    res.redirect('/dashboard?success=' + encodeURIComponent('Report status updated successfully.'));
  } catch (err) {
    next(err);
  }
});

router.post('/dashboard/users/:id/role', ensureAuthenticated, ensureRole('admin'), async function(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const allowedRoles = ['reporter', 'staff', 'admin'];

    if (!allowedRoles.includes(role)) {
      return res.redirect('/dashboard?error=' + encodeURIComponent('Invalid role specified.'));
    }

    await db.query('UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2', [role, id]);
    clearUserCache(id);

    // Also sync with Clerk publicMetadata
    try {
      await clerkClient.users.updateUserMetadata(id, {
        publicMetadata: { role: role }
      });
    } catch (clerkErr) {
      console.warn('Could not sync role to Clerk publicMetadata:', clerkErr.message);
    }

    const referer = req.get('Referer');
    if (referer && referer.includes('/dashboard')) {
      return res.redirect(referer);
    }
    res.redirect('/dashboard?success=' + encodeURIComponent('User role updated successfully.'));
  } catch (err) {
    next(err);
  }
});

router.post('/upload-image', ensureAuthenticated, uploadLimiter, function(req, res, next) {
  upload.single('file')(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size exceeds the 5MB limit.' });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message || 'File upload failed.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }
    res.json({ url: req.file.path });
  });
});

router.post('/report', ensureAuthenticated, reportLimiter, async function(req, res, next) {
  try {
    // Secure identity enforcement directly from JWT token / session
    const reporter_name = req.user.displayName || 'Anonymous';
    const reporter_email = (req.user.emails && req.user.emails[0] && req.user.emails[0].value) ? req.user.emails[0].value : 'anonymous@school.id';

    // Strict input sanitization and bounds checking
    const room = typeof req.body.room === 'string' ? req.body.room.trim() : '';
    const facility = typeof req.body.facility === 'string' ? req.body.facility.trim() : '';
    const item = typeof req.body.item === 'string' ? req.body.item.trim() : '';
    const other_item = typeof req.body.other_item === 'string' ? req.body.other_item.trim() : '';
    const damage_type = typeof req.body.damage_type === 'string' ? req.body.damage_type.trim() : '';
    const urgency = typeof req.body.urgency === 'string' ? req.body.urgency.trim() : '';
    const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
    const photo_path = typeof req.body.photo_path === 'string' ? req.body.photo_path.trim() : '';

    const finalItem = (item === 'other' && other_item) ? other_item : item;

    // Server-side validation with user-friendly error redirects
    if (!room || room.length > 100) {
      return res.redirect('/?error=' + encodeURIComponent('Please specify a valid location / room.'));
    }
    if (!facility || facility.length > 100) {
      return res.redirect('/?error=' + encodeURIComponent('Please select a facility type.'));
    }
    if (!finalItem || finalItem.length > 100) {
      return res.redirect('/?error=' + encodeURIComponent('Please select or specify a damaged item.'));
    }
    if (!damage_type || damage_type.length > 100) {
      return res.redirect('/?error=' + encodeURIComponent('Please select a damage type.'));
    }
    if (!urgency || urgency.length > 50) {
      return res.redirect('/?error=' + encodeURIComponent('Please select an urgency level.'));
    }
    if (!description || description.length > 2000) {
      return res.redirect('/?error=' + encodeURIComponent('Please provide a damage description (up to 2000 characters).'));
    }
    if (!photo_path || photo_path.length > 1000 || !/^https?:\/\//i.test(photo_path)) {
      return res.redirect('/?error=' + encodeURIComponent('Please upload a photo of the damaged facility before submitting.'));
    }

    // Parameterized SQL Query against SQL injection
    const query = `
      INSERT INTO reports (reporter_name, reporter_email, room_location, facility_type, item_type, damage_type, urgency_level, damage_description, damage_cause, photo_path, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '', $9, 'pending')
      RETURNING id;
    `;
    const values = [reporter_name, reporter_email, room, facility, finalItem, damage_type, urgency, description, photo_path];
    
    await db.query(query, values);
    res.redirect('/history?success=true');
  } catch (err) {
    next(err);
  }
});

router.get('/history', ensureAuthenticated, async function(req, res, next) {
  try {
    const email = (req.user && req.user.emails && req.user.emails[0]) ? req.user.emails[0].value : '';
    if (!email) {
      return res.redirect('/login');
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const result = await db.query(
      `SELECT *, COUNT(*) OVER()::int as full_count 
       FROM reports 
       WHERE reporter_email = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [email, limit, offset]
    );

    const reports = result.rows;
    const totalMatching = reports.length > 0 ? reports[0].full_count : 0;
    const totalPages = Math.ceil(totalMatching / limit) || 1;

    const optionMap = await getOptionLabelMap();

    res.render('history', { 
      user: req.user, 
      reports, 
      pagination: {
        page,
        limit,
        totalItems: totalMatching,
        totalPages
      },
      optionMap,
      formatOptionText,
      success: req.query.success,
      error: req.query.error || null,
      clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''
    });
  } catch(err) {
    next(err);
  }
});

router.get('/logout', function(req, res, next) {
  res.render('logout', { 
    title: 'Logging Out | MokletCare',
    clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''
  });
});

module.exports = router;
