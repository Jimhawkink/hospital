-- =============================================
-- HMS - Base Tables Migration Script (Supabase/Postgres)
-- Order: Run this script FIRST
-- =============================================

-- 1. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE hms_gender AS ENUM ('Male', 'Female', 'Other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE hms_patient_status AS ENUM ('Alive', 'Deceased');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE hms_heard_about AS ENUM ('Social Media', 'Friend', 'Google Search', 'News Rooms', 'Physical Search');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. HMS_USERS TABLE
CREATE TABLE IF NOT EXISTS hms_users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. HMS_STAFF TABLE
CREATE TABLE IF NOT EXISTS hms_staff (
    id SERIAL PRIMARY KEY,
    title VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    gender VARCHAR(20) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(50) NOT NULL,
    address VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    job_title VARCHAR(100) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    added_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    active_status BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. HMS_PATIENTS TABLE
CREATE TABLE IF NOT EXISTS hms_patients (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    middle_name VARCHAR(255),
    last_name VARCHAR(255) NOT NULL,
    gender hms_gender NOT NULL,
    dob DATE NOT NULL,
    patient_status hms_patient_status DEFAULT 'Alive',
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    occupation VARCHAR(255),
    heard_about_facility hms_heard_about,
    patient_number VARCHAR(100),
    sha_number VARCHAR(100),
    county VARCHAR(255),
    sub_county VARCHAR(255),
    area_of_residence VARCHAR(255),
    next_of_kin_first_name VARCHAR(255),
    next_of_kin_last_name VARCHAR(255),
    next_of_kin_phone VARCHAR(255),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_hms_patients_phone ON hms_patients(phone);
CREATE INDEX IF NOT EXISTS idx_hms_patients_name ON hms_patients(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_hms_staff_username ON hms_staff(username);
