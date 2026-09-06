const { clerkClient, getAuth } = require('@clerk/express');

// In-memory cache for Clerk user profile data (TTL: 5 minutes, bounded size)
const userProfileCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 1000;

function pruneExpiredUserCache() {
  const now = Date.now();
  for (const [key, value] of userProfileCache.entries()) {
    if (now >= value.expiresAt) {
      userProfileCache.delete(key);
    }
  }
}

// Periodically clean up expired cache entries every 10 minutes without holding the event loop
setInterval(pruneExpiredUserCache, 10 * 60 * 1000).unref();

// In-flight request deduplication map to prevent redundant concurrent Clerk API requests
const pendingUserFetches = new Map();

async function getCachedClerkUser(userId) {
  const cached = userProfileCache.get(userId);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.clerkUser;
  }
  if (pendingUserFetches.has(userId)) {
    return pendingUserFetches.get(userId);
  }

  const fetchPromise = Promise.race([
    clerkClient.users.getUser(userId),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Clerk API timeout')), 800))
  ]).then((clerkUser) => {
    pendingUserFetches.delete(userId);
    if (userProfileCache.size >= MAX_CACHE_ENTRIES) {
      pruneExpiredUserCache();
      if (userProfileCache.size >= MAX_CACHE_ENTRIES) {
        const firstKey = userProfileCache.keys().next().value;
        if (firstKey) userProfileCache.delete(firstKey);
      }
    }
    userProfileCache.set(userId, { clerkUser, expiresAt: Date.now() + CACHE_TTL_MS });
    return clerkUser;
  }).catch((err) => {
    pendingUserFetches.delete(userId);
    console.warn(`[Clerk Auth] Fast fallback for ${userId}: ${err.message}`);
    return null;
  });

  pendingUserFetches.set(userId, fetchPromise);
  return fetchPromise;
}

function clearUserCache(userId) {
  if (userId) {
    userProfileCache.delete(userId);
  } else {
    userProfileCache.clear();
  }
}

async function resolveUser(auth) {
  if (!auth || !auth.userId) return null;
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

  // Fallback: If no role was set in Clerk publicMetadata, check ADMIN_EMAIL or default to reporter
  if (!userRole) {
    userRole = isAdminEmail ? 'admin' : 'reporter';
  }

  return {
    id: auth.userId,
    displayName: fullName || 'User',
    emails: [{ value: primaryEmail }],
    role: userRole
  };
}

async function populateUser(req, res, next) {
  try {
    const auth = getAuth(req);
    req.user = await resolveUser(auth);
  } catch {
    req.user = null;
  }
  next();
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
    const user = await resolveUser(auth);
    if (!user) {
      return res.redirect('/login');
    }

    // Backend security check: Reject authentication from Apple accounts
    const primaryEmail = user.emails && user.emails[0] ? user.emails[0].value : '';
    if (primaryEmail && primaryEmail.toLowerCase().endsWith('@privaterelay.appleid.com')) {
      if (req.xhr || (req.headers && req.headers.accept && req.headers.accept.includes('application/json'))) {
        return res.status(403).json({ error: 'Apple login is disabled. Please sign in with Google.' });
      }
      return res.redirect('/login?error=' + encodeURIComponent('Apple login is disabled. Please sign in with Google.'));
    }

    req.user = user;
    return next();
  } catch (err) {
    console.error('Error in authentication middleware:', err);
    if (req.xhr || (req.headers && req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.status(401).json({ error: 'Authentication failed.' });
    }
    return res.redirect('/login');
  }
}

function ensureRole(...allowedRoles) {
  return function(req, res, next) {
    // Admin has full uncontrolled superuser access across all role-guarded routes
    if (req.user && req.user.role === 'admin') {
      return next();
    }
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      if (req.xhr || (req.headers && req.headers.accept && req.headers.accept.includes('application/json'))) {
        return res.status(403).json({ error: 'Forbidden: Insufficient privileges.' });
      }
      return res.redirect('/?error=' + encodeURIComponent('Access denied. You do not have permission to view that page.'));
    }
    next();
  };
}

module.exports = {
  populateUser,
  ensureAuthenticated,
  ensureRole,
  clearUserCache,
  getCachedClerkUser
};
