const { clerkClient, getAuth } = require('@clerk/express');
const db = require('../db');

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
      try {
        const clerkUser = await getCachedClerkUser(auth.userId);
        if (clerkUser) {
          const primaryEmailObj = (clerkUser.emailAddresses && clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)) 
            || (clerkUser.emailAddresses && clerkUser.emailAddresses[0]);
          primaryEmail = primaryEmailObj ? primaryEmailObj.emailAddress : '';
          fullName = (clerkUser.firstName || clerkUser.lastName)
            ? `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim()
            : (clerkUser.username || (primaryEmail ? primaryEmail.split('@')[0] : 'User'));
        }
      } catch (clerkErr) {
        console.warn('Could not fetch Clerk user details in middleware:', clerkErr.message);
      }
    }

    if (!primaryEmail) {
      primaryEmail = `${auth.userId}@clerk.user`;
      fullName = fullName || 'User';
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
      if (req.user && req.user.role === 'admin') {
        return res.redirect('/admin/approval');
      }
      return res.redirect('/?error=' + encodeURIComponent('Access denied. You do not have permission to view that page.'));
    }
    next();
  };
}

module.exports = {
  ensureAuthenticated,
  ensureRole,
  clearUserCache,
  getCachedClerkUser
};
