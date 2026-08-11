-- Add indexes for fast querying, sorting, and pagination
CREATE INDEX IF NOT EXISTS idx_reports_created_at_desc ON reports (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status);
CREATE INDEX IF NOT EXISTS idx_users_created_at_desc ON users (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
