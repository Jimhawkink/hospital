-- =============================================
-- Supabase / PostgreSQL Schema Migration
-- HMS - Hospital Management System
-- =============================================

-- -----------------------------
-- 🛠️ EXTENSIONS & TYPES
-- -----------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE appointment_status AS ENUM ('Scheduled', 'Confirmed', 'Checked-in', 'In-progress', 'Completed', 'Cancelled', 'No-show', 'Rescheduled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE gender_type AS ENUM ('Male', 'Female', 'Other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE patient_status_type AS ENUM ('Alive', 'Deceased');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- -----------------------------
-- 👥 CORE TABLES
-- -----------------------------

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Patients (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    gender gender_type NOT NULL,
    dob DATE NOT NULL,
    patient_status patient_status_type DEFAULT 'Alive',
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(150),
    occupation VARCHAR(150),
    heard_about_facility VARCHAR(100),
    patient_number VARCHAR(100),
    sha_number VARCHAR(100),
    county VARCHAR(100),
    sub_county VARCHAR(100),
    area_of_residence VARCHAR(255),
    next_of_kin_first_name VARCHAR(100),
    next_of_kin_last_name VARCHAR(100),
    next_of_kin_phone VARCHAR(50),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    title VARCHAR(50) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    gender VARCHAR(20) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(50) NOT NULL,
    address VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    "jobTitle" VARCHAR(100) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    "addedOn" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "activeStatus" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------
-- 📅 APPOINTMENTS
-- -----------------------------

CREATE TABLE IF NOT EXISTS appointment_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    emoji VARCHAR(10) DEFAULT '📅',
    color VARCHAR(20) DEFAULT '#3B82F6',
    default_duration_minutes INTEGER DEFAULT 30,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES Patients(id) ON DELETE CASCADE,
    provider_id INTEGER REFERENCES staff(id) ON DELETE SET NULL,
    appointment_type_id INTEGER REFERENCES appointment_types(id) ON DELETE SET NULL,
    appointment_type_custom VARCHAR(200),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    end_time TIME,
    duration_minutes INTEGER DEFAULT 30,
    status appointment_status NOT NULL DEFAULT 'Scheduled',
    notes TEXT,
    reason_for_visit VARCHAR(500),
    reminder_type VARCHAR(20) DEFAULT 'SMS',
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    reminder_days_before INTEGER DEFAULT 1,
    booked_by INTEGER REFERENCES staff(id) ON DELETE SET NULL,
    booking_source VARCHAR(50) DEFAULT 'Walk-in',
    original_appointment_id INTEGER,
    reschedule_count INTEGER DEFAULT 0,
    reschedule_reason VARCHAR(500),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_by INTEGER REFERENCES staff(id) ON DELETE SET NULL,
    cancellation_reason VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------
-- 🏷️ TAGS & CONSENTS
-- -----------------------------

CREATE TABLE IF NOT EXISTS tag_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(20) NOT NULL DEFAULT '#3B82F6',
    emoji VARCHAR(10) DEFAULT '🏷️',
    description VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES tag_categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    color VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by INTEGER REFERENCES staff(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category_id, name)
);

CREATE TABLE IF NOT EXISTS patient_tags (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES Patients(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    notes VARCHAR(500),
    added_by INTEGER REFERENCES staff(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(patient_id, tag_id)
);

CREATE TABLE IF NOT EXISTS consent_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    emoji VARCHAR(10) DEFAULT '📋',
    is_mandatory BOOLEAN NOT NULL DEFAULT FALSE,
    requires_otp BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patient_consents (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES Patients(id) ON DELETE CASCADE,
    consent_type_id INTEGER NOT NULL REFERENCES consent_types(id) ON DELETE CASCADE,
    is_granted BOOLEAN NOT NULL DEFAULT FALSE,
    granted_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    otp_verified BOOLEAN NOT NULL DEFAULT FALSE,
    otp_verified_at TIMESTAMP WITH TIME ZONE,
    otp_code VARCHAR(10),
    otp_expires_at TIMESTAMP WITH TIME ZONE,
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    witness_staff_id INTEGER REFERENCES staff(id) ON DELETE SET NULL,
    notes VARCHAR(500),
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(patient_id, consent_type_id)
);

-- -----------------------------
-- 🔐 ROLES & PERMISSIONS
-- -----------------------------

CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    organisation_id INTEGER NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    permission_name VARCHAR(150) NOT NULL UNIQUE,
    permission_key VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(100),
    description VARCHAR(255),
    has_create BOOLEAN DEFAULT TRUE,
    has_edit BOOLEAN DEFAULT TRUE,
    has_view BOOLEAN DEFAULT TRUE,
    has_archive BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES user_roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    can_create BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_view BOOLEAN DEFAULT FALSE,
    can_archive BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);

-- -----------------------------
-- 🔧 VIEWS
-- -----------------------------

CREATE OR REPLACE VIEW vw_appointments_detailed AS
SELECT 
    a.id,
    a.patient_id,
    CONCAT(p.first_name, ' ', COALESCE(p.middle_name || ' ', ''), p.last_name) AS patient_name,
    p.gender AS patient_gender,
    p.dob AS patient_dob,
    p.phone AS patient_phone,
    EXTRACT(YEAR FROM AGE(p.dob)) AS patient_age,
    a.provider_id,
    CONCAT(COALESCE(s.title, ''), ' ', s."firstName", ' ', s."lastName") AS provider_name,
    a.appointment_type_id,
    COALESCE(at.name, a.appointment_type_custom) AS appointment_type_name,
    at.emoji AS type_emoji,
    at.color AS type_color,
    a.appointment_date,
    a.appointment_time,
    a.end_time,
    a.duration_minutes,
    a.status,
    a.notes,
    a.reason_for_visit,
    a.reminder_type,
    a.reminder_sent,
    a.reminder_days_before,
    a.booked_by,
    CONCAT(COALESCE(sb.title, ''), ' ', sb."firstName", ' ', sb."lastName") AS booked_by_name,
    a.booking_source,
    a.reschedule_count,
    a.created_at,
    a.updated_at
FROM appointments a
LEFT JOIN Patients p ON a.patient_id = p.id
LEFT JOIN staff s ON a.provider_id = s.id
LEFT JOIN staff sb ON a.booked_by = sb.id
LEFT JOIN appointment_types at ON a.appointment_type_id = at.id;
