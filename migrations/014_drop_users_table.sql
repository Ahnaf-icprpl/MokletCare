-- Drop users table as auth and role management is now 100% handled via Clerk
DROP TABLE IF EXISTS users CASCADE;
