-- =============================================
-- ORGANISATION ROLES & PERMISSIONS TABLES
-- Run this script to create the necessary tables
-- =============================================

-- Drop tables if they exist (for clean reinstall)
-- DROP TABLE IF EXISTS role_permissions;
-- DROP TABLE IF EXISTS permissions;
-- DROP TABLE IF EXISTS user_roles;

-- Table: user_roles
-- Stores the available user roles in the system
CREATE TABLE IF NOT EXISTS user_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    organisation_id INT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: permissions
-- Stores the list of all available permissions/modules
CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    permission_name VARCHAR(150) NOT NULL UNIQUE,
    permission_key VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(100),
    description VARCHAR(255),
    has_create BOOLEAN DEFAULT TRUE,
    has_edit BOOLEAN DEFAULT TRUE,
    has_view BOOLEAN DEFAULT TRUE,
    has_archive BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: role_permissions
-- Junction table storing the permissions for each role
CREATE TABLE IF NOT EXISTS role_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    can_create BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_view BOOLEAN DEFAULT FALSE,
    can_archive BOOLEAN DEFAULT FALSE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES user_roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_role_permission (role_id, permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- INSERT DEFAULT USER ROLES
-- =============================================
INSERT INTO user_roles (role_name, description) VALUES 
('Administrator', 'Full system access'),
('Doctor', 'Medical practitioner with clinical access'),
('Nurse', 'Nursing staff with patient care access'),
('Receptionist', 'Front desk and patient registration'),
('Pharmacist', 'Pharmacy and medication management'),
('Lab Technician', 'Laboratory and investigations access'),
('Accountant', 'Billing and financial access'),
('Cashier', 'POS and payment processing')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- =============================================
-- INSERT DEFAULT PERMISSIONS
-- =============================================
INSERT INTO permissions (permission_name, permission_key, category, has_create, has_edit, has_view, has_archive, sort_order) VALUES 
('Appointments', 'appointments', 'Scheduling', TRUE, TRUE, TRUE, TRUE, 1),
('Billing', 'billing', 'Finance', TRUE, TRUE, TRUE, TRUE, 10),
('Billing - Price Override', 'billing_price_override', 'Finance', FALSE, TRUE, FALSE, FALSE, 11),
('Billing - View Totals', 'billing_view_totals', 'Finance', FALSE, FALSE, TRUE, FALSE, 12),
('Broadcast Messages', 'broadcast_messages', 'Messaging', TRUE, TRUE, TRUE, TRUE, 20),
('Messaging Credits', 'messaging_credits', 'Messaging', TRUE, FALSE, TRUE, FALSE, 21),
('Complaints & HPI', 'complaints_hpi', 'Clinical', TRUE, TRUE, TRUE, TRUE, 30),
('Diagnosis and Plan', 'diagnosis_plan', 'Clinical', TRUE, TRUE, TRUE, TRUE, 31),
('Diagnosis - Referral', 'diagnosis_referral', 'Clinical', FALSE, TRUE, FALSE, FALSE, 32),
('Diagnosis - Sick Note', 'diagnosis_sick_note', 'Clinical', FALSE, TRUE, FALSE, FALSE, 33),
('Encounters', 'encounters', 'Encounters', TRUE, FALSE, TRUE, TRUE, 40),
('Encounters - Close', 'encounters_close', 'Encounters', FALSE, TRUE, FALSE, FALSE, 41),
('Examination', 'examination', 'Clinical', TRUE, TRUE, TRUE, TRUE, 50),
('Expense History', 'expense_history', 'Finance', TRUE, TRUE, TRUE, TRUE, 60),
('Expense Summary', 'expense_summary', 'Finance', FALSE, FALSE, TRUE, FALSE, 61),
('External Reports', 'external_reports', 'Reports', FALSE, FALSE, TRUE, FALSE, 70),
('Facility Dashboard', 'facility_dashboard', 'Reports', FALSE, FALSE, TRUE, FALSE, 71),
('Internal Reports', 'internal_reports', 'Reports', FALSE, FALSE, TRUE, FALSE, 72),
('Inventory - Products', 'inventory_products', 'Inventory', TRUE, TRUE, TRUE, TRUE, 80),
('Inventory - Stock Movements', 'inventory_stock_movements', 'Inventory', TRUE, TRUE, TRUE, TRUE, 81),
('Inventory - Stock Takes', 'inventory_stock_takes', 'Inventory', TRUE, TRUE, TRUE, TRUE, 82),
('Inventory - Buy Meds', 'inventory_buy_meds', 'Inventory', TRUE, TRUE, TRUE, FALSE, 83),
('Inventory - Inbound Stock Shipments', 'inventory_inbound_shipments', 'Inventory', TRUE, TRUE, TRUE, FALSE, 84),
('Investigation Requests', 'investigation_requests', 'Investigations', TRUE, TRUE, FALSE, TRUE, 90),
('Investigations - Imaging', 'investigations_imaging', 'Investigations', FALSE, FALSE, TRUE, FALSE, 91),
('Investigations - Laboratory', 'investigations_laboratory', 'Investigations', FALSE, FALSE, TRUE, FALSE, 92),
('Investigations Results', 'investigations_results', 'Investigations', TRUE, TRUE, TRUE, TRUE, 93),
('Medication History', 'medication_history', 'Clinical', TRUE, TRUE, TRUE, TRUE, 100),
('Organisation/Branch Management', 'organisation_management', 'Administration', TRUE, TRUE, TRUE, TRUE, 110),
('Patient Information', 'patient_information', 'Patients', TRUE, TRUE, TRUE, TRUE, 120),
('Patient Medical History', 'patient_medical_history', 'Patients', TRUE, TRUE, TRUE, TRUE, 121),
('Patient Tags', 'patient_tags', 'Patients', TRUE, TRUE, TRUE, TRUE, 122),
('Prescriptions', 'prescriptions', 'Clinical', TRUE, TRUE, TRUE, TRUE, 130),
('Review of Systems', 'review_of_systems', 'Clinical', TRUE, TRUE, TRUE, TRUE, 140),
('Roles & Permissions', 'roles_permissions', 'Administration', TRUE, TRUE, TRUE, TRUE, 150)
ON DUPLICATE KEY UPDATE category = VALUES(category);

-- =============================================
-- GRANT ADMINISTRATOR FULL ACCESS
-- =============================================
INSERT INTO role_permissions (role_id, permission_id, can_create, can_edit, can_view, can_archive)
SELECT 
    (SELECT id FROM user_roles WHERE role_name = 'Administrator'),
    p.id,
    p.has_create,
    p.has_edit,
    p.has_view,
    p.has_archive
FROM permissions p
ON DUPLICATE KEY UPDATE can_create = VALUES(can_create), can_edit = VALUES(can_edit), can_view = VALUES(can_view), can_archive = VALUES(can_archive);

-- =============================================
-- GRANT NURSE DEFAULT PERMISSIONS
-- =============================================
INSERT INTO role_permissions (role_id, permission_id, can_create, can_edit, can_view, can_archive)
SELECT 
    (SELECT id FROM user_roles WHERE role_name = 'Nurse'),
    p.id,
    CASE 
        WHEN p.permission_key IN ('appointments', 'billing', 'complaints_hpi', 'diagnosis_plan', 'encounters', 'examination', 'investigation_requests', 'investigations_results', 'medication_history', 'patient_information', 'patient_medical_history', 'patient_tags', 'prescriptions', 'review_of_systems') THEN TRUE
        ELSE FALSE
    END,
    CASE 
        WHEN p.permission_key IN ('appointments', 'billing', 'complaints_hpi', 'diagnosis_plan', 'diagnosis_referral', 'diagnosis_sick_note', 'encounters_close', 'examination', 'investigations_results', 'medication_history', 'patient_information', 'patient_medical_history', 'patient_tags', 'prescriptions', 'review_of_systems') THEN TRUE
        ELSE FALSE
    END,
    CASE 
        WHEN p.permission_key IN ('appointments', 'billing', 'billing_view_totals', 'complaints_hpi', 'diagnosis_plan', 'encounters', 'examination', 'external_reports', 'internal_reports', 'investigations_imaging', 'investigations_laboratory', 'investigations_results', 'medication_history', 'patient_information', 'patient_medical_history', 'patient_tags', 'prescriptions', 'review_of_systems') THEN TRUE
        ELSE FALSE
    END,
    CASE 
        WHEN p.permission_key IN ('diagnosis_plan', 'patient_tags') THEN TRUE
        ELSE FALSE
    END
FROM permissions p
ON DUPLICATE KEY UPDATE can_create = VALUES(can_create), can_edit = VALUES(can_edit), can_view = VALUES(can_view), can_archive = VALUES(can_archive);

SELECT 'Roles and Permissions tables created successfully!' AS Status;
