-- APSIMS (Alpha Plus School Management Information System) Schema
-- Prefix: apsims_

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Core / Students (users linked to existing auth if needed, or standalone)
CREATE TABLE public.apsims_students (
  student_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  admission_number character varying NOT NULL UNIQUE,
  first_name character varying NOT NULL,
  last_name character varying NOT NULL,
  other_names character varying,
  gender character varying CHECK (gender IN ('Male', 'Female')),
  dob date,
  class_level character varying NOT NULL, -- e.g., "Form 1", "Grade 1"
  stream character varying NOT NULL,      -- e.g., "East", "Blue"
  parent_name character varying,
  parent_phone character varying,
  parent_email character varying,
  status character varying DEFAULT 'Active', -- Active, Alumnus, Transferred
  photo_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT apsims_students_pkey PRIMARY KEY (student_id)
);

-- 2. Exams Module
CREATE TABLE public.apsims_exam_terms (
  term_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  term_name character varying NOT NULL, -- e.g., "Term 1 2024"
  start_date date,
  end_date date,
  is_current boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT apsims_exam_terms_pkey PRIMARY KEY (term_id)
);

CREATE TABLE public.apsims_exams (
  exam_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  term_id uuid REFERENCES public.apsims_exam_terms(term_id),
  exam_name character varying NOT NULL, -- e.g., "Opener Exam", "Mid-Term", "End-Term"
  exam_type character varying, -- "Regular", "Mock", "KCSE"
  start_date date,
  end_date date,
  status character varying DEFAULT 'Scheduled', -- Scheduled, Ongoing, Completed, Published
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT apsims_exams_pkey PRIMARY KEY (exam_id)
);

CREATE TABLE public.apsims_exam_results (
  result_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  exam_id uuid REFERENCES public.apsims_exams(exam_id),
  student_id uuid REFERENCES public.apsims_students(student_id),
  subject_name character varying NOT NULL,
  score numeric NOT NULL CHECK (score >= 0 AND score <= 100),
  grade character varying, -- A, A-, B+, etc.
  remarks text,
  entered_by character varying, -- User ID or Name
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT apsims_exam_results_pkey PRIMARY KEY (result_id),
  CONSTRAINT apsims_exam_results_unique_entry UNIQUE (exam_id, student_id, subject_name)
);

-- 3. Fees Module
CREATE TABLE public.apsims_fee_structures (
  structure_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  term_id uuid REFERENCES public.apsims_exam_terms(term_id),
  class_level character varying NOT NULL,
  category character varying DEFAULT 'Regular', -- Regular, Boarder, Day Scholar
  amount numeric NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT apsims_fee_structures_pkey PRIMARY KEY (structure_id)
);

CREATE TABLE public.apsims_fee_items (
  item_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  structure_id uuid REFERENCES public.apsims_fee_structures(structure_id),
  item_name character varying NOT NULL, -- e.g., "Tuition", "Lunch", "Transport"
  amount numeric NOT NULL,
  is_optional boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT apsims_fee_items_pkey PRIMARY KEY (item_id)
);

CREATE TABLE public.apsims_student_fee_balances (
  balance_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  student_id uuid REFERENCES public.apsims_students(student_id),
  term_id uuid REFERENCES public.apsims_exam_terms(term_id),
  total_billed numeric DEFAULT 0,
  total_paid numeric DEFAULT 0,
  balance numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT apsims_student_fee_balances_pkey PRIMARY KEY (balance_id),
  CONSTRAINT apsims_student_fee_balances_unique UNIQUE (student_id, term_id)
);

CREATE TABLE public.apsims_fee_payments (
  payment_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  student_id uuid REFERENCES public.apsims_students(student_id),
  term_id uuid REFERENCES public.apsims_exam_terms(term_id),
  amount numeric NOT NULL,
  payment_method character varying DEFAULT 'Cash', -- Cash, M-Pesa, Bank Deposit
  reference_no character varying, -- M-Pesa Code, Slip No
  payment_date timestamp with time zone DEFAULT now(),
  received_by character varying,
  receipt_no character varying UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT apsims_fee_payments_pkey PRIMARY KEY (payment_id)
);

-- 4. Income Module (General Income apart from fees)
CREATE TABLE public.apsims_income_categories (
  category_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  category_name character varying NOT NULL UNIQUE, -- e.g., "Donations", "Rentals", "Farm Produce"
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT apsims_income_categories_pkey PRIMARY KEY (category_id)
);

CREATE TABLE public.apsims_income (
  income_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  category_id uuid REFERENCES public.apsims_income_categories(category_id),
  amount numeric NOT NULL,
  source character varying, -- Who paid?
  description text,
  payment_method character varying,
  reference_no character varying,
  income_date date DEFAULT CURRENT_DATE,
  recorded_by character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT apsims_income_pkey PRIMARY KEY (income_id)
);

-- 5. Timetable Module
CREATE TABLE public.apsims_timetable (
  timetable_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  class_level character varying NOT NULL,
  stream character varying NOT NULL,
  term_id uuid REFERENCES public.apsims_exam_terms(term_id),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT apsims_timetable_pkey PRIMARY KEY (timetable_id)
);

CREATE TABLE public.apsims_timetable_entries (
  entry_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  timetable_id uuid REFERENCES public.apsims_timetable(timetable_id),
  day_of_week character varying NOT NULL, -- Monday, Tuesday, etc.
  start_time time NOT NULL,
  end_time time NOT NULL,
  subject_name character varying NOT NULL,
  teacher_name character varying,
  room_number character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT apsims_timetable_entries_pkey PRIMARY KEY (entry_id)
);

-- 6. Remedial Management
CREATE TABLE public.apsims_remedial_sessions (
  session_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  term_id uuid REFERENCES public.apsims_exam_terms(term_id),
  subject_name character varying NOT NULL,
  teacher_name character varying,
  cost_per_student numeric DEFAULT 0,
  schedule character varying, -- e.g., "Mon-Wed 4pm-5pm"
  status character varying DEFAULT 'Active',
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT apsims_remedial_sessions_pkey PRIMARY KEY (session_id)
);

CREATE TABLE public.apsims_remedial_enrollments (
  enrollment_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  session_id uuid REFERENCES public.apsims_remedial_sessions(session_id),
  student_id uuid REFERENCES public.apsims_students(student_id),
  enrolled_date date DEFAULT CURRENT_DATE,
  has_paid boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT apsims_remedial_enrollments_pkey PRIMARY KEY (enrollment_id),
  CONSTRAINT apsims_remedial_enrollments_unique UNIQUE (session_id, student_id)
);

CREATE TABLE public.apsims_remedial_attendance (
  attendance_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  session_id uuid REFERENCES public.apsims_remedial_sessions(session_id),
  student_id uuid REFERENCES public.apsims_students(student_id),
  attendance_date date DEFAULT CURRENT_DATE,
  status character varying DEFAULT 'Present', -- Present, Absent, Excused
  recorded_by character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT apsims_remedial_attendance_pkey PRIMARY KEY (attendance_id)
);

-- 7. Student Pocket Money
CREATE TABLE public.apsims_pocket_money_wallets (
  wallet_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  student_id uuid REFERENCES public.apsims_students(student_id),
  balance numeric DEFAULT 0,
  status character varying DEFAULT 'Active', -- Active, Frozen
  pin_hash character varying, -- For students to withdraw at canteen if needed
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT apsims_pocket_money_wallets_pkey PRIMARY KEY (wallet_id),
  CONSTRAINT apsims_pocket_money_wallets_student_unique UNIQUE (student_id)
);

CREATE TABLE public.apsims_pocket_money_transactions (
  transaction_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  wallet_id uuid REFERENCES public.apsims_pocket_money_wallets(wallet_id),
  transaction_type character varying NOT NULL, -- Deposit, Withdrawal, Purchase
  amount numeric NOT NULL,
  balance_after numeric NOT NULL,
  description text,
  reference character varying,
  performed_by character varying, -- Admin/Bursar
  transaction_date timestamp with time zone DEFAULT now(),
  CONSTRAINT apsims_pocket_money_transactions_pkey PRIMARY KEY (transaction_id)
);

-- 8. Human Resources Module
CREATE TABLE public.apsims_staff (
  staff_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  first_name character varying NOT NULL,
  last_name character varying NOT NULL,
  email character varying UNIQUE,
  phone_number character varying,
  role character varying NOT NULL, -- Teacher, Admin, Bursar, Principal
  tsc_number character varying, -- For teachers
  departments text[], -- e.g., ARRAY['Mathematics', 'Science']
  subjects text[], -- e.g., ARRAY['Maths', 'Physics']
  status character varying DEFAULT 'Active',
  password_hash character varying, -- For login
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT apsims_staff_pkey PRIMARY KEY (staff_id)
);

CREATE TABLE public.apsims_subordinate_staff (
  staff_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  first_name character varying NOT NULL,
  last_name character varying NOT NULL,
  phone_number character varying,
  role character varying NOT NULL, -- Cook, Watchman, Groundsman, Cleaner, Driver, Matron
  id_number character varying UNIQUE,
  date_hired date DEFAULT CURRENT_DATE,
  status character varying DEFAULT 'Active', -- Active, Terminated, On Leave
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT apsims_subordinate_staff_pkey PRIMARY KEY (staff_id)
);
