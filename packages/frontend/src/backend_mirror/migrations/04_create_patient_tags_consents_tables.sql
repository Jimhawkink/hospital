-- =============================================
-- Patient Tags and Consents Migration Script
-- HMS - Hospital Management System
-- Created: 2025-12-24
-- Database: MySQL
-- =============================================

-- =========================================
-- 🏷️ TAG CATEGORIES TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS hms_tag_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(20) NOT NULL DEFAULT '#3B82F6',
    emoji VARCHAR(10) DEFAULT '🏷️',
    description VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default tag categories
INSERT INTO hms_tag_categories (name, color, emoji, description, sort_order) VALUES
    ('Medical conditions', '#EF4444', '🔴', 'Medical conditions and diagnoses', 1),
    ('Medical programmes', '#22C55E', '🟢', 'Enrolled medical programmes', 2),
    ('Payment', '#F59E0B', '🟡', 'Payment and billing related tags', 3),
    ('General', '#3B82F6', '🔵', 'General purpose tags', 4),
    ('Allergies', '#EC4899', '💊', 'Patient allergies and sensitivities', 5),
    ('Insurance', '#8B5CF6', '🛡️', 'Insurance and coverage information', 6)
ON CONFLICT (name) DO NOTHING;

-- =========================================
-- 🏷️ TAGS TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS hms_tags (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES hms_tag_categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    color VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tags_category_name UNIQUE (category_id, name)
);

-- Insert some default tags
INSERT INTO hms_tags (category_id, name, description) VALUES
    (1, 'Diabetes', 'Patient has diabetes'),
    (1, 'Hypertension', 'High blood pressure'),
    (1, 'Asthma', 'Respiratory condition'),
    (1, 'Heart Disease', 'Cardiovascular condition'),
    (2, 'Maternal Health', 'Enrolled in maternal health programme'),
    (2, 'Child Wellness', 'Enrolled in child wellness programme'),
    (2, 'Chronic Care', 'Chronic disease management programme'),
    (3, 'Cash Patient', 'Pays by cash'),
    (3, 'Insurance Patient', 'Has insurance coverage'),
    (3, 'NHIF Member', 'NHIF registered member'),
    (3, 'SHA Member', 'SHA registered member'),
    (4, 'VIP Patient', 'VIP status patient'),
    (4, 'Staff Family', 'Family member of staff'),
    (4, 'Regular Patient', 'Regular visiting patient'),
    (5, 'Penicillin Allergy', 'Allergic to penicillin'),
    (5, 'Latex Allergy', 'Allergic to latex'),
    (6, 'Jubilee Insurance', 'Covered by Jubilee Insurance'),
    (6, 'AAR Insurance', 'Covered by AAR Insurance'),
    (6, 'Britam Insurance', 'Covered by Britam Insurance')
ON CONFLICT (category_id, name) DO NOTHING;

-- =========================================
-- 🏷️ PATIENT TAGS (Junction Table)
-- =========================================
CREATE TABLE IF NOT EXISTS hms_patient_tags (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES hms_patients(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES hms_tags(id) ON DELETE CASCADE,
    notes VARCHAR(500),
    added_by INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_hms_patient_tags UNIQUE (patient_id, tag_id)
);

-- Create indexes for faster lookups
CREATE INDEX idx_hms_patient_tags_patient_id ON hms_patient_tags(patient_id);
CREATE INDEX idx_hms_patient_tags_tag_id ON hms_patient_tags(tag_id);

-- =========================================
-- ✅ CONSENT TYPES TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS hms_consent_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(1000),
    emoji VARCHAR(10) DEFAULT '📋',
    is_mandatory BOOLEAN NOT NULL DEFAULT FALSE,
    requires_otp BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default consent types
INSERT INTO hms_consent_types (code, title, description, emoji, is_mandatory, requires_otp, sort_order) VALUES
    ('MEDICAL_INFO_RECORDING', 'Medical Information Recording', 
     'Consent to have medical information recorded in the electronic health record system.', 
     '📝', TRUE, FALSE, 1),
    ('DATA_ANALYSIS', 'De-identified Data Analysis', 
     'Consent to use de-identified, aggregated data for analysis and research purposes.', 
     '📊', FALSE, FALSE, 2),
    ('RESEARCH_CONTACT', 'Research Contact', 
     'Consent that my care provider may contact me to participate in patient benefit and clinical research initiatives.', 
     '🔬', FALSE, FALSE, 3),
    ('SMS_NOTIFICATIONS', 'SMS Notifications', 
     'Consent to receive SMS notifications about appointments, test results, and health reminders.', 
     '📱', FALSE, FALSE, 4),
    ('EMAIL_COMMUNICATIONS', 'Email Communications', 
     'Consent to receive email communications regarding health updates and promotional offers.', 
     '📧', FALSE, FALSE, 5),
    ('THIRD_PARTY_SHARING', 'Third Party Data Sharing', 
     'Consent to share medical records with authorized third parties for insurance claims and referrals.', 
     '🤝', FALSE, TRUE, 6),
    ('EMERGENCY_CONTACT', 'Emergency Contact Authorization', 
     'Consent to contact designated emergency contacts in case of medical emergencies.', 
     '🚨', TRUE, FALSE, 7),
    ('PHOTO_VIDEO', 'Photography and Video Recording', 
     'Consent for photographs and video recordings for medical documentation and training purposes.', 
     '📷', FALSE, TRUE, 8)
ON CONFLICT (code) DO NOTHING;

-- =========================================
-- ✅ PATIENT CONSENTS TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS hms_patient_consents (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES hms_patients(id) ON DELETE CASCADE,
    consent_type_id INTEGER NOT NULL REFERENCES hms_consent_types(id) ON DELETE CASCADE,
    is_granted BOOLEAN NOT NULL DEFAULT FALSE,
    granted_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    otp_verified BOOLEAN NOT NULL DEFAULT FALSE,
    otp_verified_at TIMESTAMP WITH TIME ZONE,
    otp_code VARCHAR(10),
    otp_expires_at TIMESTAMP WITH TIME ZONE,
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    witness_staff_id INTEGER,
    notes VARCHAR(500),
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_hms_patient_consents UNIQUE (patient_id, consent_type_id)
);

-- Create indexes for faster lookups
CREATE INDEX idx_hms_patient_consents_patient_id ON hms_patient_consents(patient_id);
CREATE INDEX idx_hms_patient_consents_type_id ON hms_patient_consents(consent_type_id);
CREATE INDEX idx_hms_patient_consents_granted ON hms_patient_consents(is_granted);

-- =========================================
-- 📜 CONSENT AUDIT LOG TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS hms_consent_audit_log (
    id SERIAL PRIMARY KEY,
    patient_consent_id INTEGER NOT NULL REFERENCES hms_patient_consents(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    performed_by INTEGER,
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    notes VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hms_consent_audit_patient_consent ON hms_consent_audit_log(patient_consent_id);
CREATE INDEX idx_hms_consent_audit_created ON hms_consent_audit_log(created_at);

-- =========================================
-- 🔧 HELPFUL VIEWS
-- =========================================

-- View: Patient Tags with Category Info
CREATE OR REPLACE VIEW hms_vw_patient_tags_detailed AS
SELECT 
    pt.id,
    pt.patient_id,
    CONCAT(p.first_name, ' ', COALESCE(p.middle_name || ' ', ''), p.last_name) AS patient_name,
    t.id AS tag_id,
    t.name AS tag_name,
    t.description AS tag_description,
    tc.id AS category_id,
    tc.name AS category_name,
    COALESCE(t.color, tc.color) AS color,
    tc.emoji AS category_emoji,
    pt.notes,
    pt.is_active,
    pt.created_at,
    pt.updated_at
FROM hms_patient_tags pt
JOIN hms_patients p ON pt.patient_id = p.id
JOIN hms_tags t ON pt.tag_id = t.id
JOIN hms_tag_categories tc ON t.category_id = tc.id
WHERE pt.is_active = TRUE AND t.is_active = TRUE;

-- View: Patient Consents with Type Info
CREATE OR REPLACE VIEW hms_vw_patient_consents_detailed AS
SELECT 
    pc.id,
    pc.patient_id,
    CONCAT(p.first_name, ' ', COALESCE(p.middle_name || ' ', ''), p.last_name) AS patient_name,
    ct.id AS consent_type_id,
    ct.code AS consent_code,
    ct.title AS consent_title,
    ct.description AS consent_description,
    ct.emoji,
    ct.is_mandatory,
    ct.requires_otp,
    pc.is_granted,
    pc.granted_at,
    pc.revoked_at,
    pc.otp_verified,
    pc.otp_verified_at,
    pc.version,
    pc.created_at,
    pc.updated_at
FROM hms_patient_consents pc
JOIN hms_patients p ON pc.patient_id = p.id
JOIN hms_consent_types ct ON pc.consent_type_id = ct.id;

-- =========================================
-- 📊 SUMMARY
-- =========================================
-- Tables created:
--   1. tag_categories - Categories for organizing tags
--   2. tags - Individual tag definitions
--   3. patient_tags - Links patients to tags
--   4. consent_types - Types of consents available
--   5. patient_consents - Records patient consent decisions
--   6. consent_audit_log - Audit trail for consent changes
--
-- Views created:
--   1. vw_patient_tags_detailed - Detailed patient tag information
--   2. vw_patient_consents_detailed - Detailed patient consent information
-- =========================================
