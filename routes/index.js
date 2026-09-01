var express = require('express');
var router = express.Router();
var db = require('../db');
var multer = require('multer');
var path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const rateLimit = require('express-rate-limit');
const { clerkClient, getAuth } = require('@clerk/express');

// Rate limiter for image uploads (100 per hour per user)
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  keyGenerator: (req) => {
    return (req.user && req.user.emails && req.user.emails[0]) ? req.user.emails[0].value : 'anonymous';
  },
  message: { error: 'Too many uploads. Please try again in an hour.' }
});

// Rate limiter for submitting reports (100 per hour per user)
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
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

const { ensureAuthenticated, ensureRole, clearUserCache, getCachedClerkUser } = require('../middleware/auth');

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

router.get('/privacy-policy', function(req, res, next) {
  res.render('privacy-policy', {
    title: 'Privacy Policy | MokletCare'
  });
});

router.get('/privacy', function(req, res, next) {
  res.redirect('/privacy-policy');
});

router.get('/tos', function(req, res, next) {
  res.render('tos', {
    title: 'Terms of Service | MokletCare'
  });
});

router.get(['/terms', '/terms-of-service'], function(req, res, next) {
  res.redirect('/tos');
});

router.get('/', ensureAuthenticated, async function(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return res.redirect('/admin/approval');
  }
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

function isHighOrAboveUrgency(urgency) {
  if (!urgency) return false;
  const u = String(urgency).toLowerCase().trim();
  return u === 'high' || u === 'critical' || u === 'severe' || u.includes('tinggi') || u.includes('kritis') || u.includes('darurat') || u.includes('penting');
}

router.get('/dashboard', ensureAuthenticated, ensureRole('staff'), async function(req, res, next) {
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
      SELECT r.*,
             EXISTS(SELECT 1 FROM photo_requests pr WHERE pr.report_id = r.id AND pr.status = 'approved') as is_approved,
             EXISTS(SELECT 1 FROM photo_requests pr WHERE pr.report_id = r.id AND pr.status = 'pending') as has_pending_approval,
             COUNT(*) OVER()::int as full_count 
      FROM reports r
      ${reportWhereClause} 
      ORDER BY r.created_at DESC 
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
      error: req.query.error || null,
      success: req.query.success || null,
      optionMap,
      formatOptionText,
      isHighOrAboveUrgency,
      clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''
    });
  } catch (err) {
    next(err);
  }
});

router.post(['/dashboard/reports/:id/status', '/dashboard/reports/:id/reply'], ensureAuthenticated, ensureRole('staff'), async function(req, res, next) {
  try {
    const { id } = req.params;
    const { status, finished_photo_path, admin_reply } = req.body;
    const allowedStatuses = ['pending', 'in_progress', 'resolved', 'rejected'];

    if (status && !allowedStatuses.includes(status)) {
      if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
        return res.status(400).json({ error: 'Invalid status specified.' });
      }
      return res.redirect('/dashboard?error=' + encodeURIComponent('Invalid status specified.'));
    }

    const cleanFinishedPhoto = typeof finished_photo_path === 'string' ? finished_photo_path.trim() : null;
    const cleanAdminReply = typeof admin_reply === 'string' ? admin_reply.trim() : null;

    // Fetch existing report to know current status, urgency, and reply if not provided
    const reportRes = await db.query('SELECT status, urgency_level, resolved_at, finished_photo_path, admin_reply FROM reports WHERE id = $1', [id]);
    if (reportRes.rows.length === 0) {
      if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
        return res.status(404).json({ error: 'Report not found.' });
      }
      return res.redirect('/dashboard?error=' + encodeURIComponent('Report not found.'));
    }

    const currentReport = reportRes.rows[0];
    const newStatus = status || currentReport.status || 'pending';

    // Business flow enforcement: Staff must get Admin approval before proceeding (in_progress / resolved),
    // EXCEPT for reports with High and above urgency
    if (newStatus === 'in_progress' || newStatus === 'resolved') {
      const isHigh = isHighOrAboveUrgency(currentReport.urgency_level);
      if (!isHigh) {
        const approvedRes = await db.query(
          "SELECT 1 FROM photo_requests WHERE report_id = $1 AND status = 'approved' LIMIT 1",
          [id]
        );
        if (approvedRes.rows.length === 0) {
          const errMsg = 'Admin approval is required before proceeding with Low or Medium urgency reports. Please request approval from Admin first.';
          if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
            return res.status(403).json({ error: errMsg });
          }
          return res.redirect('/dashboard?error=' + encodeURIComponent(errMsg));
        }
      }
    }

    const newFinishedPhoto = (finished_photo_path !== undefined) ? (cleanFinishedPhoto || null) : currentReport.finished_photo_path;
    const newAdminReply = (admin_reply !== undefined) ? (cleanAdminReply || null) : currentReport.admin_reply;
    const newResolvedAt = (newStatus === 'resolved') 
      ? (currentReport.resolved_at || new Date()) 
      : currentReport.resolved_at;

    await db.query(`
      UPDATE reports 
      SET status = $1::report_status, 
          finished_photo_path = $2, 
          admin_reply = $3,
          resolved_at = $4,
          updated_at = NOW() 
      WHERE id = $5
    `, [newStatus, newFinishedPhoto, newAdminReply, newResolvedAt, id]);

    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.json({ success: true, message: 'Report reply and status updated successfully.' });
    }

    const referer = req.get('Referer');
    if (referer && referer.includes('/dashboard')) {
      return res.redirect(referer);
    }
    res.redirect('/dashboard?success=' + encodeURIComponent('Report reply and status updated successfully.'));
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
  if (req.user && req.user.role === 'admin') {
    return res.redirect('/admin/approval');
  }
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
  if (req.user && req.user.role === 'admin') {
    return res.redirect('/admin/approval');
  }
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
