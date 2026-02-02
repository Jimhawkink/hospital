-- =============================================
-- Appointments Tables Migration Script
-- HMS - Hospital Management System
-- Created: 2025-12-24
-- Database: MySQL
-- =============================================

-- =========================================
-- 📅 APPOINTMENT TYPES TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS appointment_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500),
    emoji VARCHAR(10) DEFAULT '📅',
    color VARCHAR(20) DEFAULT '#3B82F6',
    default_duration_minutes INT DEFAULT 30,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    sort_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO appointment_types (name, description, emoji, color, default_duration_minutes, sort_order) VALUES
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
    ('General consultation', 'General medical consultation', '👨‍⚕️', '#64748B', 30, 15);


CREATE TABLE IF NOT EXISTS appointments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    provider_id INT,
    appointment_type_id INT,
    appointment_type_custom VARCHAR(200),
    
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    end_time TIME,
    duration_minutes INT DEFAULT 30,
    
    
    status ENUM('Scheduled', 'Confirmed', 'Checked-in', 'In-progress', 'Completed', 'Cancelled', 'No-show', 'Rescheduled') NOT NULL DEFAULT 'Scheduled',
    
    notes TEXT,
    reason_for_visit VARCHAR(500),
    
    reminder_type ENUM('None', 'SMS', 'Email', 'Both') DEFAULT 'SMS',
    reminder_sent TINYINT(1) DEFAULT 0,
    reminder_sent_at DATETIME,
    reminder_days_before INT DEFAULT 1,
    
    
    booked_by INT,
    booking_source ENUM('Walk-in', 'Phone', 'Online', 'App', 'Referral') DEFAULT 'Walk-in',
    
    original_appointment_id INT,
    reschedule_count INT DEFAULT 0,
    reschedule_reason VARCHAR(500),
    
    
    cancelled_at DATETIME,
    cancelled_by INT,
    cancellation_reason VARCHAR(500),
    
   
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS appointment_slots (
    id INT PRIMARY KEY AUTO_INCREMENT,
    provider_id INT NOT NULL,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes INT DEFAULT 30,
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE OR REPLACE VIEW vw_appointments_detailed AS
SELECT 
    a.id,
    a.patient_id,
    CONCAT(p.first_name, ' ', IFNULL(CONCAT(p.middle_name, ' '), ''), p.last_name) AS patient_name,
    p.gender AS patient_gender,
    p.dob AS patient_dob,
    p.phone AS patient_phone,
    TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) AS patient_age,
    a.provider_id,
    CONCAT(IFNULL(s.title, ''), ' ', s.firstName, ' ', s.lastName) AS provider_name,
    a.appointment_type_id,
    IFNULL(at.name, a.appointment_type_custom) AS appointment_type_name,
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
    CONCAT(IFNULL(sb.title, ''), ' ', sb.firstName, ' ', sb.lastName) AS booked_by_name,
    a.booking_source,
    a.reschedule_count,
    a.created_at,
    a.updated_at
FROM appointments a
LEFT JOIN Patients p ON a.patient_id = p.id
LEFT JOIN staff s ON a.provider_id = s.id
LEFT JOIN staff sb ON a.booked_by = sb.id
LEFT JOIN appointment_types at ON a.appointment_type_id = at.id;

-- =========================================
-- 📊 SUMMARY
-- =========================================
-- Tables created:
--   1. appointment_types - Types of appointments with default durations
--   2. appointments - Main appointments table with full booking details
--   3. appointment_slots - Provider availability slots (optional)
--
-- Views created:
--   1. vw_appointments_detailed - Full appointment details with patient/provider info
--
-- NOTE: Foreign keys removed for flexibility. Ensure data integrity at application level.
-- =========================================
