-- Migration: 013_add_finished_photo_and_reply_to_reports
-- Description: Add finished_photo_path, admin_reply, and resolved_at columns to reports table

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS finished_photo_path VARCHAR(500) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS admin_reply TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_reports_resolved_at ON reports(resolved_at);
