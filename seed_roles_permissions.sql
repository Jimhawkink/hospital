-- ============================================
-- HMS Roles & Permissions - iLara HMIS Level
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Seed User Roles
INSERT INTO hms_user_roles (role_name, description, is_active, organisation_id, "created_at", "updated_at")
VALUES
  ('Administrator', 'Full system access - manages all settings, users, and configurations', true, null, NOW(), NOW()),
  ('Doctor', 'Clinical staff - manages patient encounters, prescriptions, and diagnostics', true, null, NOW(), NOW()),
  ('Nurse', 'Nursing staff - handles triage, vitals, and patient care', true, null, NOW(), NOW()),
  ('Receptionist', 'Front desk - manages appointments, patient registration, and check-in', true, null, NOW(), NOW()),
  ('Cashier', 'Billing staff - processes payments, invoices, and financial transactions', true, null, NOW(), NOW()),
  ('Pharmacist', 'Pharmacy staff - manages drug dispensing, stock, and prescriptions', true, null, NOW(), NOW()),
  ('Lab Technician', 'Laboratory staff - processes lab requests, enters results', true, null, NOW(), NOW()),
  ('Radiologist', 'Imaging staff - manages radiology requests and reports', true, null, NOW(), NOW()),
  ('Manager', 'Senior management - oversees operations, reports, and analytics', true, null, NOW(), NOW()),
  ('Data Clerk', 'Data entry staff - handles records and data completion', true, null, NOW(), NOW())
ON CONFLICT (role_name) DO UPDATE SET description = EXCLUDED.description, "updated_at" = NOW();

-- 2. Delete existing permissions and role_permissions to start fresh
DELETE FROM hms_role_permissions;
DELETE FROM hms_permissions;

-- 3. Seed Comprehensive Permissions (iLara HMIS Style)
INSERT INTO hms_permissions (permission_name, permission_key, category, description, has_create, has_edit, has_view, has_archive, sort_order, "created_at", "updated_at")
VALUES
  -- Patient Management
  ('Patient Registration', 'patient_registration', 'Patient Management', 'Register new patients', true, true, true, true, 1, NOW(), NOW()),
  ('Patient Information', 'patient_information', 'Patient Management', 'View and manage patient demographics', true, true, true, true, 2, NOW(), NOW()),
  ('Patient Medical History', 'patient_medical_history', 'Patient Management', 'Access patient medical history', false, true, true, false, 3, NOW(), NOW()),
  ('Patient Search', 'patient_search', 'Patient Management', 'Search and filter patients', false, false, true, false, 4, NOW(), NOW()),

  -- Clinical / Encounters
  ('Encounters', 'encounters', 'Clinical', 'Create and manage patient encounters', true, true, true, true, 10, NOW(), NOW()),
  ('Triage & Vitals', 'triage_vitals', 'Clinical', 'Record patient triage and vital signs', true, true, true, false, 11, NOW(), NOW()),
  ('Chief Complaints', 'chief_complaints', 'Clinical', 'Record patient complaints and symptoms', true, true, true, false, 12, NOW(), NOW()),
  ('Clinical Notes', 'clinical_notes', 'Clinical', 'Write and view clinical notes', true, true, true, false, 13, NOW(), NOW()),
  ('Diagnosis', 'diagnosis', 'Clinical', 'Record patient diagnosis (ICD-10)', true, true, true, false, 14, NOW(), NOW()),
  ('Treatment Plans', 'treatment_plans', 'Clinical', 'Create and manage treatment plans', true, true, true, false, 15, NOW(), NOW()),
  ('Referrals', 'referrals', 'Clinical', 'Create referral letters to other facilities', true, true, true, false, 16, NOW(), NOW()),
  ('Medical Certificates', 'medical_certificates', 'Clinical', 'Generate sick notes and medical certificates', true, true, true, false, 17, NOW(), NOW()),

  -- Prescriptions & Medication
  ('Prescriptions', 'prescriptions', 'Medication', 'Create and manage prescriptions', true, true, true, false, 20, NOW(), NOW()),
  ('Medication History', 'medication_history', 'Medication', 'View patient medication history', false, false, true, false, 21, NOW(), NOW()),
  ('Drug Dispensing', 'drug_dispensing', 'Medication', 'Dispense drugs to patients', true, true, true, false, 22, NOW(), NOW()),

  -- Investigations / Lab
  ('Investigation Requests', 'investigation_requests', 'Investigations', 'Request lab and radiology tests', true, true, true, false, 30, NOW(), NOW()),
  ('Investigations - Laboratory', 'investigations_laboratory', 'Investigations', 'Process laboratory investigations', true, true, true, false, 31, NOW(), NOW()),
  ('Investigations - Imaging', 'investigations_imaging', 'Investigations', 'Process imaging/radiology investigations', true, true, true, false, 32, NOW(), NOW()),
  ('Investigation Results', 'investigation_results', 'Investigations', 'Enter and view investigation results', true, true, true, false, 33, NOW(), NOW()),

  -- Appointments & Scheduling
  ('Appointments', 'appointments', 'Scheduling', 'Schedule and manage appointments', true, true, true, true, 40, NOW(), NOW()),
  ('Appointment Calendar', 'appointment_calendar', 'Scheduling', 'View appointment calendar dashboard', false, false, true, false, 41, NOW(), NOW()),
  ('Queue Management', 'queue_management', 'Scheduling', 'Manage patient queue and waiting list', true, true, true, false, 42, NOW(), NOW()),

  -- Billing & Finance
  ('Billing & Invoices', 'billing_invoices', 'Finance', 'Create bills and invoices', true, true, true, false, 50, NOW(), NOW()),
  ('Payments', 'payments', 'Finance', 'Process and record payments', true, true, true, false, 51, NOW(), NOW()),
  ('POS Sales', 'pos_sales', 'Finance', 'Point of sale transactions', true, true, true, false, 52, NOW(), NOW()),
  ('Revenue Tracking', 'revenue_tracking', 'Finance', 'View revenue analytics and tracking', false, false, true, false, 53, NOW(), NOW()),
  ('Financial Reports', 'financial_reports', 'Finance', 'View financial summaries and reports', false, false, true, false, 54, NOW(), NOW()),
  ('Insurance Claims', 'insurance_claims', 'Finance', 'Manage SHA/NHIF insurance claims', true, true, true, false, 55, NOW(), NOW()),

  -- Inventory / Pharmacy
  ('Pharmacy Stock', 'pharmacy_stock', 'Inventory', 'Manage pharmacy stock levels', true, true, true, true, 60, NOW(), NOW()),
  ('Stock Management', 'stock_management', 'Inventory', 'General inventory and stock management', true, true, true, true, 61, NOW(), NOW()),
  ('Inventory - Inbound Stock Shipments', 'inventory_inbound', 'Inventory', 'Receive and record incoming stock shipments', true, true, true, false, 62, NOW(), NOW()),
  ('Inventory - Stock Adjustments', 'inventory_adjustments', 'Inventory', 'Adjust stock quantities and corrections', true, true, true, false, 63, NOW(), NOW()),
  ('Stock Alerts & Expiry', 'stock_alerts', 'Inventory', 'Monitor low stock alerts and expiring items', false, false, true, false, 64, NOW(), NOW()),

  -- Staff & HR
  ('Staff Management', 'staff_management', 'Administration', 'Manage staff records and accounts', true, true, true, true, 70, NOW(), NOW()),
  ('User Roles & Permissions', 'user_roles', 'Administration', 'Configure user roles and permissions', true, true, true, false, 71, NOW(), NOW()),

  -- Organisation / Branch
  ('Organisation Settings', 'organisation_settings', 'Organisation', 'Configure organisation details', false, true, true, false, 80, NOW(), NOW()),
  ('Organisation / Branch Management', 'branch_management', 'Organisation', 'Manage branches and facilities', true, true, true, false, 81, NOW(), NOW()),
  ('Payment Methods', 'payment_methods', 'Organisation', 'Configure payment methods', true, true, true, false, 82, NOW(), NOW()),

  -- Dashboard & Reports
  ('Summary Dashboard', 'summary_dashboard', 'Dashboard', 'View main facility dashboard', false, false, true, false, 90, NOW(), NOW()),
  ('Data Completion', 'data_completion', 'Dashboard', 'Track data completion metrics', false, false, true, false, 91, NOW(), NOW()),
  ('Reports', 'reports', 'Dashboard', 'Generate and view system reports', false, false, true, false, 92, NOW(), NOW()),
  ('Audit Logs', 'audit_logs', 'Dashboard', 'View system activity and audit logs', false, false, true, false, 93, NOW(), NOW()),

  -- Expenses
  ('Expense History', 'expense_history', 'Expenses', 'View expense records', false, false, true, false, 100, NOW(), NOW()),
  ('Expense Management', 'expense_management', 'Expenses', 'Record and manage facility expenses', true, true, true, true, 101, NOW(), NOW())
;

-- 4. Seed Role Permissions

-- Administrator - FULL ACCESS to everything
INSERT INTO hms_role_permissions (role_id, permission_id, can_create, can_edit, can_view, can_archive, "created_at", "updated_at")
SELECT r.id, p.id, p.has_create, p.has_edit, p.has_view, p.has_archive, NOW(), NOW()
FROM hms_user_roles r, hms_permissions p
WHERE r.role_name = 'Administrator';

-- Doctor - Clinical access + view most things
INSERT INTO hms_role_permissions (role_id, permission_id, can_create, can_edit, can_view, can_archive, "created_at", "updated_at")
SELECT r.id, p.id,
  CASE WHEN p.permission_key IN ('encounters','triage_vitals','chief_complaints','clinical_notes','diagnosis','treatment_plans','referrals','medical_certificates','prescriptions','investigation_requests','appointments') THEN true ELSE false END,
  CASE WHEN p.permission_key IN ('encounters','triage_vitals','chief_complaints','clinical_notes','diagnosis','treatment_plans','referrals','medical_certificates','prescriptions','patient_information') THEN true ELSE false END,
  CASE WHEN p.permission_key NOT IN ('staff_management','user_roles','organisation_settings','branch_management','payment_methods','audit_logs','expense_management') THEN true ELSE false END,
  false, NOW(), NOW()
FROM hms_user_roles r, hms_permissions p WHERE r.role_name = 'Doctor';

-- Nurse
INSERT INTO hms_role_permissions (role_id, permission_id, can_create, can_edit, can_view, can_archive, "created_at", "updated_at")
SELECT r.id, p.id,
  CASE WHEN p.permission_key IN ('triage_vitals','chief_complaints','clinical_notes','encounters','appointments','queue_management') THEN true ELSE false END,
  CASE WHEN p.permission_key IN ('triage_vitals','chief_complaints','clinical_notes','patient_information','queue_management') THEN true ELSE false END,
  CASE WHEN p.permission_key NOT IN ('staff_management','user_roles','organisation_settings','branch_management','payment_methods','audit_logs','financial_reports','revenue_tracking','expense_management','expense_history') THEN true ELSE false END,
  false, NOW(), NOW()
FROM hms_user_roles r, hms_permissions p WHERE r.role_name = 'Nurse';

-- Receptionist
INSERT INTO hms_role_permissions (role_id, permission_id, can_create, can_edit, can_view, can_archive, "created_at", "updated_at")
SELECT r.id, p.id,
  CASE WHEN p.permission_key IN ('patient_registration','patient_information','appointments','queue_management','billing_invoices','payments') THEN true ELSE false END,
  CASE WHEN p.permission_key IN ('patient_registration','patient_information','appointments','queue_management','billing_invoices') THEN true ELSE false END,
  CASE WHEN p.permission_key IN ('patient_registration','patient_information','patient_search','appointments','appointment_calendar','queue_management','billing_invoices','payments','summary_dashboard','encounters') THEN true ELSE false END,
  false, NOW(), NOW()
FROM hms_user_roles r, hms_permissions p WHERE r.role_name = 'Receptionist';

-- Cashier
INSERT INTO hms_role_permissions (role_id, permission_id, can_create, can_edit, can_view, can_archive, "created_at", "updated_at")
SELECT r.id, p.id,
  CASE WHEN p.permission_key IN ('billing_invoices','payments','pos_sales','insurance_claims') THEN true ELSE false END,
  CASE WHEN p.permission_key IN ('billing_invoices','payments','pos_sales','insurance_claims') THEN true ELSE false END,
  CASE WHEN p.permission_key IN ('billing_invoices','payments','pos_sales','insurance_claims','patient_search','patient_information','summary_dashboard','financial_reports','revenue_tracking') THEN true ELSE false END,
  false, NOW(), NOW()
FROM hms_user_roles r, hms_permissions p WHERE r.role_name = 'Cashier';

-- Pharmacist
INSERT INTO hms_role_permissions (role_id, permission_id, can_create, can_edit, can_view, can_archive, "created_at", "updated_at")
SELECT r.id, p.id,
  CASE WHEN p.permission_key IN ('pharmacy_stock','drug_dispensing','stock_management','inventory_inbound','inventory_adjustments','pos_sales') THEN true ELSE false END,
  CASE WHEN p.permission_key IN ('pharmacy_stock','drug_dispensing','stock_management','inventory_inbound','inventory_adjustments','pos_sales') THEN true ELSE false END,
  CASE WHEN p.permission_key IN ('pharmacy_stock','drug_dispensing','stock_management','inventory_inbound','inventory_adjustments','stock_alerts','pos_sales','prescriptions','medication_history','patient_information','summary_dashboard','billing_invoices') THEN true ELSE false END,
  CASE WHEN p.permission_key IN ('pharmacy_stock','stock_management') THEN true ELSE false END,
  NOW(), NOW()
FROM hms_user_roles r, hms_permissions p WHERE r.role_name = 'Pharmacist';

-- Lab Technician
INSERT INTO hms_role_permissions (role_id, permission_id, can_create, can_edit, can_view, can_archive, "created_at", "updated_at")
SELECT r.id, p.id,
  CASE WHEN p.permission_key IN ('investigations_laboratory','investigation_results') THEN true ELSE false END,
  CASE WHEN p.permission_key IN ('investigations_laboratory','investigation_results') THEN true ELSE false END,
  CASE WHEN p.permission_key IN ('investigations_laboratory','investigation_results','investigation_requests','patient_information','patient_medical_history','encounters','summary_dashboard') THEN true ELSE false END,
  false, NOW(), NOW()
FROM hms_user_roles r, hms_permissions p WHERE r.role_name = 'Lab Technician';

-- Radiologist
INSERT INTO hms_role_permissions (role_id, permission_id, can_create, can_edit, can_view, can_archive, "created_at", "updated_at")
SELECT r.id, p.id,
  CASE WHEN p.permission_key IN ('investigations_imaging','investigation_results') THEN true ELSE false END,
  CASE WHEN p.permission_key IN ('investigations_imaging','investigation_results') THEN true ELSE false END,
  CASE WHEN p.permission_key IN ('investigations_imaging','investigation_results','investigation_requests','patient_information','patient_medical_history','encounters','summary_dashboard') THEN true ELSE false END,
  false, NOW(), NOW()
FROM hms_user_roles r, hms_permissions p WHERE r.role_name = 'Radiologist';

-- Manager
INSERT INTO hms_role_permissions (role_id, permission_id, can_create, can_edit, can_view, can_archive, "created_at", "updated_at")
SELECT r.id, p.id,
  CASE WHEN p.permission_key IN ('expense_management','staff_management') THEN true ELSE false END,
  CASE WHEN p.permission_key IN ('expense_management','staff_management','organisation_settings') THEN true ELSE false END,
  true, -- can view everything
  false, NOW(), NOW()
FROM hms_user_roles r, hms_permissions p WHERE r.role_name = 'Manager';

-- Data Clerk
INSERT INTO hms_role_permissions (role_id, permission_id, can_create, can_edit, can_view, can_archive, "created_at", "updated_at")
SELECT r.id, p.id,
  CASE WHEN p.permission_key IN ('patient_registration','patient_information') THEN true ELSE false END,
  CASE WHEN p.permission_key IN ('patient_registration','patient_information') THEN true ELSE false END,
  CASE WHEN p.permission_key IN ('patient_registration','patient_information','patient_search','patient_medical_history','encounters','summary_dashboard','data_completion','reports') THEN true ELSE false END,
  false, NOW(), NOW()
FROM hms_user_roles r, hms_permissions p WHERE r.role_name = 'Data Clerk';

-- 5. Fix logo_url column to TEXT for base64 support
ALTER TABLE hms_organisation_settings ALTER COLUMN logo_url TYPE text;

-- Done! Verify:
SELECT 'Roles' as info, count(*) as count FROM hms_user_roles
UNION ALL
SELECT 'Permissions', count(*) FROM hms_permissions
UNION ALL
SELECT 'Role-Permissions', count(*) FROM hms_role_permissions;
