var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config();

// Fail-fast environment variable validation
if (!process.env.DATABASE_URL) {
  console.warn('WARNING: DATABASE_URL is not defined in environment variables.');
}
if (!process.env.CLERK_SECRET_KEY) {
  console.warn('WARNING: CLERK_SECRET_KEY is not defined in environment variables.');
}

const { clerkMiddleware } = require('@clerk/express');
const { pool } = require('./db');

var indexRouter = require('./routes/index');
var approvalRouter = require('./routes/approval');

var app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

// Security Headers Middleware
app.use(function(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

var compression = require('compression');

// Enable Gzip/Deflate HTTP response compression (CSS, JS, HTML)
app.use(compression());

// Parse cookies and request bodies with explicit limits
app.use(logger(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : '1h',
  etag: true
}));

// Enable Clerk middleware with explicit keys
app.use(clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY
}));

app.use('/', indexRouter);
app.use('/', approvalRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  if (req.xhr || req.is('json') || (req.headers.accept && req.headers.accept.includes('application/json'))) {
    return res.status(404).json({ error: 'Endpoint not found.' });
  }
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  const status = err.status || 500;

  if (status >= 500) {
    console.error('Server error encountered:', err);
  }

  // If request expects JSON, return structured JSON error
  if (req.xhr || req.is('json') || (req.headers.accept && req.headers.accept.includes('application/json'))) {
    return res.status(status).json({
      error: req.app.get('env') === 'development' ? err.message : (status === 404 ? 'Endpoint not found.' : 'Internal Server Error')
    });
  }

  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(status);
  res.render('error');
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
});

// Graceful shutdown handling for container and process managers
const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}. Gracefully terminating HTTP server and database pool...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      await pool.end();
      console.log('Database pool connection terminated cleanly.');
      process.exit(0);
    } catch (dbErr) {
      console.error('Error while terminating database pool:', dbErr);
      process.exit(1);
    }
  });

  // Force shutdown if cleanup takes more than 10 seconds
  setTimeout(() => {
    console.error('Graceful shutdown timeout exceeded. Forcefully terminating.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
