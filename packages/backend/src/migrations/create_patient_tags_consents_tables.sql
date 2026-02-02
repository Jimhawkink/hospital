-- =============================================
-- Patient Tags and Consents Migration Script
-- HMS - Hospital Management System
-- Created: 2025-12-24
-- Database: MySQL
-- =============================================

-- =========================================
-- 🏷️ TAG CATEGORIES TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS tag_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(20) NOT NULL DEFAULT '#3B82F6',
    emoji VARCHAR(10) DEFAULT '🏷️',
    description VARCHAR(255),
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    sort_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default tag categories
INSERT INTO tag_categories (name, color, emoji, description, sort_order) VALUES
    ('Medical conditions', '#EF4444', '🔴', 'Medical conditions and diagnoses', 1),
    ('Medical programmes', '#22C55E', '🟢', 'Enrolled medical programmes', 2),
    ('Payment', '#F59E0B', '🟡', 'Payment and billing related tags', 3),
    ('General', '#3B82F6', '🔵', 'General purpose tags', 4),
    ('Allergies', '#EC4899', '💊', 'Patient allergies and sensitivities', 5),
    ('Insurance', '#8B5CF6', '🛡️', 'Insurance and coverage information', 6);

-- =========================================
-- 🏷️ TAGS TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    color VARCHAR(20),
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tags_category FOREIGN KEY (category_id) REFERENCES tag_categories(id) ON DELETE CASCADE,
    UNIQUE KEY unique_tags_category_name (category_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert some default tags
INSERT INTO tags (category_id, name, description) VALUES
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
    (6, 'Britam Insurance', 'Covered by Britam Insurance');

-- =========================================
-- 🏷️ PATIENT TAGS (Junction Table)
-- =========================================
CREATE TABLE IF NOT EXISTS patient_tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    tag_id INT NOT NULL,
    notes VARCHAR(500),
    added_by INT,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_patient_tags_patient FOREIGN KEY (patient_id) REFERENCES Patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_patient_tags_tag FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE KEY unique_patient_tags (patient_id, tag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for faster lookups
CREATE INDEX idx_patient_tags_patient_id ON patient_tags(patient_id);
CREATE INDEX idx_patient_tags_tag_id ON patient_tags(tag_id);

-- =========================================
-- ✅ CONSENT TYPES TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS consent_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(1000),
    emoji VARCHAR(10) DEFAULT '📋',
    is_mandatory TINYINT(1) NOT NULL DEFAULT 0,
    requires_otp TINYINT(1) NOT NULL DEFAULT 0,
    sort_order INT DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default consent types
INSERT INTO consent_types (code, title, description, emoji, is_mandatory, requires_otp, sort_order) VALUES
    ('MEDICAL_INFO_RECORDING', 'Medical Information Recording', 
     'Consent to have medical information recorded in the electronic health record system.', 
     '📝', 1, 0, 1),
    ('DATA_ANALYSIS', 'De-identified Data Analysis', 
     'Consent to use de-identified, aggregated data for analysis and research purposes.', 
     '📊', 0, 0, 2),
    ('RESEARCH_CONTACT', 'Research Contact', 
     'Consent that my care provider may contact me to participate in patient benefit and clinical research initiatives.', 
     '🔬', 0, 0, 3),
    ('SMS_NOTIFICATIONS', 'SMS Notifications', 
     'Consent to receive SMS notifications about appointments, test results, and health reminders.', 
     '📱', 0, 0, 4),
    ('EMAIL_COMMUNICATIONS', 'Email Communications', 
     'Consent to receive email communications regarding health updates and promotional offers.', 
     '📧', 0, 0, 5),
    ('THIRD_PARTY_SHARING', 'Third Party Data Sharing', 
     'Consent to share medical records with authorized third parties for insurance claims and referrals.', 
     '🤝', 0, 1, 6),
    ('EMERGENCY_CONTACT', 'Emergency Contact Authorization', 
     'Consent to contact designated emergency contacts in case of medical emergencies.', 
     '🚨', 1, 0, 7),
    ('PHOTO_VIDEO', 'Photography and Video Recording', 
     'Consent for photographs and video recordings for medical documentation and training purposes.', 
     '📷', 0, 1, 8);

-- =========================================
-- ✅ PATIENT CONSENTS TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS patient_consents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    consent_type_id INT NOT NULL,
    is_granted TINYINT(1) NOT NULL DEFAULT 0,
    granted_at DATETIME,
    revoked_at DATETIME,
    otp_verified TINYINT(1) NOT NULL DEFAULT 0,
    otp_verified_at DATETIME,
    otp_code VARCHAR(10),
    otp_expires_at DATETIME,
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    witness_staff_id INT,
    notes VARCHAR(500),
    version INT NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_patient_consents_patient FOREIGN KEY (patient_id) REFERENCES Patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_patient_consents_type FOREIGN KEY (consent_type_id) REFERENCES consent_types(id) ON DELETE CASCADE,
    UNIQUE KEY unique_patient_consents (patient_id, consent_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for faster lookups
CREATE INDEX idx_patient_consents_patient_id ON patient_consents(patient_id);
CREATE INDEX idx_patient_consents_type_id ON patient_consents(consent_type_id);
CREATE INDEX idx_patient_consents_granted ON patient_consents(is_granted);

-- =========================================
-- 📜 CONSENT AUDIT LOG TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS consent_audit_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_consent_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    performed_by INT,
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    notes VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_consent_audit_consent FOREIGN KEY (patient_consent_id) REFERENCES patient_consents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_consent_audit_patient_consent ON consent_audit_log(patient_consent_id);
CREATE INDEX idx_consent_audit_created ON consent_audit_log(created_at);

-- =========================================
-- 🔧 HELPFUL VIEWS
-- =========================================

-- View: Patient Tags with Category Info
CREATE OR REPLACE VIEW vw_patient_tags_detailed AS
SELECT 
    pt.id,
    pt.patient_id,
    CONCAT(p.first_name, ' ', IFNULL(CONCAT(p.middle_name, ' '), ''), p.last_name) AS patient_name,
    t.id AS tag_id,
    t.name AS tag_name,
    t.description AS tag_description,
    tc.id AS category_id,
    tc.name AS category_name,
    IFNULL(t.color, tc.color) AS color,
    tc.emoji AS category_emoji,
    pt.notes,
    pt.is_active,
    pt.created_at,
    pt.updated_at
FROM patient_tags pt
JOIN Patients p ON pt.patient_id = p.id
JOIN tags t ON pt.tag_id = t.id
JOIN tag_categories tc ON t.category_id = tc.id
WHERE pt.is_active = 1 AND t.is_active = 1;

-- View: Patient Consents with Type Info
CREATE OR REPLACE VIEW vw_patient_consents_detailed AS
SELECT 
    pc.id,
    pc.patient_id,
    CONCAT(p.first_name, ' ', IFNULL(CONCAT(p.middle_name, ' '), ''), p.last_name) AS patient_name,
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
FROM patient_consents pc
JOIN Patients p ON pc.patient_id = p.id
JOIN consent_types ct ON pc.consent_type_id = ct.id;

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
