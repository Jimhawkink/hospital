-- =============================================
-- Appointments Tables Migration Script
-- HMS - Hospital Management System
-- Created: 2026-02-02
-- Database: PostgreSQL (Supabase)
-- =============================================

-- =========================================
-- 📅 APPOINTMENT TYPES TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS hms_appointment_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500),
    emoji VARCHAR(10) DEFAULT '📅',
    color VARCHAR(20) DEFAULT '#3B82F6',
    default_duration_minutes INT DEFAULT 30,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO hms_appointment_types (name, description, emoji, color, default_duration_minutes, sort_order) VALUES
    ('Family planning follow-up', 'Follow-up for family planning services', '👨‍👩‍👧', '#EC4899', 30, 1),
    ('Antenatal follow-up', 'Prenatal care follow-up visit', '🤰', '#F59E0B', 45, 2),
    ('Child wellness follow-up', 'Pediatric wellness check', '👶', '#22C55E', 30, 3),
    ('Postnatal follow-up', 'Post-delivery care follow-up', '🍼', '#8B5CF6', 30, 4),
    ('Chronic disease follow-up', 'Management of chronic conditions', '💊', '#EF4444', 30, 5),
    ('Review of patient condition', 'General condition review', '🔄', '#3B82F6', 20, 6),
    ('Review of investigations', 'Review lab/imaging results', '🔬', '#06B6D4', 20, 7),
    ('Prescription refill', 'Medication refill appointment', '💉', '#14B8A6', 15, 8),
    ('Immunization', 'Vaccination appointment', '🩺', '#6366F1', 15, 9),
    ('Wound care', 'Wound dressing and care', '🩹', '#F97316', 20, 10),
    ('Dental check-up', 'Dental examination', '🦷', '#84CC16', 45, 11),
    ('Eye examination', 'Vision and eye health check', '👁️', '#0EA5E9', 30, 12),
    ('Mental health consultation', 'Psychiatric/psychological consultation', '🧠', '#A855F7', 60, 13),
    ('Physiotherapy session', 'Physical therapy appointment', '🏃', '#10B981', 45, 14),
    ('General consultation', 'General medical consultation', '👨‍⚕️', '#64748B', 30, 15)
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS hms_appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES hms_patients(id) ON DELETE CASCADE,
    provider_id INTEGER REFERENCES hms_staff(id) ON DELETE SET NULL,
    appointment_type_id INTEGER REFERENCES hms_appointment_types(id) ON DELETE SET NULL,
    appointment_type_custom VARCHAR(200),
    
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    end_time TIME,
    duration_minutes INT DEFAULT 30,
    
    status VARCHAR(50) NOT NULL DEFAULT 'Scheduled',
    
    notes TEXT,
    reason_for_visit VARCHAR(500),
    
    reminder_type VARCHAR(20) DEFAULT 'SMS',
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    reminder_days_before INT DEFAULT 1,
    
    booked_by INTEGER REFERENCES hms_staff(id) ON DELETE SET NULL,
    booking_source VARCHAR(50) DEFAULT 'Walk-in',
    
    original_appointment_id INTEGER,
    reschedule_count INT DEFAULT 0,
    reschedule_reason VARCHAR(500),
    
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_by INTEGER REFERENCES hms_staff(id) ON DELETE SET NULL,
    cancellation_reason VARCHAR(500),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hms_appointment_slots (
    id SERIAL PRIMARY KEY,
    provider_id INTEGER NOT NULL REFERENCES hms_staff(id) ON DELETE CASCADE,
    day_of_week VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes INT DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE VIEW hms_vw_appointments_detailed AS
SELECT 
    a.id,
    a.patient_id,
    CONCAT(p.first_name, ' ', COALESCE(p.middle_name || ' ', ''), p.last_name) AS patient_name,
    p.gender AS patient_gender,
    p.dob AS patient_dob,
    p.phone AS patient_phone,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.dob)) AS patient_age,
    a.provider_id,
    CONCAT(COALESCE(s.title || ' ', ''), s."firstName", ' ', s."lastName") AS provider_name,
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
    CONCAT(COALESCE(sb.title || ' ', ''), sb."firstName", ' ', sb."lastName") AS booked_by_name,
    a.booking_source,
    a.reschedule_count,
    a.created_at,
    a.updated_at
FROM hms_appointments a
LEFT JOIN hms_patients p ON a.patient_id = p.id
LEFT JOIN hms_staff s ON a.provider_id = s.id
LEFT JOIN hms_staff sb ON a.booked_by = sb.id
LEFT JOIN hms_appointment_types at ON a.appointment_type_id = at.id;
