-- Migration: 002_add_verification_fields_to_reports

ALTER TABLE reports
ADD COLUMN reporter_email VARCHAR(255) NOT NULL DEFAULT '',
ADD COLUMN urgency_level VARCHAR(50) NOT NULL DEFAULT 'medium';
