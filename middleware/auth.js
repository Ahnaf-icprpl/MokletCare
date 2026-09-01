const { clerkClient, getAuth } = require('@clerk/express');

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
    let userRole = null;

    // Fast path: Extract user profile and role directly from verified JWT session claims
    if (auth.sessionClaims) {
      primaryEmail = auth.sessionClaims.email || auth.sessionClaims.primary_email || (auth.sessionClaims.email_addresses && auth.sessionClaims.email_addresses[0]) || '';
      fullName = (auth.sessionClaims.first_name || auth.sessionClaims.last_name)
        ? `${auth.sessionClaims.first_name || ''} ${auth.sessionClaims.last_name || ''}`.trim()
        : (auth.sessionClaims.username || (primaryEmail ? primaryEmail.split('@')[0] : ''));
      
      if (auth.sessionClaims.metadata && auth.sessionClaims.metadata.role) {
        userRole = auth.sessionClaims.metadata.role;
      } else if (auth.sessionClaims.public_metadata && auth.sessionClaims.public_metadata.role) {
        userRole = auth.sessionClaims.public_metadata.role;
      }
    }

    // Fetch Clerk user details if role or email was not present in claims
    if (!primaryEmail || !userRole) {
      try {
        const clerkUser = await getCachedClerkUser(auth.userId);
        if (clerkUser) {
          if (!primaryEmail) {
            const primaryEmailObj = (clerkUser.emailAddresses && clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)) 
              || (clerkUser.emailAddresses && clerkUser.emailAddresses[0]);
            primaryEmail = primaryEmailObj ? primaryEmailObj.emailAddress : '';
          }
          if (!fullName) {
            fullName = (clerkUser.firstName || clerkUser.lastName)
              ? `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim()
              : (clerkUser.username || (primaryEmail ? primaryEmail.split('@')[0] : 'User'));
          }
          if (!userRole && clerkUser.publicMetadata && clerkUser.publicMetadata.role) {
            userRole = clerkUser.publicMetadata.role;
          }
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

    if (isAdminEmail) {
      userRole = 'admin';
    } else if (!userRole) {
      userRole = 'reporter';
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
