var express = require('express');
var router = express.Router();
var passport = require('passport');
var db = require('../db');
var multer = require('multer');
var path = require('path');
var jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const rateLimit = require('express-rate-limit');

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
    allowedFormats: ['jpg', 'png', 'jpeg'],
  },
});
const upload = multer({ storage: storage });

function ensureAuthenticated(req, res, next) {
  const token = req.cookies.jwt;
  if (!token) return res.redirect('/login');
  try {
    req.user = jwt.verify(token, process.env.SESSION_SECRET || 'mokletcare-secret-key');
    return next();
  } catch(err) {
    res.clearCookie('jwt');
    return res.redirect('/login');
  }
}

router.get('/login', function(req, res, next) {
  if (req.cookies.jwt) {
    try {
      jwt.verify(req.cookies.jwt, process.env.SESSION_SECRET || 'mokletcare-secret-key');
      return res.redirect('/');
    } catch(err) {}
  }
  res.render('login', { title: 'Login | SMK Telkom Malang' });
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
      urgencies
    });
  } catch (err) {
    next(err);
  }
});

router.post('/upload-image', ensureAuthenticated, uploadLimiter, upload.single('file'), function(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ url: req.file.path });
});

router.post('/report', ensureAuthenticated, reportLimiter, async function(req, res, next) {
  try {
    const { reporter_name, reporter_email, room, facility, item, other_item, damage_type, urgency, description, photo_path } = req.body;
    const finalItem = item === 'other' && other_item ? other_item : item;
    const photoPath = photo_path || null;

    const query = `
      INSERT INTO reports (reporter_name, reporter_email, room_location, facility_type, item_type, damage_type, urgency_level, damage_description, damage_cause, photo_path, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '', $9, 'pending')
      RETURNING id;
    `;
    const values = [reporter_name, reporter_email, room, facility, finalItem, damage_type, urgency, description, photoPath];
    
    await db.query(query, values);
    res.redirect('/history?success=true');
  } catch (err) {
    next(err);
  }
});

router.get('/history', ensureAuthenticated, async function(req, res, next) {
  try {
    const email = req.user.emails[0].value;
    const result = await db.query('SELECT * FROM reports WHERE reporter_email = $1 ORDER BY created_at DESC', [email]);
    res.render('history', { user: req.user, reports: result.rows, success: req.query.success });
  } catch(err) {
    next(err);
  }
});

router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  function(req, res) {
    const payload = {
      displayName: req.user.displayName,
      emails: req.user.emails
    };
    const token = jwt.sign(payload, process.env.SESSION_SECRET || 'mokletcare-secret-key', { expiresIn: '24h' });
    res.cookie('jwt', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    res.redirect('/');
  });

router.get('/logout', function(req, res, next){
  res.clearCookie('jwt');
  res.redirect('/login');
});

module.exports = router;
