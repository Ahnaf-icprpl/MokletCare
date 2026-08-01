-- Migration: 001_create_reports_table
-- Description: Create the initial table for storing facility damage reports

-- Create ENUM type for status
DO $$ BEGIN
    CREATE TYPE report_status AS ENUM ('pending', 'in_progress', 'resolved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    reporter_name VARCHAR(255) NOT NULL,
    room_location VARCHAR(255) NOT NULL,
    facility_type VARCHAR(100) NOT NULL,
    damage_description TEXT NOT NULL,
    photo_path VARCHAR(255) DEFAULT NULL,
    status report_status DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
