var express = require('express');
var router = express.Router();
var db = require('../db');

// Middleware to check if user is admin
function ensureRole(...allowedRoles) {
  return function(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userRole = req.user.publicMetadata && req.user.publicMetadata.role ? req.user.publicMetadata.role : 'reporter';
    if (allowedRoles.includes(userRole)) {
      return next();
    }
    return res.status(403).json({ error: 'Forbidden' });
  };
}

// Middleware to ensure user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.user) {
    return next();
  }
  res.redirect('/sign-in');
}

// GET: Admin permissions page - show all photo requests with pie chart
router.get('/admin/permissions', ensureAuthenticated, ensureRole('admin'), async function(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;
    const statusFilter = req.query.status || 'all';

    let whereClause = '';
    let params = [];
    let paramIdx = 1;

    if (statusFilter !== 'all') {
      whereClause = `WHERE status = $${paramIdx++}`;
      params.push(statusFilter);
    }

    params.push(limit, offset);
    const pageParam = paramIdx;
    const offsetParam = paramIdx + 1;

    // Get paginated requests
    const requestsQuery = `
      SELECT *, COUNT(*) OVER()::int as full_count
      FROM photo_requests
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${pageParam} OFFSET $${offsetParam}
    `;

    const requestsResult = await db.query(requestsQuery, params);
    const requests = requestsResult.rows;
    const totalItems = requests.length > 0 ? requests[0].full_count : 0;
    const totalPages = Math.ceil(totalItems / limit);

    // Get stats for pie chart
    const statsQuery = `
      SELECT
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::int as pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END)::int as approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END)::int as rejected
      FROM photo_requests
    `;

    const statsResult = await db.query(statsQuery);
    const requestStats = statsResult.rows[0] || { pending: 0, approved: 0, rejected: 0 };

    res.render('admin-permissions', {
      requests: requests.map(r => ({ ...r, full_count: undefined })), // Remove full_count from individual rows
      requestStats,
      requestPagination: {
        page,
        limit,
        totalItems,
        totalPages,
        status: statusFilter
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST: Staff sends photo request to admin/reporter
router.post('/api/photo-request', ensureAuthenticated, ensureRole('staff'), async function(req, res, next) {
  try {
    const staffId = req.user.id;
    const staffEmail = req.user.emails && req.user.emails[0] ? req.user.emails[0].value : 'staff@school.id';
    const staffName = req.user.displayName || 'Staff Member';

    const { reportId, photoUrl, photoDescription, recipientType, recipientEmail, message } = req.body;

    // Validate inputs
    if (!reportId || !photoUrl || !recipientType || !recipientEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['admin', 'reporter'].includes(recipientType)) {
      return res.status(400).json({ error: 'Invalid recipient type' });
    }

    // Check if report exists
    const reportResult = await db.query('SELECT id, reporter_email FROM reports WHERE id = $1', [reportId]);
    if (reportResult.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Validate recipient email
    const report = reportResult.rows[0];
    if (recipientType === 'reporter' && recipientEmail !== report.reporter_email) {
      return res.status(400).json({ error: 'Invalid recipient email for reporter' });
    }

    // Insert photo request
    const insertQuery = `
      INSERT INTO photo_requests (
        report_id, staff_id, staff_email, staff_name, 
        recipient_type, recipient_id, recipient_email, 
        photo_url, photo_description, request_message
      ) VALUES ($1, $2, $3, $4, $5, NULL, $6, $7, $8, $9)
      RETURNING id
    `;

    const result = await db.query(insertQuery, [
      reportId,
      staffId,
      staffEmail,
      staffName,
      recipientType,
      recipientEmail,
      photoUrl,
      photoDescription || '',
      message || ''
    ]);

    res.json({
      success: true,
      requestId: result.rows[0].id,
      message: 'Photo request sent successfully'
    });
  } catch (err) {
    next(err);
  }
});

// POST: Approve photo request
router.post('/admin/permissions/:id/approve', ensureAuthenticated, ensureRole('admin'), async function(req, res, next) {
  try {
    const { id } = req.params;

    // Update request status
    await db.query('UPDATE photo_requests SET status = $1, updated_at = NOW() WHERE id = $2', ['approved', id]);

    const referer = req.get('Referer');
    if (referer && referer.includes('/admin/permissions')) {
      return res.redirect(referer);
    }
    res.redirect('/admin/permissions?success=Request approved');
  } catch (err) {
    next(err);
  }
});

// POST: Reject photo request
router.post('/admin/permissions/:id/reject', ensureAuthenticated, ensureRole('admin'), async function(req, res, next) {
  try {
    const { id } = req.params;

    // Update request status
    await db.query('UPDATE photo_requests SET status = $1, updated_at = NOW() WHERE id = $2', ['rejected', id]);

    const referer = req.get('Referer');
    if (referer && referer.includes('/admin/permissions')) {
      return res.redirect(referer);
    }
    res.redirect('/admin/permissions?success=Request rejected');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
