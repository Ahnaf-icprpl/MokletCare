-- Migration: 012_create_photo_requests_table
-- Description: Create table for storing photo sharing requests from staff to admin/reporter

CREATE TABLE IF NOT EXISTS photo_requests (
    id SERIAL PRIMARY KEY,
    report_id INTEGER NOT NULL,
    staff_id VARCHAR(255) NOT NULL,
    staff_email VARCHAR(255) NOT NULL,
    staff_name VARCHAR(255) NOT NULL,
    recipient_type VARCHAR(50) NOT NULL, -- 'reporter' or 'admin'
    recipient_id VARCHAR(255),
    recipient_email VARCHAR(255),
    photo_url VARCHAR(500) NOT NULL,
    photo_description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    request_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_photo_requests_report ON photo_requests(report_id);
CREATE INDEX IF NOT EXISTS idx_photo_requests_staff ON photo_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_photo_requests_status ON photo_requests(status);
CREATE INDEX IF NOT EXISTS idx_photo_requests_recipient ON photo_requests(recipient_type);
