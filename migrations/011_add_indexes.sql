-- Add indexes for fast querying, sorting, and pagination on reports
CREATE INDEX IF NOT EXISTS idx_reports_created_at_desc ON reports (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status);
