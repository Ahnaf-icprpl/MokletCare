var express = require('express');
var router = express.Router();
var db = require('../db');
const { ensureAuthenticated, ensureRole } = require('../middleware/auth');

// GET: Approval page - show all photo requests with pie chart and approval workflow
router.get(['/admin/approval', '/approval', '/admin/approvals', '/admin/permissions'], ensureAuthenticated, ensureRole('admin'), async function(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;
    const statusFilter = req.query.status ? req.query.status.trim() : 'pending';

    let whereClause = '';
    let params = [];
    let paramIdx = 1;

    if (statusFilter !== 'all') {
      whereClause = `WHERE pr.status = $${paramIdx++}`;
      params.push(statusFilter);
    }

    params.push(limit, offset);
    const pageParam = paramIdx;
    const offsetParam = paramIdx + 1;

    // Get paginated requests with linked report details
    const requestsQuery = `
      SELECT pr.*, 
             r.room_location,
             r.facility_type,
             r.item_type,
             r.damage_type,
             r.urgency_level,
             r.damage_description as report_damage_description,
             r.status as report_current_status,
             r.reporter_name,
             COUNT(*) OVER()::int as full_count
      FROM photo_requests pr
      LEFT JOIN reports r ON r.id = pr.report_id
      ${whereClause}
      ORDER BY pr.created_at DESC
      LIMIT $${pageParam} OFFSET $${offsetParam}
    `;

    const requestsResult = await db.query(requestsQuery, params);
    const requests = requestsResult.rows;
    const totalItems = requests.length > 0 ? requests[0].full_count : 0;
    const totalPages = Math.ceil(totalItems / limit) || 1;

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

    // Query Users for Admin User Permissions Control
    const userPage = Math.max(1, parseInt(req.query.user_page, 10) || 1);
    const userLimit = Math.max(1, Math.min(100, parseInt(req.query.user_limit, 10) || 10));
    const userOffset = (userPage - 1) * userLimit;
    const userSearchQuery = typeof req.query.user_q === 'string' ? req.query.user_q.trim() : '';

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
    const users = usersRes.rows;
    const totalUserMatching = users.length > 0 ? users[0].full_count : 0;
    const totalUserPages = Math.ceil(totalUserMatching / userLimit) || 1;

    res.render('approval', {
      user: req.user,
      requests: requests.map(r => ({ ...r, full_count: undefined })),
      requestStats,
      requestPagination: {
        page,
        limit,
        totalItems,
        totalPages,
        status: statusFilter
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
      success: req.query.success || null
    });
  } catch (err) {
    next(err);
  }
});

// POST: Admin manages user role permissions
router.post(['/admin/users/:id/role', '/dashboard/users/:id/role'], ensureAuthenticated, ensureRole('admin'), async function(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const allowedRoles = ['reporter', 'staff', 'admin'];

    if (!allowedRoles.includes(role)) {
      return res.redirect('/admin/approval?error=' + encodeURIComponent('Invalid role specified.'));
    }

    await db.query('UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2', [role, id]);
    const { clearUserCache } = require('../middleware/auth');
    clearUserCache(id);

    // Also sync with Clerk publicMetadata
    try {
      const { clerkClient } = require('@clerk/express');
      await clerkClient.users.updateUserMetadata(id, {
        publicMetadata: { role: role }
      });
    } catch (clerkErr) {
      console.warn('Could not sync role to Clerk publicMetadata:', clerkErr.message);
    }

    const referer = req.get('Referer');
    if (referer && referer.includes('/admin/approval')) {
      return res.redirect(referer);
    }
    res.redirect('/admin/approval?success=' + encodeURIComponent(`User permission successfully updated to ${role}.`));
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
    if (!reportId) {
      return res.status(400).json({ error: 'Missing reportId' });
    }

    const recType = recipientType || 'admin';
    if (!['admin', 'reporter'].includes(recType)) {
      return res.status(400).json({ error: 'Invalid recipient type' });
    }

    // Check if report exists
    const reportResult = await db.query('SELECT id, reporter_email, photo_path, damage_description, room_location FROM reports WHERE id = $1', [reportId]);
    if (reportResult.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = reportResult.rows[0];
    const recEmail = recType === 'admin' ? 'admin@mokletcare.local' : (recipientEmail || report.reporter_email);
    const photoToUse = photoUrl || report.photo_path || '';
    const descToUse = photoDescription || `Approval request for report #${report.id} (${report.room_location})`;

    // Validate recipient email if reporter
    if (recType === 'reporter' && recEmail !== report.reporter_email) {
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
      recType,
      recEmail,
      photoToUse,
      descToUse,
      message || ''
    ]);

    res.json({
      success: true,
      requestId: result.rows[0].id,
      message: 'Photo approval request sent successfully'
    });
  } catch (err) {
    next(err);
  }
});

// POST: Approve photo request
router.post(['/admin/approval/:id/approve', '/admin/permissions/:id/approve'], ensureAuthenticated, ensureRole('admin'), async function(req, res, next) {
  try {
    const { id } = req.params;

    // Update request status
    await db.query('UPDATE photo_requests SET status = $1, updated_at = NOW() WHERE id = $2', ['approved', id]);

    const referer = req.get('Referer');
    if (referer && (referer.includes('/admin/approval') || referer.includes('/approval') || referer.includes('/admin/permissions'))) {
      return res.redirect(referer);
    }
    res.redirect('/admin/approval?success=' + encodeURIComponent('Request approved successfully'));
  } catch (err) {
    next(err);
  }
});

// POST: Reject photo request
router.post(['/admin/approval/:id/reject', '/admin/permissions/:id/reject'], ensureAuthenticated, ensureRole('admin'), async function(req, res, next) {
  try {
    const { id } = req.params;

    // Update request status
    await db.query('UPDATE photo_requests SET status = $1, updated_at = NOW() WHERE id = $2', ['rejected', id]);

    const referer = req.get('Referer');
    if (referer && (referer.includes('/admin/approval') || referer.includes('/approval') || referer.includes('/admin/permissions'))) {
      return res.redirect(referer);
    }
    res.redirect('/admin/approval?success=' + encodeURIComponent('Request rejected successfully'));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
