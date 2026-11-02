import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Users, Calendar, CheckSquare, BookOpen, BarChart3, FileText, Settings,
  Plus, Trash2, Save, Printer, Download, RefreshCw, Database, CheckCircle2,
  AlertCircle, Sparkles, Upload, Code2, Copy, Check, LogIn, LogOut, Shield,
  User, Clock, MapPin, Activity, PieChart, TrendingUp, ChevronRight, Lock, Eye,
  Pencil, Search, Filter, Briefcase, Network, BookMarked, Award, FileSpreadsheet,
  UserCheck, UserX, FolderArchive, RotateCcw, Edit3, SlidersHorizontal, KeyRound,
  Target, Bell
} from 'lucide-react';
import {
  initSupabaseRuntime,
  isSupabaseConfigured,
  SUPABASE_URL as CLIENT_SUPABASE_URL,
  SUPABASE_ANON_KEY as CLIENT_SUPABASE_ANON_KEY,
  subscribeRealtimeUpdates,
  getRealtimeStatus,
  SkenaHrApi,
  CompanySettings,
  Employee,
  Competency,
  WorkSchedule,
  AttendanceRecord,
  ActivityLog,
  KpiEvaluation,
  EmployeeReport,
  EmploymentStatus,
  AttendanceStatus,
  DEFAULT_COMPANY_SETTINGS,
  DEFAULT_USERS,
  DEFAULT_JOB_PROFILES,
  DEFAULT_LMS_CURRICULUM,
  JobProfile,
  JobChecklistItem,
  JobWorkflowStep,
  LmsCurriculum,
  AppUser,
  CollaboratorCategory,
  ResignStatus,
  KpiWeightConfig,
  DEFAULT_KPI_WEIGHTS,
  SharingSessionItem,
  SharingProgramType,
  OneYearPlanItem,
  ExecutiveReminderItem
} from './services/supabaseClient';

export const SUPABASE_URL = CLIENT_SUPABASE_URL || 'https://qmrxilteqperjqqlaghv.supabase.co';
export const SUPABASE_ANON_KEY =
  CLIENT_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtcnhpbHRlcXBlcmpxcWxhZ2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyNjk4MzAsImV4cCI6MjEwODg0NTgzMH0.cCqdeGBGAqFRchegMk25jCo4Asnb4ok_oxMBTAYsVrA';

const SKENA_LOGO_SRC = '/assets/aistudio/Screenshot_2026-10-28_151237_3e3ace99.png';

type ActiveModule =
  | 'dashboard'
  | 'schedules'
  | 'attendance'
  | 'logs'
  | 'kpi_workload'
  | 'report_card'
  | 'employee_self_attendance'
  | 'performance_analytics'
  | 'org_chart'
  | 'job_profiles_lms'
  | 'sharing_sessions'
  | 'one_year_plan'
  | 'user_accounts_db';

const SQL_SCHEMA_SCRIPT = `-- ============================================================================
-- PT SKENA WAHANA KREATIF HRIS — SUPABASE POSTGRESQL PERFECTED SCHEMA (v3.0)
-- ============================================================================
-- FITUR SKRIP INI:
-- 1. 100% IDEMPOTENT (Aman dijalankan berulang kali di SQL Editor tanpa error)
-- 2. AUTO-MIGRATION & SELF-HEALING (Otomatis memperbaiki tabel lama yang
--    menggunakan tipe UUID ketat menjadi TEXT fleksibel & menambah kolom baru)
-- 3. REALTIME WEBSOCKET READY (Mengaktifkan publikasi supabase_realtime)
-- 4. LENGKAP 11 TABEL + SEED DATA OTOMATIS (Siap diedit secara Realtime)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- BAGIAN A: PEMBUATAN 11 TABEL UTAMA (JIKA BELUM ADA)
-- ============================================================================

-- 1. TABEL PENGATURAN PERUSAHAAN & HR
CREATE TABLE IF NOT EXISTS company_settings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_name TEXT NOT NULL DEFAULT 'PT Skena Wahana Kreatif',
    industry_sector TEXT NOT NULL DEFAULT 'Creative & Digital Media Agency',
    department_scope TEXT NOT NULL DEFAULT 'All Departments',
    evaluation_cycle TEXT NOT NULL DEFAULT 'Quarterly (Q4)',
    period_year TEXT NOT NULL DEFAULT '2026',
    period_term TEXT NOT NULL DEFAULT 'Semester 2 (Jul - Des)',
    hr_lead_name TEXT NOT NULL DEFAULT 'Agun Sesar',
    hr_lead_id TEXT DEFAULT 'SKN-HC-001',
    managing_director_name TEXT NOT NULL DEFAULT 'Uswatun Hasanah',
    managing_director_id TEXT DEFAULT 'SKN-DIR-001',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABEL MASTER KARYAWAN & SKEMA KONTRAK
CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_nik TEXT UNIQUE NOT NULL,
    tax_bpjs_id TEXT DEFAULT '',
    full_name TEXT NOT NULL,
    gender TEXT DEFAULT 'L',
    role_title TEXT NOT NULL,
    department TEXT NOT NULL DEFAULT 'Creative',
    employment_status TEXT NOT NULL DEFAULT 'Full Time',
    contract_duration TEXT DEFAULT '12 Bulan (Jan - Des 2026)',
    benefits_package TEXT DEFAULT 'BPJS Kesehatan, BPJS Ketenagakerjaan',
    assigned_project TEXT DEFAULT '',
    work_location TEXT DEFAULT 'Makassar HQ',
    direct_supervisor TEXT DEFAULT 'Managing Director',
    annual_leave_quota INT DEFAULT 12,
    deactivation_reason TEXT,
    deactivation_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABEL KAMUS KOMPETENSI & KPI MATRIX
CREATE TABLE IF NOT EXISTS competencies (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    competency_code TEXT NOT NULL UNIQUE,
    competency_name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Core KPI',
    target_threshold NUMERIC(5,2) DEFAULT 75.00,
    standard_workload_hours INT DEFAULT 40,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TABEL JADWAL KERJA, SHIFT & PRODUKSI
CREATE TABLE IF NOT EXISTS work_schedules (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    schedule_date DATE DEFAULT CURRENT_DATE,
    day_of_week TEXT NOT NULL DEFAULT 'Senin',
    start_time TEXT NOT NULL DEFAULT '09:00',
    end_time TEXT NOT NULL DEFAULT '17:00',
    shift_code TEXT NOT NULL,
    competency_id TEXT,
    location_agenda_notes TEXT DEFAULT '',
    employee_id TEXT,
    employee_name TEXT DEFAULT 'Seluruh Tim',
    created_by_role TEXT DEFAULT 'admin',
    status TEXT DEFAULT 'Scheduled',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. TABEL PRESENSI HARIAN KARYAWAN
CREATE TABLE IF NOT EXISTS attendances (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_id TEXT NOT NULL,
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in_time TEXT DEFAULT '08:45:00',
    status TEXT NOT NULL DEFAULT 'WFO',
    work_location_tag TEXT DEFAULT 'Makassar HQ',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(employee_id, attendance_date)
);

-- 6. TABEL LOG AKTIVITAS, LMS & SPRINT HARIAN
CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    schedule_id TEXT,
    competency_id TEXT,
    sprint_session_info TEXT NOT NULL DEFAULT 'Sprint Pagi (09:00 - 12:00)',
    project_deliverable_topic TEXT NOT NULL,
    execution_details TEXT NOT NULL,
    blocker_evaluator_notes TEXT DEFAULT '',
    total_active_team INT DEFAULT 0,
    total_on_leave INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. TABEL EVALUASI KPI, SKILL LEVEL & WORKLOAD
CREATE TABLE IF NOT EXISTS kpi_evaluations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_id TEXT NOT NULL,
    competency_id TEXT NOT NULL,
    period_year TEXT NOT NULL DEFAULT '2026',
    period_term TEXT NOT NULL DEFAULT 'Semester 2 (Jul - Des)',
    kpi_q1 NUMERIC(5,2) DEFAULT 0,
    kpi_q2 NUMERIC(5,2) DEFAULT 0,
    kpi_q3 NUMERIC(5,2) DEFAULT 0,
    kpi_q4 NUMERIC(5,2) DEFAULT 0,
    mid_review_score NUMERIC(5,2) DEFAULT 0,
    final_project_score NUMERIC(5,2) DEFAULT 0,
    final_kpi_score NUMERIC(5,2) DEFAULT 0,
    current_skill_level INT DEFAULT 3,
    workload_percentage NUMERIC(5,2) DEFAULT 85.00,
    performance_narrative TEXT DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(employee_id, competency_id, period_year, period_term)
);

-- 8. TABEL RAPOR KARYAWAN, IDP, LMS & TALENT PIPELINE
CREATE TABLE IF NOT EXISTS employee_reports (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_id TEXT NOT NULL,
    period_year TEXT NOT NULL DEFAULT '2026',
    period_term TEXT NOT NULL DEFAULT 'Semester 2 (Jul - Des)',
    idp_lms_modules JSONB DEFAULT '[]'::jsonb,
    behavioral_culture_notes TEXT DEFAULT '',
    hr_director_notes TEXT DEFAULT '',
    talent_pipeline_box TEXT DEFAULT 'Solid Professional (Key Contributor)',
    career_decision TEXT DEFAULT 'Retain Current Role',
    next_role_assignment TEXT DEFAULT '-',
    report_date DATE DEFAULT CURRENT_DATE,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(employee_id, period_year, period_term)
);

-- 9. TABEL DATABASE AKUN LOGIN USER (USERNAME & PASSWORD)
CREATE TABLE IF NOT EXISTS user_accounts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL DEFAULT 'password123',
    role TEXT NOT NULL DEFAULT 'employee',
    employee_id TEXT,
    employee_nik TEXT,
    role_title TEXT DEFAULT 'Staff',
    department TEXT DEFAULT 'Creative',
    employment_status TEXT DEFAULT 'Full Time',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. TABEL JOB PROFILE & STANDAR JABATAN
CREATE TABLE IF NOT EXISTS job_profiles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    role_title TEXT NOT NULL,
    department TEXT NOT NULL DEFAULT 'Creative',
    direct_supervisor TEXT DEFAULT 'Managing Director',
    reports_to TEXT DEFAULT 'Managing Director',
    directsupervisor TEXT DEFAULT 'Managing Director',
    summary TEXT DEFAULT '',
    role_summary TEXT DEFAULT '',
    key_responsibilities JSONB DEFAULT '[]'::jsonb,
    requirements JSONB DEFAULT '[]'::jsonb,
    technical_competencies JSONB DEFAULT '[]'::jsonb,
    required_competencies JSONB DEFAULT '[]'::jsonb,
    behavioral_traits JSONB DEFAULT '[]'::jsonb,
    core_kpis JSONB DEFAULT '[]'::jsonb,
    kpi_indicators JSONB DEFAULT '[]'::jsonb,
    standard_workload_hours INT DEFAULT 40,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. TABEL KURIKULUM LMS & MODUL PELATIHAN
CREATE TABLE IF NOT EXISTS lms_curriculum (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    module_code TEXT DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    department TEXT NOT NULL DEFAULT 'Creative',
    category TEXT NOT NULL DEFAULT 'Creative & Production',
    department_focus TEXT NOT NULL DEFAULT 'All Departments',
    duration_hours INT DEFAULT 8,
    level TEXT DEFAULT 'Intermediate',
    status TEXT DEFAULT 'Aktif',
    description TEXT DEFAULT '',
    instructor_mentor TEXT DEFAULT 'Internal Mentor',
    syllabus_summary TEXT DEFAULT '',
    learning_objectives JSONB DEFAULT '[]'::jsonb,
    key_skills_learned JSONB DEFAULT '[]'::jsonb,
    target_roles JSONB DEFAULT '[]'::jsonb,
    target_competency_codes JSONB DEFAULT '[]'::jsonb,
    passing_score INT DEFAULT 80,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- BAGIAN B: AUTO-MIGRATION & SELF-HEALING UNTUK TABEL LAMA (UUID -> TEXT)
-- ============================================================================
-- Blok ini otomatis memperbaiki tabel lama jika sebelumnya Anda pernah
-- menjalankan skrip SQL versi lama yang memakai tipe UUID atau kurang kolom.
DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. Hapus Foreign Key & Check Constraints lama yang terlalu kaku agar konversi tipe aman
    FOR r IN (
        SELECT tc.table_name, tc.constraint_name
        FROM information_schema.table_constraints tc
        WHERE tc.table_schema = 'public'
          AND tc.table_name IN (
              'company_settings', 'employees', 'competencies', 'work_schedules',
              'attendances', 'activity_logs', 'kpi_evaluations', 'employee_reports',
              'user_accounts', 'job_profiles', 'lms_curriculum'
          )
          AND tc.constraint_type IN ('FOREIGN KEY', 'CHECK')
    ) LOOP
        EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I CASCADE', r.table_name, r.constraint_name);
    END LOOP;

    -- 2. Konversi kolom ID & relasi dari UUID ke TEXT jika masih bertipe UUID
    FOR r IN (
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name IN (
              'company_settings', 'employees', 'competencies', 'work_schedules',
              'attendances', 'activity_logs', 'kpi_evaluations', 'employee_reports',
              'user_accounts', 'job_profiles', 'lms_curriculum'
          )
          AND data_type IN ('uuid', 'time without time zone')
    ) LOOP
        EXECUTE format(
            'ALTER TABLE public.%I ALTER COLUMN %I TYPE TEXT USING %I::text',
            r.table_name, r.column_name, r.column_name
        );
    END LOOP;

    -- 3. Pastikan semua kolom id memiliki DEFAULT gen_random_uuid()::text
    FOR r IN (
        SELECT table_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND column_name = 'id'
          AND table_name IN (
              'company_settings', 'employees', 'competencies', 'work_schedules',
              'attendances', 'activity_logs', 'kpi_evaluations', 'employee_reports',
              'user_accounts', 'job_profiles', 'lms_curriculum'
          )
    ) LOOP
        EXECUTE format('ALTER TABLE public.%I ALTER COLUMN id SET DEFAULT gen_random_uuid()::text', r.table_name);
    END LOOP;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Auto-migration notice: %', SQLERRM;
END $$;

-- 4. Tambahkan kolom-kolom baru jika belum ada pada tabel lama
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE employees ADD COLUMN IF NOT EXISTS tax_bpjs_id TEXT DEFAULT '';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS annual_leave_quota INT DEFAULT 12;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS deactivation_reason TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS deactivation_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE competencies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE work_schedules ADD COLUMN IF NOT EXISTS schedule_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE work_schedules ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE work_schedules ADD COLUMN IF NOT EXISTS employee_name TEXT DEFAULT 'Seluruh Tim';
ALTER TABLE work_schedules ADD COLUMN IF NOT EXISTS created_by_role TEXT DEFAULT 'admin';
ALTER TABLE work_schedules ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Scheduled';
ALTER TABLE work_schedules ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE attendances ADD COLUMN IF NOT EXISTS check_in_time TEXT DEFAULT '08:45:00';
ALTER TABLE attendances ADD COLUMN IF NOT EXISTS work_location_tag TEXT DEFAULT 'Makassar HQ';
ALTER TABLE attendances ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
ALTER TABLE attendances ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS summary TEXT DEFAULT '';
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS role_summary TEXT DEFAULT '';
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS direct_supervisor TEXT DEFAULT 'Managing Director';
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS reports_to TEXT DEFAULT 'Managing Director';
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS requirements JSONB DEFAULT '[]'::jsonb;
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS technical_competencies JSONB DEFAULT '[]'::jsonb;
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS behavioral_traits JSONB DEFAULT '[]'::jsonb;
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS core_kpis JSONB DEFAULT '[]'::jsonb;
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE lms_curriculum ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Creative';
ALTER TABLE lms_curriculum ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'Intermediate';
ALTER TABLE lms_curriculum ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Aktif';
ALTER TABLE lms_curriculum ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE lms_curriculum ADD COLUMN IF NOT EXISTS key_skills_learned JSONB DEFAULT '[]'::jsonb;
ALTER TABLE lms_curriculum ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Pastikan final_kpi_score pada kpi_evaluations dapat diupdate langsung tanpa error GENERATED ALWAYS
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'kpi_evaluations'
          AND column_name = 'final_kpi_score'
          AND is_generated = 'ALWAYS'
    ) THEN
        ALTER TABLE public.kpi_evaluations ALTER COLUMN final_kpi_score DROP EXPRESSION;
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Fallback jika versi PG tidak mendukung DROP EXPRESSION: ganti kolom secara aman
    BEGIN
        ALTER TABLE public.kpi_evaluations DROP COLUMN final_kpi_score;
        ALTER TABLE public.kpi_evaluations ADD COLUMN final_kpi_score NUMERIC(5,2) DEFAULT 0;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
END $$;

ALTER TABLE kpi_evaluations ADD COLUMN IF NOT EXISTS final_kpi_score NUMERIC(5,2) DEFAULT 0;
ALTER TABLE kpi_evaluations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE employee_reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ============================================================================
-- BAGIAN C: ROW LEVEL SECURITY (RLS) & PUBLIC ACCESS POLICIES (IDEMPOTENT)
-- ============================================================================
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lms_curriculum ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access to company_settings" ON company_settings;
CREATE POLICY "Allow full access to company_settings" ON company_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to employees" ON employees;
CREATE POLICY "Allow full access to employees" ON employees FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to competencies" ON competencies;
CREATE POLICY "Allow full access to competencies" ON competencies FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to work_schedules" ON work_schedules;
CREATE POLICY "Allow full access to work_schedules" ON work_schedules FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to attendances" ON attendances;
CREATE POLICY "Allow full access to attendances" ON attendances FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to activity_logs" ON activity_logs;
CREATE POLICY "Allow full access to activity_logs" ON activity_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to kpi_evaluations" ON kpi_evaluations;
CREATE POLICY "Allow full access to kpi_evaluations" ON kpi_evaluations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to employee_reports" ON employee_reports;
CREATE POLICY "Allow full access to employee_reports" ON employee_reports FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to user_accounts" ON user_accounts;
CREATE POLICY "Allow full access to user_accounts" ON user_accounts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to job_profiles" ON job_profiles;
CREATE POLICY "Allow full access to job_profiles" ON job_profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to lms_curriculum" ON lms_curriculum;
CREATE POLICY "Allow full access to lms_curriculum" ON lms_curriculum FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- BAGIAN D: KONFIGURASI REALTIME WEBSOCKET SUPABASE (POSTGRES_CHANGES)
-- ============================================================================
ALTER TABLE company_settings REPLICA IDENTITY FULL;
ALTER TABLE employees REPLICA IDENTITY FULL;
ALTER TABLE competencies REPLICA IDENTITY FULL;
ALTER TABLE work_schedules REPLICA IDENTITY FULL;
ALTER TABLE attendances REPLICA IDENTITY FULL;
ALTER TABLE activity_logs REPLICA IDENTITY FULL;
ALTER TABLE kpi_evaluations REPLICA IDENTITY FULL;
ALTER TABLE employee_reports REPLICA IDENTITY FULL;
ALTER TABLE user_accounts REPLICA IDENTITY FULL;
ALTER TABLE job_profiles REPLICA IDENTITY FULL;
ALTER TABLE lms_curriculum REPLICA IDENTITY FULL;

DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'company_settings', 'employees', 'competencies', 'work_schedules',
        'attendances', 'activity_logs', 'kpi_evaluations', 'employee_reports',
        'user_accounts', 'job_profiles', 'lms_curriculum'
    ] LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime'
              AND schemaname = 'public'
              AND tablename = tbl
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
        END IF;
    END LOOP;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Realtime publication setup notice: %', SQLERRM;
END $$;

-- ============================================================================
-- BAGIAN E: SEED DATA MASTER AWAL PT SKENA WAHANA KREATIF (SIAP DIEDIT)
-- ============================================================================

-- 1. Seed Pengaturan Perusahaan
INSERT INTO company_settings (id, company_name, industry_sector, department_scope, evaluation_cycle, period_year, period_term, hr_lead_name, hr_lead_id, managing_director_name, managing_director_id)
VALUES ('default-settings-1', 'PT Skena Wahana Kreatif', 'Creative & Digital Media Agency', 'All Departments (Creative, Medsos, Marcomm, Production, Operasional, Finance, Sales)', 'Quarterly (Q4)', '2026', 'Semester 2 (Jul - Des)', 'Agun Sesar', 'SKN-HC-001', 'Uswatun Hasanah', 'SKN-DIR-001')
ON CONFLICT (id) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    updated_at = now();

-- 2. Seed 18 Karyawan Organisasi Skena
INSERT INTO employees (id, employee_nik, tax_bpjs_id, full_name, gender, role_title, department, employment_status, contract_duration, benefits_package, assigned_project, work_location, direct_supervisor, annual_leave_quota, is_active) VALUES
('e-1', 'SKN-DIR-001', 'BPJS-990112201', 'Uswatun Hasanah', 'P', 'Managing Director', 'Managing Director', 'Full Time', 'Permanent / Executive', 'Executive Benefits, BPJS Lengkap, Revenue Share', 'Executive Corporate Strategy & Agency Growth', 'Makassar HQ', 'Board of Founders', 12, true),
('e-2', 'SKN-OPS-001', 'BPJS-990112202', 'Herwin', 'L', 'Operational Manager', 'Operasional', 'Full Time', 'Permanent (Jan - Des 2026)', 'BPJS Kesehatan & TK, Operational Allowance', 'Agency Operations & Cross-Department Workflow', 'Makassar HQ', 'Uswatun Hasanah (Managing Director)', 12, true),
('e-3', 'SKN-FIN-001', 'BPJS-990112203', 'Nadia', 'P', 'Finance & Tax Manager', 'Finance & Tax', 'Full Time', 'Permanent (Jan - Des 2026)', 'BPJS Kesehatan & TK, Professional Allowance', 'Corporate Cashflow, Tax Compliance & Billing', 'Makassar HQ', 'Uswatun Hasanah (Managing Director)', 12, true),
('e-4', 'SKN-HC-001', 'BPJS-990112204', 'Agun Sesar', 'L', 'Staff Human Capital', 'Operasional', 'Full Time', '12 Bulan (Jan - Des 2026)', 'BPJS Kesehatan & TK, HR Operational Allowance', 'People Operations, KPI Evaluation & Recruitment', 'Makassar HQ', 'Herwin (Operational Manager)', 12, true),
('e-5', 'SKN-GA-001', 'BPJS-990112205', 'Rezky Amalia', 'P', 'General Affair', 'Operasional', 'Full Time', '12 Bulan (Jan - Des 2026)', 'BPJS Kesehatan & TK, Transport Allowance', 'Facility Management, Asset & Studio Readiness', 'Makassar HQ', 'Herwin (Operational Manager)', 12, true),
('e-6', 'SKN-FIN-002', 'BPJS-990112206', 'Nanda', 'P', 'Staff Finance & Tax', 'Finance & Tax', 'Full Time', '12 Bulan (Jan - Des 2026)', 'BPJS Kesehatan & TK, Meal Allowance', 'Invoicing, Expense Tracking & Monthly Tax Filing', 'Makassar HQ', 'Nadia (Finance & Tax Manager)', 12, true),
('e-7', 'SKN-SLS-001', 'BPJS-990112207', 'Anggi', 'P', 'Manager Sales & Marketing', 'Sales & Marketing', 'Full Time', 'Permanent (Jan - Des 2026)', 'BPJS Kesehatan & TK, Komisi Revenue Klien', 'Key Account Acquisition & Commercial Target', 'Makassar HQ', 'Uswatun Hasanah (Managing Director)', 12, true),
('e-8', 'SKN-SLS-002', 'BPJS-990112208', 'Fikri', 'L', 'Staff Business Development', 'Sales & Marketing', 'Full Time Performance Based', '12 Bulan + Insentif Deal', 'Gaji Pokok, BPJS, Tiered Sales Incentive', 'B2B Partnership & New Brand Pitching', 'Makassar HQ / Client Site', 'Anggi (Manager Sales & Marketing)', 12, true),
('e-9', 'SKN-SLS-003', 'BPJS-990112209', 'Auliyah', 'P', 'Admin Sales', 'Sales & Marketing', 'Full Time', '12 Bulan (Jan - Des 2026)', 'BPJS Kesehatan & TK, Admin Bonus', 'Sales Quotation, Client Database & Contract Admin', 'Makassar HQ', 'Anggi (Manager Sales & Marketing)', 12, true),
('e-10', 'SKN-CRE-001', 'BPJS-990112210', 'Wahyudi', 'L', 'Creative Head', 'Creative', 'Full Time', 'Permanent (Jan - Des 2026)', 'BPJS Kesehatan & TK, Device & Creative Lead Bonus', 'Multi-Brand Creative Direction & Quality Control', 'Makassar HQ', 'Uswatun Hasanah (Managing Director)', 12, true),
('e-11', 'SKN-CRE-002', 'BPJS-990112211', 'Wulan', 'P', 'Graphic Designer', 'Creative', 'Full Time', '12 Bulan (Jan - Des 2026)', 'BPJS Kesehatan & TK, Device Allowance', 'Key Visual Kampanye, Social Feeds & Branding Kit', 'Makassar HQ / Hybrid', 'Wahyudi (Creative Head)', 12, true),
('e-12', 'SKN-CRE-003', 'BPJS-990112212', 'Fadel', 'L', 'Graphic Designer', 'Creative', 'Full Time', '12 Bulan (Jan - Des 2026)', 'BPJS Kesehatan & TK, Device Allowance', 'Digital Ads Visual, Packaging & Motion Asset', 'Makassar HQ / Hybrid', 'Wahyudi (Creative Head)', 12, true),
('e-13', 'SKN-MDS-001', 'BPJS-990112213', 'Hilal', 'L', 'Social Media Specialist', 'Medsos', 'Full Time Performance Based', '12 Bulan + Bonus Viral/ER', 'BPJS Kesehatan & TK, Content Performance Bonus', 'Content Pillar, TikTok/IG Growth & Analytics', 'Makassar HQ / Studio', 'Wahyudi (Creative Head)', 12, true),
('e-14', 'SKN-MDS-002', 'BPJS-990112214', 'Rifky', 'L', 'Copywriter', 'Medsos', 'Full Time', '12 Bulan (Jan - Des 2026)', 'BPJS Kesehatan & TK, Creative Writing Allowance', 'Scriptwriting, Ad Copy, Caption & Storytelling', 'Makassar HQ / Hybrid', 'Wahyudi (Creative Head)', 12, true),
('e-15', 'SKN-MRC-001', 'BPJS-990112215', 'Fadli', 'L', 'Marcomm Specialist', 'Marcomm', 'Full Time', '12 Bulan (Jan - Des 2026)', 'BPJS Kesehatan & TK, Communication Allowance', 'Public Relations, KOL Management & Brand Activation', 'Makassar HQ / Lapangan', 'Anggi (Manager Sales & Marketing)', 12, true),
('e-16', 'SKN-PRD-001', 'BPJS-990112216', 'Lullu', 'L', 'Head Production', 'Production', 'Full Time', 'Permanent (Jan - Des 2026)', 'BPJS Kesehatan & TK, Gear & Production Lead Bonus', 'Commercial Video Production & Post-Production Lead', 'Studio Utama & Lokasi Syuting', 'Wahyudi (Creative Head)', 12, true),
('e-17', 'SKN-PRD-002', 'BPJS-990112217', 'Taufik', 'L', 'Videographer & Editor', 'Production', 'Full Time Performance Based', '12 Bulan + Insentif Produksi', 'BPJS Kesehatan & TK, Gear Maintenance & Shoot Fee', 'Shooting Kampanye Klien, Offline/Online Video Editing', 'Studio Utama & Outdoor', 'Lullu (Head Production)', 12, true),
('e-18', 'SKN-PRD-003', 'BPJS-990112218', 'Rian', 'L', 'Videographer & Editor', 'Production', 'Probation', '3 Bulan Evaluasi (Okt - Des 2026)', 'Gaji Pokok Probation, Uang Makan & Liputan', 'Reels/TikTok Video Shooting, Color Grading & Motion', 'Studio Utama & Outdoor', 'Lullu (Head Production)', 12, true)
ON CONFLICT (employee_nik) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role_title = EXCLUDED.role_title,
    department = EXCLUDED.department,
    employment_status = EXCLUDED.employment_status,
    updated_at = now();

-- 3. Seed Kamus Kompetensi & KPI
INSERT INTO competencies (id, competency_code, competency_name, category, target_threshold, standard_workload_hours) VALUES
('c-cre-1', 'KPI-CRE-01', 'Visual Branding, Graphic Design & Key Visual Quality', 'Core KPI', 82, 40),
('c-cre-2', 'KPI-CRE-02', 'Creative Ideation, Art Direction & Campaign Concepting', 'Hard Skill', 80, 40),
('c-mds-1', 'KPI-MDS-01', 'Social Media Growth, Engagement Rate (ER) & Content Pillar', 'Core KPI', 80, 40),
('c-mds-2', 'KPI-MDS-02', 'Copywriting, Scriptwriting & Persuasive Hook Storytelling', 'Hard Skill', 78, 40),
('c-mrc-1', 'KPI-MRC-01', 'Marcomm Strategy, KOL/Influencer & Brand Activation', 'Core KPI', 80, 40),
('c-prd-1', 'KPI-PRD-01', 'Videography, Cinematography, Lighting & Audio Production', 'Core KPI', 82, 40),
('c-prd-2', 'KPI-PRD-02', 'Video Editing, Color Grading, Motion & Turnaround Speed', 'Hard Skill', 80, 40),
('c-sls-1', 'KPI-SLS-01', 'Sales Revenue Target, B2B Pitching & New Client Acquisition', 'Core KPI', 85, 40),
('c-sls-2', 'KPI-SLS-02', 'Client Retention, Account Admin & Quotation Accuracy', 'Soft Skill', 80, 40),
('c-ops-1', 'KPI-OPS-01', 'Operational Excellence, SLA Workflow & Facility Readiness', 'Core KPI', 82, 40),
('c-hc-1', 'KPI-HC-01', 'Human Capital Management, KPI/WLA Audit & Team Culture', 'Core KPI', 82, 40),
('c-fin-1', 'KPI-FIN-01', 'Financial Reporting Accuracy, Cashflow & Tax Compliance', 'Core KPI', 88, 40),
('c-gen-1', 'SKL-GEN-01', 'Cross-Team Agile Collaboration, Discipline & Initiative', 'Soft Skill', 80, 40)
ON CONFLICT (competency_code) DO UPDATE SET
    competency_name = EXCLUDED.competency_name,
    category = EXCLUDED.category,
    target_threshold = EXCLUDED.target_threshold,
    updated_at = now();

-- 4. Seed Database Akun Login (20 Akun Admin & Karyawan)
INSERT INTO user_accounts (id, name, email, username, password, role, employee_id, employee_nik, role_title, department, employment_status) VALUES
('u-admin-1', 'Uswatun Hasanah', 'uswatun@skena.id', 'uswatun', 'password123', 'admin', 'e-1', 'SKN-DIR-001', 'Managing Director', 'Managing Director', 'Full Time'),
('u-admin-2', 'Agun Sesar', 'agun@skena.id', 'agun', 'password123', 'admin', 'e-4', 'SKN-HC-001', 'Staff Human Capital', 'Operasional', 'Full Time'),
('u-emp-1', 'Uswatun Hasanah', 'uswatun@skena.id', 'uswatun.emp', 'password123', 'employee', 'e-1', 'SKN-DIR-001', 'Managing Director', 'Managing Director', 'Full Time'),
('u-emp-2', 'Herwin', 'herwin@skena.id', 'herwin', 'password123', 'employee', 'e-2', 'SKN-OPS-001', 'Operational Manager', 'Operasional', 'Full Time'),
('u-emp-3', 'Nadia', 'nadia@skena.id', 'nadia', 'password123', 'employee', 'e-3', 'SKN-FIN-001', 'Finance & Tax Manager', 'Finance & Tax', 'Full Time'),
('u-emp-4', 'Agun Sesar', 'agun@skena.id', 'agun.emp', 'password123', 'employee', 'e-4', 'SKN-HC-001', 'Staff Human Capital', 'Operasional', 'Full Time'),
('u-emp-5', 'Rezky Amalia', 'rezky@skena.id', 'rezky', 'password123', 'employee', 'e-5', 'SKN-GA-001', 'General Affair', 'Operasional', 'Full Time'),
('u-emp-6', 'Nanda', 'nanda@skena.id', 'nanda', 'password123', 'employee', 'e-6', 'SKN-FIN-002', 'Staff Finance & Tax', 'Finance & Tax', 'Full Time'),
('u-emp-7', 'Anggi', 'anggi@skena.id', 'anggi', 'password123', 'employee', 'e-7', 'SKN-SLS-001', 'Manager Sales & Marketing', 'Sales & Marketing', 'Full Time'),
('u-emp-8', 'Fikri', 'fikri@skena.id', 'fikri', 'password123', 'employee', 'e-8', 'SKN-SLS-002', 'Staff Business Development', 'Sales & Marketing', 'Full Time Performance Based'),
('u-emp-9', 'Auliyah', 'auliyah@skena.id', 'auliyah', 'password123', 'employee', 'e-9', 'SKN-SLS-003', 'Admin Sales', 'Sales & Marketing', 'Full Time'),
('u-emp-10', 'Wahyudi', 'wahyudi@skena.id', 'wahyudi', 'password123', 'employee', 'e-10', 'SKN-CRE-001', 'Creative Head', 'Creative', 'Full Time'),
('u-emp-11', 'Wulan', 'wulan@skena.id', 'wulan', 'password123', 'employee', 'e-11', 'SKN-CRE-002', 'Graphic Designer', 'Creative', 'Full Time'),
('u-emp-12', 'Fadel', 'fadel@skena.id', 'fadel', 'password123', 'employee', 'e-12', 'SKN-CRE-003', 'Graphic Designer', 'Creative', 'Full Time'),
('u-emp-13', 'Hilal', 'hilal@skena.id', 'hilal', 'password123', 'employee', 'e-13', 'SKN-MDS-001', 'Social Media Specialist', 'Medsos', 'Full Time Performance Based'),
('u-emp-14', 'Rifky', 'rifky@skena.id', 'rifky', 'password123', 'employee', 'e-14', 'SKN-MDS-002', 'Copywriter', 'Medsos', 'Full Time'),
('u-emp-15', 'Fadli', 'fadli@skena.id', 'fadli', 'password123', 'employee', 'e-15', 'SKN-MRC-001', 'Marcomm Specialist', 'Marcomm', 'Full Time'),
('u-emp-16', 'Lullu', 'lullu@skena.id', 'lullu', 'password123', 'employee', 'e-16', 'SKN-PRD-001', 'Head Production', 'Production', 'Full Time'),
('u-emp-17', 'Taufik', 'taufik@skena.id', 'taufik', 'password123', 'employee', 'e-17', 'SKN-PRD-002', 'Videographer & Editor', 'Production', 'Full Time Performance Based'),
('u-emp-18', 'Rian', 'rian@skena.id', 'rian', 'password123', 'employee', 'e-18', 'SKN-PRD-003', 'Videographer & Editor', 'Production', 'Probation')
ON CONFLICT (username) DO UPDATE SET
    name = EXCLUDED.name,
    role_title = EXCLUDED.role_title,
    department = EXCLUDED.department,
    employment_status = EXCLUDED.employment_status,
    updated_at = now();`;

const SQL_CLEAN_RESET_SCRIPT = `-- ============================================================================
-- OPSI RESET BERSIH (DROP & RECREATE 11 TABEL) — PT SKENA WAHANA KREATIF HRIS
-- Gunakan skrip ini JIKA Anda ingin menghapus tabel lama secara total dan
-- membangun ulang seluruh 11 tabel dari awal secara bersih.
-- ============================================================================

DROP TABLE IF EXISTS lms_curriculum CASCADE;
DROP TABLE IF EXISTS job_profiles CASCADE;
DROP TABLE IF EXISTS user_accounts CASCADE;
DROP TABLE IF EXISTS employee_reports CASCADE;
DROP TABLE IF EXISTS kpi_evaluations CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS attendances CASCADE;
DROP TABLE IF EXISTS work_schedules CASCADE;
DROP TABLE IF EXISTS competencies CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS company_settings CASCADE;

${SQL_SCHEMA_SCRIPT}`;

// ============================================================================
// SISTEMATIKA & GENERATOR REKOMENDASI PENGEMBANGAN DIRI (IDP) PER DEPARTEMEN
// ============================================================================
export const getIdpRecommendations = (emp: Employee) => {
  const dept = emp.department || 'Creative';
  const role = (emp.role_title || '').toLowerCase();

  if (dept === 'Managing Director' || role.includes('managing director')) {
    return {
      modules: [
        {
          module_name: 'Executive Leadership & Agency Scaling in Digital Media',
          category: 'LMS Course' as const,
          target_date: '2026-11-30',
          status: 'Completed' as const,
          score: '96/100',
        },
        {
          module_name: 'Strategic Mergers, Multi-Brand Joint Ventures & M&A',
          category: 'Mentoring' as const,
          target_date: '2026-12-15',
          status: 'In Progress' as const,
          score: '94/100',
        },
        {
          module_name: 'Agency National Expansion: Strategic Jakarta & Regional Presence',
          category: 'Project Assignment' as const,
          target_date: '2027-01-30',
          status: 'Planned' as const,
          score: '95/100',
        },
      ],
      careerDecision: 'Retain Current Role',
      nextRole: 'Managing Director & Strategic Founder',
      talentBox: 'High Potential - High Performer (Star)',
      cultureNotes: 'Menjadi teladan kepemimpinan visioner, membina iklim kerja kreatif, dan menjaga standar kualitas tertinggi agensi.',
      directorNotes: 'Fokus pada strategi ekspansi nasional, kemitraan korporat strategis, dan stabilitas profitabilitas agensi jangka panjang.',
    };
  }

  if (dept === 'Sales & Marketing' || role.includes('sales') || role.includes('business development') || role.includes('marketing')) {
    if (role.includes('manager') || role.includes('head')) {
      return {
        modules: [
          {
            module_name: 'Enterprise B2B Retainer Sales & Value-Based Pricing',
            category: 'LMS Course' as const,
            target_date: '2026-11-30',
            status: 'Completed' as const,
            score: '92/100',
          },
          {
            module_name: 'Strategic Pitching to C-Level Corporate Executives',
            category: 'Mentoring' as const,
            target_date: '2026-12-15',
            status: 'In Progress' as const,
            score: '90/100',
          },
          {
            module_name: 'Q1 Enterprise Deal Pipeline Growth: 3 FMCG Flagship Retainers',
            category: 'Project Assignment' as const,
            target_date: '2027-01-15',
            status: 'Planned' as const,
            score: '88/100',
          },
        ],
        careerDecision: 'Promote / Grade Up',
        nextRole: 'Head of Business Development & Strategic Client Partnerships',
        talentBox: 'High Potential - High Performer (Star)',
        cultureNotes: 'Sangat proaktif, berorientasi target pendapatan, dan lihai dalam membina relasi jangka panjang dengan klien korporat.',
        directorNotes: 'Tingkatkan akurasi sales forecasting dan perkuat pendampingan sales pitch pada staf junior.',
      };
    } else if (role.includes('admin')) {
      return {
        modules: [
          {
            module_name: 'Advanced CRM Pipeline, Deal Tracking & Contract Administration',
            category: 'LMS Course' as const,
            target_date: '2026-11-30',
            status: 'Completed' as const,
            score: '89/100',
          },
          {
            module_name: 'Sales Invoicing Workflow & Legal Contract Review Clinic',
            category: 'Mentoring' as const,
            target_date: '2026-12-15',
            status: 'In Progress' as const,
            score: '88/100',
          },
        ],
        careerDecision: 'Retain Current Role',
        nextRole: 'Senior Sales Operations & CRM Administrator',
        talentBox: 'Solid Professional (Key Contributor)',
        cultureNotes: 'Tertib administrasi proposal, teliti dalam pengarsipan kontrak klien, dan responsif terhadap kebutuhan tim sales.',
        directorNotes: 'Tingkatkan otomatisasi pelaporan pipeline bulanan ke Managing Director dan BD Manager.',
      };
    } else {
      return {
        modules: [
          {
            module_name: 'Full-Funnel Lead Prospecting & High-Impact Cold Outreach',
            category: 'LMS Course' as const,
            target_date: '2026-11-30',
            status: 'Completed' as const,
            score: '88/100',
          },
          {
            module_name: 'Weekly Closing Mastery & Handling Client Objection Clinic',
            category: 'Mentoring' as const,
            target_date: '2026-12-15',
            status: 'In Progress' as const,
            score: '87/100',
          },
        ],
        careerDecision: 'Extend Performance Contract',
        nextRole: 'Senior Account Executive',
        talentBox: 'Core Player (Future Star)',
        cultureNotes: 'Penuh energi, pantang menyerah dalam menindaklanjuti leads prospek, dan menjaga etika komunikasi profesional.',
        directorNotes: 'Tingkatkan conversion rate dari tahapan discovery meeting menuju submit proposal penawaran.',
      };
    }
  }

  if (dept === 'Operasional' || role.includes('finance') || role.includes('general affair') || role.includes('human capital')) {
    if (role.includes('finance')) {
      return {
        modules: [
          {
            module_name: 'Corporate Cashflow Forecasting & Agency Profit Margin Governance',
            category: 'LMS Course' as const,
            target_date: '2026-11-30',
            status: 'Completed' as const,
            score: '93/100',
          },
          {
            module_name: 'Strategic Tax Planning & Financial Audit Readiness Session',
            category: 'Mentoring' as const,
            target_date: '2026-12-15',
            status: 'In Progress' as const,
            score: '90/100',
          },
        ],
        careerDecision: 'Promote / Grade Up',
        nextRole: 'Finance & Accounting Lead',
        talentBox: 'Solid Professional (Key Contributor)',
        cultureNotes: 'Integritas tinggi, cermat dalam pengelolaan kas dan kepatuhan pajak perusahaan.',
        directorNotes: 'Pertahankan disiplin kontrol piutang klien (AR Days) di bawah 30 hari.',
      };
    } else if (role.includes('human capital')) {
      return {
        modules: [
          {
            module_name: 'Strategic Talent Development, HR Analytics & Performance Calibration',
            category: 'LMS Course' as const,
            target_date: '2026-11-30',
            status: 'Completed' as const,
            score: '94/100',
          },
          {
            module_name: 'Executive Human Capital Advisory with Managing Director',
            category: 'Mentoring' as const,
            target_date: '2026-12-15',
            status: 'In Progress' as const,
            score: '92/100',
          },
          {
            module_name: 'Skena Creative Academy: 2026 Internal Upskilling Curriculum',
            category: 'Project Assignment' as const,
            target_date: '2027-01-15',
            status: 'Planned' as const,
            score: '90/100',
          },
        ],
        careerDecision: 'Promote / Grade Up',
        nextRole: 'Human Capital & Culture Manager',
        talentBox: 'High Potential - High Performer (Star)',
        cultureNotes: 'Sensitivitas interpersonal prima, adil dalam menangani kebutuhan karyawan, dan penjaga budaya kerja Skena.',
        directorNotes: 'Optimalkan sistem evaluasi WLA (beban kerja) untuk mencegah turnover pada tim produksi bertekanan tinggi.',
      };
    } else {
      // General Affair
      return {
        modules: [
          {
            module_name: 'Modern Facility Management & Creative Studio Logistics Standardization',
            category: 'LMS Course' as const,
            target_date: '2026-11-30',
            status: 'Completed' as const,
            score: '91/100',
          },
          {
            module_name: 'Vendor Negotiation & Equipment Lifespan Optimization',
            category: 'Mentoring' as const,
            target_date: '2026-12-15',
            status: 'In Progress' as const,
            score: '89/100',
          },
        ],
        careerDecision: 'Retain Current Role',
        nextRole: 'General Affair & Procurement Lead',
        talentBox: 'Solid Professional (Key Contributor)',
        cultureNotes: 'Sigap menyelesaikan kendala fasilitas kantor studio, terorganisir dan memiliki orientasi layanan yang prima.',
        directorNotes: 'Terapkan checklist pemeliharaan preventif untuk seluruh genset, AC studio, dan perangkat audio visual.',
      };
    }
  }

  // Creative Department
  if (role.includes('director')) {
    return {
      modules: [
        {
          module_name: 'Masterclass in Visual Storytelling & Cross-Platform Art Direction',
          category: 'LMS Course' as const,
          target_date: '2026-11-30',
          status: 'Completed' as const,
          score: '95/100',
        },
        {
          module_name: 'Creative Leadership, Team Mentorship & Pitch Strategy with MD',
          category: 'Mentoring' as const,
          target_date: '2026-12-15',
          status: 'In Progress' as const,
          score: '94/100',
        },
      ],
      careerDecision: 'Retain Current Role',
      nextRole: 'Executive Creative Director',
      talentBox: 'High Potential - High Performer (Star)',
      cultureNotes: 'Membawa inspirasi artistik luar biasa, teliti terhadap detail estetika, dan berwibawa dalam memimpin tim kreatif.',
      directorNotes: 'Pertahankan kurasi mutu konten level A-tier sembari mengasah kemandirian para Project Manager dan Art Director.',
    };
  }

  if (role.includes('project manager')) {
    return {
      modules: [
        {
          module_name: 'Agile Project Management, Sprint Velocity & Creative Scope Control',
          category: 'LMS Course' as const,
          target_date: '2026-11-30',
          status: 'Completed' as const,
          score: '91/100',
        },
        {
          module_name: 'Client Stakeholder Communication & Revision SLA Clinic',
          category: 'Mentoring' as const,
          target_date: '2026-12-15',
          status: 'In Progress' as const,
          score: '90/100',
        },
      ],
      careerDecision: 'Promote / Grade Up',
      nextRole: 'Lead / Head of Project Management',
      talentBox: 'Solid Professional (Key Contributor)',
      cultureNotes: 'Disiplin waktu tinggi, mampu meredam gesekan antara deadline klien dan kapasitas tim produksi.',
      directorNotes: 'Perketat validasi brief di awal agar tidak terjadi revisi berulang di fase pasca-produksi.',
    };
  }

  if (role.includes('video') || role.includes('videographer') || role.includes('editor')) {
    return {
      modules: [
        {
          module_name: 'DaVinci Resolve Color Grading, 3D Motion Graphics & High-Velocity Editing',
          category: 'LMS Course' as const,
          target_date: '2026-11-30',
          status: 'Completed' as const,
          score: '90/100',
        },
        {
          module_name: 'Cinematography Lighting & Lens Choice Workshop with Creative Director',
          category: 'Mentoring' as const,
          target_date: '2026-12-15',
          status: 'In Progress' as const,
          score: '88/100',
        },
      ],
      careerDecision: emp.employment_status === 'Probation' ? 'Pass Probation to Full Time' : 'Extend Performance Contract',
      nextRole: 'Senior Video Production Specialist',
      talentBox: 'Core Player (Future Star)',
      cultureNotes: 'Dedikasi tinggi di lapangan dan meja editing, adaptif terhadap arahan revisi kreatif.',
      directorNotes: 'Tingkatkan efisiensi render dan eksplorasi generative AI tools untuk mempercepat workflow editing.',
    };
  }

  if (role.includes('social media')) {
    return {
      modules: [
        {
          module_name: 'Multi-Channel Viral Hooks, Short-Form Scriptwriting & Social Algorithms',
          category: 'LMS Course' as const,
          target_date: '2026-11-30',
          status: 'Completed' as const,
          score: '89/100',
        },
        {
          module_name: 'Copywriting That Converts: Persuasive Messaging for Gen-Z & Millennials',
          category: 'Mentoring' as const,
          target_date: '2026-12-15',
          status: 'In Progress' as const,
          score: '88/100',
        },
      ],
      careerDecision: emp.employment_status === 'Probation' ? 'Pass Probation to Full Time' : 'Extend Performance Contract',
      nextRole: 'Senior Social Media Strategist',
      talentBox: 'Core Player (Future Star)',
      cultureNotes: 'Peka terhadap tren viral, memiliki sense humor yang tepat untuk audiens media sosial, dan rajin memantau metrik.',
      directorNotes: 'Fokus pada peningkatan dwell time dan shareability konten agar campaign brand klien mencapai virality organik.',
    };
  }

  // Default fallback for graphic designer etc.
  return {
    modules: [
      {
        module_name: 'Design Systems, Micro-Interactions & Modern Brand Visual Guidelines',
        category: 'LMS Course' as const,
        target_date: '2026-11-30',
        status: 'Completed' as const,
        score: '90/100',
      },
      {
        module_name: 'Typography & Layout Composition Review with Art Director',
        category: 'Mentoring' as const,
        target_date: '2026-12-15',
        status: 'In Progress' as const,
        score: '88/100',
      },
    ],
    careerDecision: emp.employment_status === 'Probation' ? 'Pass Probation to Full Time' : 'Retain Current Role',
    nextRole: 'Senior Graphic Designer',
    talentBox: 'Core Player (Future Star)',
    cultureNotes: 'Kreatif, responsif terhadap kritik konstruktif, dan menghasilkan aset visual yang rapi dan memikat.',
    directorNotes: 'Perluas eksplorasi gaya visual modern dan konsistensi palet warna pada kampanye 360 derajat.',
  };
};

export default function App() {
  // Authentication State (Input akun kosong secara default — dimasukkan secara manual oleh pengguna)
  const [userAccounts, setUserAccounts] = useState<AppUser[]>(() => SkenaHrApi.getUsers());
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [empLoginUsername, setEmpLoginUsername] = useState<string>('');
  const [loginPin, setLoginPin] = useState<string>('');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [loginTab, setLoginTab] = useState<'admin' | 'employee'>('admin');
  const [selectedLoginEmpId, setSelectedLoginEmpId] = useState<string>('e-1');

  // Master Data Tracking Filters
  const [filterDept, setFilterDept] = useState<string>('Semua');
  const [filterStatus, setFilterStatus] = useState<string>('Semua');
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [editingCompId, setEditingCompId] = useState<string | null>(null);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [kpiDeptFilter, setKpiDeptFilter] = useState<string>('Semua');

  // Navigation, Realtime & Connection State
  const [activeModule, setActiveModule] = useState<ActiveModule>('dashboard');
  const [showConnModal, setShowConnModal] = useState<boolean>(false);
  const [showSqlModal, setShowSqlModal] = useState<boolean>(false);
  const [sqlModalMode, setSqlModalMode] = useState<'migrate' | 'reset'>('migrate');
  const [sqlCopied, setSqlCopied] = useState<boolean>(false);
  const [realtimeInfo, setRealtimeInfo] = useState(() => getRealtimeStatus());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Live Clock for Attendance
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Cloud Database State (Zero LocalStorage)
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_COMPANY_SETTINGS);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [kpiList, setKpiList] = useState<KpiEvaluation[]>([]);
  const [kpiWeights, setKpiWeights] = useState<KpiWeightConfig>(DEFAULT_KPI_WEIGHTS);
  const [sharingSessions, setSharingSessions] = useState<SharingSessionItem[]>([]);
  const [oneYearPlans, setOneYearPlans] = useState<OneYearPlanItem[]>([]);
  const [executiveReminders, setExecutiveReminders] = useState<ExecutiveReminderItem[]>([]);
  const [allReportsMap, setAllReportsMap] = useState<Record<string, EmployeeReport>>({});
  const [allHistoricalAttendances, setAllHistoricalAttendances] = useState<AttendanceRecord[]>([]);

  // Module 1: Form States (Admin Only)
  const [empForm, setEmpForm] = useState<Partial<Employee>>({
    employee_nik: '',
    tax_bpjs_id: '',
    full_name: '',
    gender: 'L',
    role_title: '',
    department: 'Creative',
    employment_status: 'Full Time',
    contract_duration: '12 Bulan (Jan - Des 2026)',
    contract_start_date: '2026-01-01',
    contract_end_date: '2026-12-31',
    benefits_package: 'BPJS Kesehatan, BPJS Ketenagakerjaan, Device Allowance',
    assigned_project: '',
    work_location: 'Makassar HQ',
    direct_supervisor: 'Managing Director',
    annual_leave_quota: 12,
    is_active: true,
    resign_status: 'Aktif',
    resign_notice_date: '',
    resign_effective_date: '',
    resign_reason: '',
    handover_notes: '',
    address_domicile: 'Kota Makassar, Sulawesi Selatan',
    whatsapp_contact: '0812-',
    email: '',
    rate_budget: 'Gaji Pokok + Tunjangan Kinerja',
    notes: '',
    collaborator_category: 'Karyawan Internal',
  });

  const [compForm, setCompForm] = useState<Omit<Competency, 'id'>>({
    competency_code: '',
    competency_name: '',
    category: 'Core KPI',
    target_threshold: 78,
    standard_workload_hours: 40,
    description: '',
    level_1_desc: 'Dasar / Perlu supervisi penuh',
    level_2_desc: 'Mampu eksekusi tugas rutin',
    level_3_desc: 'Mandiri & memenuhi standar Skena',
    level_4_desc: 'Mahir & mampu memecahkan masalah kompleks',
    level_5_desc: 'Expert / Mentor lintas tim',
  });
  const [compMatrixView, setCompMatrixView] = useState<'dictionary' | 'matrix'>('dictionary');

  // Module: Senin Di Skena & Bincang Kenyang State
  const [sharingTab, setSharingTab] = useState<'Semua' | 'Senin Di Skena' | 'Bincang Kenyang'>('Semua');
  const [editingSharingId, setEditingSharingId] = useState<string | null>(null);
  const [sharingForm, setSharingForm] = useState<Partial<SharingSessionItem>>({
    program_type: 'Senin Di Skena',
    session_date: new Date().toISOString().split('T')[0],
    speaker_employee_id: 'e-1',
    speaker_name: '',
    speaker_department: '',
    speaker_role: '',
    topic_title: '',
    material_summary: '',
    remarks: '',
    status: 'Terjadwal',
  });

  // Module: One Year Plan State
  const [oneYearQuarterFilter, setOneYearQuarterFilter] = useState<string>('Semua');
  const [editingOneYearId, setEditingOneYearId] = useState<string | null>(null);
  const [oneYearForm, setOneYearForm] = useState<Partial<OneYearPlanItem>>({
    quarter: 'Q1',
    target_month: 'Januari - Maret 2026',
    month_label: 'Januari - Maret 2026',
    objective_title: '',
    title: '',
    department: 'Company Strategy',
    category: 'Company Strategy',
    pic_name: 'Managing Director & HR Lead',
    key_result_kpi: '',
    target_metric: '',
    budget_estimate: '',
    is_completed: false,
    progress_pct: 0,
    status: 'On Track',
    notes: '',
  });

  // Module: Executive Reminder & Action Center State
  const [reminderFilterCat, setReminderFilterCat] = useState<string>('Semua');
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);
  const [reminderForm, setReminderForm] = useState<Partial<ExecutiveReminderItem>>({
    title: '',
    category: 'Pengajuan Budget Rabu (Mingguan)',
    due_date: new Date().toISOString().split('T')[0],
    schedule_info: 'Setiap Hari Rabu',
    priority: 'Tinggi',
    pic_name: 'Finance & Admin',
    is_completed: false,
    notes: '',
  });

  // IDP & LMS Graphical Output View Mode
  const [idpViewMode, setIdpViewMode] = useState<'overall' | 'individual' | 'editor' | 'overall_chart' | 'individual_chart'>('overall');

  // Module 2 & 3: Today Date Helper & Schedule Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const [schedForm, setSchedForm] = useState<Omit<WorkSchedule, 'id' | 'competencies'>>({
    day_of_week: 'Senin',
    start_time: '09:00',
    end_time: '12:00',
    shift_code: 'Sprint & Content Production',
    competency_id: '',
    location_agenda_notes: 'Studio Utama Makassar',
    schedule_date: todayStr,
  });
  const [scheduleSubTab, setScheduleSubTab] = useState<'calendar' | 'weekly'>('calendar');
  const [schedFilterEmp, setSchedFilterEmp] = useState<'all' | 'mine'>('all');
  const [schedAssignee, setSchedAssignee] = useState<string>('all');

  // Module 3: Attendance State
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [dailyAttendances, setDailyAttendances] = useState<Record<string, AttendanceRecord>>({});
  const [attendanceMonth, setAttendanceMonth] = useState<string>(todayStr.slice(0, 7));
  const [monthlyAttendances, setMonthlyAttendances] = useState<AttendanceRecord[]>([]);
  const [attendanceSubTab, setAttendanceSubTab] = useState<'daily' | 'charts' | 'monthly' | 'logs_detail'>('daily');
  const [attChartScope, setAttChartScope] = useState<'overall' | 'individual' | 'month_comparison'>('overall');
  const [attChartEmpId, setAttChartEmpId] = useState<string>('e-1');
  const [attFilterStatus, setAttFilterStatus] = useState<string>('Semua');
  const [selfAttViewMode, setSelfAttViewMode] = useState<'form_table' | 'chart'>('form_table');
  const [adminAttForm, setAdminAttForm] = useState<{
    employee_id: string;
    attendance_date: string;
    check_in_time: string;
    status: AttendanceStatus;
    work_location_tag: string;
    notes: string;
    isEditing: boolean;
  }>({
    employee_id: 'e-1',
    attendance_date: todayStr,
    check_in_time: '08:45:00',
    status: 'WFO',
    work_location_tag: 'Makassar HQ',
    notes: '',
    isEditing: false,
  });

  // Module 6: Monthly Report Card State (Rapor Per Bulan)
  const [reportMonth, setReportMonth] = useState<string>(todayStr.slice(0, 7));

  // Non-blocking Delete Confirmation Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Employee Self Attendance Check-in State
  const [selfStatus, setSelfStatus] = useState<AttendanceStatus>('WFO');
  const [selfLocation, setSelfLocation] = useState<string>('Office Makassar HQ');
  const [selfNotes, setSelfNotes] = useState<string>('');
  const [selfCheckInTime, setSelfCheckInTime] = useState<string>('08:50:00');

  // Module 4: Activity & LMS Log State
  const [logForm, setLogForm] = useState<ActivityLog>({
    log_date: todayStr,
    schedule_id: null,
    competency_id: '',
    sprint_session_info: 'Sprint Pagi (09:00 - 12:00)',
    project_deliverable_topic: '',
    execution_details: '',
    blocker_evaluator_notes: '',
    total_active_team: 0,
    total_on_leave: 0,
  });

  // Module 5: KPI & Workload Analysis State
  const [selectedCompId, setSelectedCompId] = useState<string>('');
  const [inlineKpiMap, setInlineKpiMap] = useState<Record<string, KpiEvaluation>>({});
  const [showInlineCompCrud, setShowInlineCompCrud] = useState<boolean>(false);
  const [empKpiInputForm, setEmpKpiInputForm] = useState<{
    sprintField: 'kpi_q1' | 'kpi_q2' | 'kpi_q3' | 'kpi_q4' | 'final_project_score';
    scoreValue: number;
    actualHoursWeek: number;
    deliverableNotes: string;
  }>({
    sprintField: 'kpi_q4',
    scoreValue: 88,
    actualHoursWeek: 36,
    deliverableNotes: '',
  });

  // Quick Admin Employee Add / Edit / Rename Modal & 360 Integrated Detail Modal
  const [showQuickEmpModal, setShowQuickEmpModal] = useState<boolean>(false);
  const [quickEmpEditingId, setQuickEmpEditingId] = useState<string | null>(null);
  const [quickEmpForm, setQuickEmpForm] = useState<Partial<Employee>>({
    employee_nik: '',
    full_name: '',
    gender: 'L',
    role_title: '',
    department: 'Creative',
    employment_status: 'Full Time',
    contract_duration: '12 Bulan (Jan - Des 2026)',
    work_location: 'Makassar HQ',
    direct_supervisor: 'Managing Director',
    annual_leave_quota: 12,
    is_active: true,
  });
  const [detailInspectEmpId, setDetailInspectEmpId] = useState<string | null>(null);

  // Module 6: Report Card & Talent Pipeline State
  const [selectedReportEmpId, setSelectedReportEmpId] = useState<string>('e-1');
  const [empReportData, setEmpReportData] = useState<EmployeeReport>({
    employee_id: '',
    period_year: '2026',
    period_term: 'Semester 2 (Jul - Des)',
    idp_lms_modules: [
      {
        module_name: 'Creative Leadership & Agile Project Management',
        category: 'LMS Course',
        target_date: '2026-11-30',
        status: 'Completed',
        score: '92/100',
        mentor_notes: 'Sangat baik dalam memimpin sprint kreatif lintas divisi.',
      },
      {
        module_name: 'Brand Storytelling & Multi-Platform Hook',
        category: 'LMS Course',
        target_date: '2026-12-15',
        status: 'In Progress',
        score: '88/100',
        mentor_notes: 'Tingkatkan eksplorasi hook visual 3 detik pertama.',
      },
    ],
    behavioral_culture_notes:
      'Menunjukkan inisiatif tinggi dalam kolaborasi lintas tim, responsif terhadap brief klien, dan menjunjung standar estetika brand.',
    hr_director_notes:
      'Direkomendasikan untuk memimpin proyek skala regional kuartal berikutnya dengan perluasan peran pendampingan junior.',
    talent_pipeline_box: 'High Potential - High Performer (Star)',
    career_decision: 'Promote / Grade Up',
    next_role_assignment: 'Senior Creative Lead',
    report_date: todayStr,
  });
  const [empReportAttendances, setEmpReportAttendances] = useState<AttendanceRecord[]>([]);

  // Selected Employee for Analytics Chart View
  const [analyticsEmpId, setAnalyticsEmpId] = useState<string>('e-1');

  // Master Data Employee Active vs Archived Tab State
  const [empActiveTab, setEmpActiveTab] = useState<'active' | 'archived'>('active');
  const [showDeactivateModal, setShowDeactivateModal] = useState<boolean>(false);
  const [deactivatingEmp, setDeactivatingEmp] = useState<Employee | null>(null);
  const [deactivateReason, setDeactivateReason] = useState<string>('Resign Sukarela');
  const [deactivateDate, setDeactivateDate] = useState<string>(todayStr);

  // User Account Self-Service Modal State (Every Employee & Admin can edit credentials)
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);
  const [accountForm, setAccountForm] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    roleTitle: '',
    department: '',
  });

  // KPI Target Adjustment Modal State (Admin Only)
  const [showKpiTargetModal, setShowKpiTargetModal] = useState<boolean>(false);
  const [editingCompTarget, setEditingCompTarget] = useState<Competency | null>(null);

  // Job Profiles & LMS Curriculum State
  const [jobProfiles, setJobProfiles] = useState<JobProfile[]>(DEFAULT_JOB_PROFILES);
  const [lmsCurriculumList, setLmsCurriculumList] = useState<LmsCurriculum[]>(DEFAULT_LMS_CURRICULUM);
  const [jobLmsSubTab, setJobLmsSubTab] = useState<'job_profiles' | 'curriculum'>('job_profiles');
  const [selectedLmsCategory, setSelectedLmsCategory] = useState<string>('Semua');
  const [showJobProfileModal, setShowJobProfileModal] = useState<boolean>(false);
  const [editingJobProfile, setEditingJobProfile] = useState<Partial<JobProfile> | null>(null);
  const [showLmsModal, setShowLmsModal] = useState<boolean>(false);
  const [editingLmsCourse, setEditingLmsCourse] = useState<Partial<LmsCurriculum> | null>(null);

  // Org Chart Filter State
  const [orgDepartmentFilter, setOrgDepartmentFilter] = useState<string>('Semua');

  // Admin-Only User Account Database Management States
  const [editingAdminAccId, setEditingAdminAccId] = useState<string | null>(null);
  const [showAllPasswordsAdmin, setShowAllPasswordsAdmin] = useState<boolean>(false);
  const [accSearchQuery, setAccSearchQuery] = useState<string>('');
  const [accRoleFilter, setAccRoleFilter] = useState<'all' | 'admin' | 'employee'>('all');
  const [adminAccForm, setAdminAccForm] = useState<{
    id: string;
    name: string;
    username: string;
    password: string;
    email: string;
    role: 'admin' | 'employee';
    employeeId: string;
    employeeNik: string;
    roleTitle: string;
    department: string;
    employmentStatus: EmploymentStatus;
  }>({
    id: '',
    name: '',
    username: '',
    password: 'password123',
    email: '',
    role: 'employee',
    employeeId: '',
    employeeNik: '',
    roleTitle: 'Creative Staff',
    department: 'Creative',
    employmentStatus: 'Full Time',
  });

  // Helper Toast Notification
  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Helper: Calculate Remaining Leave Quota per Employee
  const getEmployeeLeaveStats = (empId: string, quota: number = 12) => {
    const cutiCount = monthlyAttendances.filter((a) => a.employee_id === empId && a.status === 'Cuti').length;
    const izinCount = monthlyAttendances.filter(
      (a) => a.employee_id === empId && (a.status === 'Izin' || a.status === 'Urusan Pribadi' || a.status === 'Urusan Kantor')
    ).length;
    const sakitCount = monthlyAttendances.filter((a) => a.employee_id === empId && a.status === 'Sakit').length;
    const remaining = Math.max(0, quota - cutiCount);
    return { quota, used: cutiCount, izin: izinCount, sakit: sakitCount, remaining };
  };

  // Helper: Hitung Sisa Waktu Kontrak (Alert Mulai dari H-2 Bulan / ≤ 60 Hari)
  const getContractCountdownInfo = (empOrEndDate?: Employee | string, employmentStatus?: string) => {
    const endDate =
      typeof empOrEndDate === 'object' && empOrEndDate !== null
        ? empOrEndDate.contract_end_date
        : empOrEndDate;
    const statusLabel =
      typeof empOrEndDate === 'object' && empOrEndDate !== null
        ? empOrEndDate.employment_status
        : employmentStatus;

    if (!endDate || statusLabel === 'PKWTT (Permanent)') {
      const label = 'PKWTT / Permanen';
      return {
        daysRemaining: null as number | null,
        daysLeft: 999,
        isAlertH2Months: false,
        isH2MonthsAlert: false,
        isExpired: false,
        badgeLabel: label,
        label,
        badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
      };
    }
    const todayMs = new Date(todayStr + 'T00:00:00').getTime();
    const endMs = new Date(endDate + 'T00:00:00').getTime();
    const diffDays = Math.ceil((endMs - todayMs) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const label = `Kontrak Berakhir (${Math.abs(diffDays)} Hari Lalu)`;
      return {
        daysRemaining: diffDays,
        daysLeft: diffDays,
        isAlertH2Months: true,
        isH2MonthsAlert: true,
        isExpired: true,
        badgeLabel: label,
        label,
        badgeClass: 'bg-rose-600 text-white border-rose-700',
      };
    }
    if (diffDays <= 14) {
      const label = `🚨 Segera Habis: H-${diffDays} Hari`;
      return {
        daysRemaining: diffDays,
        daysLeft: diffDays,
        isAlertH2Months: true,
        isH2MonthsAlert: true,
        isExpired: false,
        badgeLabel: label,
        label,
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
      };
    }
    if (diffDays <= 30) {
      const label = `⚠️ Alert H-1 Bulan (Sisa ${diffDays} Hari)`;
      return {
        daysRemaining: diffDays,
        daysLeft: diffDays,
        isAlertH2Months: true,
        isH2MonthsAlert: true,
        isExpired: false,
        badgeLabel: label,
        label,
        badgeClass: 'bg-orange-100 text-orange-900 border-orange-300',
      };
    }
    if (diffDays <= 60) {
      const label = `⏰ Alert H-2 Bulan (Sisa ${diffDays} Hari)`;
      return {
        daysRemaining: diffDays,
        daysLeft: diffDays,
        isAlertH2Months: true,
        isH2MonthsAlert: true,
        isExpired: false,
        badgeLabel: label,
        label,
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
      };
    }
    const monthsApprox = Math.round(diffDays / 30);
    const label = `Aktif • Sisa ${diffDays} Hari (~${monthsApprox} Bln)`;
    return {
      daysRemaining: diffDays,
      daysLeft: diffDays,
      isAlertH2Months: false,
      isH2MonthsAlert: false,
      isExpired: false,
      badgeLabel: label,
      label,
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    };
  };

  // Helper: Hitung Sisa Waktu Kerja untuk Karyawan One-Month Notice Resign
  const getResignNoticeInfo = (emp: Employee) => {
    if (!emp.resign_status || emp.resign_status === 'Aktif') {
      const label = 'Aktif Bekerja';
      return {
        isResigning: false,
        daysLeftWorking: null as number | null,
        badgeLabel: label,
        label,
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    }
    if (emp.resign_status === 'Resigned') {
      const label = `Telah Resign (${emp.resign_effective_date || emp.deactivation_date || '-'})`;
      return {
        isResigning: true,
        daysLeftWorking: 0,
        badgeLabel: label,
        label,
        badgeClass: 'bg-slate-200 text-slate-700 border-slate-300',
      };
    }
    const effDate = emp.resign_effective_date;
    if (!effDate) {
      const label = 'One Month Notice (Resign)';
      return {
        isResigning: true,
        daysLeftWorking: 30,
        badgeLabel: label,
        label,
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
      };
    }
    const todayMs = new Date(todayStr + 'T00:00:00').getTime();
    const effMs = new Date(effDate + 'T00:00:00').getTime();
    const diffDays = Math.ceil((effMs - todayMs) / (1000 * 60 * 60 * 24));
    const label =
      diffDays >= 0
        ? `📌 One Month Notice • Sisa Kerja ${diffDays} Hari (s/d ${effDate})`
        : `Efektif Resign (${effDate})`;
    return {
      isResigning: true,
      daysLeftWorking: diffDays,
      badgeLabel: label,
      label,
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    };
  };

  // Helper: Analisis Keterlambatan Jam Masuk 09:00 WITA dengan Toleransi Maksimal 15 Menit (Batas 09:15 WITA)
  // Mendukung 10 Kategori Kehadiran & Perizinan: WFO, WFH, Take Content, Urusan Kantor, Overtime, Sakit, Cuti, Izin, Urusan Pribadi, Tidak Absen
  const analyzeAttendancePunctuality = (checkInTime?: string, status: AttendanceStatus = 'WFO') => {
    const isPermissionOrLeave =
      status === 'Izin' ||
      status === 'Sakit' ||
      status === 'Cuti' ||
      status === 'Urusan Pribadi' ||
      status === 'Tidak Absen';
    const rawTime = (checkInTime || '08:45:00').trim();
    const parts = rawTime.split(':').map((n) => parseInt(n, 10) || 0);
    const hours = parts[0] ?? 8;
    const minutes = parts[1] ?? 45;
    const seconds = parts[2] ?? 0;
    const totalMinutesExact = hours * 60 + minutes + seconds / 60;
    const standardEntryMin = 9 * 60; // 09:00 = 540 menit
    const toleranceLimitMin = 9 * 60 + 15; // 09:15 = 555 menit (toleransi maksimal 15 menit)

    if (isPermissionOrLeave) {
      const labelMap: Record<string, string> = {
        Izin: 'Izin Resmi',
        Sakit: 'Izin Sakit',
        Cuti: 'Cuti Tahunan',
        'Urusan Pribadi': 'Izin Urusan Pribadi',
        'Tidak Absen': 'Tidak Absen / Alpha',
      };
      const classMap: Record<string, string> = {
        Izin: 'bg-amber-100 text-amber-800 border-amber-300',
        Sakit: 'bg-orange-100 text-orange-800 border-orange-300',
        Cuti: 'bg-rose-100 text-rose-800 border-rose-300',
        'Urusan Pribadi': 'bg-pink-100 text-pink-800 border-pink-300',
        'Tidak Absen': 'bg-red-200 text-red-900 border-red-400',
      };
      return {
        category: 'leave' as const,
        isLate: false,
        isWithinTolerance: false,
        isOnTime: false,
        isLeave: true,
        checkInMinutes: standardEntryMin,
        lateMinutesFrom0900: 0,
        lateMinutesPastTolerance: 0,
        toleranceMinutesUsed: 0,
        badgeLabel: labelMap[status] || status,
        shortLabel: status,
        badgeClass: classMap[status] || 'bg-amber-100 text-amber-800 border-amber-300',
      };
    }

    if (totalMinutesExact <= standardEntryMin) {
      const earlyMin = Math.max(0, Math.round(standardEntryMin - totalMinutesExact));
      return {
        category: 'on_time' as const,
        isLate: false,
        isWithinTolerance: false,
        isOnTime: true,
        isLeave: false,
        checkInMinutes: Math.round(totalMinutesExact),
        lateMinutesFrom0900: 0,
        lateMinutesPastTolerance: 0,
        toleranceMinutesUsed: 0,
        badgeLabel: earlyMin > 0 ? `Tepat Waktu (-${earlyMin}m dari 09:00)` : 'Tepat Waktu (09:00)',
        shortLabel: 'Tepat Waktu (≤ 09:00)',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      };
    }

    if (totalMinutesExact <= toleranceLimitMin) {
      const tolUsed = Math.max(1, Math.ceil(totalMinutesExact - standardEntryMin));
      return {
        category: 'within_tolerance' as const,
        isLate: false,
        isWithinTolerance: true,
        isOnTime: false,
        isLeave: false,
        checkInMinutes: Math.round(totalMinutesExact),
        lateMinutesFrom0900: 0,
        lateMinutesPastTolerance: 0,
        toleranceMinutesUsed: tolUsed,
        badgeLabel: `Toleransi 15m (+${tolUsed}m dari 09:00)`,
        shortLabel: `Toleransi (+${tolUsed}m)`,
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
      };
    }

    const lateFrom0900 = Math.ceil(totalMinutesExact - standardEntryMin);
    const latePastTolerance = Math.ceil(totalMinutesExact - toleranceLimitMin);
    return {
      category: 'late' as const,
      isLate: true,
      isWithinTolerance: false,
      isOnTime: false,
      isLeave: false,
      checkInMinutes: Math.round(totalMinutesExact),
      lateMinutesFrom0900: lateFrom0900,
      lateMinutesPastTolerance: latePastTolerance,
      toleranceMinutesUsed: 15,
      badgeLabel: `Terlambat +${lateFrom0900}m (Lewat Toleransi +${latePastTolerance}m)`,
      shortLabel: `Terlambat +${lateFrom0900}m`,
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    };
  };

  // Helper Badge Warna Mode Kehadiran & Perizinan (10 Kategori)
  const getAttendanceStatusBadgeClass = (st: AttendanceStatus) => {
    switch (st) {
      case 'WFO':
        return 'bg-blue-100 text-[#1E40AF] border-blue-200';
      case 'WFH':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Take Content':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Urusan Kantor':
        return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      case 'Overtime':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'Izin':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Urusan Pribadi':
        return 'bg-pink-100 text-pink-800 border-pink-300';
      case 'Sakit':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Cuti':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'Tidak Absen':
        return 'bg-red-200 text-red-900 border-red-400';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Handler: Open Self-Service Account Modal
  const handleOpenAccountModal = () => {
    if (!currentUser) return;
    const latestUsers = SkenaHrApi.getUsers();
    const matched =
      latestUsers.find((u) => u.id === currentUser.id) ||
      latestUsers.find((u) => u.employeeId === currentUser.employeeId && u.role === currentUser.role) ||
      currentUser;
    setAccountForm({
      name: matched.name || '',
      email: matched.email || '',
      username: matched.username || (matched.email ? matched.email.split('@')[0] : 'user'),
      password: matched.password || 'password123',
      roleTitle: matched.roleTitle || '',
      department: matched.department || '',
    });
    setShowAccountModal(true);
  };

  // Handler: Save Self-Service Account Permanently to Cloud Database
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!accountForm.name.trim()) {
      triggerToast('Nama lengkap tidak boleh kosong!', 'error');
      return;
    }
    if (!accountForm.username.trim() || !accountForm.password.trim()) {
      triggerToast('Username dan Password tidak boleh kosong!', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const updated = await SkenaHrApi.upsertUserAccountAsync(
        {
          id: currentUser.id,
          name: accountForm.name.trim(),
          email: accountForm.email.trim() || `${accountForm.username.trim()}@skena.id`,
          username: accountForm.username.trim(),
          password: accountForm.password.trim(),
          roleTitle: accountForm.roleTitle.trim(),
          department: accountForm.department.trim(),
          role: currentUser.role,
          employeeId: currentUser.employeeId,
          employeeNik: currentUser.employeeNik,
        },
        currentUser.username
      );
      const refreshedUsers = await SkenaHrApi.fetchUsersFromSupabase();
      setUserAccounts(refreshedUsers);
      setCurrentUser(updated);
      SkenaHrApi.getEmployees().then(setEmployees);
      setShowAccountModal(false);
      triggerToast(
        `Akun berhasil disimpan permanen ke Server Database Cloud! Username aktif: "${updated.username}"`
      );
    } catch (err: any) {
      triggerToast(`Gagal memperbarui profil: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Admin Create or Update Any User Account in Cloud Database
  const handleAdminSaveUserAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || currentUser.role !== 'admin') {
      triggerToast('Akses ditolak! Hanya Administrator yang dapat mengelola database akun.', 'error');
      return;
    }
    if (!adminAccForm.name.trim() || !adminAccForm.username.trim() || !adminAccForm.password.trim()) {
      triggerToast('Nama Lengkap, Username, dan Password wajib diisi!', 'error');
      return;
    }
    // Cek duplikasi username
    const duplicate = userAccounts.find(
      (u) =>
        u.username?.toLowerCase() === adminAccForm.username.trim().toLowerCase() &&
        u.id !== (editingAdminAccId || adminAccForm.id)
    );
    if (duplicate) {
      triggerToast(`Username "${adminAccForm.username}" sudah digunakan oleh ${duplicate.name}!`, 'error');
      return;
    }

    setIsLoading(true);
    try {
      const targetId = editingAdminAccId || adminAccForm.id || `u-acc-${Date.now()}`;
      const saved = await SkenaHrApi.upsertUserAccountAsync({
        id: targetId,
        name: adminAccForm.name.trim(),
        username: adminAccForm.username.trim(),
        password: adminAccForm.password.trim(),
        email: adminAccForm.email.trim() || `${adminAccForm.username.trim()}@skena.id`,
        role: adminAccForm.role,
        employeeId: adminAccForm.employeeId || undefined,
        employeeNik: adminAccForm.employeeNik || undefined,
        roleTitle: adminAccForm.roleTitle.trim() || (adminAccForm.role === 'admin' ? 'Administrator HR' : 'Staff'),
        department: adminAccForm.department || 'Creative',
        employmentStatus: adminAccForm.employmentStatus || 'Full Time',
      });

      const refreshed = await SkenaHrApi.fetchUsersFromSupabase();
      setUserAccounts(refreshed);
      if (currentUser.id === saved.id) {
        setCurrentUser(saved);
      }

      setEditingAdminAccId(null);
      setAdminAccForm({
        id: '',
        name: '',
        username: '',
        password: 'password123',
        email: '',
        role: 'employee',
        employeeId: '',
        employeeNik: '',
        roleTitle: 'Creative Staff',
        department: 'Creative',
        employmentStatus: 'Full Time',
      });
      triggerToast(
        editingAdminAccId
          ? `Akun @${saved.username} (${saved.name}) berhasil diperbarui di Database Cloud Terpusat!`
          : `Akun baru @${saved.username} (${saved.name}) berhasil ditambahkan ke Database Cloud Terpusat!`
      );
    } catch (err: any) {
      triggerToast(`Gagal menyimpan akun: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Admin Delete User Account
  const handleAdminDeleteUserAccount = (acc: AppUser) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    if (acc.id === currentUser.id) {
      triggerToast('Anda tidak dapat menghapus akun Administrator yang sedang Anda gunakan login saat ini!', 'error');
      return;
    }
    setDeleteConfirm({
      isOpen: true,
      title: 'Hapus Akun Login dari Database',
      message: `Apakah Anda yakin ingin menghapus akun login "${acc.name}" (Username: @${acc.username}) dari Database Sistem? Pengguna ini tidak akan bisa login lagi kecuali dibuatkan akun baru.`,
      onConfirm: async () => {
        setIsLoading(true);
        try {
          await SkenaHrApi.deleteUserAccount(acc.id);
          const refreshed = await SkenaHrApi.fetchUsersFromSupabase();
          setUserAccounts(refreshed);
          triggerToast(`Akun @${acc.username} (${acc.name}) berhasil dihapus dari Database.`);
        } catch (err: any) {
          triggerToast(`Gagal menghapus akun: ${err.message}`, 'error');
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  // Handler: Admin Sync / Push All Master Data & Accounts to Cloud Database
  const handleSyncAllToSupabase = async () => {
    if (!currentUser || currentUser.role !== 'admin') {
      triggerToast('Hanya Administrator yang dapat mengatur dan menyinkronkan Database Cloud!', 'error');
      return;
    }
    initSupabaseRuntime();
    setIsLoading(true);
    try {
      const res = await SkenaHrApi.syncAllDataToSupabase();
      await fetchMasterData();
      triggerToast(
        `Berhasil menyinkronkan ke Server Cloud: ${res.usersSynced} Akun User, ${res.employeesSynced} Karyawan, & ${res.competenciesSynced} KPI!`
      );
    } catch (err: any) {
      triggerToast(`Gagal sinkronisasi ke Server Cloud: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Admin Export User Accounts Database (.xlsx)
  const handleExportUserAccountsExcel = () => {
    if (!currentUser || currentUser.role !== 'admin') return;
    const headers = [
      'No',
      'ID Akun',
      'Nama Lengkap Pengguna',
      'Role Akses Aplikasi',
      'Username Login',
      'Password Aktif',
      'Email',
      'NIK Karyawan Terkait',
      'Jabatan / Role Title',
      'Departemen',
      'Status Kontrak',
    ];
    const rows = userAccounts.map((u, idx) => [
      idx + 1,
      u.id,
      u.name,
      u.role === 'admin' ? 'ADMINISTRATOR (HR / MD)' : 'KARYAWAN (PORTAL)',
      u.username || '-',
      u.password || 'password123',
      u.email || '-',
      u.employeeNik || '-',
      u.roleTitle || '-',
      u.department || '-',
      u.employmentStatus || 'Full Time',
    ]);
    downloadExcel(
      `Database_Akun_User_PT_Skena_${todayStr}`,
      'Database_Akun_Login',
      headers,
      rows,
      [
        [settings.company_name.toUpperCase()],
        ['DATABASE KREDENSIAL AKUN LOGIN (USERNAME & PASSWORD) — RAHASIA ADMINISTRATOR'],
        [`Dicetak Oleh: ${currentUser.name} (@${currentUser.username}) | Tanggal: ${todayStr}`],
      ]
    );
    triggerToast('File Excel (.xlsx) Database Akun User berhasil diunduh!');
  };

  // Handler: Confirm Archiving Employee (Deactivate)
  const handleArchiveEmployeeConfirm = async () => {
    if (!deactivatingEmp) return;
    setIsLoading(true);
    try {
      await SkenaHrApi.archiveEmployee(deactivatingEmp.id, deactivateReason, deactivateDate);
      const updated = await SkenaHrApi.getEmployees();
      setEmployees(updated);
      setShowDeactivateModal(false);
      setDeactivatingEmp(null);
      triggerToast(`Karyawan ${deactivatingEmp.full_name} berhasil dipindahkan ke Arsip Karyawan Nonaktif.`);
    } catch (err: any) {
      triggerToast(`Gagal menonaktifkan karyawan: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Restore Archived Employee
  const handleRestoreEmployee = async (emp: Employee) => {
    setIsLoading(true);
    try {
      await SkenaHrApi.restoreEmployee(emp.id);
      const updated = await SkenaHrApi.getEmployees();
      setEmployees(updated);
      triggerToast(`Karyawan ${emp.full_name} berhasil dipulihkan menjadi Karyawan Aktif!`);
    } catch (err: any) {
      triggerToast(`Gagal memulihkan karyawan: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Save KPI Target Adjustment
  const handleSaveKpiTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompTarget) return;
    setIsLoading(true);
    try {
      await SkenaHrApi.upsertCompetency(editingCompTarget);
      const updated = await SkenaHrApi.getCompetencies();
      setCompetencies(updated);
      setShowKpiTargetModal(false);
      setEditingCompTarget(null);
      triggerToast(`Target KPI ${editingCompTarget.competency_name} berhasil disesuaikan!`);
    } catch (err: any) {
      triggerToast(`Gagal menyesuaikan target KPI: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers for Job Profile Management
  const handleSaveJobProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJobProfile?.role_title?.trim()) {
      triggerToast('Nama jabatan wajib diisi!', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const cleanResponsibilities = (editingJobProfile.key_responsibilities || [])
        .flatMap((s) => String(s).split('\n'))
        .map((s) => s.trim())
        .filter(Boolean);
      const rawReqs =
        editingJobProfile.requirements !== undefined
          ? editingJobProfile.requirements
          : editingJobProfile.technical_competencies || [];
      const cleanReqs = rawReqs
        .flatMap((s) => String(s).split('\n'))
        .map((s) => s.trim())
        .filter(Boolean);
      const cleanKpis = (editingJobProfile.core_kpis || [])
        .flatMap((s) => String(s).split('\n'))
        .map((s) => s.trim())
        .filter(Boolean);
      const cleanTraits = (editingJobProfile.behavioral_traits || [])
        .flatMap((s) => String(s).split('\n'))
        .map((s) => s.trim())
        .filter(Boolean);
      const supervisor =
        (editingJobProfile.reports_to || editingJobProfile.direct_supervisor || 'Managing Director').trim() ||
        'Managing Director';

      const payloadToSave: Partial<JobProfile> = {
        ...editingJobProfile,
        role_title: editingJobProfile.role_title.trim(),
        department: editingJobProfile.department || 'Creative',
        summary: (editingJobProfile.summary || '').trim(),
        reports_to: supervisor,
        direct_supervisor: supervisor,
        key_responsibilities: cleanResponsibilities,
        requirements: cleanReqs,
        technical_competencies: cleanReqs,
        behavioral_traits: cleanTraits,
        core_kpis: cleanKpis,
      };

      await SkenaHrApi.upsertJobProfile(payloadToSave);
      const updated = await SkenaHrApi.getJobProfiles();
      setJobProfiles([...updated]);
      setShowJobProfileModal(false);
      setEditingJobProfile(null);
      triggerToast(`Job Profile "${payloadToSave.role_title}" berhasil disimpan & disinkronkan!`);
    } catch (err: any) {
      triggerToast(`Gagal menyimpan Job Profile: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteJobProfile = (id: string, title?: string) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Hapus Job Profile',
      message: `Apakah Anda yakin ingin menghapus deskripsi jabatan "${title || 'Job Profile'}"? Tindakan ini akan menghapus data dari daftar profil jabatan resmi.`,
      onConfirm: async () => {
        await SkenaHrApi.deleteJobProfile(id);
        const updated = await SkenaHrApi.getJobProfiles();
        setJobProfiles([...updated]);
        triggerToast('Job Profile berhasil dihapus & disinkronkan.');
      },
    });
  };

  // Handlers for LMS Curriculum Management
  const handleSaveLmsCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLmsCourse?.title?.trim()) {
      triggerToast('Judul kursus wajib diisi!', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const rawObjs =
        editingLmsCourse.learning_objectives !== undefined
          ? editingLmsCourse.learning_objectives
          : editingLmsCourse.key_skills_learned || [];
      const cleanObjs = rawObjs
        .flatMap((s) => String(s).split('\n'))
        .map((s) => s.trim())
        .filter(Boolean);
      const cleanRoles = (editingLmsCourse.target_roles || ['Semua Tim Skena'])
        .flatMap((s) => String(s).split(/[\n,]+/))
        .map((s) => s.trim())
        .filter(Boolean);
      const cleanCodes = (editingLmsCourse.target_competency_codes || ['KPI-CRE-01'])
        .flatMap((s) => String(s).split(/[\n,]+/))
        .map((s) => s.trim())
        .filter(Boolean);

      const payloadToSave: Partial<LmsCurriculum> = {
        ...editingLmsCourse,
        title: editingLmsCourse.title.trim(),
        department: editingLmsCourse.department || 'Creative',
        category: editingLmsCourse.category || 'Creative & Production',
        duration_hours: Number(editingLmsCourse.duration_hours ?? 8),
        level: editingLmsCourse.level || 'Intermediate',
        status: editingLmsCourse.status || 'Aktif',
        description: (editingLmsCourse.description || '').trim(),
        learning_objectives: cleanObjs,
        key_skills_learned: cleanObjs,
        target_roles: cleanRoles.length > 0 ? cleanRoles : ['Semua Tim Skena'],
        target_competency_codes: cleanCodes.length > 0 ? cleanCodes : ['KPI-CRE-01'],
      };

      await SkenaHrApi.upsertLmsCurriculum(payloadToSave);
      const updated = await SkenaHrApi.getLmsCurriculum();
      setLmsCurriculumList([...updated]);
      setShowLmsModal(false);
      setEditingLmsCourse(null);
      triggerToast(`Kurikulum LMS "${payloadToSave.title}" berhasil disimpan & disinkronkan!`);
    } catch (err: any) {
      triggerToast(`Gagal menyimpan kurikulum: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLmsCourse = (id: string, title?: string) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Hapus Materi Pembelajaran LMS',
      message: `Apakah Anda yakin ingin menghapus modul pembelajaran "${title || 'Materi LMS'}"?`,
      onConfirm: async () => {
        await SkenaHrApi.deleteLmsCurriculum(id);
        const updated = await SkenaHrApi.getLmsCurriculum();
        setLmsCurriculumList([...updated]);
        triggerToast('Materi LMS berhasil dihapus & disinkronkan.');
      },
    });
  };

  // Indonesian Month Formatter Helper
  const MONTH_NAMES_ID = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const formatMonthLabel = (yearMonth: string): string => {
    if (!yearMonth) return '';
    const [y, m] = yearMonth.split('-');
    const idx = parseInt(m, 10) - 1;
    return `${MONTH_NAMES_ID[idx] || m} ${y}`;
  };

  // Native Multi-Sheet Excel (.xlsx) Workbook Download Helper
  const downloadExcelWorkbook = (
    filename: string,
    sheets: {
      sheetName: string;
      headers: string[];
      rows: (string | number)[][];
      titleRows?: (string | number)[][];
    }[]
  ) => {
    const wb = XLSX.utils.book_new();
    sheets.forEach((sheet, idx) => {
      const aoa: (string | number)[][] = [];
      if (sheet.titleRows && sheet.titleRows.length > 0) {
        aoa.push(...sheet.titleRows, []);
      }
      aoa.push(sheet.headers, ...sheet.rows);
      const ws = XLSX.utils.aoa_to_sheet(aoa);

      // Auto-fit column widths
      const colWidths = sheet.headers.map((h, colIdx) => {
        let maxLen = String(h || '').length;
        sheet.rows.forEach((r) => {
          const cellVal = String(r[colIdx] ?? '');
          if (cellVal.length > maxLen) maxLen = cellVal.length;
        });
        return { wch: Math.min(Math.max(maxLen + 4, 12), 55) };
      });
      ws['!cols'] = colWidths;

      const cleanSheetName =
        (sheet.sheetName || `Sheet_${idx + 1}`).replace(/[\\/?*[\]:]/g, '').slice(0, 31) || `Sheet_${idx + 1}`;
      XLSX.utils.book_append_sheet(wb, ws, cleanSheetName);
    });

    const baseName = filename.replace(/\.(csv|xlsx|pdf)$/i, '');
    XLSX.writeFile(wb, `${baseName}.xlsx`);
  };

  // Single-sheet Excel (.xlsx) convenience wrapper
  const downloadExcel = (
    filename: string,
    sheetName: string,
    headers: string[],
    rows: (string | number)[][],
    titleRows?: (string | number)[][]
  ) => {
    downloadExcelWorkbook(filename, [{ sheetName, headers, rows, titleRows }]);
  };

  // Structured single-sheet Excel (.xlsx) with two title header rows
  const downloadStructuredExcel = (
    filename: string,
    sheetName: string,
    title1: string,
    title2: string,
    headers: string[],
    rows: (string | number)[][]
  ) => {
    downloadExcelWorkbook(filename, [
      {
        sheetName,
        headers,
        rows,
        titleRows: [[title1], [title2]],
      },
    ]);
  };

  // Export Module 5: KPI & WLA Scorecard (.xlsx)
  const handleExportKpiCsv = () => {
    const activeComp = competencies.find((c) => c.id === selectedCompId);
    const headers = [
      'NIK',
      'Nama Karyawan',
      'Departemen',
      'Jabatan',
      'Status Kontrak',
      'Indikator KPI',
      'Passing Target',
      'Sprint M1',
      'Sprint M2',
      'Sprint M3',
      'Sprint M4',
      'Skill Review (30%)',
      'Project Delivery (20%)',
      'Skor Akhir KPI',
      'Skill Level (1-5)',
      'Beban Kerja (WLA %)',
      'Status Kelulusan',
      'Narasi Evaluasi & Capaian',
    ];
    const currentCompRows = employees
      .filter((emp) => kpiDeptFilter === 'Semua' || emp.department === kpiDeptFilter)
      .map((emp) => {
        const row = inlineKpiMap[emp.id];
        const finalScore = row ? calculateRowScore(row) : 0;
        const target = activeComp?.target_threshold || 75;
        const isPass = finalScore >= target ? 'LULUS / MENCAPAI TARGET' : 'BELUM MENCAPAI TARGET';
        return [
          emp.employee_nik,
          emp.full_name,
          emp.department,
          emp.role_title,
          emp.employment_status,
          activeComp ? `${activeComp.competency_code} - ${activeComp.competency_name}` : 'Semua',
          target,
          row?.kpi_q1 ?? 0,
          row?.kpi_q2 ?? 0,
          row?.kpi_q3 ?? 0,
          row?.kpi_q4 ?? 0,
          row?.mid_review_score ?? 0,
          row?.final_project_score ?? 0,
          finalScore,
          row?.current_skill_level ?? 3,
          `${row?.workload_percentage ?? 80}%`,
          isPass,
          row?.performance_narrative || 'Kompetensi telah dinilai sesuai standar target.',
        ];
      });

    // Sheet 2: Seluruh Indikator KPI Semua Karyawan
    const allKpiRows: (string | number)[][] = [];
    employees.forEach((emp) => {
      competencies.forEach((comp) => {
        const ev = kpiList.find((k) => k.employee_id === emp.id && k.competency_id === comp.id);
        const sc = ev ? (ev.final_kpi_score ?? calculateRowScore(ev)) : 85;
        allKpiRows.push([
          emp.employee_nik,
          emp.full_name,
          emp.department,
          emp.role_title,
          emp.employment_status,
          `${comp.competency_code} - ${comp.competency_name}`,
          comp.target_threshold,
          ev?.kpi_q1 ?? 82,
          ev?.kpi_q2 ?? 85,
          ev?.kpi_q3 ?? 86,
          ev?.kpi_q4 ?? 88,
          ev?.mid_review_score ?? 85,
          ev?.final_project_score ?? 86,
          sc,
          ev?.current_skill_level ?? 3,
          `${ev?.workload_percentage ?? 85}%`,
          sc >= comp.target_threshold ? 'LULUS / MENCAPAI TARGET' : 'BELUM MENCAPAI TARGET',
          ev?.performance_narrative || 'Evaluasi sesuai target departemen.',
        ]);
      });
    });

    downloadExcelWorkbook(
      `Buku_Evaluasi_KPI_WLA_PT_Skena_${activeComp?.competency_code || 'All'}_${settings.period_year}`,
      [
        {
          sheetName: 'Evaluasi_KPI_Terpilih',
          headers,
          rows: currentCompRows,
          titleRows: [
            [settings.company_name.toUpperCase()],
            [`BUKU EVALUASI KPI, SKILL LEVEL & WORKING LOAD ANALYSIS (WLA) — ${settings.period_term} (${settings.period_year})`],
            [`Indikator Aktif: ${activeComp ? `${activeComp.competency_code} - ${activeComp.competency_name}` : 'Semua'} | Filter Dept: ${kpiDeptFilter}`],
          ],
        },
        {
          sheetName: 'Semua_Indikator_KPI',
          headers,
          rows: allKpiRows,
          titleRows: [
            [settings.company_name.toUpperCase()],
            ['REKAPITULASI LENGKAP SELURUH INDIKATOR KPI & WLA KARYAWAN'],
          ],
        },
      ]
    );
    triggerToast('File Excel (.xlsx) Buku Evaluasi KPI & WLA berhasil diunduh!');
  };

  // Export Module 4: Operational Sprint & LMS Logs (.xlsx)
  const handleExportLogsCsv = () => {
    const headers = [
      'No',
      'Tanggal Log',
      'Sesi Sprint / Jam Kerja',
      'Kompetensi / KPI Terkait',
      'Topik Deliverable / Materi LMS',
      'Rincian Eksekusi Proyek',
      'Catatan Hambatan / Blocker',
      'Jumlah Tim Aktif (Orang)',
      'Jumlah Tim Cuti (Orang)',
    ];
    const rows = activityLogs.map((log, idx) => [
      idx + 1,
      log.log_date,
      log.sprint_session_info,
      log.competencies?.competency_name || 'Kompetensi Umum',
      log.project_deliverable_topic,
      log.execution_details,
      log.blocker_evaluator_notes || '-',
      log.total_active_team,
      log.total_on_leave,
    ]);
    downloadExcel(
      `Jurnal_Operasional_Sprint_LMS_Skena_${todayStr}`,
      'Jurnal_Operasional_LMS',
      headers,
      rows,
      [
        [settings.company_name.toUpperCase()],
        [`REKAPITULASI JURNAL OPERASIONAL, SPRINT HARIAN & LMS — ${settings.period_term} (${settings.period_year})`],
        [`Managing Director: ${settings.managing_director_name} | Human Capital: ${settings.hr_lead_name}`],
      ]
    );
    triggerToast('File Excel (.xlsx) Jurnal Operasional & LMS berhasil diunduh!');
  };

  // Export Module 6: Official Monthly Employee Report Card (.xlsx Multi-Sheet)
  const handleExportEmployeeReportCsv = () => {
    const targetEmpId = currentUser?.role === 'employee' && currentUser.employeeId ? currentUser.employeeId : selectedReportEmpId;
    const emp = employees.find((e) => e.id === targetEmpId);
    if (!emp) return;

    const monthAtts = empReportAttendances.filter((a) => !reportMonth || a.attendance_date.startsWith(reportMonth));
    const wfo = monthAtts.filter((a) => a.status === 'WFO').length;
    const wfh = monthAtts.filter((a) => a.status === 'WFH').length;
    const content = monthAtts.filter((a) => a.status === 'Take Content').length;
    const cuti = monthAtts.filter((a) => a.status === 'Cuti').length;
    const leaveStats = getEmployeeLeaveStats(emp.id, emp.annual_leave_quota || 12);

    const summaryHeaders = ['Bagian Rapor', 'Parameter / Indikator Evaluasi', 'Nilai / Keputusan Resmi'];
    const summaryRows: (string | number)[][] = [
      ['1. Identitas Perusahaan', 'Nama Perusahaan', settings.company_name],
      ['1. Identitas Perusahaan', 'Sektor Industri', `${settings.industry_sector} • Makassar HQ`],
      ['2. Periode Rapor Bulanan', 'Bulan Evaluasi Rapor', formatMonthLabel(reportMonth)],
      ['2. Periode Rapor Bulanan', 'Siklus Semester & Tahun', `${settings.period_term} (${settings.period_year})`],
      ['3. Identitas Karyawan', 'NIK / ID Karyawan', emp.employee_nik],
      ['3. Identitas Karyawan', 'Nama Lengkap Karyawan', emp.full_name],
      ['3. Identitas Karyawan', 'Jabatan / Role', emp.role_title],
      ['3. Identitas Karyawan', 'Departemen / Divisi', emp.department],
      ['3. Identitas Karyawan', 'Status Kontrak Kerja', emp.employment_status],
      ['3. Identitas Karyawan', 'Durasi Kontrak & Lokasi', `${emp.contract_duration} • ${emp.work_location}`],
      ['3. Identitas Karyawan', 'Paket Benefit / Proyek', emp.benefits_package || emp.assigned_project || '-'],
      [`4. Presensi Bulan ${formatMonthLabel(reportMonth)}`, 'Hadir Work From Office (WFO)', `${wfo} Hari`],
      [`4. Presensi Bulan ${formatMonthLabel(reportMonth)}`, 'Hadir Work From Home (WFH)', `${wfh} Hari`],
      [`4. Presensi Bulan ${formatMonthLabel(reportMonth)}`, 'Produksi Lapangan (Take Content)', `${content} Hari`],
      [`4. Presensi Bulan ${formatMonthLabel(reportMonth)}`, 'Cuti / Izin Resmi Bulan Ini', `${cuti} Hari`],
      [`4. Presensi Bulan ${formatMonthLabel(reportMonth)}`, 'Sisa Kuota Cuti Tahunan', `${leaveStats.remaining} Hari (dari ${leaveStats.quota} Hari)`],
      ['5. Keputusan Talent Pipeline', 'Kategori 9-Box Talent', empReportData.talent_pipeline_box],
      ['5. Keputusan Talent Pipeline', 'Keputusan Karir Manajemen', empReportData.career_decision],
      ['5. Keputusan Talent Pipeline', 'Penugasan / Role Berikutnya', empReportData.next_role_assignment || '-'],
      ['6. Catatan Evaluasi Resmi', 'Catatan Budaya Kerja & Human Capital', empReportData.behavioral_culture_notes || '-'],
      ['6. Catatan Evaluasi Resmi', 'Catatan Managing Director / Atasan', empReportData.hr_director_notes || '-'],
      ['7. Pengesahan Dokumen', 'Human Capital / HR Lead', `${settings.hr_lead_name} (${settings.hr_lead_id})`],
      ['7. Pengesahan Dokumen', 'Managing Director', `${settings.managing_director_name} (${settings.managing_director_id})`],
    ];

    const empKpis = kpiList.filter((k) => k.employee_id === emp.id);
    const kpiHeaders = [
      'Kode KPI',
      'Nama Kompetensi / KPI',
      'Kategori',
      'Passing Target',
      'Sprint M1',
      'Sprint M2',
      'Sprint M3',
      'Sprint M4',
      'Skill Review (30%)',
      'Project (20%)',
      'Skor Akhir',
      'Skill Level (1-5)',
      'Beban Kerja (WLA %)',
      'Analisis Capaian & Beban Kerja',
    ];
    const kpiRows = competencies.map((comp) => {
      const ev = empKpis.find((k) => k.competency_id === comp.id);
      const sc = ev ? (ev.final_kpi_score ?? calculateRowScore(ev)) : 85;
      return [
        comp.competency_code,
        comp.competency_name,
        comp.category,
        comp.target_threshold,
        ev?.kpi_q1 ?? 82,
        ev?.kpi_q2 ?? 85,
        ev?.kpi_q3 ?? 86,
        ev?.kpi_q4 ?? 88,
        ev?.mid_review_score ?? 85,
        ev?.final_project_score ?? 86,
        sc,
        `Lv.${ev?.current_skill_level || 3}`,
        `${ev?.workload_percentage || 85}%`,
        ev?.performance_narrative || 'Kompetensi telah dinilai sesuai standar target tim kreatif.',
      ];
    });

    const idpHeaders = ['No', 'Modul Pembelajaran / Program Pengembangan (IDP)', 'Metode Pelaksanaan', 'Target Tanggal', 'Status Penyelesaian', 'Skor / Evaluasi'];
    const idpRows = empReportData.idp_lms_modules.map((mod, idx) => [
      idx + 1,
      mod.module_name,
      mod.category,
      mod.target_date || todayStr,
      mod.status,
      mod.score,
    ]);

    const attHeaders = ['No', 'Tanggal Presensi', 'Jam Presensi (WITA)', 'Mode Kehadiran', 'Lokasi Kerja / Liputan', 'Catatan / Output Harian'];
    const attRows = monthAtts.map((a, idx) => [
      idx + 1,
      a.attendance_date,
      a.check_in_time || '08:45:00',
      a.status,
      a.work_location_tag || 'Makassar HQ',
      a.notes || '-',
    ]);

    downloadExcelWorkbook(
      `Rapor_Bulanan_Resmi_${emp.full_name.replace(/\s+/g, '_')}_${reportMonth}`,
      [
        {
          sheetName: '1_Rapor_Utama',
          headers: summaryHeaders,
          rows: summaryRows,
          titleRows: [
            [settings.company_name.toUpperCase()],
            [`RAPOR KINERJA BULANAN RESMI KARYAWAN — BULAN ${formatMonthLabel(reportMonth).toUpperCase()}`],
            [`Nama: ${emp.full_name} (${emp.employee_nik}) | Jabatan: ${emp.role_title} (${emp.department})`],
          ],
        },
        {
          sheetName: '2_Evaluasi_KPI_WLA',
          headers: kpiHeaders,
          rows: kpiRows,
          titleRows: [
            [`TABEL A. EVALUASI KEY PERFORMANCE INDICATOR (KPI) & WORKLOAD ANALYSIS — ${emp.full_name}`],
          ],
        },
        {
          sheetName: '3_Program_IDP_LMS',
          headers: idpHeaders,
          rows: idpRows,
          titleRows: [
            [`TABEL B. INDIVIDUAL DEVELOPMENT PLAN (IDP) & LMS — ${emp.full_name}`],
          ],
        },
        {
          sheetName: '4_Detail_Presensi_Bulan',
          headers: attHeaders,
          rows: attRows,
          titleRows: [
            [`TABEL C. LOG PRESENSI BULAN ${formatMonthLabel(reportMonth).toUpperCase()} — ${emp.full_name}`],
          ],
        },
      ]
    );
    triggerToast(`File Excel (.xlsx) Rapor Bulanan ${emp.full_name} (${formatMonthLabel(reportMonth)}) berhasil diunduh!`);
  };

  // Export Executive Summary All-in-One (.xlsx)
  const exportExecutiveSummaryCsv = () => {
    const headers = [
      'NIK',
      'Nama Karyawan',
      'Jenis Kelamin',
      'Departemen',
      'Jabatan',
      'Status Kontrak',
      'Durasi Kontrak',
      'Lokasi Kerja',
      'Kuota Cuti Tahunan',
      'Cuti Digunakan',
      'Sisa Cuti (Hari)',
      'Rata-rata Skor KPI',
      'Beban Kerja (WLA %)',
      'Status Keaktifan',
    ];

    const rows = employees.map((emp) => {
      const leave = getEmployeeLeaveStats(emp.id, emp.annual_leave_quota || 12);
      const empKpis = kpiList.filter((k) => k.employee_id === emp.id);
      const avgScore =
        empKpis.length > 0
          ? (
              empKpis.reduce((acc, k) => {
                const calc =
                  ((Number(k.kpi_q1) + Number(k.kpi_q2) + Number(k.kpi_q3) + Number(k.kpi_q4)) / 4) * 0.5 +
                  Number(k.mid_review_score) * 0.3 +
                  Number(k.final_project_score) * 0.2;
                return acc + (k.final_kpi_score ?? calc);
              }, 0) / empKpis.length
            ).toFixed(1)
          : '85.0';
      const avgWla =
        empKpis.length > 0
          ? (empKpis.reduce((acc, k) => acc + (k.workload_percentage || 85), 0) / empKpis.length).toFixed(1)
          : '90.0';

      return [
        emp.employee_nik,
        emp.full_name,
        emp.gender,
        emp.department,
        emp.role_title,
        emp.employment_status,
        emp.contract_duration,
        emp.work_location,
        leave.quota,
        leave.used,
        leave.remaining,
        Number(avgScore),
        `${avgWla}%`,
        emp.is_active ? 'Aktif' : `Nonaktif (${emp.deactivation_reason || 'Alumni'})`,
      ];
    });

    downloadExcel(
      `Rangkuman_Eksekutif_SDM_PT_Skena_${todayStr}`,
      'Master_SDM_Eksekutif',
      headers,
      rows,
      [
        [settings.company_name.toUpperCase()],
        [`RANGKUMAN EKSEKUTIF MASTER DATA SDM, KONTRAK, SISA CUTI & RATA-RATA KPI (${settings.period_year})`],
      ]
    );
    triggerToast('File Excel (.xlsx) Rangkuman Eksekutif Karyawan berhasil diunduh!');
  };

  // Export Archived / Nonactive Employees (.xlsx)
  const exportArchivedEmployeesCsv = () => {
    const headers = ['No', 'NIK', 'Nama Karyawan', 'Jabatan', 'Departemen', 'Status Kontrak Terakhir', 'Tanggal Nonaktif', 'Alasan Keluar / Nonaktif'];
    const archived = employees.filter((e) => !e.is_active);
    const rows = archived.map((emp, idx) => [
      idx + 1,
      emp.employee_nik,
      emp.full_name,
      emp.role_title,
      emp.department,
      emp.employment_status,
      emp.deactivation_date || '-',
      emp.deactivation_reason || 'Alumni',
    ]);
    downloadExcel(
      `Arsip_Karyawan_Nonaktif_Skena_${todayStr}`,
      'Arsip_Alumni_Nonaktif',
      headers,
      rows,
      [
        [settings.company_name.toUpperCase()],
        ['DATABASE ARSIP KARYAWAN NONAKTIF & ALUMNI PT SKENA WAHANA KREATIF'],
      ]
    );
    triggerToast('File Excel (.xlsx) Database Arsip Karyawan Nonaktif berhasil diunduh!');
  };

  // Export Module 2: Schedules & Calendar (.xlsx Multi-Sheet)
  const handleExportSchedulesExcel = () => {
    const sortedByDate = [...schedules].sort((a, b) =>
      (a.schedule_date || todayStr).localeCompare(b.schedule_date || todayStr)
    );
    const calHeaders = [
      'No',
      'Tanggal Kalender',
      'Hari Kerja',
      'Jam Mulai',
      'Jam Selesai',
      'Personil / PIC',
      'Nama Shift / Sesi Produksi',
      'Fokus KPI / Kompetensi',
      'Lokasi & Catatan Agenda',
    ];
    const calRows = sortedByDate.map((s, idx) => [
      idx + 1,
      s.schedule_date || todayStr,
      s.day_of_week,
      s.start_time.slice(0, 5),
      s.end_time.slice(0, 5),
      s.employee_name || 'Seluruh Tim Skena',
      s.shift_code,
      s.competencies?.competency_name || 'Kompetensi Umum',
      s.location_agenda_notes || '-',
    ]);

    downloadExcel(
      `Kalender_Jadwal_Shift_Produksi_Skena_${todayStr}`,
      'Kalender_Jadwal_Produksi',
      calHeaders,
      calRows,
      [
        [settings.company_name.toUpperCase()],
        ['RANGKUMAN KALENDER JADWAL SHIFT, LIPUTAN & PRODUKSI KE DEPAN'],
      ]
    );
    triggerToast('File Excel (.xlsx) Kalender Jadwal Shift & Produksi berhasil diunduh!');
  };

  // Export Module 3 Daily Attendance (.xlsx)
  const handleExportDailyAttendanceExcel = () => {
    const headers = [
      'No',
      'Tanggal Presensi',
      'NIK',
      'Nama Karyawan',
      'Departemen',
      'Status Kontrak',
      'Jam Masuk Standar',
      'Jam Presensi Aktual (WITA)',
      'Mode Kehadiran',
      'Status Ketepatan Waktu (Toleransi 15m)',
      'Menit Terlambat (Lewat 09:00)',
      'Tag Lokasi Kerja / Liputan',
      'Keterangan Izin / WFH / Output Harian',
    ];
    const rows = employees.map((emp, idx) => {
      const rec = dailyAttendances[emp.id];
      const checkIn = rec?.check_in_time || '08:45:00';
      const st = rec?.status || 'WFO';
      const punc = analyzeAttendancePunctuality(checkIn, st);
      return [
        idx + 1,
        selectedDate,
        emp.employee_nik,
        emp.full_name,
        emp.department,
        emp.employment_status,
        '09:00:00 (Toleransi 09:15:00)',
        checkIn,
        st,
        punc.badgeLabel,
        punc.lateMinutesFrom0900 > 0 ? `${punc.lateMinutesFrom0900} Menit` : '0 Menit',
        rec?.work_location_tag || emp.work_location || 'Makassar HQ',
        rec?.notes || '-',
      ];
    });
    downloadExcel(
      `Presensi_Harian_Skena_${selectedDate}`,
      'Presensi_Harian',
      headers,
      rows,
      [
        [settings.company_name.toUpperCase()],
        [`REKAP PRESENSI HARIAN & KALKULASI KETERLAMBATAN (JAM MASUK 09:00 + TOLERANSI 15 MENIT) — TANGGAL ${selectedDate}`],
      ]
    );
    triggerToast(`File Excel (.xlsx) Presensi Harian tanggal ${selectedDate} berhasil diunduh!`);
  };

  // Export Org Chart Hierarchy (.xlsx)
  const handleExportOrgChartExcel = () => {
    const activeEmps = employees.filter((e) => e.is_active);
    const headers = [
      'Level Hierarki',
      'NIK',
      'Nama Lengkap',
      'Jabatan / Role',
      'Departemen',
      'Atasan Langsung',
      'Status Kontrak',
      'Sisa Cuti (Hari)',
      'Lokasi Kerja',
    ];
    const rows = activeEmps.map((emp) => {
      const title = emp.role_title.toLowerCase();
      const level =
        title.includes('managing director') || emp.department === 'Managing Director'
          ? 'Level 1 - Pimpinan Eksekutif (Managing Director)'
          : title.includes('director') || title.includes('manager') || title.includes('head') || title.includes('lead')
          ? 'Level 2 - Kepala Divisi & Project Manager'
          : 'Level 3 - Tim Spesialis, Kreator & Operasional';
      const leave = getEmployeeLeaveStats(emp.id, emp.annual_leave_quota || 12);
      return [
        level,
        emp.employee_nik,
        emp.full_name,
        emp.role_title,
        emp.department,
        emp.direct_supervisor || 'Managing Director',
        emp.employment_status,
        leave.remaining,
        emp.work_location || 'Makassar HQ',
      ];
    });
    downloadExcel(
      `Struktur_Organisasi_PT_Skena_${todayStr}`,
      'Struktur_Organisasi',
      headers,
      rows,
      [
        [settings.company_name.toUpperCase()],
        ['BAGAN STRUKTUR ORGANISASI & HIERARKI JABATAN RESMI'],
      ]
    );
    triggerToast('File Excel (.xlsx) Struktur Organisasi berhasil diunduh!');
  };

  // Export Job Profiles & LMS Curriculum (.xlsx Multi-Sheet)
  const handleExportJobProfilesLmsExcel = () => {
    const jpHeaders = [
      'No',
      'Nama Jabatan / Role',
      'Departemen',
      'Atasan Langsung (Reports To)',
      'Tanggung Jawab Utama',
      'Kualifikasi & Kompetensi',
      'Indikator KPI Utama',
    ];
    const jpRows = jobProfiles.map((jp, idx) => [
      idx + 1,
      jp.role_title,
      jp.department,
      jp.reports_to || 'Managing Director',
      (jp.key_responsibilities || []).join(' | '),
      (jp.requirements || jp.technical_competencies || []).join(' | '),
      (jp.core_kpis || []).join(' | '),
    ]);

    const lmsHeaders = [
      'No',
      'Judul Materi / Kurikulum LMS',
      'Kategori Pelatihan',
      'Durasi (Jam)',
      'Target Jabatan / Role',
      'Kode KPI Terkait',
      'Sasaran Pembelajaran (Learning Objectives)',
    ];
    const lmsRows = lmsCurriculumList.map((c, idx) => [
      idx + 1,
      c.title,
      c.category,
      c.duration_hours,
      (c.target_roles || ['Semua Tim']).join(', '),
      (c.target_competency_codes || ['KPI-01']).join(', '),
      (c.learning_objectives || c.key_skills_learned || []).join(' | '),
    ]);

    downloadExcelWorkbook(`Job_Profile_Kurikulum_LMS_PT_Skena_${todayStr}`, [
      {
        sheetName: '1_Deskripsi_Jabatan',
        headers: jpHeaders,
        rows: jpRows,
        titleRows: [
          [settings.company_name.toUpperCase()],
          ['DAFTAR JOB PROFILE & DESKRIPSI JABATAN RESMI'],
        ],
      },
      {
        sheetName: '2_Kurikulum_LMS',
        headers: lmsHeaders,
        rows: lmsRows,
        titleRows: [
          [settings.company_name.toUpperCase()],
          ['KURIKULUM PEMBELAJARAN INTERNAL (LEARNING MANAGEMENT SYSTEM)'],
        ],
      },
    ]);
    triggerToast('File Excel (.xlsx) Job Profile & Kurikulum LMS berhasil diunduh!');
  };

  // Export Employee Performance Analytics & IDP (.xlsx)
  const handleExportAnalyticsExcel = () => {
    if (!employeeAnalyticsData || !activeAnalyticsEmp) return;
    const emp = activeAnalyticsEmp;
    const rec = getIdpRecommendations(emp);

    const kpiHeaders = [
      'Kode KPI',
      'Nama Kompetensi / KPI',
      'Kategori',
      'Target Kelulusan',
      'Sprint M1',
      'Sprint M2',
      'Sprint M3',
      'Sprint M4',
      'Skill Review (30%)',
      'Project (20%)',
      'Skor Akhir',
      'Skill Level',
      'Status',
    ];
    const kpiRows = employeeAnalyticsData.compBreakdown.map((item) => [
      item.compCode,
      item.compName,
      item.category,
      item.target,
      item.sprints[0] ?? 85,
      item.sprints[1] ?? 85,
      item.sprints[2] ?? 85,
      item.sprints[3] ?? 85,
      item.mid,
      item.project,
      item.score,
      `Lv.${item.skillLevel}`,
      item.score >= item.target ? 'LULUS TARGET' : 'PERLU PEMBINAAN',
    ]);

    const idpHeaders = ['Parameter Rekomendasi IDP & Analitik', 'Detail / Nilai'];
    const idpRows: (string | number)[][] = [
      ['Nama Karyawan', emp.full_name],
      ['NIK Karyawan', emp.employee_nik],
      ['Jabatan & Departemen', `${emp.role_title} (${emp.department})`],
      ['Status Kontrak', emp.employment_status],
      ['Rata-rata Skor KPI', employeeAnalyticsData.avgScore],
      ['Rata-rata Beban Kerja (WLA)', `${employeeAnalyticsData.avgWla}%`],
      ['Persentase Kehadiran Aktif', `${employeeAnalyticsData.attendance.attendancePct}%`],
      ['Rincian Kehadiran', `WFO: ${employeeAnalyticsData.attendance.wfo} | WFH: ${employeeAnalyticsData.attendance.wfh} | Take Content: ${employeeAnalyticsData.attendance.content} | Cuti: ${employeeAnalyticsData.attendance.cuti}`],
      ['Pemetaan 9-Box Talent', rec.talentBox],
      ['Rekomendasi Keputusan Karir', rec.careerDecision],
      ['Proyeksi Role Berikutnya', rec.nextRole],
      ['Saran Human Capital', rec.cultureNotes],
      ['Saran Managing Director', rec.directorNotes],
      ...rec.modules.map((m, i) => [
        `Rekomendasi Modul LMS #${i + 1}`,
        `${m.module_name} (${m.category}) — Status: ${m.status} | Skor: ${m.score}`,
      ]),
    ];

    downloadExcelWorkbook(`Analitik_Kinerja_IDP_${emp.full_name.replace(/\s+/g, '_')}_${todayStr}`, [
      {
        sheetName: '1_Grafik_Capaian_KPI',
        headers: kpiHeaders,
        rows: kpiRows,
        titleRows: [
          [settings.company_name.toUpperCase()],
          [`RANGKUMAN CAPAIAN KINERJA & SPRINT KARYAWAN — ${emp.full_name}`],
        ],
      },
      {
        sheetName: '2_Rekomendasi_IDP_Karir',
        headers: idpHeaders,
        rows: idpRows,
        titleRows: [
          [settings.company_name.toUpperCase()],
          [`SISTEMATIKA INDIVIDUAL DEVELOPMENT PLAN (IDP) — ${emp.full_name}`],
        ],
      },
    ]);
    triggerToast(`File Excel (.xlsx) Analitik Kinerja & IDP ${emp.full_name} berhasil diunduh!`);
  };

  // Export Self Attendance History (.xlsx)
  const handleExportSelfAttendanceExcel = () => {
    const myEmpId = currentUser?.role === 'employee' ? currentUser.employeeId : selectedLoginEmpId;
    const myEmp = employees.find((e) => e.id === myEmpId);
    const myRecords = monthlyAttendances.filter((r) => r.employee_id === myEmpId);
    const headers = ['No', 'Tanggal Presensi', 'Jam Check-in (WITA)', 'Mode Kehadiran', 'Lokasi Kerja', 'Catatan / Deliverable Harian'];
    const rows = myRecords.map((r, idx) => [
      idx + 1,
      r.attendance_date,
      r.check_in_time || '08:45:00',
      r.status,
      r.work_location_tag || 'Makassar HQ',
      r.notes || '-',
    ]);
    downloadExcel(
      `Riwayat_Presensi_Saya_${(myEmp?.full_name || currentUser?.name || 'Karyawan').replace(/\s+/g, '_')}_${attendanceMonth}`,
      'Riwayat_Presensi_Saya',
      headers,
      rows,
      [
        [settings.company_name.toUpperCase()],
        [`RIWAYAT PRESENSI MANDIRI KARYAWAN — ${myEmp?.full_name || currentUser?.name || ''}`],
      ]
    );
    triggerToast('File Excel (.xlsx) Riwayat Presensi Mandiri berhasil diunduh!');
  };

  // Export Master All-In-One Database (.xlsx with 7 Sheets)
  const handleExportMasterAllInOneExcel = () => {
    const empHeaders = ['NIK', 'Nama Lengkap', 'Gender', 'Jabatan', 'Departemen', 'Status Kontrak', 'Durasi Kontrak', 'Kuota Cuti', 'Sisa Cuti', 'Lokasi Kerja', 'Status'];
    const activeRows = employees.filter((e) => e.is_active).map((emp) => {
      const leave = getEmployeeLeaveStats(emp.id, emp.annual_leave_quota || 12);
      return [
        emp.employee_nik,
        emp.full_name,
        emp.gender,
        emp.role_title,
        emp.department,
        emp.employment_status,
        emp.contract_duration,
        leave.quota,
        leave.remaining,
        emp.work_location,
        'Aktif',
      ];
    });

    const archivedRows = employees.filter((e) => !e.is_active).map((emp) => [
      emp.employee_nik,
      emp.full_name,
      emp.role_title,
      emp.department,
      emp.employment_status,
      emp.deactivation_date || '-',
      emp.deactivation_reason || 'Alumni',
    ]);

    const compRows = competencies.map((c) => [
      c.competency_code,
      c.competency_name,
      c.category,
      c.target_threshold,
      c.standard_workload_hours,
    ]);

    const schedRows = schedules.map((s) => [
      s.schedule_date || todayStr,
      s.day_of_week,
      s.start_time.slice(0, 5),
      s.end_time.slice(0, 5),
      s.employee_name || 'Seluruh Tim',
      s.shift_code,
      s.competencies?.competency_name || 'Umum',
      s.location_agenda_notes || '-',
    ]);

    const logRows = activityLogs.map((l) => [
      l.log_date,
      l.sprint_session_info,
      l.competencies?.competency_name || 'Umum',
      l.project_deliverable_topic,
      l.execution_details,
      l.blocker_evaluator_notes || '-',
      l.total_active_team,
      l.total_on_leave,
    ]);

    downloadExcelWorkbook(`Database_Master_Lengkap_PT_Skena_${todayStr}`, [
      {
        sheetName: '1_Karyawan_Aktif',
        headers: empHeaders,
        rows: activeRows,
        titleRows: [[settings.company_name.toUpperCase()], ['MASTER DATABASE KARYAWAN AKTIF']],
      },
      {
        sheetName: '2_Arsip_Alumni',
        headers: ['NIK', 'Nama Lengkap', 'Jabatan Terakhir', 'Departemen', 'Kontrak Terakhir', 'Tanggal Nonaktif', 'Alasan Nonaktif'],
        rows: archivedRows,
        titleRows: [[settings.company_name.toUpperCase()], ['DATABASE ARSIP KARYAWAN NONAKTIF / ALUMNI']],
      },
      {
        sheetName: '3_Kamus_KPI',
        headers: ['Kode KPI', 'Nama Kompetensi / KPI', 'Kategori', 'Passing Target', 'Standar Jam Kerja/Minggu'],
        rows: compRows,
        titleRows: [[settings.company_name.toUpperCase()], ['KAMUS KOMPETENSI & TARGET KPI']],
      },
      {
        sheetName: '4_Jadwal_Produksi',
        headers: ['Tanggal', 'Hari', 'Mulai', 'Selesai', 'PIC', 'Shift / Sesi', 'Fokus KPI', 'Lokasi & Agenda'],
        rows: schedRows,
        titleRows: [[settings.company_name.toUpperCase()], ['KALENDER JADWAL SHIFT & PRODUKSI']],
      },
      {
        sheetName: '5_Jurnal_Operasional',
        headers: ['Tanggal', 'Sesi Sprint', 'KPI Terkait', 'Topik Project / LMS', 'Rincian Eksekusi', 'Hambatan / Blocker', 'Tim Aktif', 'Tim Cuti'],
        rows: logRows,
        titleRows: [[settings.company_name.toUpperCase()], ['JURNAL AKTIVITAS SPRINT & EVALUASI HARIAN']],
      },
    ]);
    triggerToast('File Master Database Lengkap (5 Sheet .xlsx) berhasil diunduh!');
  };

  // Load All Initial Data
  const fetchMasterData = async () => {
    setIsLoading(true);
    try {
      const [
        dbSettings,
        dbEmployees,
        dbCompetencies,
        dbSchedules,
        dbLogs,
        dbJobProfiles,
        dbCurriculum,
        dbUsers,
        dbSharing,
        dbOneYear,
        dbReminders,
      ] = await Promise.all([
        SkenaHrApi.getSettings(),
        SkenaHrApi.getEmployees(),
        SkenaHrApi.getCompetencies(),
        SkenaHrApi.getSchedules(),
        SkenaHrApi.getActivityLogs(),
        SkenaHrApi.getJobProfiles(),
        SkenaHrApi.getLmsCurriculum(),
        SkenaHrApi.fetchUsersFromSupabase(),
        SkenaHrApi.getSharingSessions(),
        SkenaHrApi.getOneYearPlans(),
        SkenaHrApi.getExecutiveReminders(),
      ]);

      const activePeriodYear = dbSettings?.period_year || settings.period_year;
      const activePeriodTerm = dbSettings?.period_term || settings.period_term;

      if (dbSettings) setSettings(dbSettings);
      setEmployees(dbEmployees);
      setCompetencies(dbCompetencies);
      setSchedules(dbSchedules);
      setActivityLogs(dbLogs);
      if (dbJobProfiles) setJobProfiles(dbJobProfiles);
      if (dbCurriculum) setLmsCurriculumList(dbCurriculum);
      if (dbUsers) setUserAccounts(dbUsers);
      if (dbSharing) setSharingSessions(dbSharing);
      if (dbOneYear) setOneYearPlans(dbOneYear);
      if (dbReminders) setExecutiveReminders(dbReminders);
      setKpiWeights(SkenaHrApi.getKpiWeights());

      if (dbCompetencies.length > 0) {
        setSelectedCompId((prev) => prev || dbCompetencies[0].id);
        setSchedForm((prev) => ({ ...prev, competency_id: prev.competency_id || dbCompetencies[0].id }));
        setLogForm((prev) => ({ ...prev, competency_id: prev.competency_id || dbCompetencies[0].id }));
      }

      if (dbEmployees.length > 0) {
        setSelectedReportEmpId((prev) => prev || dbEmployees[0].id);
        setAnalyticsEmpId((prev) => prev || dbEmployees[0].id);
        setSelectedLoginEmpId((prev) => prev || dbEmployees[0].id);
      }

      const [dbKpis, dbAllReports, dbAllHistAtt] = await Promise.all([
        SkenaHrApi.getKpiEvaluations(activePeriodYear, activePeriodTerm),
        SkenaHrApi.getAllEmployeeReports(activePeriodYear, activePeriodTerm),
        SkenaHrApi.getAttendancesByMonth(''),
      ]);
      setKpiList(dbKpis);
      setAllReportsMap(dbAllReports);
      setAllHistoricalAttendances(dbAllHistAtt);

      await fetchDailyAttendance(selectedDate, dbEmployees);
      await fetchMonthlyAttendance(attendanceMonth);
    } catch (err: any) {
      triggerToast(`Gagal memuat data: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  // Subscribe to Realtime Updates (Supabase postgres_changes + Local Session Sync)
  useEffect(() => {
    const unsubscribe = subscribeRealtimeUpdates(async (evt) => {
      const tableName = typeof evt === 'string' ? evt : evt.table;
      setRealtimeInfo(getRealtimeStatus());
      // Refresh specific slices silently without blocking UI inputs
      try {
        if (tableName === 'company_settings' || tableName === 'all') {
          const s = await SkenaHrApi.getSettings();
          if (s) setSettings(s);
          setKpiWeights(SkenaHrApi.getKpiWeights());
        }
        if (tableName === 'employees' || tableName === 'all') {
          setEmployees(await SkenaHrApi.getEmployees());
        }
        if (tableName === 'competencies' || tableName === 'all') {
          setCompetencies(await SkenaHrApi.getCompetencies());
        }
        if (tableName === 'work_schedules' || tableName === 'all') {
          setSchedules(await SkenaHrApi.getSchedules());
        }
        if (tableName === 'activity_logs' || tableName === 'all') {
          setActivityLogs(await SkenaHrApi.getActivityLogs());
        }
        if (tableName === 'kpi_evaluations' || tableName === 'all') {
          setKpiList(await SkenaHrApi.getKpiEvaluations(settings.period_year, settings.period_term));
        }
        if (tableName === 'user_accounts' || tableName === 'all') {
          setUserAccounts(await SkenaHrApi.fetchUsersFromSupabase());
        }
        if (tableName === 'job_profiles' || tableName === 'all') {
          setJobProfiles(await SkenaHrApi.getJobProfiles());
        }
        if (tableName === 'lms_curriculum' || tableName === 'all') {
          setLmsCurriculumList(await SkenaHrApi.getLmsCurriculum());
        }
        if (tableName === 'sharing_sessions' || tableName === 'all') {
          setSharingSessions(await SkenaHrApi.getSharingSessions());
        }
        if (tableName === 'one_year_plans' || tableName === 'all') {
          setOneYearPlans(await SkenaHrApi.getOneYearPlans());
        }
        if (tableName === 'executive_reminders' || tableName === 'all') {
          setExecutiveReminders(await SkenaHrApi.getExecutiveReminders());
        }
        if (tableName === 'employee_reports' || tableName === 'all') {
          setAllReportsMap(await SkenaHrApi.getAllEmployeeReports(settings.period_year, settings.period_term));
        }
      } catch {
        // Ignore silent background sync errors
      }
    });
    return () => unsubscribe();
  }, [settings.period_year, settings.period_term]);

  // Sync effective employee when currentUser changes
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'employee' && currentUser.employeeId) {
        setSelectedReportEmpId(currentUser.employeeId);
        setAnalyticsEmpId(currentUser.employeeId);
        setActiveModule('performance_analytics');
      } else if (currentUser.role === 'admin') {
        setActiveModule('dashboard');
      }
    }
  }, [currentUser]);

  // Fetch Attendance per Date
  const fetchDailyAttendance = async (dateStr: string, empList: Employee[] = employees) => {
    try {
      const records = await SkenaHrApi.getAttendancesByDate(dateStr);
      const map: Record<string, AttendanceRecord> = {};
      empList.forEach((emp) => {
        const found = records.find((r) => r.employee_id === emp.id);
        map[emp.id] = found || {
          employee_id: emp.id,
          attendance_date: dateStr,
          status: 'WFO',
          work_location_tag: emp.work_location || 'Makassar HQ',
          notes: '',
        };
      });
      setDailyAttendances(map);
    } catch (err: any) {
      triggerToast(`Gagal mengambil presensi harian: ${err.message}`, 'error');
    }
  };

  // Fetch Monthly Attendance Matrix
  const fetchMonthlyAttendance = async (yearMonth: string) => {
    try {
      const [records, allRecords] = await Promise.all([
        SkenaHrApi.getAttendancesByMonth(yearMonth),
        SkenaHrApi.getAttendancesByMonth(''),
      ]);
      setMonthlyAttendances(records);
      setAllHistoricalAttendances(allRecords);
    } catch (err: any) {
      triggerToast(`Gagal memuat rekap presensi bulanan: ${err.message}`, 'error');
    }
  };

  // Sync Attendance Counts into Module 4 Activity Log
  const syncAttendanceToLogDate = async (dateStr: string) => {
    try {
      const records = await SkenaHrApi.getAttendancesByDate(dateStr);
      const activeCount = records.filter(
        (r) =>
          r.status === 'WFO' ||
          r.status === 'WFH' ||
          r.status === 'Take Content' ||
          r.status === 'Urusan Kantor' ||
          r.status === 'Overtime'
      ).length;
      const leaveCount = records.filter(
        (r) =>
          r.status === 'Cuti' ||
          r.status === 'Izin' ||
          r.status === 'Sakit' ||
          r.status === 'Urusan Pribadi' ||
          r.status === 'Tidak Absen'
      ).length;
      setLogForm((prev) => ({
        ...prev,
        log_date: dateStr,
        total_active_team: activeCount,
        total_on_leave: leaveCount,
      }));
    } catch (err: any) {
      triggerToast(`Gagal sinkronisasi presensi log: ${err.message}`, 'error');
    }
  };

  // Sync Inline KPI Spreadsheet
  useEffect(() => {
    if (!selectedCompId || employees.length === 0) return;
    const map: Record<string, KpiEvaluation> = {};
    employees.forEach((emp) => {
      const existing = kpiList.find(
        (k) =>
          k.employee_id === emp.id &&
          k.competency_id === selectedCompId &&
          k.period_year === settings.period_year &&
          k.period_term === settings.period_term
      );
      map[emp.id] = existing || {
        employee_id: emp.id,
        competency_id: selectedCompId,
        period_year: settings.period_year,
        period_term: settings.period_term,
        kpi_q1: 82,
        kpi_q2: 85,
        kpi_q3: 86,
        kpi_q4: 88,
        mid_review_score: 85,
        final_project_score: 86,
        current_skill_level: 3,
        workload_percentage: 85,
        performance_narrative: '',
      };
    });
    setInlineKpiMap(map);
  }, [selectedCompId, employees, kpiList, settings.period_year, settings.period_term]);

  // Load Individual Employee Report Card & Attendance Summary
  useEffect(() => {
    const loadEmployeeReportCard = async () => {
      const targetEmpId = currentUser?.role === 'employee' && currentUser.employeeId ? currentUser.employeeId : selectedReportEmpId;
      if (!targetEmpId) return;
      try {
        const [report, allAtt, allRep] = await Promise.all([
          SkenaHrApi.getEmployeeReport(targetEmpId, settings.period_year, settings.period_term),
          SkenaHrApi.getAllEmployeeAttendances(targetEmpId),
          SkenaHrApi.getAllEmployeeReports(settings.period_year, settings.period_term),
        ]);
        setEmpReportAttendances(allAtt);
        setAllReportsMap(allRep);
        if (report) {
          setEmpReportData(report);
        } else {
          setEmpReportData({
            employee_id: targetEmpId,
            period_year: settings.period_year,
            period_term: settings.period_term,
            idp_lms_modules: [
              {
                module_name: 'Advanced Visual Storytelling & Editing',
                category: 'LMS Course',
                target_date: todayStr,
                status: 'Completed',
                score: '90/100',
                mentor_notes: ' Telah menguasai teknik pacing video pendek.',
              },
              {
                module_name: 'Project Stakeholder Communication',
                category: 'Mentoring',
                target_date: todayStr,
                status: 'In Progress',
                score: '85/100',
                mentor_notes: 'Perlu peningkatan pada presentasi deck klien.',
              },
            ],
            behavioral_culture_notes:
              'Menjaga etos kerja profesional, komunikatif dalam tim, dan disiplin terhadap tenggat waktu klien.',
            hr_director_notes:
              'Pertahankan konsistensi performa dan tingkatkan penguasaan manajemen beban kerja pada proyek berfrekuensi tinggi.',
            talent_pipeline_box: 'Solid Professional (Key Contributor)',
            career_decision: 'Retain Current Role',
            next_role_assignment: '-',
            report_date: todayStr,
          });
        }
      } catch (err: any) {
        triggerToast(`Gagal memuat rapor karyawan: ${err.message}`, 'error');
      }
    };
    loadEmployeeReportCard();
  }, [selectedReportEmpId, currentUser, settings.period_year, settings.period_term]);

  // Metrics calculation
  const dashboardMetrics = useMemo(() => {
    const activeEmployees = employees.filter(
      (e) => e.is_active && (!e.collaborator_category || e.collaborator_category === 'Karyawan Internal')
    ).length;
    const archivedCollaboratorsCount = employees.filter(
      (e) => !e.is_active || (e.collaborator_category && e.collaborator_category !== 'Karyawan Internal')
    ).length;
    const expiringContractsCount = employees.filter((e) => {
      if (!e.is_active) return false;
      const c = getContractCountdownInfo(e);
      return c.isAlertH2Months;
    }).length;
    const resignNoticeCount = employees.filter(
      (e) => e.is_active && e.resign_status === 'One Month Notice (Resign)'
    ).length;
    const oneYearProgressPct =
      oneYearPlans.length > 0
        ? Math.round(
            oneYearPlans.reduce(
              (acc, p) => acc + (p.is_completed ? 100 : Number(p.progress_pct || 0)),
              0
            ) / oneYearPlans.length
          )
        : 0;

    const todayAttList = Object.values(dailyAttendances);
    const presentToday = todayAttList.filter((a) => a.status !== 'Cuti' && a.status !== 'Tidak Absen').length;
    const attendanceRate = activeEmployees > 0 ? Math.round((presentToday / activeEmployees) * 100) : 0;

    const sw = (kpiWeights.sprint_weight_pct ?? 50) / 100;
    const kw = (kpiWeights.skill_weight_pct ?? 30) / 100;
    const pw = (kpiWeights.project_weight_pct ?? 20) / 100;

    const avgKpi =
      kpiList.length > 0
        ? (
            kpiList.reduce((acc, item) => {
              const calc =
                ((Number(item.kpi_q1) + Number(item.kpi_q2) + Number(item.kpi_q3) + Number(item.kpi_q4)) / 4) * sw +
                Number(item.mid_review_score) * kw +
                Number(item.final_project_score) * pw;
              return acc + (item.final_kpi_score ?? calc);
            }, 0) / kpiList.length
          ).toFixed(1)
        : '84.5';

    return {
      activeEmployees,
      archivedCollaboratorsCount,
      expiringContractsCount,
      resignNoticeCount,
      oneYearProgressPct,
      attendanceRate,
      schedulesCount: schedules.length,
      logsCount: activityLogs.length,
      avgKpi,
    };
  }, [employees, dailyAttendances, schedules, activityLogs, kpiList, kpiWeights, oneYearPlans]);

  // Employee Self Attendance Check-in Handler
  const handleSelfCheckin = async () => {
    if (!currentUser) return;
    const empId = currentUser.role === 'employee' ? currentUser.employeeId : selectedLoginEmpId;
    if (!empId) {
      triggerToast('ID Karyawan tidak teridentifikasi', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const nowTimeStr =
        currentUser.role === 'admin' && selfCheckInTime
          ? selfCheckInTime
          : currentTime.toLocaleTimeString('id-ID', { hour12: false });
      const punc = analyzeAttendancePunctuality(nowTimeStr, selfStatus);
      const record: AttendanceRecord = {
        employee_id: empId,
        attendance_date: todayStr,
        check_in_time: nowTimeStr,
        status: selfStatus,
        work_location_tag: selfLocation || 'HQ Makassar',
        notes:
          selfNotes ||
          (selfStatus === 'Izin' ||
          selfStatus === 'Sakit' ||
          selfStatus === 'Cuti' ||
          selfStatus === 'Urusan Pribadi' ||
          selfStatus === 'Tidak Absen'
            ? `Keterangan ${selfStatus} tercatat pukul ${nowTimeStr} WITA`
            : `Presensi ${selfStatus} oleh ${currentUser.name} pukul ${nowTimeStr} WITA (${punc.shortLabel})`),
      };

      await SkenaHrApi.submitEmployeeAttendance(record);
      await fetchDailyAttendance(todayStr);
      await fetchMonthlyAttendance(attendanceMonth);
      triggerToast(
        `Presensi tercatat pukul ${nowTimeStr} WITA: ${selfStatus} • ${punc.badgeLabel}!`
      );
    } catch (err: any) {
      triggerToast(`Gagal mencatat presensi: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers for Module 1: Settings, Employee, Competency, CSV Import (Admin Only)
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role !== 'admin') {
      triggerToast('Akses ditolak: Hanya Admin yang dapat mengubah identitas perusahaan.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const saved = await SkenaHrApi.upsertSettings(settings);
      setSettings(saved);
      triggerToast('Pengaturan Perusahaan & HR berhasil disimpan!');
    } catch (err: any) {
      triggerToast(`Gagal menyimpan pengaturan: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role !== 'admin') {
      triggerToast('Akses ditolak: Hanya Admin yang dapat menambah/mengedit karyawan.', 'error');
      return;
    }
    if (!empForm.employee_nik || !empForm.full_name || !empForm.role_title) {
      triggerToast('NIK, Nama Lengkap, dan Jabatan wajib diisi!', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const payload: Partial<Employee> = {
        ...empForm,
        ...(editingEmpId ? { id: editingEmpId } : {}),
      };
      await SkenaHrApi.upsertEmployee(payload);
      const updated = await SkenaHrApi.getEmployees();
      setEmployees(updated);
      setUserAccounts(SkenaHrApi.getUsers());
      setEditingEmpId(null);
      setEmpForm({
        employee_nik: '',
        tax_bpjs_id: '',
        full_name: '',
        gender: 'L',
        role_title: '',
        department: 'Creative',
        employment_status: 'Full Time',
        contract_duration: '12 Bulan (Jan - Des 2026)',
        contract_start_date: '2026-01-01',
        contract_end_date: '2026-12-31',
        benefits_package: 'BPJS Kesehatan, BPJS Ketenagakerjaan, Device Allowance',
        assigned_project: '',
        work_location: 'Makassar HQ',
        direct_supervisor: 'Managing Director',
        annual_leave_quota: 12,
        is_active: true,
        resign_status: 'Aktif',
        resign_notice_date: '',
        resign_effective_date: '',
        resign_reason: '',
        handover_notes: '',
        address_domicile: 'Kota Makassar, Sulawesi Selatan',
        whatsapp_contact: '0812-',
        email: '',
        rate_budget: 'Gaji Pokok + Tunjangan Kinerja',
        notes: '',
        collaborator_category: 'Karyawan Internal',
      });
      triggerToast(editingEmpId ? 'Data karyawan / mitra berhasil diperbarui!' : 'Karyawan / mitra baru berhasil ditambahkan!');
    } catch (err: any) {
      triggerToast(`Gagal menyimpan karyawan: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCsvEmployeeImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentUser?.role !== 'admin') {
      triggerToast('Akses ditolak: Hanya Admin yang dapat mengimpor data.', 'error');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheet = wb.Sheets[wb.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json<(string | number)[]>(firstSheet, { header: 1 });
      const dataRows = rawRows.filter((r) => Array.isArray(r) && r.length >= 2 && String(r[0] || '').trim() !== 'NIK');
      const payloads: Partial<Employee>[] = dataRows.map((cols) => ({
        employee_nik: String(cols[0] || `SKN-${Math.floor(Math.random() * 9000 + 1000)}`).trim(),
        full_name: String(cols[1] || 'Karyawan Baru').trim(),
        gender: (String(cols[2] || 'L').trim().toUpperCase() === 'P' ? 'P' : 'L') as 'L' | 'P',
        role_title: String(cols[3] || 'Creative Staff').trim(),
        department: String(cols[4] || 'Creative').trim(),
        employment_status: (['Probation', 'Full Time', 'Full Time Performance Based', 'Freelance'].includes(String(cols[5] || '').trim())
          ? String(cols[5]).trim()
          : 'Full Time') as EmploymentStatus,
        contract_duration: String(cols[6] || '12 Bulan').trim(),
        benefits_package: String(cols[7] || 'BPJS Kesehatan & TK').trim(),
        assigned_project: String(cols[8] || '-').trim(),
        work_location: String(cols[9] || 'Makassar HQ').trim(),
        is_active: true,
      }));
      await SkenaHrApi.bulkInsertEmployees(payloads);
      const updated = await SkenaHrApi.getEmployees();
      setEmployees(updated);
      triggerToast(`Berhasil mengimpor ${payloads.length} karyawan dari file Excel!`, 'success');
    } catch (err: any) {
      triggerToast(`Gagal impor file Excel: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCompetency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role !== 'admin') {
      triggerToast('Akses ditolak: Hanya Admin yang dapat mengubah kamus kompetensi.', 'error');
      return;
    }
    if (!compForm.competency_code || !compForm.competency_name) return;
    setIsLoading(true);
    try {
      await SkenaHrApi.upsertCompetency({
        ...compForm,
        ...(editingCompId ? { id: editingCompId } : {}),
      });
      const updated = await SkenaHrApi.getCompetencies();
      setCompetencies(updated);
      const wasEditing = Boolean(editingCompId);
      setEditingCompId(null);
      setCompForm({
        competency_code: '',
        competency_name: '',
        category: 'Core KPI',
        target_threshold: 78,
        standard_workload_hours: 40,
        description: '',
        level_1_desc: 'Dasar / Perlu supervisi penuh',
        level_2_desc: 'Mampu eksekusi tugas rutin',
        level_3_desc: 'Mandiri & memenuhi standar Skena',
        level_4_desc: 'Mahir & mampu memecahkan masalah kompleks',
        level_5_desc: 'Expert / Mentor lintas tim',
      });
      triggerToast(wasEditing ? 'Indikator Kompetensi & KPI berhasil diperbarui!' : 'Kamus Kompetensi & KPI berhasil ditambahkan!');
    } catch (err: any) {
      triggerToast(`Gagal menyimpan kompetensi: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Module 3: Batch Presensi (Admin Only)
  const handleSetAllWfo = () => {
    if (currentUser?.role !== 'admin') {
      triggerToast('Akses ditolak: Hanya Admin yang dapat melakukan Set Semua WFO.', 'error');
      return;
    }
    const updated: Record<string, AttendanceRecord> = {};
    employees.forEach((emp) => {
      updated[emp.id] = {
        employee_id: emp.id,
        attendance_date: selectedDate,
        check_in_time: dailyAttendances[emp.id]?.check_in_time || '08:50:00',
        status: 'WFO',
        work_location_tag: emp.work_location || 'Makassar HQ',
        notes: `Hadir Tepat Waktu ≤ 09:00 WITA (WFO Makassar HQ)`,
      };
    });
    setDailyAttendances(updated);
    triggerToast('Seluruh karyawan diset WFO Tepat Waktu (≤ 09:00 WITA). Klik "Simpan Presensi Serentak" untuk konfirmasi.');
  };

  const handleBatchSaveAttendance = async () => {
    if (currentUser?.role !== 'admin') {
      triggerToast('Akses ditolak: Hanya Admin yang dapat menyimpan presensi massal.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const records = Object.values(dailyAttendances).map((r) => ({
        ...r,
        check_in_time: r.check_in_time || '08:45:00',
      }));
      await SkenaHrApi.batchUpsertAttendances(records);
      await fetchMonthlyAttendance(attendanceMonth);
      triggerToast(`Presensi tanggal ${selectedDate} (${records.length} karyawan beserta jam & kalkulasi keterlambatan) berhasil disimpan!`);
    } catch (err: any) {
      triggerToast(`Gagal menyimpan presensi: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportMonthlyCsv = () => {
    const headers = [
      'No',
      'Periode Bulan',
      'NIK',
      'Nama Karyawan',
      'Jabatan',
      'Departemen',
      'Status Kontrak',
      'WFO',
      'WFH/WFA',
      'Take Content',
      'Urusan Kantor',
      'Overtime',
      'Izin Resmi',
      'Urusan Pribadi',
      'Sakit',
      'Cuti',
      'Tidak Absen',
      'Tepat Waktu (≤ 09:00)',
      'Toleransi 15 Menit (09:01-09:15)',
      'Terlambat (> 09:15)',
      'Total Menit Keterlambatan',
      'Sisa Kuota Cuti Tahunan',
      'Persentase Kehadiran Aktif',
    ];
    const rows = employees.map((emp, idx) => {
      const empRecs = monthlyAttendances.filter((r) => r.employee_id === emp.id);
      const wfo = empRecs.filter((r) => r.status === 'WFO').length;
      const wfh = empRecs.filter((r) => r.status === 'WFH').length;
      const content = empRecs.filter((r) => r.status === 'Take Content').length;
      const urusanKantor = empRecs.filter((r) => r.status === 'Urusan Kantor').length;
      const overtime = empRecs.filter((r) => r.status === 'Overtime').length;
      const izin = empRecs.filter((r) => r.status === 'Izin').length;
      const urusanPribadi = empRecs.filter((r) => r.status === 'Urusan Pribadi').length;
      const sakit = empRecs.filter((r) => r.status === 'Sakit').length;
      const cuti = empRecs.filter((r) => r.status === 'Cuti').length;
      const tidakAbsen = empRecs.filter((r) => r.status === 'Tidak Absen').length;

      let onTime = 0;
      let inTol = 0;
      let lateCount = 0;
      let totalLateMin = 0;
      empRecs.forEach((r) => {
        const p = analyzeAttendancePunctuality(r.check_in_time, r.status);
        if (p.category === 'on_time') onTime++;
        else if (p.category === 'within_tolerance') inTol++;
        else if (p.category === 'late') {
          lateCount++;
          totalLateMin += p.lateMinutesFrom0900;
        }
      });

      const totalActive = wfo + wfh + content + urusanKantor + overtime;
      const totalLogged = totalActive + izin + urusanPribadi + sakit + cuti + tidakAbsen;
      const pct = totalLogged > 0 ? Math.round((totalActive / totalLogged) * 100) : 100;
      const leaveStats = getEmployeeLeaveStats(emp.id, emp.annual_leave_quota || 12);
      return [
        idx + 1,
        formatMonthLabel(attendanceMonth),
        emp.employee_nik,
        emp.full_name,
        emp.role_title,
        emp.department,
        emp.employment_status,
        wfo,
        wfh,
        content,
        urusanKantor,
        overtime,
        izin,
        urusanPribadi,
        sakit,
        cuti,
        tidakAbsen,
        onTime,
        inTol,
        lateCount,
        `${totalLateMin} Menit`,
        `${leaveStats.remaining} / ${leaveStats.quota} Hari`,
        `${pct}%`,
      ];
    });

    const detailHeaders = [
      'No',
      'Tanggal Presensi',
      'Jam Masuk Standar',
      'Jam Presensi Aktual (WITA)',
      'NIK',
      'Nama Karyawan',
      'Departemen',
      'Mode Kehadiran / Perizinan',
      'Status Ketepatan Waktu (Toleransi 15m)',
      'Menit Keterlambatan',
      'Lokasi Kerja / Liputan',
      'Keterangan Izin / WFH / Output',
    ];
    const detailRows = monthlyAttendances.map((rec, idx) => {
      const emp = employees.find((e) => e.id === rec.employee_id);
      const p = analyzeAttendancePunctuality(rec.check_in_time, rec.status);
      return [
        idx + 1,
        rec.attendance_date,
        '09:00:00 (Batas Toleransi 09:15:00)',
        rec.check_in_time || '08:45:00',
        emp?.employee_nik || '-',
        emp?.full_name || 'Karyawan',
        emp?.department || '-',
        rec.status,
        p.badgeLabel,
        p.lateMinutesFrom0900 > 0 ? `${p.lateMinutesFrom0900} Menit` : '0 Menit',
        rec.work_location_tag || 'Makassar HQ',
        rec.notes || '-',
      ];
    });

    downloadExcelWorkbook(`Rekap_Presensi_Bulanan_Skena_${attendanceMonth}`, [
      {
        sheetName: '1_Matriks_Rekap_Bulanan',
        headers,
        rows,
        titleRows: [
          [settings.company_name.toUpperCase()],
          [`MATRIKS REKAPITULASI PRESENSI, PERIZINAN & KETERLAMBATAN (JAM MASUK 09:00 + TOLERANSI 15M) — PERIODE ${formatMonthLabel(attendanceMonth).toUpperCase()}`],
        ],
      },
      {
        sheetName: '2_Detail_Log_Jam_Presensi',
        headers: detailHeaders,
        rows: detailRows,
        titleRows: [
          [settings.company_name.toUpperCase()],
          [`RINCIAN LOG TANGGAL, JAM SPESIFIK & KETERANGAN PERIZINAN/WFH — PERIODE ${formatMonthLabel(attendanceMonth).toUpperCase()}`],
        ],
      },
    ]);
    triggerToast(`File Excel (.xlsx) Rekap Presensi Bulan ${formatMonthLabel(attendanceMonth)} berhasil diunduh!`);
  };

  // Module 5: Inline KPI Calculation (Menggunakan Proporsi Bobot KPI yang Dapat Disesuaikan Admin)
  const calculateRowScore = (row: KpiEvaluation): number => {
    const qAvg = (Number(row.kpi_q1) + Number(row.kpi_q2) + Number(row.kpi_q3) + Number(row.kpi_q4)) / 4.0;
    const sw = (kpiWeights.sprint_weight_pct ?? 50) / 100;
    const kw = (kpiWeights.skill_weight_pct ?? 30) / 100;
    const pw = (kpiWeights.project_weight_pct ?? 20) / 100;
    return Number((qAvg * sw + Number(row.mid_review_score) * kw + Number(row.final_project_score) * pw).toFixed(2));
  };

  const generateAutoNarrative = (_emp: Employee, row: KpiEvaluation) => {
    const score = calculateRowScore(row);
    const comp = competencies.find((c) => c.id === selectedCompId);
    const threshold = comp?.target_threshold || 75;
    const skillLabels: Record<number, string> = {
      1: 'Novice (Dasar)',
      2: 'Advanced Beginner',
      3: 'Competent (Mandiri)',
      4: 'Proficient (Mahir)',
      5: 'Expert (Master/Mentor)',
    };
    const workloadStatus =
      row.workload_percentage > 100
        ? 'Overload (>100%, perlu redistribusi tugas)'
        : row.workload_percentage >= 80
        ? 'Optimal & Produktif (80-100%)'
        : 'Under-utilized (<80%, kapasitas siap ditingkatkan)';

    const narrative =
      score >= threshold
        ? `Melampaui standar target pada kompetensi "${comp?.competency_name}" (Skor: ${score} ≥ Target ${threshold}). Penguasaan berada pada level ${
            skillLabels[row.current_skill_level] || 'Competent'
          } dengan utilisasi beban kerja ${row.workload_percentage}% (${workloadStatus}).`
        : `Perlu pendampingan khusus (IDP) pada kompetensi "${comp?.competency_name}" (Skor: ${score} < Target ${threshold}). Level kecakapan saat ini ${
            skillLabels[row.current_skill_level] || 'Dasar'
          } dengan beban kerja ${row.workload_percentage}% (${workloadStatus}).`;

    setInlineKpiMap((prev) => ({
      ...prev,
      [_emp.id]: { ...prev[_emp.id], performance_narrative: narrative },
    }));
  };

  const handleSaveSingleKpiRow = async (empId: string) => {
    if (currentUser?.role !== 'admin') {
      triggerToast('Akses ditolak: Hanya Admin yang dapat menilai dan menyimpan KPI.', 'error');
      return;
    }
    const row = inlineKpiMap[empId];
    if (!row) return;
    setIsLoading(true);
    try {
      await SkenaHrApi.upsertKpiEvaluation(row);
      const refreshed = await SkenaHrApi.getKpiEvaluations(settings.period_year, settings.period_term);
      setKpiList(refreshed);
      triggerToast('Evaluasi KPI, Skill & Workload tersimpan!');
    } catch (err: any) {
      triggerToast(`Gagal menyimpan KPI: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchSaveAllKpiRows = async () => {
    if (currentUser?.role !== 'admin') {
      triggerToast('Akses ditolak: Hanya Admin yang dapat menyimpan KPI massal.', 'error');
      return;
    }
    const allRows = Object.values(inlineKpiMap);
    if (allRows.length === 0) return;
    setIsLoading(true);
    try {
      for (const row of allRows) {
        await SkenaHrApi.upsertKpiEvaluation(row);
      }
      const refreshed = await SkenaHrApi.getKpiEvaluations(settings.period_year, settings.period_term);
      setKpiList(refreshed);
      triggerToast(`Seluruh evaluasi KPI & WLA (${allRows.length} karyawan) berhasil disimpan serentak!`);
    } catch (err: any) {
      triggerToast(`Gagal menyimpan batch KPI: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSingleKpiRow = (emp: Employee) => {
    if (currentUser?.role !== 'admin' || !selectedCompId) return;
    setDeleteConfirm({
      isOpen: true,
      title: 'Reset / Hapus Evaluasi KPI Karyawan',
      message: `Reset dan hapus data evaluasi KPI "${emp.full_name}" untuk indikator terpilih?`,
      onConfirm: async () => {
        setIsLoading(true);
        try {
          await SkenaHrApi.deleteKpiEvaluation(emp.id, selectedCompId, settings.period_year, settings.period_term);
          const refreshed = await SkenaHrApi.getKpiEvaluations(settings.period_year, settings.period_term);
          setKpiList(refreshed);
          triggerToast(`Data evaluasi KPI ${emp.full_name} berhasil direset.`);
        } catch (err: any) {
          triggerToast(`Gagal mereset KPI: ${err.message}`, 'error');
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  const copySqlToClipboard = async () => {
    try {
      const activeScript = sqlModalMode === 'reset' ? SQL_CLEAN_RESET_SCRIPT : SQL_SCHEMA_SCRIPT;
      await navigator.clipboard.writeText(activeScript);
      setSqlCopied(true);
      triggerToast(
        sqlModalMode === 'reset'
          ? 'Skrip SQL Reset Bersih (11 Tabel) berhasil disalin ke clipboard!'
          : 'Skrip SQL Utama v3.0 (Auto-Fix & Migrasi Aman) berhasil disalin ke clipboard!'
      );
      setTimeout(() => setSqlCopied(false), 3000);
    } catch (e) {
      triggerToast('Gagal menyalin SQL ke clipboard', 'error');
    }
  };

  // Data for the active employee in analytics view
  const activeAnalyticsEmp = useMemo(() => {
    const id = currentUser?.role === 'employee' && currentUser.employeeId ? currentUser.employeeId : analyticsEmpId;
    return employees.find((e) => e.id === id) || employees[0];
  }, [currentUser, analyticsEmpId, employees]);

  // Performance data for active analytics employee
  const employeeAnalyticsData = useMemo(() => {
    if (!activeAnalyticsEmp) return null;
    const empKpis = kpiList.filter((k) => k.employee_id === activeAnalyticsEmp.id);
    const empAttendances = monthlyAttendances.filter((a) => a.employee_id === activeAnalyticsEmp.id);

    const wfo = empAttendances.filter((a) => a.status === 'WFO').length;
    const wfh = empAttendances.filter((a) => a.status === 'WFH').length;
    const content = empAttendances.filter((a) => a.status === 'Take Content').length;
    const izin = empAttendances.filter((a) => a.status === 'Izin').length;
    const sakit = empAttendances.filter((a) => a.status === 'Sakit').length;
    const cuti = empAttendances.filter((a) => a.status === 'Cuti').length;

    let onTimeCount = 0;
    let toleranceCount = 0;
    let lateCount = 0;
    let totalLateMinutes = 0;
    empAttendances.forEach((a) => {
      const p = analyzeAttendancePunctuality(a.check_in_time, a.status);
      if (p.category === 'on_time') onTimeCount++;
      else if (p.category === 'within_tolerance') toleranceCount++;
      else if (p.category === 'late') {
        lateCount++;
        totalLateMinutes += p.lateMinutesFrom0900;
      }
    });

    const totalActive = wfo + wfh + content;
    const totalDays = totalActive + izin + sakit + cuti;
    const attendancePct = totalDays > 0 ? Math.round((totalActive / totalDays) * 100) : 100;

    // Average Score & Workload
    let totalScore = 0;
    let totalWla = 0;
    const compBreakdown = competencies.map((comp) => {
      const match = empKpis.find((k) => k.competency_id === comp.id);
      const score = match ? match.final_kpi_score ?? calculateRowScore(match) : 80;
      const wla = match ? match.workload_percentage : 85;
      totalScore += score;
      totalWla += wla;
      return {
        compCode: comp.competency_code,
        compName: comp.competency_name,
        category: comp.category,
        score,
        target: comp.target_threshold,
        wla,
        skillLevel: match?.current_skill_level || 3,
        sprints: [match?.kpi_q1 ?? 80, match?.kpi_q2 ?? 82, match?.kpi_q3 ?? 85, match?.kpi_q4 ?? 86],
        mid: match?.mid_review_score ?? 84,
        project: match?.final_project_score ?? 85,
      };
    });

    const avgScore = competencies.length > 0 ? Number((totalScore / competencies.length).toFixed(1)) : 80;
    const avgWla = competencies.length > 0 ? Number((totalWla / competencies.length).toFixed(1)) : 85;

    return {
      emp: activeAnalyticsEmp,
      avgScore,
      avgWla,
      compBreakdown,
      attendance: {
        wfo,
        wfh,
        content,
        izin,
        sakit,
        cuti,
        onTimeCount,
        toleranceCount,
        lateCount,
        totalLateMinutes,
        totalDays,
        attendancePct,
      },
    };
  }, [activeAnalyticsEmp, kpiList, monthlyAttendances, competencies]);

  // Today's attendance record for current logged-in user
  const userTodayAttendance = useMemo(() => {
    if (!currentUser) return null;
    const empId = currentUser.role === 'employee' ? currentUser.employeeId : selectedLoginEmpId;
    if (!empId) return null;
    return dailyAttendances[empId] || null;
  }, [currentUser, dailyAttendances, selectedLoginEmpId]);

  // =========================================================================
  // RENDER 1: HALAMAN LOGIN USER KETIKA PERTAMA KALI DIGUNAKAN
  // =========================================================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
        {toast && (
          <div
            className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-white font-medium ${
              toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        )}

        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
          {/* Logo & Header */}
          <div className="bg-white p-8 text-center border-b border-slate-100">
            <div className="inline-block p-2 rounded-2xl bg-slate-50 border border-slate-100 shadow-xs mb-3">
              <img
                src={SKENA_LOGO_SRC}
                alt="Skena Logo"
                className="h-12 mx-auto object-contain"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<span class="text-2xl font-black text-[#1E2B6D] tracking-wider">SKENA</span>';
                  }
                }}
              />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Skena HR & Talent Cloud</h1>
            <p className="text-xs text-slate-500 mt-1">PT Skena Wahana Kreatif — Creative & Digital Media Agency</p>
          </div>

          {/* Role Switcher Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
            <button
              onClick={() => setLoginTab('admin')}
              className={`flex-1 py-3.5 flex items-center justify-center gap-2 border-b-2 transition ${
                loginTab === 'admin'
                  ? 'border-[#1E40AF] text-[#1E40AF] bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Shield className="w-4 h-4" /> Masuk Admin / HR Lead
            </button>
            <button
              onClick={() => setLoginTab('employee')}
              className={`flex-1 py-3.5 flex items-center justify-center gap-2 border-b-2 transition ${
                loginTab === 'employee'
                  ? 'border-[#10B981] text-[#10B981] bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-4 h-4" /> Masuk Akun Karyawan
            </button>
          </div>

          <div className="p-6 md:p-8 space-y-5">
            {loginTab === 'admin' ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsLoading(true);
                  try {
                    const result = await SkenaHrApi.authenticateUserFromSupabase(
                      loginEmail,
                      loginPassword,
                      'admin'
                    );
                    if (!result.success || !result.user) {
                      triggerToast(
                        result.errorMessage ||
                          `Username atau Password Administrator tidak sesuai dengan Database Sistem!`,
                        'error'
                      );
                      return;
                    }
                    setUserAccounts(SkenaHrApi.getUsers());
                    setCurrentUser(result.user);
                    triggerToast(`Selamat datang, ${result.user.name} (Otorisasi Administrator Aktif)`);
                  } catch (err: any) {
                    triggerToast(`Gagal memverifikasi kredensial: ${err.message}`, 'error');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Username Administrator
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan username administrator"
                    value={loginEmail ?? ''}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 uppercase">
                      Password Administrator
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((prev) => !prev)}
                      className="text-[11px] font-bold text-[#1E40AF] hover:underline"
                    >
                      {showLoginPassword ? 'Sembunyikan' : 'Tampilkan'}
                    </button>
                  </div>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan password administrator"
                    value={loginPassword ?? ''}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-[#1E40AF] hover:bg-blue-800 disabled:opacity-60 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Memverifikasi Kredensial...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" /> Masuk sebagai Administrator
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsLoading(true);
                  try {
                    const result = await SkenaHrApi.authenticateUserFromSupabase(
                      empLoginUsername,
                      loginPin,
                      'employee'
                    );
                    if (!result.success || !result.user) {
                      triggerToast(
                        result.errorMessage ||
                          `Username atau Password Karyawan tidak sesuai dengan Database Sistem!`,
                        'error'
                      );
                      return;
                    }
                    setUserAccounts(SkenaHrApi.getUsers());
                    setSelectedLoginEmpId(result.user.employeeId || 'e-1');
                    setCurrentUser(result.user);
                    triggerToast(`Selamat datang, ${result.user.name} (${result.user.roleTitle})`);
                  } catch (err: any) {
                    triggerToast(`Gagal memverifikasi kredensial: ${err.message}`, 'error');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Username Login Karyawan
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan username karyawan"
                    value={empLoginUsername ?? ''}
                    onChange={(e) => setEmpLoginUsername(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 uppercase">
                      Password Karyawan
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((prev) => !prev)}
                      className="text-[11px] font-bold text-emerald-700 hover:underline"
                    >
                      {showLoginPassword ? 'Sembunyikan' : 'Tampilkan'}
                    </button>
                  </div>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan password karyawan"
                    value={loginPin ?? ''}
                    onChange={(e) => setLoginPin(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-[#10B981] hover:bg-emerald-600 disabled:opacity-60 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Memverifikasi Kredensial...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" /> Masuk ke Portal Karyawan
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER 2: APLIKASI UTAMA SETELAH LOGIN (ADMIN & KARYAWAN)
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row font-sans">
      {/* CSS KHUSUS CETAK A4 PRESISI */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .print-area {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          table {
            page-break-inside: auto;
            border-collapse: collapse !important;
            width: 100% !important;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
        }
      `}</style>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-white font-medium transition-all no-print ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* MODAL LIHAT & SALIN SKRIP SQL SKEMA DATABASE (HANYA ADMINISTRATOR) */}
      {showSqlModal && currentUser.role === 'admin' && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5 text-[#1E40AF]">
                <Code2 className="w-6 h-6" />
                <div>
                  <h2 className="text-lg font-bold">Skrip SQL PostgreSQL Enterprise v3.0 (11 Tabel + Realtime + Auto-Fix)</h2>
                  <p className="text-[11px] text-slate-500">
                    Skema struktur tabel database cloud terpusat — mendukung pembuatan tabel baru maupun migrasi otomatis tabel lama.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowSqlModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold px-2 py-1">
                ✕
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSqlModalMode('migrate')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    sqlModalMode === 'migrate'
                      ? 'bg-[#1E40AF] text-white shadow'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  🛡️ Skrip SQL Utama (Auto-Fix & Migrasi Aman - Direkomendasikan)
                </button>
                <button
                  type="button"
                  onClick={() => setSqlModalMode('reset')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    sqlModalMode === 'reset'
                      ? 'bg-rose-600 text-white shadow'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  ♻️ Skrip SQL Reset Bersih (Drop & Recreate 11 Tabel)
                </button>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                ✓ Idempotent (Aman Dijalankan Berulang Kali)
              </span>
            </div>

            <div className="relative flex-1 overflow-auto bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs border border-slate-800">
              <pre>{sqlModalMode === 'reset' ? SQL_CLEAN_RESET_SCRIPT : SQL_SCHEMA_SCRIPT}</pre>
            </div>
            <div className="flex flex-wrap justify-between items-center gap-2 pt-4">
              <span className="text-xs text-slate-500">
                Row Level Security (RLS), Sinkronisasi Realtime WebSocket, & Seed Data otomatis aktif.
              </span>
              <div className="flex gap-2">
                <button
                  onClick={copySqlToClipboard}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow"
                >
                  {sqlCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {sqlCopied ? 'Tersalin ke Clipboard!' : 'Salin Seluruh Skrip SQL'}
                </button>
                <button
                  onClick={() => setShowSqlModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL STATUS SINKRONISASI SERVER CLOUD ENTERPRISE (HANYA ADMINISTRATOR) */}
      {showConnModal && currentUser.role === 'admin' && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-[#1E40AF] mb-3">
              <Database className="w-7 h-7" />
              <h2 className="text-xl font-bold">Status Integrasi Server Cloud HRIS</h2>
            </div>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Sistem HRIS & Talent Management PT Skena Wahana Kreatif telah terintegrasi secara otomatis dan realtime dengan Server Database Cloud Terpusat.
            </p>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900">Status Koneksi Cloud:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[10px]">
                    ONLINE & TERINTEGRASI PENUH
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Protokol Sinkronisasi:</span>
                  <strong className="text-slate-900">WebSocket Realtime + REST Cloud API</strong>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Keamanan Kredensial:</span>
                  <strong className="text-slate-900">Enkripsi Server Terpusat (Aktif)</strong>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowConnModal(false);
                    setShowSqlModal(true);
                  }}
                  className="text-xs text-blue-700 hover:underline flex items-center gap-1 font-bold"
                >
                  <Code2 className="w-3.5 h-3.5" /> Skema SQL Enterprise
                </button>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setShowConnModal(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Tutup
                  </button>
                  <button
                    onClick={async () => {
                      setShowConnModal(false);
                      await handleSyncAllToSupabase();
                    }}
                    className="px-4 py-2.5 rounded-lg text-xs font-bold bg-[#10B981] text-white hover:bg-emerald-600 shadow-md"
                  >
                    Sinkronkan Semua Data ke Cloud
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR NAVIGASI RESPONSIF DENGAN LOGO SKENA RESMI & ROLE RBAC */}
      <aside className="w-full md:w-72 bg-[#1E2B6D] text-white flex flex-col justify-between shrink-0 no-print shadow-xl">
        <div>
          {/* Logo Skena Resmi di Header Sidebar */}
          <div className="p-5 border-b border-blue-900/60 bg-[#162055]">
            <div className="bg-white rounded-2xl p-3 shadow-md flex items-center justify-center">
              <img
                src={SKENA_LOGO_SRC}
                alt="Skena Wahana Kreatif"
                className="h-10 w-auto object-contain"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<span class="text-xl font-black text-[#1E2B6D]">SKENA HRIS</span>';
                  }
                }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs px-1">
              <span className="text-blue-200">Peran Akun:</span>
              <span
                className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                  currentUser.role === 'admin' ? 'bg-amber-400 text-slate-900' : 'bg-emerald-400 text-slate-900'
                }`}
              >
                {currentUser.role === 'admin' ? 'Administrator HR' : 'Portal Karyawan'}
              </span>
            </div>
          </div>

          {/* Navigasi Sesuai Role (RBAC) */}
          <nav className="p-4 space-y-1.5">
            {currentUser.role === 'admin' && (
              <>
                <div className="px-3 pt-1 pb-1 text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                  Pusat Komando & Agenda
                </div>
                <button
                  onClick={() => setActiveModule('dashboard')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeModule === 'dashboard'
                      ? 'bg-[#10B981] text-white shadow font-semibold'
                      : 'text-blue-100 hover:bg-blue-800/60'
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span className="text-left">Dashboard Utama, SDM & Arsip</span>
                </button>
                <button
                  onClick={() => setActiveModule('one_year_plan')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeModule === 'one_year_plan'
                      ? 'bg-[#10B981] text-white shadow font-semibold'
                      : 'text-blue-100 hover:bg-blue-800/60'
                  }`}
                >
                  <Target className="w-4 h-4 shrink-0" />
                  <span className="text-left">One Year Plan (Roadmap)</span>
                </button>
              </>
            )}

            {/* Bagian Mandiri & Kultur Skena */}
            <div className="px-3 pt-2 pb-1 text-[11px] font-bold text-blue-300 uppercase tracking-wider">
              {currentUser.role === 'admin' ? 'Kultur, Performa & Presensi' : 'Akses Mandiri & Kultur Skena'}
            </div>

            <button
              onClick={() => setActiveModule('sharing_sessions')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeModule === 'sharing_sessions'
                  ? 'bg-[#10B981] text-white shadow font-semibold'
                  : 'text-blue-100 hover:bg-blue-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span className="text-left">Senin Di Skena & Bincang Kenyang</span>
            </button>

            <button
              onClick={() => setActiveModule('performance_analytics')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeModule === 'performance_analytics'
                  ? 'bg-[#10B981] text-white shadow font-semibold'
                  : 'text-blue-100 hover:bg-blue-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span className="text-left">
                {currentUser.role === 'admin' ? 'Grafik Performa Karyawan' : 'Rangkuman Grafik Kinerja Saya'}
              </span>
            </button>

            <button
              onClick={() => setActiveModule('employee_self_attendance')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeModule === 'employee_self_attendance'
                  ? 'bg-[#10B981] text-white shadow font-semibold'
                  : 'text-blue-100 hover:bg-blue-800/60'
              }`}
            >
              <CheckSquare className="w-4 h-4 shrink-0" />
              <span className="text-left">
                {currentUser.role === 'admin' ? 'Kelola & Input Absen Karyawan' : 'Isi Presensi & Izin Mandiri'}
              </span>
            </button>

            <button
              onClick={() => setActiveModule('report_card')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeModule === 'report_card'
                  ? 'bg-[#10B981] text-white shadow font-semibold'
                  : 'text-blue-100 hover:bg-blue-800/60'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span className="text-left">
                {currentUser.role === 'admin' ? 'Rapor Resmi, IDP & LMS (Grafik)' : 'Rapor Kinerja, IDP & LMS Saya'}
              </span>
            </button>

            <button
              onClick={() => setActiveModule('schedules')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeModule === 'schedules'
                  ? 'bg-[#10B981] text-white shadow font-semibold'
                  : 'text-blue-100 hover:bg-blue-800/60'
              }`}
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <span className="text-left">Jadwal Shift & Produksi</span>
            </button>

            {/* Bagian Evaluasi Terintegrasi & Master Kontrol HR */}
            <div className="pt-3 px-3 pb-1 text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center justify-between">
              <span>{currentUser.role === 'admin' ? 'Master Data & Kontrol HR' : 'Buku KPI & Rekap Presensi'}</span>
            </div>

            <button
              onClick={() => setActiveModule('kpi_workload')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeModule === 'kpi_workload'
                  ? 'bg-[#10B981] text-white shadow font-semibold'
                  : 'text-blue-100 hover:bg-blue-800/60'
              }`}
            >
              <Activity className="w-4 h-4 shrink-0" />
              <span className="text-left">
                {currentUser.role === 'admin' ? 'Buku Evaluasi KPI, Bobot & WLA' : 'Buku Evaluasi KPI & WLA (Input)'}
              </span>
            </button>

            <button
              onClick={() => setActiveModule('attendance')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeModule === 'attendance'
                  ? 'bg-[#10B981] text-white shadow font-semibold'
                  : 'text-blue-100 hover:bg-blue-800/60'
              }`}
            >
              <CheckSquare className="w-4 h-4 shrink-0" />
              <span className="text-left">
                {currentUser.role === 'admin' ? 'Presensi, Perizinan & Grafik' : 'Rekap & Grafik Presensi'}
              </span>
            </button>

            {currentUser.role === 'admin' ? (
              <>
                <button
                  onClick={() => setActiveModule('job_profiles_lms')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeModule === 'job_profiles_lms'
                      ? 'bg-[#10B981] text-white shadow font-semibold'
                      : 'text-blue-100 hover:bg-blue-800/60'
                  }`}
                >
                  <BookMarked className="w-4 h-4 shrink-0" />
                  <span className="text-left">Job Profile, Checklist & Flow</span>
                </button>

                <button
                  onClick={() => setActiveModule('logs')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeModule === 'logs'
                      ? 'bg-[#10B981] text-white shadow font-semibold'
                      : 'text-blue-100 hover:bg-blue-800/60'
                  }`}
                >
                  <BookOpen className="w-4 h-4 shrink-0" />
                  <span className="text-left">Jurnal Sprint Harian & LMS</span>
                </button>

                <button
                  onClick={() => setActiveModule('org_chart')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeModule === 'org_chart'
                      ? 'bg-[#10B981] text-white shadow font-semibold'
                      : 'text-blue-100 hover:bg-blue-800/60'
                  }`}
                >
                  <Network className="w-4 h-4 shrink-0" />
                  <span className="text-left">Struktur Organisasi</span>
                </button>

                <button
                  onClick={() => setActiveModule('user_accounts_db')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeModule === 'user_accounts_db'
                      ? 'bg-amber-400 text-slate-900 shadow font-bold'
                      : 'text-amber-200 hover:bg-blue-800/60 font-semibold'
                  }`}
                >
                  <KeyRound className="w-4 h-4 shrink-0" />
                  <span className="text-left">Manajemen Akun & Sistem</span>
                </button>
              </>
            ) : (
              <div className="bg-blue-950/40 p-3 rounded-xl border border-blue-900/50 text-[11px] text-blue-200">
                <div className="flex items-center gap-1.5 font-semibold text-amber-300 mb-1">
                  <Shield className="w-3.5 h-3.5" /> Hak Akses Karyawan
                </div>
                Karyawan dapat melakukan input presensi, keterangan izin/WFH & laporan progres KPI serta melihat jadwal Senin Di Skena / Bincang Kenyang dan grafik presensi.
              </div>
            )}
          </nav>
        </div>

        {/* Footer Sidebar: User Profile & Switch Account */}
        <div className="p-4 border-t border-blue-900/60 space-y-2.5 bg-[#162055]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center font-black text-white text-sm shadow">
              {currentUser.name
                .split(' ')
                .slice(0, 2)
                .map((n) => n[0])
                .join('')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-xs text-white truncate">{currentUser.name}</div>
              <div className="text-[10px] text-emerald-300 font-mono truncate">
                @{currentUser.username || 'user'} • {currentUser.roleTitle || currentUser.role}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenAccountModal}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-blue-800/90 hover:bg-blue-700 text-[11px] font-semibold text-white transition shadow-xs"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-300" /> Ubah Username & Password
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setUserAccounts(SkenaHrApi.getUsers());
                setLoginEmail('');
                setLoginPassword('');
                setEmpLoginUsername('');
                setLoginPin('');
                setCurrentUser(null);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-[11px] font-semibold text-white transition shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" /> Keluar / Ganti Akun
            </button>
            {currentUser.role === 'admin' && (
              <button
                onClick={() => setShowConnModal(true)}
                title="Status Server Cloud HRIS (Khusus Admin)"
                className="p-2 rounded-lg bg-blue-800/80 hover:bg-blue-700 text-white transition"
              >
                <Database className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* KONTEN UTAMA */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {/* TOP HEADER BAR */}
        <header className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-200 no-print">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-[#1E40AF]">
                {currentUser.role === 'admin' ? 'Mode Administrator' : 'Portal Karyawan'}
              </span>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                @{currentUser.username || 'user'}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-500">
                {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {currentUser.role === 'admin' ? 'Dashboard Manajemen SDM & KPI' : `Halo, ${currentUser.name}`}
            </h2>
            <p className="text-xs text-slate-500">
              {currentUser.roleTitle} • Departemen: {currentUser.department || 'Creative'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border ${
                isSupabaseConfigured()
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-blue-50 text-[#1E40AF] border-blue-200'
              }`}
              title={
                realtimeInfo.lastSyncTime
                  ? `Sinkronisasi terakhir: ${realtimeInfo.lastSyncTime} (${realtimeInfo.lastChangedTable || 'Ready'})`
                  : 'Mode Sinkronisasi Realtime Aktif'
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isSupabaseConfigured() ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'
                }`}
              />
              {isSupabaseConfigured()
                ? `Realtime Cloud Aktif${realtimeInfo.lastSyncTime ? ` • ${realtimeInfo.lastSyncTime}` : ''}`
                : 'Realtime Sistem Aktif'}
            </span>
            {isLoading && (
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#1E40AF] bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Memperbarui data...
              </span>
            )}
            <button
              onClick={handleOpenAccountModal}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 text-[#1E40AF] text-xs font-bold hover:bg-blue-100 border border-blue-200 shadow-xs"
            >
              <KeyRound className="w-4 h-4 text-[#1E40AF]" /> Ubah Username & Password (@{currentUser.username || 'user'})
            </button>
            {currentUser.role === 'admin' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setActiveModule('attendance');
                    setAttendanceSubTab('charts');
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-xs transition"
                >
                  <BarChart3 className="w-4 h-4" /> Grafik Presensi & Keterlambatan
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModule('user_accounts_db')}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold hover:bg-amber-200 shadow-xs transition"
                >
                  <KeyRound className="w-4 h-4 text-amber-800" /> Database Akun User
                </button>
                <button
                  type="button"
                  onClick={handleExportMasterAllInOneExcel}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs transition"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Unduh Semua Data Master (.xlsx)
                </button>
              </>
            )}
            <button
              onClick={fetchMasterData}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Sinkronkan Data
            </button>
          </div>
        </header>

        {/* ===================================================================
            MODUL 0: RANGKUMAN GRAFIK PERFORMA DENGAN GRAFIK INTERAKTIF
           =================================================================== */}
        {activeModule === 'performance_analytics' && employeeAnalyticsData && (
          <div className="space-y-6">
            {/* Header Pemilihan Karyawan (Admin dapat memilih siapa saja, Karyawan terkunci ke dirinya) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  {currentUser.role === 'admin'
                    ? 'Rangkuman Grafik Kinerja & Analisis Talenta Karyawan'
                    : 'Rangkuman Grafik Kinerja & Pencapaian KPI Saya'}
                </h3>
                <p className="text-xs text-slate-500">
                  Visualisasi radar kompetensi, progress bar per kuartal, tingkat pemenuhan target, dan analisis kapasitas beban kerja.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {currentUser.role === 'admin' ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="text-xs font-bold uppercase text-slate-500">Pilih Karyawan:</label>
                    <select
                      value={analyticsEmpId ?? ''}
                      onChange={(e) => setAnalyticsEmpId(e.target.value)}
                      className="px-3.5 py-2 border border-blue-300 rounded-xl text-xs font-bold text-[#1E40AF] bg-blue-50"
                    >
                      {employees.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.full_name} ({e.role_title} - {e.employment_status})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const emp = activeAnalyticsEmp;
                        if (!emp) return;
                        setEditingEmpId(emp.id);
                        setEmpForm({
                          employee_nik: emp.employee_nik,
                          tax_bpjs_id: emp.tax_bpjs_id || '',
                          full_name: emp.full_name,
                          gender: emp.gender || 'L',
                          role_title: emp.role_title,
                          department: emp.department || 'Creative',
                          employment_status: emp.employment_status || 'Full Time',
                          contract_duration: emp.contract_duration || '',
                          benefits_package: emp.benefits_package || '',
                          assigned_project: emp.assigned_project || '',
                          work_location: emp.work_location || 'Makassar HQ',
                          direct_supervisor: emp.direct_supervisor || 'Managing Director',
                          annual_leave_quota: emp.annual_leave_quota || 12,
                          is_active: emp.is_active ?? true,
                        });
                        setActiveModule('dashboard');
                        setTimeout(() => {
                          const el = document.getElementById('employee-crud-form');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }, 150);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-[#1E40AF] border border-blue-200 text-xs font-bold hover:bg-blue-100 transition"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit Profil Karyawan
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModule('kpi_workload')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold hover:bg-amber-100 transition"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" /> Edit Nilai KPI
                    </button>
                  </div>
                ) : (
                  <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
                    Akun Pribadi: {currentUser.name} ({currentUser.employeeNik})
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleExportAnalyticsExcel}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#10B981] text-white text-xs font-bold hover:bg-emerald-600 shadow transition"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Unduh Analitik & IDP (.xlsx)
                </button>
              </div>
            </div>

            {/* 4 Kartu Metrik Utama Karyawan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold uppercase text-slate-400">Rata-rata Skor KPI</span>
                <div className="text-3xl font-black text-[#1E40AF] mt-1">{employeeAnalyticsData.avgScore}</div>
                <span className="text-xs text-slate-500 mt-1 block">Passing Target: 75.00</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold uppercase text-slate-400">Analisis Beban Kerja (WLA)</span>
                <div
                  className={`text-3xl font-black mt-1 ${
                    employeeAnalyticsData.avgWla > 100
                      ? 'text-rose-600'
                      : employeeAnalyticsData.avgWla >= 80
                      ? 'text-emerald-600'
                      : 'text-amber-600'
                  }`}
                >
                  {employeeAnalyticsData.avgWla}%
                </div>
                <span className="text-xs text-slate-500 mt-1 block">
                  {employeeAnalyticsData.avgWla > 100
                    ? 'Overload (Tugas Berlebih)'
                    : employeeAnalyticsData.avgWla >= 80
                    ? 'Optimal (Zona Produktif)'
                    : 'Under-utilized (Tersedia Kapasitas)'}
                </span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold uppercase text-slate-400">Tingkat Kehadiran Aktif</span>
                <div className="text-3xl font-black text-[#10B981] mt-1">
                  {employeeAnalyticsData.attendance.attendancePct}%
                </div>
                <span className="text-xs text-slate-500 mt-1 block">
                  {employeeAnalyticsData.attendance.wfo} WFO • {employeeAnalyticsData.attendance.wfh} WFH • {employeeAnalyticsData.attendance.content} Content
                </span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold uppercase text-slate-400">Status Kontrak Kerja</span>
                <div className="text-lg font-black text-slate-800 mt-2 truncate">
                  {employeeAnalyticsData.emp.employment_status}
                </div>
                <span className="text-xs text-blue-700 font-semibold mt-1 block truncate">
                  {employeeAnalyticsData.emp.contract_duration || '12 Bulan'}
                </span>
              </div>
            </div>

            {/* GRAFIK 1: BAR CHART PERBANDINGAN NILAI KPI VS TARGET */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Grafik Capaian Skor KPI vs Passing Threshold</h4>
                    <p className="text-xs text-slate-500">Garis putus-putus menunjukkan target kelulusan standar kompetensi.</p>
                  </div>
                  <TrendingUp className="w-5 h-5 text-[#1E40AF]" />
                </div>

                <div className="space-y-4 pt-2">
                  {employeeAnalyticsData.compBreakdown.map((item, idx) => {
                    const isPass = item.score >= item.target;
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800">
                            [{item.category}] {item.compName}
                          </span>
                          <span className="font-mono">
                            <strong className={isPass ? 'text-emerald-700' : 'text-rose-600'}>{item.score}</strong> / Target {item.target}
                          </span>
                        </div>
                        <div className="relative h-6 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center">
                          {/* Progress fill */}
                          <div
                            className={`h-full transition-all duration-700 ${
                              isPass ? 'bg-linear-to-r from-emerald-500 to-[#10B981]' : 'bg-linear-to-r from-rose-500 to-amber-500'
                            }`}
                            style={{ width: `${Math.min(item.score, 100)}%` }}
                          />
                          {/* Target line indicator */}
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-slate-900 z-10"
                            style={{ left: `${item.target}%` }}
                            title={`Target Threshold: ${item.target}`}
                          />
                          <span className="absolute right-2 text-[10px] font-bold text-slate-700 z-20">
                            Lv.{item.skillLevel}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* GRAFIK 2: RADAR / MULTIDIMENSIONAL SPIDER CHART SVG */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Grafik Radar Multi-Dimensi Kompetensi</h4>
                    <p className="text-xs text-slate-500">Keseimbangan penguasaan Hard Skill, Soft Skill & Core KPI.</p>
                  </div>
                  <PieChart className="w-5 h-5 text-[#10B981]" />
                </div>

                <div className="py-2 flex items-center justify-center">
                  <svg className="w-64 h-64 overflow-visible" viewBox="-120 -120 240 240">
                    {/* Background concentric circles */}
                    {[25, 50, 75, 100].map((r) => (
                      <polygon
                        key={r}
                        points={[0, 1, 2, 3, 4]
                          .map((i) => {
                            const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                            return `${(r * Math.cos(angle)).toFixed(1)},${(r * Math.sin(angle)).toFixed(1)}`;
                          })
                          .join(' ')}
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="1"
                        strokeDasharray={r === 75 ? '2,2' : undefined}
                      />
                    ))}

                    {/* Axes */}
                    {[0, 1, 2, 3, 4].map((i) => {
                      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                      return (
                        <line
                          key={i}
                          x1="0"
                          y1="0"
                          x2={(100 * Math.cos(angle)).toFixed(1)}
                          y2={(100 * Math.sin(angle)).toFixed(1)}
                          stroke="#cbd5e1"
                          strokeWidth="1"
                        />
                      );
                    })}

                    {/* Data Polygon */}
                    <polygon
                      points={employeeAnalyticsData.compBreakdown.slice(0, 5).map((item, i) => {
                        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                        const dist = Math.min(Math.max(item.score, 20), 100);
                        return `${(dist * Math.cos(angle)).toFixed(1)},${(dist * Math.sin(angle)).toFixed(1)}`;
                      }).join(' ')}
                      fill="rgba(30, 64, 175, 0.25)"
                      stroke="#1E40AF"
                      strokeWidth="2.5"
                    />

                    {/* Data Points */}
                    {employeeAnalyticsData.compBreakdown.slice(0, 5).map((item, i) => {
                      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                      const dist = Math.min(Math.max(item.score, 20), 100);
                      const x = dist * Math.cos(angle);
                      const y = dist * Math.sin(angle);
                      return (
                        <circle key={i} cx={x} cy={y} r="4" fill="#10B981" stroke="#ffffff" strokeWidth="1.5" />
                      );
                    })}

                    {/* Axis Labels */}
                    {employeeAnalyticsData.compBreakdown.slice(0, 5).map((item, i) => {
                      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                      const x = 118 * Math.cos(angle);
                      const y = 118 * Math.sin(angle);
                      return (
                        <text
                          key={i}
                          x={x}
                          y={y}
                          textAnchor="middle"
                          dominantBaseline="central"
                          className="text-[9px] font-bold fill-slate-700"
                        >
                          {item.compCode}
                        </text>
                      );
                    })}
                  </svg>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4 text-xs pt-2 border-t">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <span className="w-3 h-3 rounded-full bg-[#1E40AF]" /> Nilai Capaian Karyawan
                  </span>
                  <span className="flex items-center gap-1.5 font-semibold text-slate-500">
                    <span className="w-3 h-3 rounded-full bg-slate-300" /> Standar Passing Target (75+)
                  </span>
                </div>
              </div>
            </div>

            {/* GRAFIK 3 & 4: TREN SPRINT & DISTRIBUSI PRESENSI */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* TREN SPRINT EVALUATION (M1, M2, M3, M4, Mid, Project) */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="border-b pb-3">
                  <h4 className="font-bold text-sm text-slate-900">Konsistensi Sprint & Evaluasi Komprehensif</h4>
                  <p className="text-xs text-slate-500">Performa output dari Sprint 1 hingga Sprint 4, Penilaian Skill & Project Delivery.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 uppercase">
                        <th className="p-2.5 border">Kompetensi</th>
                        <th className="p-2 border text-center">M1</th>
                        <th className="p-2 border text-center">M2</th>
                        <th className="p-2 border text-center">M3</th>
                        <th className="p-2 border text-center">M4</th>
                        <th className="p-2 border text-center">Skill (30%)</th>
                        <th className="p-2 border text-center">Project (20%)</th>
                        <th className="p-2 border text-center">Skor Akhir</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeeAnalyticsData.compBreakdown.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 border font-semibold text-slate-800">{item.compName}</td>
                          {item.sprints.map((s, si) => (
                            <td key={si} className="p-2 border text-center font-mono font-medium">
                              {s}
                            </td>
                          ))}
                          <td className="p-2 border text-center font-mono font-medium text-blue-700">{item.mid}</td>
                          <td className="p-2 border text-center font-mono font-medium text-emerald-700">{item.project}</td>
                          <td className="p-2 border text-center font-mono font-black text-xs text-[#1E40AF]">
                            {item.score}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* DISTRIBUSI PRESENSI, KETEPATAN WAKTU (09:00 + 15M) & WLA STATUS */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
                <div>
                  <div className="border-b pb-3">
                    <h4 className="font-bold text-sm text-slate-900">Distribusi Kehadiran & Keterlambatan</h4>
                    <p className="text-xs text-slate-500">Jam Masuk Standar 09:00 WITA (Toleransi Maks. 15 Menit s/d 09:15).</p>
                  </div>

                  <div className="pt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between items-center p-2 rounded-xl bg-blue-50 border border-blue-200">
                      <span className="font-bold text-[#1E40AF]">🏢 WFO</span>
                      <strong className="text-xs font-black">{employeeAnalyticsData.attendance.wfo} Hr</strong>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-xl bg-emerald-50 border border-emerald-200">
                      <span className="font-bold text-emerald-700">🏡 WFH</span>
                      <strong className="text-xs font-black">{employeeAnalyticsData.attendance.wfh} Hr</strong>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-xl bg-purple-50 border border-purple-200">
                      <span className="font-bold text-purple-700">🎥 Content</span>
                      <strong className="text-xs font-black">{employeeAnalyticsData.attendance.content} Hr</strong>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-xl bg-amber-50 border border-amber-200">
                      <span className="font-bold text-amber-800">📝 Izin/Sakit</span>
                      <strong className="text-xs font-black">
                        {(employeeAnalyticsData.attendance.izin || 0) + (employeeAnalyticsData.attendance.sakit || 0)} Hr
                      </strong>
                    </div>
                    <div className="col-span-2 flex justify-between items-center p-2 rounded-xl bg-rose-50 border border-rose-200">
                      <span className="font-bold text-rose-700">🌴 Cuti Tahunan</span>
                      <strong className="text-xs font-black">{employeeAnalyticsData.attendance.cuti} Hari</strong>
                    </div>
                  </div>

                  <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                    <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                      Rekap Ketepatan Waktu (09:00 + 15m):
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-700 font-semibold">✓ Tepat Waktu (≤ 09:00)</span>
                      <strong className="font-black text-emerald-700">{employeeAnalyticsData.attendance.onTimeCount || 0} Hari</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-700 font-semibold">⏱️ Dalam Toleransi (09:01–09:15)</span>
                      <strong className="font-black text-amber-700">{employeeAnalyticsData.attendance.toleranceCount || 0} Hari</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-rose-600 font-semibold">⚠️ Terlambat (&gt; 09:15 WITA)</span>
                      <strong className="font-black text-rose-600">
                        {employeeAnalyticsData.attendance.lateCount || 0}x ({employeeAnalyticsData.attendance.totalLateMinutes || 0} Menit)
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAttChartScope('individual');
                      setAttChartEmpId(activeAnalyticsEmp?.id || employees[0]?.id || 'e-1');
                      setAttendanceSubTab('charts');
                      setActiveModule('attendance');
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow"
                  >
                    <BarChart3 className="w-4 h-4" /> Buka Grafik Detail Absensi & Keterlambatan →
                  </button>
                  <button
                    onClick={() => setActiveModule('report_card')}
                    className="w-full py-2 px-3 rounded-xl bg-[#1E40AF] hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow"
                  >
                    <FileText className="w-4 h-4" /> Buka Lembar Rapor Resmi A4 →
                  </button>
                </div>
              </div>
            </div>

            {/* KARTU REKOMENDASI PENGEMBANGAN DIRI (IDP) & KARIR KARYAWAN */}
            {(() => {
              const targetEmp = activeAnalyticsEmp;
              if (!targetEmp) return null;
              const rec = getIdpRecommendations(targetEmp);
              return (
                <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-xl space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-purple-500/20 text-purple-300 rounded-2xl border border-purple-400/30">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-lg font-black tracking-tight">
                          Sistematika Individual Development Plan (IDP) & Rekomendasi Karir
                        </h4>
                        <p className="text-xs text-slate-300">
                          Rekomendasi terstruktur untuk <strong className="text-white">{targetEmp.full_name}</strong> ({targetEmp.role_title} • Departemen {targetEmp.department})
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-purple-200">
                        Talent Box: {rec.talentBox}
                      </span>
                      <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                        {rec.careerDecision}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Modul LMS & Mentoring */}
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" /> Modul Pembelajaran LMS & Program Mentoring
                      </h5>
                      <div className="space-y-2">
                        {rec.modules.map((m, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start justify-between gap-2">
                            <div>
                              <div className="text-xs font-bold text-white">{m.module_name}</div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                Metode: <span className="text-purple-300">{m.category}</span> • Target: {m.target_date}
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                              {m.status} ({m.score})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Catatan Human Capital & Next Role */}
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2.5">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                          <Shield className="w-4 h-4" /> Proyeksi Penugasan & Saran Pembinaan
                        </h5>
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Target Role Berikutnya:</span>
                          <div className="text-sm font-bold text-emerald-300">{rec.nextRole}</div>
                        </div>
                        <div className="text-xs text-slate-300 space-y-1 bg-white/5 p-3 rounded-xl border border-white/10">
                          <p className="leading-relaxed"><strong className="text-white">Human Capital (Agun Sesar):</strong> "{rec.cultureNotes}"</p>
                          <p className="leading-relaxed"><strong className="text-white">Managing Director (Uswatun Hasanah):</strong> "{rec.directorNotes}"</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveModule('report_card')}
                        className="w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow"
                      >
                        <FileText className="w-4 h-4" /> Buka Lembar Rapor Resmi A4 Karyawan
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ===================================================================
            MODUL BARU: BAGIAN KARYAWAN MENGISI ABSEN LEWAT MASING-MASING AKUNNYA
           =================================================================== */}
        {/* ===================================================================
            MODUL BARU: BAGIAN KARYAWAN MENGISI ABSEN LEWAT MASING-MASING AKUNNYA
            (DILENGKAPI HITUNGAN JAM MASUK 09:00 + TOLERANSI 15 MENIT, OPSI IZIN/WFH, & OUTPUT GRAFIK)
           =================================================================== */}
        {activeModule === 'employee_self_attendance' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-md space-y-6">
              {/* Header Card dengan Jam Digital Realtime & Aturan Jam Masuk 09:00 + Toleransi 15m */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-6">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-emerald-100 text-[#10B981] rounded-2xl">
                    <Clock className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-black text-slate-900">
                        Presensi Kehadiran, Izin, WFH & Hitungan Keterlambatan
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold">
                        Jam Masuk: 09:00 WITA (Toleransi Maks. 15 Menit s/d 09:15)
                      </span>
                    </div>
                    {(() => {
                      const currentEmpId = currentUser.role === 'employee' ? currentUser.employeeId : selectedLoginEmpId;
                      const currentEmp = employees.find((e) => e.id === currentEmpId);
                      const leave = getEmployeeLeaveStats(currentEmpId || '', currentEmp?.annual_leave_quota || 12);
                      return (
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          {currentUser.role === 'admin' ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-[#1E40AF]">Pilih / Atur Karyawan (Kontrol Admin):</span>
                              <select
                                value={selectedLoginEmpId}
                                onChange={(e) => setSelectedLoginEmpId(e.target.value)}
                                className="px-2.5 py-1 rounded-lg border border-blue-300 bg-blue-50 text-xs font-bold text-[#1E40AF]"
                              >
                                {employees.map((emp) => (
                                  <option key={emp.id} value={emp.id}>
                                    {emp.full_name} ({emp.employee_nik} - {emp.role_title})
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">
                              Akun: <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.employeeNik || 'SKN-2026-001'})
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-[#1E40AF]">
                            🌴 Sisa Cuti: {leave.remaining} / {leave.quota} Hari
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="text-right bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-inner">
                  <div className="text-xs text-slate-400 font-semibold uppercase">Waktu Aktual (WITA)</div>
                  <div className="text-xl font-black font-mono tracking-wider text-emerald-400">
                    {currentTime.toLocaleTimeString('id-ID')}
                  </div>
                </div>
              </div>

              {/* Status Hari Ini + Kalkulasi Ketepatan Waktu (09:00 + Toleransi 15 Menit) */}
              {userTodayAttendance && userTodayAttendance.status ? (() => {
                const p = analyzeAttendancePunctuality(userTodayAttendance.check_in_time, userTodayAttendance.status);
                return (
                  <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-600 text-white font-bold text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Presensi Hari Ini Tercatat
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 text-emerald-400 font-mono font-bold text-xs">
                          <Clock className="w-3.5 h-3.5" /> Jam Masuk: {userTodayAttendance.check_in_time || '08:45:00'} WITA
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${p.badgeClass}`}>
                          {p.badgeLabel}
                        </span>
                      </div>
                      <div className="mt-2 text-sm font-bold text-slate-800">
                        Mode / Status: <span className="text-[#1E40AF]">{userTodayAttendance.status}</span> • Lokasi: {userTodayAttendance.work_location_tag}
                      </div>
                      {userTodayAttendance.notes && (
                        <p className="text-xs text-slate-700 mt-1 bg-white/80 px-3 py-1.5 rounded-lg border border-emerald-200">
                          <strong>Keterangan Izin / WFH / Deliverable:</strong> "{userTodayAttendance.notes}"
                        </p>
                      )}
                    </div>
                    <div className="text-right text-xs">
                      <span className="text-emerald-800 font-bold block">Standar Masuk: 09:00 WITA</span>
                      <span className="text-slate-500">Batas Toleransi: 09:15 WITA</span>
                    </div>
                  </div>
                );
              })() : (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900">
                  <span className="font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" /> Belum ada catatan presensi pada tanggal hari ini ({todayStr}).
                  </span>
                  <span>Jam Masuk Standar: <strong>09:00 WITA</strong> (Toleransi maksimal 15 menit s/d 09:15 WITA).</span>
                </div>
              )}

              {/* Formulir Pengisian Presensi Mandiri / Pengaturan Admin */}
              <div className="space-y-5 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-2">
                    1. Pilih Mode Kehadiran / Kategori Perizinan Lengkap (10 Kategori Terintegrasi):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                    {[
                      { status: 'WFO', label: '🏢 WFO (Kantor)', desc: 'Hadir di Kantor HQ' },
                      { status: 'WFH', label: '🏡 WFH / WFA', desc: 'Work From Home / Anywhere' },
                      { status: 'Take Content', label: '🎥 Take Content', desc: 'Produksi Studio / Liputan' },
                      { status: 'Urusan Kantor', label: '💼 Urusan Kantor', desc: 'Meeting Klien / Dinas Luar' },
                      { status: 'Overtime', label: '⚡ Overtime (Lembur)', desc: 'Lembur Produksi / Campaign' },
                      { status: 'Izin', label: '📝 Izin Resmi', desc: 'Izin Terkonfirmasi HR' },
                      { status: 'Urusan Pribadi', label: '🏠 Urusan Pribadi', desc: 'Keperluan Pribadi / Keluarga' },
                      { status: 'Sakit', label: '🏥 Izin Sakit', desc: 'Istirahat Medis / Sakit' },
                      { status: 'Cuti', label: '🌴 Cuti Tahunan', desc: 'Memotong Kuota Cuti' },
                      { status: 'Tidak Absen', label: '⚠️ Tidak Absen', desc: 'Alpa / Belum Konfirmasi' },
                    ].map((m) => {
                      const isSelected = selfStatus === m.status;
                      return (
                        <button
                          key={m.status}
                          type="button"
                          onClick={() => setSelfStatus(m.status as AttendanceStatus)}
                          className={`p-3 rounded-2xl border-2 text-left transition ${
                            isSelected
                              ? 'border-[#1E40AF] bg-blue-50/90 shadow-sm ring-2 ring-blue-300'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className={`font-black text-xs ${isSelected ? 'text-[#1E40AF]' : 'text-slate-800'}`}>
                            {m.label}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{m.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      2. Tag Lokasi Kerja / Liputan / Domisili WFH:
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        value={selfLocation ?? ''}
                        onChange={(e) => setSelfLocation(e.target.value)}
                        placeholder="Makassar HQ / Lokasi WFH / Lokasi Liputan"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                      />
                    </div>
                  </div>

                  <div className={currentUser.role === 'admin' ? 'md:col-span-1' : 'md:col-span-2'}>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      3. Keterangan Izin / WFH / Urusan Kantor / Deliverable:
                    </label>
                    <input
                      type="text"
                      value={selfNotes ?? ''}
                      onChange={(e) => setSelfNotes(e.target.value)}
                      placeholder="Contoh: Urusan kantor meeting klien, WFH edit video, Izin urusan pribadi, Overtime..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>

                  {currentUser.role === 'admin' && (
                    <div>
                      <label className="block text-xs font-bold uppercase text-[#1E40AF] mb-1">
                        4. Atur Jam Masuk (Khusus Admin • Opsional):
                      </label>
                      <input
                        type="time"
                        step="1"
                        value={selfCheckInTime}
                        onChange={(e) => setSelfCheckInTime(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-blue-300 text-xs font-mono font-bold bg-blue-50 text-[#1E40AF]"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-1 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleSelfCheckin}
                    className="flex-1 py-3.5 px-4 rounded-2xl bg-[#10B981] hover:bg-emerald-600 text-white font-black text-sm shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    {currentUser.role === 'admin'
                      ? 'Simpan / Tetapkan Presensi Karyawan Ini'
                      : 'Kirim Presensi & Keterangan Hari Ini'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const targetEmpId = currentUser.role === 'employee' ? currentUser.employeeId : selectedLoginEmpId;
                      setAttChartScope('individual');
                      setAttChartEmpId(targetEmpId || employees[0]?.id || 'e-1');
                      setAttendanceSubTab('charts');
                      setActiveModule('attendance');
                    }}
                    className="py-3.5 px-5 rounded-2xl bg-[#1E40AF] hover:bg-blue-800 text-white font-bold text-xs shadow transition flex items-center gap-2"
                  >
                    <BarChart3 className="w-4 h-4" /> Buka Grafik Lengkap Absensi & Keterlambatan
                  </button>
                </div>
              </div>

              {/* Pilihan Output: Tabel Riwayat vs Grafik Individu */}
              {(() => {
                const targetEmpId = currentUser.role === 'employee' ? currentUser.employeeId : selectedLoginEmpId;
                const empRecs = monthlyAttendances.filter((r) => r.employee_id === targetEmpId);
                let onTime = 0;
                let inTol = 0;
                let late = 0;
                let totalLateMin = 0;
                empRecs.forEach((r) => {
                  const p = analyzeAttendancePunctuality(r.check_in_time, r.status);
                  if (p.category === 'on_time') onTime++;
                  else if (p.category === 'within_tolerance') inTol++;
                  else if (p.category === 'late') {
                    late++;
                    totalLateMin += p.lateMinutesFrom0900;
                  }
                });

                return (
                  <div className="pt-6 border-t border-slate-200 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">
                          Output Data Presensi & Hitungan Keterlambatan Individu ({formatMonthLabel(attendanceMonth)})
                        </h4>
                        <p className="text-xs text-slate-500">
                          Tepat Waktu (≤09:00): <strong className="text-emerald-700">{onTime}x</strong> · Toleransi 15m (09:01–09:15): <strong className="text-amber-700">{inTol}x</strong> · Terlambat (&gt;09:15): <strong className="text-rose-600">{late}x ({totalLateMin} Menit)</strong>
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                          <button
                            type="button"
                            onClick={() => setSelfAttViewMode('form_table')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                              selfAttViewMode === 'form_table'
                                ? 'bg-[#1E40AF] text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Tabel Riwayat
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelfAttViewMode('chart')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                              selfAttViewMode === 'chart'
                                ? 'bg-[#1E40AF] text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <BarChart3 className="w-3.5 h-3.5" /> Output Grafik Individu
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={handleExportSelfAttendanceExcel}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#10B981] text-white text-xs font-bold hover:bg-emerald-600 shadow-xs transition"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" /> Unduh Excel (.xlsx)
                        </button>
                      </div>
                    </div>

                    {selfAttViewMode === 'chart' ? (
                      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="p-3 rounded-xl bg-white border border-emerald-200">
                            <span className="text-slate-500 block">Tepat Waktu (≤ 09:00)</span>
                            <strong className="text-lg font-black text-emerald-700">{onTime} Hari</strong>
                          </div>
                          <div className="p-3 rounded-xl bg-white border border-amber-200">
                            <span className="text-slate-500 block">Toleransi 15m (09:01–09:15)</span>
                            <strong className="text-lg font-black text-amber-700">{inTol} Hari</strong>
                          </div>
                          <div className="p-3 rounded-xl bg-white border border-rose-200">
                            <span className="text-slate-500 block">Terlambat (&gt; 09:15)</span>
                            <strong className="text-lg font-black text-rose-600">{late} Hari</strong>
                          </div>
                          <div className="p-3 rounded-xl bg-white border border-slate-200">
                            <span className="text-slate-500 block">Total Menit Terlambat</span>
                            <strong className="text-lg font-black text-slate-900">{totalLateMin} Menit</strong>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-xs font-bold text-slate-800">
                            Grafik Jam Check-In Harian vs Standar Masuk 09:00 & Batas Toleransi 09:15 WITA
                          </div>
                          <div className="space-y-2">
                            {empRecs.slice(0, 12).map((rec, i) => {
                              const p = analyzeAttendancePunctuality(rec.check_in_time, rec.status);
                              const barColor =
                                p.category === 'on_time'
                                  ? 'bg-emerald-500'
                                  : p.category === 'within_tolerance'
                                  ? 'bg-amber-500'
                                  : p.category === 'late'
                                  ? 'bg-rose-500'
                                  : 'bg-slate-400';
                              const widthPct = Math.min(100, Math.max(25, Math.round(((p.checkInMinutes - 450) / 180) * 100)));
                              return (
                                <div key={i} className="grid grid-cols-12 items-center gap-2 text-xs">
                                  <div className="col-span-3 sm:col-span-2 font-mono font-bold text-slate-700">
                                    {rec.attendance_date}
                                  </div>
                                  <div className="col-span-5 sm:col-span-6 bg-slate-200 h-5 rounded-full overflow-hidden relative">
                                    <div
                                      className={`h-full ${barColor} rounded-full transition-all flex items-center justify-end pr-2 text-[10px] font-bold text-white`}
                                      style={{ width: `${widthPct}%` }}
                                    >
                                      {rec.check_in_time || '08:45:00'}
                                    </div>
                                  </div>
                                  <div className="col-span-4 text-right">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.badgeClass}`}>
                                      {rec.status} · {p.badgeLabel}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700 uppercase">
                              <th className="p-2.5 border">Tanggal</th>
                              <th className="p-2.5 border">Jam Check-In (WITA)</th>
                              <th className="p-2.5 border">Status Kehadiran / Perizinan</th>
                              <th className="p-2.5 border">Ketepatan Waktu (09:00 + 15m)</th>
                              <th className="p-2.5 border">Lokasi Kerja</th>
                              <th className="p-2.5 border">Keterangan Izin / WFH / Output</th>
                              {currentUser.role === 'admin' && <th className="p-2.5 border text-center">Aksi Admin</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {empRecs.slice(0, 15).map((rec, i) => {
                              const p = analyzeAttendancePunctuality(rec.check_in_time, rec.status);
                              const isAdmin = currentUser.role === 'admin';
                              return (
                                <tr key={i} className="hover:bg-slate-50">
                                  <td className="p-2 border font-mono font-medium">{rec.attendance_date}</td>
                                  <td className="p-2 border font-mono text-emerald-700 font-bold">
                                    {isAdmin ? (
                                      <input
                                        type="time"
                                        step="1"
                                        value={rec.check_in_time || '08:45:00'}
                                        onChange={async (e) => {
                                          await SkenaHrApi.submitEmployeeAttendance({
                                            ...rec,
                                            check_in_time: e.target.value,
                                          });
                                          await fetchMonthlyAttendance(attendanceMonth);
                                          await fetchDailyAttendance(selectedDate);
                                        }}
                                        className="px-2 py-1 border rounded font-mono text-xs font-bold bg-white"
                                      />
                                    ) : (
                                      rec.check_in_time || '08:45:00'
                                    )}
                                  </td>
                                  <td className="p-2 border">
                                    {isAdmin ? (
                                      <select
                                        value={rec.status}
                                        onChange={async (e) => {
                                          await SkenaHrApi.submitEmployeeAttendance({
                                            ...rec,
                                            status: e.target.value as AttendanceStatus,
                                          });
                                          await fetchMonthlyAttendance(attendanceMonth);
                                          await fetchDailyAttendance(selectedDate);
                                        }}
                                        className="px-2 py-1 border rounded text-xs font-bold bg-white text-[#1E40AF]"
                                      >
                                        <option value="WFO">WFO</option>
                                        <option value="WFH">WFH / WFA</option>
                                        <option value="Take Content">Take Content</option>
                                        <option value="Urusan Kantor">Urusan Kantor</option>
                                        <option value="Overtime">Overtime</option>
                                        <option value="Izin">Izin Resmi</option>
                                        <option value="Urusan Pribadi">Urusan Pribadi</option>
                                        <option value="Sakit">Sakit</option>
                                        <option value="Cuti">Cuti</option>
                                        <option value="Tidak Absen">Tidak Absen</option>
                                      </select>
                                    ) : (
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getAttendanceStatusBadgeClass(rec.status)}`}>
                                        {rec.status}
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-2 border">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.badgeClass}`}>
                                      {p.badgeLabel}
                                    </span>
                                  </td>
                                  <td className="p-2 border text-slate-600">{rec.work_location_tag || '-'}</td>
                                  <td className="p-2 border text-slate-600">
                                    {isAdmin ? (
                                      <input
                                        type="text"
                                        value={rec.notes || ''}
                                        onChange={async (e) => {
                                          await SkenaHrApi.submitEmployeeAttendance({
                                            ...rec,
                                            notes: e.target.value,
                                          });
                                          await fetchMonthlyAttendance(attendanceMonth);
                                        }}
                                        placeholder="Keterangan izin / WFH / output"
                                        className="w-full px-2 py-1 border rounded text-xs bg-white"
                                      />
                                    ) : (
                                      rec.notes || '-'
                                    )}
                                  </td>
                                  {isAdmin && (
                                    <td className="p-2 border text-center">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setDeleteConfirm({
                                            isOpen: true,
                                            title: 'Hapus Riwayat Presensi',
                                            message: `Hapus data presensi tanggal ${rec.attendance_date}?`,
                                            onConfirm: async () => {
                                              await SkenaHrApi.deleteAttendanceRecord(rec.employee_id, rec.attendance_date);
                                              await fetchMonthlyAttendance(attendanceMonth);
                                              await fetchDailyAttendance(selectedDate);
                                              triggerToast('Data presensi berhasil dihapus.');
                                            },
                                          });
                                        }}
                                        className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                                        title="Hapus Presensi"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ===================================================================
            MODUL 1: DASHBOARD UTAMA, PENGINGAT EKSEKUTIF, MASTER KARYAWAN & ARSIP MITRA
           =================================================================== */}
        {activeModule === 'dashboard' && (
          currentUser.role !== 'admin' ? (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4 max-w-lg mx-auto">
              <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Akses Master Data Terbatas</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Halaman Dashboard Utama, Pengingat Eksekutif, dan Master Data hanya dapat diakses oleh Administrator (HR Lead & Managing Director).
              </p>
              <button
                onClick={() => setActiveModule('performance_analytics')}
                className="px-5 py-2.5 rounded-xl bg-[#1E40AF] text-white text-xs font-bold hover:bg-blue-800"
              >
                Kembali ke Rangkuman Grafik Kinerja Saya
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* KARTU METRIK REAL-TIME + ALERT KONTRAK H-2 BULAN & ONE MONTH NOTICE RESIGN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold uppercase text-slate-400">Karyawan Aktif</span>
                  <div className="text-2xl font-black text-[#1E40AF] mt-1">{dashboardMetrics.activeEmployees} Orang</div>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">Arsip & Mitra: {dashboardMetrics.archivedCollaboratorsCount}</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-amber-300 bg-amber-50/40 shadow-xs">
                  <span className="text-[11px] font-bold uppercase text-amber-800">Kontrak ≤ H-2 Bulan</span>
                  <div className="text-2xl font-black text-amber-700 mt-1">{dashboardMetrics.expiringContractsCount} Orang</div>
                  <span className="text-[11px] text-amber-700 mt-0.5 block">Wajib Evaluasi ≤ 60 Hari</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-rose-300 bg-rose-50/40 shadow-xs">
                  <span className="text-[11px] font-bold uppercase text-rose-800">One Month Notice Resign</span>
                  <div className="text-2xl font-black text-rose-600 mt-1">{dashboardMetrics.resignNoticeCount} Orang</div>
                  <span className="text-[11px] text-rose-700 mt-0.5 block">Pantau Handover & Transisi</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold uppercase text-slate-400">Kehadiran Hari Ini</span>
                  <div className="text-2xl font-black text-[#10B981] mt-1">{dashboardMetrics.attendanceRate}%</div>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">WFO, WFH, Konten & Dinas</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold uppercase text-slate-400">Progres One Year Plan</span>
                  <div className="text-2xl font-black text-indigo-700 mt-1">{dashboardMetrics.oneYearProgressPct}%</div>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">Roadmap Tahunan Skena</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold uppercase text-slate-400">Rata-rata Skor KPI</span>
                  <div className="text-2xl font-black text-[#1E40AF] mt-1">{dashboardMetrics.avgKpi}</div>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">Bobot: {kpiWeights.sprint_weight_pct}/{kpiWeights.skill_weight_pct}/{kpiWeights.project_weight_pct}%</span>
                </div>
              </div>

              {/* ===================================================================
                  PUSAT PENGINGAT KEGIATAN & AGENDA EKSEKUTIF (DASHBOARD UTAMA)
                  - Pengingat Kontrak Karyawan Mau Habis (Start H-2 Bulan / ≤60 Hari)
                  - Pengingat One Month Notice Resign & Sisa Waktu Kerja
                  - Jadwal Bulanan CSR, Waktu Penggajian (Payroll), Pengajuan Budget Hari Rabu
                 =================================================================== */}
              <div className="bg-white p-6 rounded-3xl border-2 border-indigo-200 shadow-sm space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-indigo-100 text-[#1E40AF]">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-black text-slate-900">
                          Dashboard Utama: Pusat Pengingat Kegiatan & Agenda Eksekutif HR
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          Terintegrasi Kontrak H-2 Bulan, Resign Notice, CSR, Penggajian & Budget Rabu
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Seluruh pengingat kegiatan rutin maupun khusus yang harus dilakukan Administrator. Dapat ditambah, diedit, dicentang selesai, dihapus, dan diunduh ke Excel.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const headers = [
                          'No',
                          'Judul Pengingat / Kegiatan',
                          'Kategori Agenda',
                          'Siklus / Frekuensi',
                          'Tanggal Jatuh Tempo',
                          'Prioritas',
                          'PIC / Penanggung Jawab',
                          'Status Selesai',
                          'Catatan / Rincian',
                        ];
                        const rows = (executiveReminders || []).map((r, idx) => [
                          idx + 1,
                          r.title || '-',
                          r.category || '-',
                          r.recurrence_label || r.schedule_info || '-',
                          r.due_date || '-',
                          r.priority || '-',
                          r.assigned_to || r.pic_name || '-',
                          r.is_completed ? 'Selesai (✓)' : 'Belum Selesai',
                          r.notes || '-',
                        ]);
                        downloadExcelWorkbook(`Agenda_Pengingat_Eksekutif_Skena_${todayStr}`, [
                          {
                            sheetName: 'Pengingat_Eksekutif',
                            headers,
                            rows,
                            titleRows: [
                              [settings.company_name.toUpperCase()],
                              ['DAFTAR PENGINGAT KEGIATAN EKSEKUTIF (KONTRAK H-2 BULAN, CSR, PENGGAJIAN, PENGAJUAN BUDGET RABU)'],
                            ],
                          },
                        ]);
                        triggerToast('Daftar Pengingat Kegiatan berhasil diunduh (.xlsx)');
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#10B981] text-white text-xs font-bold hover:bg-emerald-600 shadow-xs transition"
                    >
                      <FileSpreadsheet className="w-4 h-4" /> Unduh Agenda & Pengingat (.xlsx)
                    </button>
                  </div>
                </div>

                {/* PANEL OTOMATIS: PERINGATAN KONTRAK H-2 BULAN (≤60 HARI) & KARYAWAN ONE MONTH NOTICE RESIGN */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Alert Kontrak Start H-2 Bulan */}
                  <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-600" /> Pengingat Otomatis: Kontrak Karyawan Mulai H-2 Bulan (≤ 60 Hari)
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                        Start Alert H-60 Hari
                      </span>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {employees
                        .filter((e) => e.is_active)
                        .map((emp) => ({ emp, cInfo: getContractCountdownInfo(emp.contract_end_date, emp.employment_status) }))
                        .filter((x) => x.cInfo.isH2MonthsAlert || (x.cInfo.daysLeft !== null && x.cInfo.daysLeft <= 90))
                        .sort((a, b) => (a.cInfo.daysLeft ?? 999) - (b.cInfo.daysLeft ?? 999))
                        .map(({ emp, cInfo }) => (
                          <div key={emp.id} className="p-2.5 rounded-xl bg-white border border-amber-200 flex items-center justify-between gap-2 text-xs">
                            <div>
                              <div className="font-bold text-slate-900">{emp.full_name} <span className="text-slate-400 font-mono">({emp.employee_nik})</span></div>
                              <div className="text-[11px] text-slate-600">
                                {emp.role_title} • Mulai: <strong>{emp.contract_start_date || '-'}</strong> → Berakhir: <strong className="text-rose-700">{emp.contract_end_date || '-'}</strong>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${cInfo.badgeClass}`}>
                                {cInfo.label}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Alert Karyawan Resign & One Month Notice */}
                  <div className="p-4 rounded-2xl bg-rose-50/90 border border-rose-300 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-rose-950 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-rose-600" /> Pelacakan One-Month Notice Resign & Sisa Waktu Bekerja
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 text-rose-900">
                        Notice & Handover
                      </span>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {employees
                        .filter((e) => e.resign_status === 'One Month Notice (Resign)' || e.resign_status === 'Resigned')
                        .map((emp) => {
                          const rInfo = getResignNoticeInfo(emp);
                          return (
                            <div key={emp.id} className="p-2.5 rounded-xl bg-white border border-rose-200 flex items-start justify-between gap-2 text-xs">
                              <div>
                                <div className="font-bold text-slate-900">
                                  {emp.full_name} <span className="text-[10px] font-mono text-slate-500">({emp.role_title})</span>
                                </div>
                                <div className="text-[11px] text-slate-600 mt-0.5">
                                  Pengajuan Notice: <strong>{emp.resign_notice_date || '-'}</strong> • Efektif Terakhir Kerja: <strong className="text-rose-700">{emp.resign_effective_date || '-'}</strong>
                                </div>
                                {emp.resign_reason && (
                                  <div className="text-[11px] text-slate-500 mt-0.5">
                                    Alasan: "{emp.resign_reason}" {emp.handover_notes ? `• Handover: ${emp.handover_notes}` : ''}
                                  </div>
                                )}
                              </div>
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${rInfo.badgeClass}`}>
                                {rInfo.label}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>

                {/* FORM TAMBAH / EDIT PENGINGAT KEGIATAN (CSR, PENGGAJIAN, PENGAJUAN BUDGET RABU, KONTRAK, CUSTOM) */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!reminderForm.title) return;
                    const payload: ExecutiveReminderItem = {
                      id: editingReminderId || `rem-${Date.now()}`,
                      title: reminderForm.title || '',
                      category: (reminderForm.category as ExecutiveReminderItem['category']) || 'Pengajuan Budget Rabu',
                      schedule_info: reminderForm.recurrence_label || reminderForm.schedule_info || 'Mingguan / Bulanan',
                      recurrence_label: reminderForm.recurrence_label || reminderForm.schedule_info || 'Mingguan / Bulanan',
                      due_date: reminderForm.due_date || todayStr,
                      priority: (reminderForm.priority as ExecutiveReminderItem['priority']) || 'High',
                      is_completed: Boolean(reminderForm.is_completed),
                      pic_name: reminderForm.assigned_to || reminderForm.pic_name || 'Agun Sesar & Uswatun Hasanah',
                      assigned_to: reminderForm.assigned_to || reminderForm.pic_name || 'Agun Sesar & Uswatun Hasanah',
                      notes: reminderForm.notes || '',
                    };
                    const updated = await SkenaHrApi.saveExecutiveReminder(payload);
                    setExecutiveReminders(Array.isArray(updated) ? updated : []);
                    setEditingReminderId(null);
                    setReminderForm({
                      title: '',
                      category: 'Pengajuan Budget Rabu',
                      recurrence_label: 'Setiap Hari Rabu',
                      due_date: todayStr,
                      priority: 'High',
                      is_completed: false,
                      assigned_to: 'Agun Sesar & Uswatun Hasanah',
                      notes: '',
                    });
                    triggerToast(editingReminderId ? 'Pengingat kegiatan berhasil diperbarui!' : 'Pengingat kegiatan baru berhasil ditambahkan!');
                  }}
                  className="grid grid-cols-1 md:grid-cols-6 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200"
                >
                  <div className="md:col-span-2">
                    <label className="text-[11px] font-bold text-slate-700">Judul Kegiatan / Pengingat *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Pengajuan Budget Mingguan Rabu / Jadwal CSR Bulanan / Payroll"
                      value={reminderForm.title ?? ''}
                      onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-xl text-xs bg-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700">Kategori Pengingat</label>
                    <select
                      value={reminderForm.category ?? 'Pengajuan Budget Rabu'}
                      onChange={(e) => setReminderForm({ ...reminderForm, category: e.target.value as any })}
                      className="w-full mt-1 px-3 py-2 border rounded-xl text-xs bg-white font-bold text-[#1E40AF]"
                    >
                      <option value="Kontrak Karyawan">Kontrak Karyawan (H-2 Bulan)</option>
                      <option value="Resign & Handover">Resign & One Month Notice</option>
                      <option value="Jadwal CSR Bulanan">Jadwal CSR Bulanan</option>
                      <option value="Waktu Penggajian (Payroll)">Waktu Penggajian (Payroll)</option>
                      <option value="Pengajuan Budget Rabu">Pengajuan Budget (Setiap Rabu)</option>
                      <option value="Agenda Kustom">Agenda Kustom Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700">Jadwal / Siklus Waktu</label>
                    <input
                      type="text"
                      placeholder="Setiap Hari Rabu / Tanggal 25"
                      value={reminderForm.recurrence_label ?? ''}
                      onChange={(e) => setReminderForm({ ...reminderForm, recurrence_label: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-xl text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700">Tanggal Target</label>
                    <input
                      type="date"
                      value={reminderForm.due_date ?? todayStr}
                      onChange={(e) => setReminderForm({ ...reminderForm, due_date: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-xl text-xs bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700">Prioritas & PIC</label>
                    <div className="flex gap-1.5 mt-1">
                      <select
                        value={reminderForm.priority ?? 'High'}
                        onChange={(e) => setReminderForm({ ...reminderForm, priority: e.target.value as any })}
                        className="w-24 px-2 py-2 border rounded-xl text-xs bg-white font-bold"
                      >
                        <option value="Urgent">Urgent</option>
                        <option value="High">High</option>
                        <option value="Normal">Normal</option>
                      </select>
                      <input
                        type="text"
                        placeholder="PIC"
                        value={reminderForm.assigned_to ?? ''}
                        onChange={(e) => setReminderForm({ ...reminderForm, assigned_to: e.target.value })}
                        className="flex-1 px-2.5 py-2 border rounded-xl text-xs bg-white"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-4">
                    <input
                      type="text"
                      placeholder="Rincian tindakan / catatan pengajuan budget / lokasi CSR / daftar kontrak..."
                      value={reminderForm.notes ?? ''}
                      onChange={(e) => setReminderForm({ ...reminderForm, notes: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                    />
                  </div>
                  <div className="md:col-span-2 flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 px-4 rounded-xl bg-[#1E40AF] hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow"
                    >
                      {editingReminderId ? <Save className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      {editingReminderId ? 'Simpan Perubahan Agenda' : 'Tambah Pengingat Kegiatan'}
                    </button>
                    {editingReminderId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingReminderId(null);
                          setReminderForm({
                            title: '',
                            category: 'Pengajuan Budget Rabu',
                            recurrence_label: 'Setiap Hari Rabu',
                            due_date: todayStr,
                            priority: 'High',
                            is_completed: false,
                            assigned_to: 'Agun Sesar & Uswatun Hasanah',
                            notes: '',
                          });
                        }}
                        className="px-3 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </form>

                {/* FILTER KATEGORI PENGINGAT & DAFTAR CHECKLIST */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    'Semua',
                    'Kontrak Karyawan',
                    'Resign & Handover',
                    'Jadwal CSR Bulanan',
                    'Waktu Penggajian (Payroll)',
                    'Pengajuan Budget Rabu',
                    'Agenda Kustom',
                  ].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setReminderFilterCat(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        reminderFilterCat === cat
                          ? 'bg-[#1E40AF] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(executiveReminders || [])
                    .filter((r) => reminderFilterCat === 'Semua' || r.category === reminderFilterCat)
                    .map((rem) => (
                      <div
                        key={rem.id}
                        className={`p-4 rounded-2xl border transition flex items-start justify-between gap-3 ${
                          rem.is_completed
                            ? 'bg-emerald-50/50 border-emerald-200 opacity-85'
                            : rem.priority === 'Urgent' || rem.priority === 'Tinggi'
                            ? 'bg-rose-50/40 border-rose-200'
                            : 'bg-white border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={rem.is_completed}
                            onChange={async () => {
                              const updated = await SkenaHrApi.saveExecutiveReminder({
                                ...rem,
                                is_completed: !rem.is_completed,
                              });
                              setExecutiveReminders(Array.isArray(updated) ? updated : []);
                              triggerToast(
                                !rem.is_completed
                                  ? `Kegiatan "${rem.title}" ditandai selesai!`
                                  : `Status "${rem.title}" dikembalikan ke aktif.`
                              );
                            }}
                            className="mt-1 w-4 h-4 rounded text-[#10B981] focus:ring-emerald-500 cursor-pointer"
                          />
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-[#1E40AF] border border-indigo-200">
                                {rem.category}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  rem.priority === 'Urgent' || rem.priority === 'Tinggi'
                                    ? 'bg-rose-100 text-rose-800'
                                    : rem.priority === 'High' || rem.priority === 'Sedang'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {rem.priority}
                              </span>
                              <span className="text-[11px] font-mono font-bold text-slate-500">
                                🗓 {rem.recurrence_label || rem.schedule_info} ({rem.due_date})
                              </span>
                            </div>
                            <h4
                              className={`text-sm font-bold mt-1 ${
                                rem.is_completed ? 'line-through text-slate-400' : 'text-slate-900'
                              }`}
                            >
                              {rem.title}
                            </h4>
                            <p className="text-xs text-slate-600 mt-0.5">{rem.notes}</p>
                            <div className="text-[11px] text-slate-400 mt-1">
                              PIC: <strong className="text-slate-700">{rem.assigned_to || rem.pic_name}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingReminderId(rem.id);
                              setReminderForm({
                                ...rem,
                                recurrence_label: rem.recurrence_label || rem.schedule_info || '',
                                assigned_to: rem.assigned_to || rem.pic_name || '',
                              });
                            }}
                            className="p-1.5 text-[#1E40AF] hover:bg-blue-50 rounded-lg"
                            title="Edit Pengingat"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteConfirm({
                                isOpen: true,
                                title: 'Hapus Agenda Pengingat',
                                message: `Hapus pengingat "${rem.title}" dari Dashboard Utama?`,
                                onConfirm: async () => {
                                  const updated = await SkenaHrApi.deleteExecutiveReminder(rem.id);
                                  setExecutiveReminders(Array.isArray(updated) ? updated : []);
                                  triggerToast('Pengingat berhasil dihapus.');
                                },
                              });
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="Hapus Pengingat"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* FORM PENGATURAN IDENTITAS PERUSAHAAN & HR */}
              <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">Pengaturan Organisasi, HR & Managing Director</h3>
                    <p className="text-xs text-slate-500">Kop surat dan tanda tangan pada Rapor A4 akan secara otomatis mengikuti identitas ini.</p>
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E40AF] text-white text-sm font-semibold hover:bg-blue-800 shadow"
                  >
                    <Save className="w-4 h-4" /> Simpan Pengaturan
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Nama Perusahaan / Agensi</label>
                    <input
                      type="text"
                      value={settings.company_name ?? ''}
                      onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white font-bold text-[#1E40AF]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Sektor Industri</label>
                    <input
                      type="text"
                      value={settings.industry_sector ?? ''}
                      onChange={(e) => setSettings({ ...settings, industry_sector: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Cakupan Departemen</label>
                    <input
                      type="text"
                      value={settings.department_scope ?? ''}
                      onChange={(e) => setSettings({ ...settings, department_scope: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Tahun Evaluasi</label>
                    <input
                      type="text"
                      value={settings.period_year ?? ''}
                      onChange={(e) => setSettings({ ...settings, period_year: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Periode / Semester</label>
                    <input
                      type="text"
                      value={settings.period_term ?? ''}
                      onChange={(e) => setSettings({ ...settings, period_term: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Nama Human Capital / HR Lead</label>
                    <input
                      type="text"
                      value={settings.hr_lead_name ?? ''}
                      onChange={(e) => setSettings({ ...settings, hr_lead_name: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">ID / NIK HR Lead</label>
                    <input
                      type="text"
                      value={settings.hr_lead_id ?? ''}
                      onChange={(e) => setSettings({ ...settings, hr_lead_id: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Nama Managing Director</label>
                    <input
                      type="text"
                      value={settings.managing_director_name ?? ''}
                      onChange={(e) => setSettings({ ...settings, managing_director_name: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">ID / NIK Managing Director</label>
                    <input
                      type="text"
                      value={settings.managing_director_id ?? ''}
                      onChange={(e) => setSettings({ ...settings, managing_director_id: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white"
                    />
                  </div>
                </div>
              </form>

              {/* CRUD MASTER DATA KARYAWAN, KONTRAK (START H-2 BULAN), RESIGN ONE-MONTH NOTICE & ARSIP MITRA/KOLABORATOR */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">
                      Database Karyawan, Kontrak (H-2 Bulan), Resign Notice & Arsip Orang yang Pernah Bekerja Sama
                    </h3>
                    <p className="text-xs text-slate-500">
                      Kelola data personal, tanggal mulai & berakhir kontrak (otomatis hitung mundur start H-2 bulan), status rencana resign (One-Month Notice), serta database mitra/talent/alumni lengkap dengan alamat, WA, email, harga budget, project, dan keterangan.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={exportExecutiveSummaryCsv}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1E40AF] text-white text-xs font-semibold hover:bg-blue-800 shadow-xs transition"
                    >
                      <FileSpreadsheet className="w-4 h-4" /> Unduh Rangkuman Eksekutif (.xlsx)
                    </button>
                    <button
                      type="button"
                      onClick={handleExportMasterAllInOneExcel}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#10B981] text-white text-xs font-semibold hover:bg-emerald-600 shadow-xs transition"
                    >
                      <Download className="w-4 h-4" /> Unduh Full Database 5-Sheet (.xlsx)
                    </button>
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition">
                      <Upload className="w-4 h-4" /> Import Data (.xlsx / .csv)
                      <input type="file" accept=".xlsx,.xls,.csv" onChange={handleCsvEmployeeImport} className="hidden" />
                    </label>
                  </div>
                </div>

                <form
                  id="employee-crud-form"
                  onSubmit={handleSaveEmployee}
                  className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200"
                >
                  {editingEmpId && (
                    <div className="md:col-span-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900 font-bold">
                      <span className="flex items-center gap-2">
                        <Pencil className="w-4 h-4 text-blue-700" /> Sedang Mengedit Data Personal / Kontrak / Mitra: {empForm.full_name} ({empForm.employee_nik})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingEmpId(null);
                          setEmpForm({
                            employee_nik: '',
                            tax_bpjs_id: '',
                            full_name: '',
                            gender: 'L',
                            role_title: '',
                            department: 'Creative',
                            employment_status: 'Full Time',
                            contract_duration: '12 Bulan (Jan - Des 2026)',
                            contract_start_date: '2026-01-01',
                            contract_end_date: '2026-12-31',
                            benefits_package: 'BPJS Kesehatan, BPJS Ketenagakerjaan, Device Allowance',
                            assigned_project: '',
                            work_location: 'Makassar HQ',
                            direct_supervisor: 'Managing Director',
                            annual_leave_quota: 12,
                            is_active: true,
                            address_domicile: '',
                            whatsapp_contact: '',
                            email: '',
                            rate_budget: '',
                            notes: '',
                            collaborator_category: 'Karyawan Internal',
                            resign_status: 'Aktif',
                            resign_notice_date: '',
                            resign_effective_date: '',
                            resign_reason: '',
                            handover_notes: '',
                          });
                          triggerToast('Mode edit dibatalkan.');
                        }}
                        className="text-rose-600 hover:underline px-2.5 py-1 bg-white rounded border border-rose-200"
                      >
                        Batal Edit
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-slate-600">NIK / ID Mitra *</label>
                    <input
                      type="text"
                      required
                      placeholder="SKN-2026-005 / COL-2026-01"
                      value={empForm.employee_nik ?? ''}
                      onChange={(e) => setEmpForm({ ...empForm, employee_nik: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Nama Lengkap *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nama Lengkap Karyawan / Mitra"
                      value={empForm.full_name ?? ''}
                      onChange={(e) => setEmpForm({ ...empForm, full_name: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-indigo-700">Kategori Personel / Kolaborator *</label>
                    <select
                      value={empForm.collaborator_category ?? 'Karyawan Internal'}
                      onChange={(e) => {
                        const cat = e.target.value as CollaboratorCategory;
                        setEmpForm({
                          ...empForm,
                          collaborator_category: cat,
                          is_active: cat === 'Karyawan Internal' ? empForm.is_active : false,
                        });
                      }}
                      className="w-full mt-1 px-3 py-2 border border-indigo-300 rounded-lg text-sm bg-white font-bold text-[#1E40AF]"
                    >
                      <option value="Karyawan Internal">Karyawan Internal Skena</option>
                      <option value="Alumni / Ex-Karyawan">Alumni / Ex-Karyawan (Arsip)</option>
                      <option value="Freelancer / Mitra">Freelancer / Mitra Produksi (Arsip)</option>
                      <option value="KOL / Talent">KOL / Talent / Muse (Arsip)</option>
                      <option value="Vendor">Vendor / Partner Eksternal (Arsip)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Status Keaktifan Database</label>
                    <select
                      value={empForm.is_active === false ? 'inactive' : 'active'}
                      onChange={(e) => setEmpForm({ ...empForm, is_active: e.target.value === 'active' })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white font-bold"
                    >
                      <option value="active">Karyawan Aktif Bekerja</option>
                      <option value="inactive">Database Arsip / Pernah Bekerja Sama</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600">Jabatan / Role / Spesialisasi *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Videographer / DOP Freelance / KOL"
                      value={empForm.role_title ?? ''}
                      onChange={(e) => setEmpForm({ ...empForm, role_title: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Departemen / Divisi *</label>
                    <select
                      value={empForm.department ?? 'Creative'}
                      onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white font-bold text-slate-800"
                    >
                      <option value="Creative">Creative</option>
                      <option value="Sales & Marketing">Sales & Marketing</option>
                      <option value="Operasional">Operasional</option>
                      <option value="Managing Director">Managing Director</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Skema Kontrak Kerja *</label>
                    <select
                      value={empForm.employment_status ?? 'Full Time'}
                      onChange={(e) => setEmpForm({ ...empForm, employment_status: e.target.value as EmploymentStatus })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white font-bold text-[#1E40AF]"
                    >
                      <option value="Full Time">Full Time</option>
                      <option value="Full Time Performance Based">Full Time Performance Based</option>
                      <option value="Probation">Probation (Masa Percobaan)</option>
                      <option value="Freelance">Freelance / Project Based</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Label Durasi Kontrak</label>
                    <input
                      type="text"
                      placeholder="Contoh: 6 Bulan / 12 Bulan / Per Project"
                      value={empForm.contract_duration ?? ''}
                      onChange={(e) => setEmpForm({ ...empForm, contract_duration: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white"
                    />
                  </div>

                  {/* TANGGAL MULAI & TANGGAL BERAKHIR KONTRAK (UNTUK HITUNGAN MUNDUR H-2 BULAN) */}
                  <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200">
                    <label className="text-xs font-bold text-amber-900">Tanggal Mulai Kontrak *</label>
                    <input
                      type="date"
                      value={empForm.contract_start_date ?? ''}
                      onChange={(e) => setEmpForm({ ...empForm, contract_start_date: e.target.value })}
                      className="w-full mt-1 px-2.5 py-1.5 border border-amber-300 rounded-lg text-xs font-mono bg-white"
                    />
                  </div>
                  <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200">
                    <label className="text-xs font-bold text-amber-900">Tanggal Berakhir Kontrak (Alert H-2 Bulan)</label>
                    <input
                      type="date"
                      value={empForm.contract_end_date ?? ''}
                      onChange={(e) => setEmpForm({ ...empForm, contract_end_date: e.target.value })}
                      className="w-full mt-1 px-2.5 py-1.5 border border-amber-300 rounded-lg text-xs font-mono bg-white"
                    />
                  </div>

                  {/* PELACAKAN RESIGN & ONE MONTH NOTICE */}
                  <div className="bg-rose-50/70 p-2.5 rounded-xl border border-rose-200">
                    <label className="text-xs font-bold text-rose-900">Status Resign / One-Month Notice</label>
                    <select
                      value={empForm.resign_status ?? 'Aktif'}
                      onChange={(e) => setEmpForm({ ...empForm, resign_status: e.target.value as ResignStatus })}
                      className="w-full mt-1 px-2.5 py-1.5 border border-rose-300 rounded-lg text-xs font-bold bg-white text-rose-900"
                    >
                      <option value="Aktif">Aktif (Tidak Ada Pengajuan Resign)</option>
                      <option value="One Month Notice (Resign)">One Month Notice (Berencana Resign)</option>
                      <option value="Resigned">Telah Resign / Selesai Kontrak</option>
                    </select>
                  </div>
                  <div className="bg-rose-50/70 p-2.5 rounded-xl border border-rose-200">
                    <label className="text-xs font-bold text-rose-900">Tgl Pengajuan Notice & Tgl Terakhir Kerja</label>
                    <div className="grid grid-cols-2 gap-1.5 mt-1">
                      <input
                        type="date"
                        title="Tanggal Pengajuan One Month Notice"
                        value={empForm.resign_notice_date ?? ''}
                        onChange={(e) => setEmpForm({ ...empForm, resign_notice_date: e.target.value })}
                        className="px-2 py-1.5 border border-rose-300 rounded-lg text-[11px] font-mono bg-white"
                      />
                      <input
                        type="date"
                        title="Tanggal Efektif Terakhir Bekerja"
                        value={empForm.resign_effective_date ?? ''}
                        onChange={(e) => setEmpForm({ ...empForm, resign_effective_date: e.target.value })}
                        className="px-2 py-1.5 border border-rose-300 rounded-lg text-[11px] font-mono bg-white"
                      />
                    </div>
                  </div>

                  {empForm.resign_status !== 'Aktif' && (
                    <>
                      <div className="md:col-span-2 bg-rose-50/50 p-2.5 rounded-xl border border-rose-200">
                        <label className="text-xs font-bold text-rose-900">Alasan Resign & Detail Waktu</label>
                        <input
                          type="text"
                          placeholder="Contoh: Pindah domisili / Melanjutkan studi S2 / Karir baru..."
                          value={empForm.resign_reason ?? ''}
                          onChange={(e) => setEmpForm({ ...empForm, resign_reason: e.target.value })}
                          className="w-full mt-1 px-3 py-1.5 border border-rose-300 rounded-lg text-xs bg-white"
                        />
                      </div>
                      <div className="md:col-span-2 bg-rose-50/50 p-2.5 rounded-xl border border-rose-200">
                        <label className="text-xs font-bold text-rose-900">Catatan Handover Pekerjaan & Aset</label>
                        <input
                          type="text"
                          placeholder="Contoh: Serah terima file project ke Videographer, pengembalian kamera..."
                          value={empForm.handover_notes ?? ''}
                          onChange={(e) => setEmpForm({ ...empForm, handover_notes: e.target.value })}
                          className="w-full mt-1 px-3 py-1.5 border border-rose-300 rounded-lg text-xs bg-white"
                        />
                      </div>
                    </>
                  )}

                  {/* INFORMASI PERSONAL, KONTAK WA, EMAIL, ALAMAT/DOMISILI, HARGA BUDGET, PROJECT & KETERANGAN */}
                  <div>
                    <label className="text-xs font-semibold text-emerald-800">Kontak WhatsApp (WA)</label>
                    <input
                      type="text"
                      placeholder="0812-xxxx-xxxx"
                      value={empForm.whatsapp_contact ?? ''}
                      onChange={(e) => setEmpForm({ ...empForm, whatsapp_contact: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-emerald-300 rounded-lg text-sm bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-emerald-800">Alamat Email</label>
                    <input
                      type="email"
                      placeholder="nama@skena.id / email mitra"
                      value={empForm.email ?? ''}
                      onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-emerald-300 rounded-lg text-sm bg-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-emerald-800">Alamat Lengkap / Domisili Saat Ini</label>
                    <input
                      type="text"
                      placeholder="Contoh: Jl. Boulevard Panakkukang No. 18, Makassar"
                      value={empForm.address_domicile ?? ''}
                      onChange={(e) => setEmpForm({ ...empForm, address_domicile: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-emerald-300 rounded-lg text-sm bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-blue-800">Harga Budget / Rate Card / Fee</label>
                    <input
                      type="text"
                      placeholder="Contoh: Rp 5.500.000 / Bulan atau Rp 1.500.000 / Hari"
                      value={empForm.rate_budget ?? ''}
                      onChange={(e) => setEmpForm({ ...empForm, rate_budget: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-blue-300 rounded-lg text-sm bg-white font-bold text-[#1E40AF]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-blue-800">Project yang Ditangani</label>
                    <input
                      type="text"
                      placeholder="Contoh: Campaign Ramadhan / Retainer F&B"
                      value={empForm.assigned_project ?? ''}
                      onChange={(e) => setEmpForm({ ...empForm, assigned_project: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-blue-300 rounded-lg text-sm bg-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-blue-800">Keterangan / Catatan Evaluasi & Portofolio</label>
                    <input
                      type="text"
                      placeholder="Catatan performa, spesialisasi alat, histori kerjasama, atau evaluasi HR..."
                      value={empForm.notes ?? ''}
                      onChange={(e) => setEmpForm({ ...empForm, notes: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-blue-300 rounded-lg text-sm bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600">Kuota Cuti Tahunan (Hari)</label>
                    <input
                      type="number"
                      min={0}
                      max={60}
                      value={empForm.annual_leave_quota ?? 12}
                      onChange={(e) => setEmpForm({ ...empForm, annual_leave_quota: Number(e.target.value) })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white font-semibold text-[#1E40AF]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Lokasi Penugasan</label>
                    <input
                      type="text"
                      placeholder="Makassar HQ / Remote"
                      value={empForm.work_location ?? ''}
                      onChange={(e) => setEmpForm({ ...empForm, work_location: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Paket Benefit & Tunjangan</label>
                    <input
                      type="text"
                      placeholder="BPJS Kes & TK, Device Allowance"
                      value={empForm.benefits_package ?? ''}
                      onChange={(e) => setEmpForm({ ...empForm, benefits_package: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#10B981] text-white text-sm font-semibold hover:bg-emerald-600 shadow"
                    >
                      {editingEmpId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      {editingEmpId ? 'Simpan Perubahan Data' : 'Simpan Data Baru'}
                    </button>
                  </div>
                </form>

                {/* ===================================================================
                    DATABASE PELACAKAN KARYAWAN AKTIF vs DATABASE ORANG YANG PERNAH BEKERJA SAMA (ARSIP)
                   =================================================================== */}
                <div className="pt-2 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setEmpActiveTab('active')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                          empActiveTab === 'active'
                            ? 'bg-[#1E40AF] text-white shadow-md'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <UserCheck className="w-4 h-4" /> Database Karyawan Aktif, Kontrak H-2 Bulan & Resign ({employees.filter((e) => e.is_active).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmpActiveTab('archived')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                          empActiveTab === 'archived'
                            ? 'bg-amber-600 text-white shadow-md'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <FolderArchive className="w-4 h-4" /> Database Orang Pernah Bekerja Sama / Arsip Alumni, Mitra & Talent ({employees.filter((e) => !e.is_active).length})
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const targetList = empActiveTab === 'active' ? employees.filter((e) => e.is_active) : employees.filter((e) => !e.is_active);
                        const headers = [
                          'No',
                          'NIK / ID',
                          'Nama Lengkap',
                          'Kategori',
                          'Jabatan / Spesialisasi',
                          'Departemen',
                          'Status Kontrak',
                          'Tgl Mulai Kontrak',
                          'Tgl Berakhir Kontrak',
                          'Sisa Waktu Kontrak (H-2 Bulan)',
                          'Status Resign / One Month Notice',
                          'Tgl Pengajuan Resign',
                          'Tgl Efektif Terakhir',
                          'Alamat / Domisili',
                          'Kontak WhatsApp',
                          'Email',
                          'Harga Budget / Rate Fee',
                          'Project yang Ditangani',
                          'Keterangan / Catatan',
                        ];
                        const rows = targetList.map((emp, idx) => {
                          const cInfo = getContractCountdownInfo(emp.contract_end_date, emp.employment_status);
                          const rInfo = getResignNoticeInfo(emp);
                          return [
                            idx + 1,
                            emp.employee_nik,
                            emp.full_name,
                            emp.collaborator_category || (emp.is_active ? 'Karyawan Internal' : 'Alumni / Mitra'),
                            emp.role_title,
                            emp.department,
                            emp.employment_status,
                            emp.contract_start_date || '-',
                            emp.contract_end_date || '-',
                            cInfo.label,
                            rInfo.label,
                            emp.resign_notice_date || '-',
                            emp.resign_effective_date || '-',
                            emp.address_domicile || '-',
                            emp.whatsapp_contact || '-',
                            emp.email || '-',
                            emp.rate_budget || '-',
                            emp.assigned_project || '-',
                            emp.notes || emp.deactivation_reason || '-',
                          ];
                        });
                        downloadExcelWorkbook(
                          empActiveTab === 'active'
                            ? `Database_Karyawan_Kontrak_Resign_${todayStr}`
                            : `Database_Arsip_Mitra_Pernah_Bekerjasama_${todayStr}`,
                          [
                            {
                              sheetName: empActiveTab === 'active' ? 'Karyawan_Aktif_Kontrak' : 'Arsip_Mitra_Kolaborator',
                              headers,
                              rows,
                              titleRows: [
                                [settings.company_name.toUpperCase()],
                                [
                                  empActiveTab === 'active'
                                    ? 'DATABASE KARYAWAN AKTIF, SISA KONTRAK (H-2 BULAN) & PELACAKAN ONE MONTH NOTICE RESIGN'
                                    : 'DATABASE ORANG YANG PERNAH BEKERJA SAMA (ARSIP ALUMNI, FREELANCER, MITRA PRODUKSI, KOL/TALENT & VENDOR)',
                                ],
                              ],
                            },
                          ]
                        );
                        triggerToast('Database berhasil diunduh ke Excel (.xlsx)!');
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold hover:bg-amber-100 transition shadow-xs"
                    >
                      <FileSpreadsheet className="w-4 h-4" /> Unduh Tabel Ini (.xlsx)
                    </button>
                  </div>

                  {empActiveTab === 'active' ? (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-blue-100 text-[#1E40AF] rounded-xl">
                            <Users className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900">
                              Database Pelacakan Karyawan Aktif, Countdown Kontrak (Start H-2 Bulan) & Resign Notice
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              Dilengkapi kontak WA, alamat/domisili, harga budget, project, sisa waktu kontrak mulai H-2 bulan, dan pengingat One-Month Notice resign.
                            </p>
                          </div>
                        </div>

                        <div className="relative w-full sm:w-64">
                          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                          <input
                            type="text"
                            value={filterSearch ?? ''}
                            onChange={(e) => setFilterSearch(e.target.value)}
                            placeholder="Cari nama, NIK, alamat, WA, project..."
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-none focus:ring-2 focus:ring-blue-600"
                          />
                        </div>
                      </div>

                      {/* Filter Pills */}
                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-slate-600 mr-1 flex items-center gap-1">
                            <Filter className="w-3.5 h-3.5 text-slate-400" /> Dept:
                          </span>
                          {['Semua', 'Creative', 'Sales & Marketing', 'Operasional', 'Managing Director'].map((dept) => (
                            <button
                              key={dept}
                              type="button"
                              onClick={() => setFilterDept(dept)}
                              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                                filterDept === dept
                                  ? 'bg-[#1E40AF] text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {dept}
                            </button>
                          ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-slate-600 mr-1 flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Kontrak:
                          </span>
                          {['Semua', 'Full Time', 'Full Time Performance Based', 'Probation', 'Freelance'].map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => setFilterStatus(st)}
                              className={`px-2.5 py-1.5 rounded-xl font-bold transition text-[11px] ${
                                filterStatus === st
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {st === 'Full Time Performance Based' ? 'Performance Based' : st}
                            </button>
                          ))}
                        </div>
                      </div>

                      {(() => {
                        const activeEmps = employees.filter((e) => e.is_active);
                        const filteredEmployees = activeEmps.filter((emp) => {
                          const matchDept = filterDept === 'Semua' || emp.department === filterDept;
                          const matchStatus = filterStatus === 'Semua' || emp.employment_status === filterStatus;
                          const s = (filterSearch ?? '').toLowerCase();
                          const matchSearch =
                            !s ||
                            (emp.full_name ?? '').toLowerCase().includes(s) ||
                            (emp.employee_nik ?? '').toLowerCase().includes(s) ||
                            (emp.role_title ?? '').toLowerCase().includes(s) ||
                            (emp.address_domicile ?? '').toLowerCase().includes(s) ||
                            (emp.whatsapp_contact ?? '').toLowerCase().includes(s) ||
                            (emp.assigned_project ?? '').toLowerCase().includes(s);
                          return matchDept && matchStatus && matchSearch;
                        });

                        return (
                          <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-sm text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-100 text-slate-700 text-xs uppercase">
                                  <th className="p-3 border-b">No</th>
                                  <th className="p-3 border-b">Profil, Alamat & Kontak WA/Email</th>
                                  <th className="p-3 border-b">Jabatan, Budget & Project</th>
                                  <th className="p-3 border-b">Tgl Kontrak & Sisa Waktu (Start H-2 Bulan)</th>
                                  <th className="p-3 border-b">Status Resign & One-Month Notice</th>
                                  <th className="p-3 border-b text-right">Aksi Administrator</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {filteredEmployees.map((emp, index) => {
                                  const leave = getEmployeeLeaveStats(emp.id, emp.annual_leave_quota || 12);
                                  const cInfo = getContractCountdownInfo(emp.contract_end_date, emp.employment_status);
                                  const rInfo = getResignNoticeInfo(emp);
                                  return (
                                    <tr key={emp.id} className="hover:bg-slate-50 transition">
                                      <td className="p-3 text-xs font-mono text-slate-400">{index + 1}</td>
                                      <td className="p-3">
                                        <div className="font-bold text-slate-900">{emp.full_name}</div>
                                        <div className="text-xs font-mono text-slate-500">{emp.employee_nik}</div>
                                        <div className="text-[11px] text-slate-600 mt-1">
                                          📍 {emp.address_domicile || emp.work_location || 'Makassar'}
                                        </div>
                                        <div className="text-[11px] text-emerald-700 font-mono">
                                          📞 {emp.whatsapp_contact || '-'} • ✉️ {emp.email || '-'}
                                        </div>
                                      </td>
                                      <td className="p-3 text-xs space-y-1">
                                        <div className="font-bold text-slate-800">{emp.role_title}</div>
                                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                                          {emp.department} • {emp.employment_status}
                                        </span>
                                        <div className="text-[#1E40AF] font-bold">
                                          💰 Budget: {emp.rate_budget || '-'}
                                        </div>
                                        <div className="text-slate-600">
                                          🎬 Project: <strong>{emp.assigned_project || '-'}</strong>
                                        </div>
                                        {emp.notes && (
                                          <div className="text-[11px] text-slate-500 italic">"{emp.notes}"</div>
                                        )}
                                      </td>
                                      <td className="p-3 text-xs space-y-1.5">
                                        <div>
                                          <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${cInfo.badgeClass}`}>
                                            {cInfo.label}
                                          </span>
                                        </div>
                                        <div className="text-[11px] text-slate-600 font-mono">
                                          Mulai: <strong>{emp.contract_start_date || '-'}</strong>
                                        </div>
                                        <div className="text-[11px] text-slate-600 font-mono">
                                          Habis: <strong>{emp.contract_end_date || 'Permanen'}</strong>
                                        </div>
                                        <div className="text-[11px] text-blue-700 font-bold">
                                          🌴 Sisa Cuti: {leave.remaining}/{leave.quota} Hari
                                        </div>
                                      </td>
                                      <td className="p-3 text-xs space-y-1">
                                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${rInfo.badgeClass}`}>
                                          {rInfo.label}
                                        </span>
                                        {emp.resign_status && emp.resign_status !== 'Aktif' && (
                                          <div className="text-[11px] text-rose-800 bg-rose-50 p-2 rounded-lg border border-rose-200 mt-1 space-y-0.5">
                                            <div>Notice: <strong>{emp.resign_notice_date || '-'}</strong></div>
                                            <div>Efektif: <strong>{emp.resign_effective_date || '-'}</strong></div>
                                            {emp.resign_reason && <div>Alasan: {emp.resign_reason}</div>}
                                            {emp.handover_notes && <div>Handover: {emp.handover_notes}</div>}
                                          </div>
                                        )}
                                      </td>
                                      <td className="p-3 text-right">
                                        <div className="inline-flex items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingEmpId(emp.id);
                                              setEmpForm({
                                                employee_nik: emp.employee_nik,
                                                tax_bpjs_id: emp.tax_bpjs_id || '',
                                                full_name: emp.full_name,
                                                gender: emp.gender || 'L',
                                                role_title: emp.role_title,
                                                department: emp.department || 'Creative',
                                                employment_status: emp.employment_status || 'Full Time',
                                                contract_duration: emp.contract_duration || '',
                                                contract_start_date: emp.contract_start_date || '2026-01-01',
                                                contract_end_date: emp.contract_end_date || '',
                                                benefits_package: emp.benefits_package || '',
                                                assigned_project: emp.assigned_project || '',
                                                work_location: emp.work_location || 'Makassar HQ',
                                                direct_supervisor: emp.direct_supervisor || 'Managing Director',
                                                annual_leave_quota: emp.annual_leave_quota || 12,
                                                is_active: emp.is_active ?? true,
                                                address_domicile: emp.address_domicile || '',
                                                whatsapp_contact: emp.whatsapp_contact || '',
                                                email: emp.email || '',
                                                rate_budget: emp.rate_budget || '',
                                                notes: emp.notes || '',
                                                collaborator_category: emp.collaborator_category || 'Karyawan Internal',
                                                resign_status: emp.resign_status || 'Aktif',
                                                resign_notice_date: emp.resign_notice_date || '',
                                                resign_effective_date: emp.resign_effective_date || '',
                                                resign_reason: emp.resign_reason || '',
                                                handover_notes: emp.handover_notes || '',
                                              });
                                              triggerToast(`Formulir siap untuk mengedit ${emp.full_name}`);
                                              const el = document.getElementById('employee-crud-form');
                                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                                            }}
                                            title="Ubah / Edit Data Karyawan, Kontrak & Resign"
                                            className="p-2 text-[#1E40AF] hover:bg-blue-50 rounded-lg transition"
                                          >
                                            <Pencil className="w-4 h-4" />
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => {
                                              setSelectedReportEmpId(emp.id);
                                              setActiveModule('report_card');
                                              triggerToast(`Membuka Rapor Evaluasi & IDP untuk ${emp.full_name}`);
                                            }}
                                            title="Buka Rapor Evaluasi & IDP"
                                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                          >
                                            <Award className="w-4 h-4" />
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => {
                                              setDeactivatingEmp(emp);
                                              setDeactivateReason(emp.resign_reason || 'Selesai Kontrak / Masuk Database Mitra & Alumni');
                                              setDeactivateDate(emp.resign_effective_date || todayStr);
                                              setShowDeactivateModal(true);
                                            }}
                                            title="Pindahkan ke Database Orang Pernah Bekerja Sama (Arsip)"
                                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                          >
                                            <UserX className="w-4 h-4" />
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => {
                                              setDeleteConfirm({
                                                isOpen: true,
                                                title: 'Hapus Permanen Data Karyawan',
                                                message: `Apakah Anda yakin ingin menghapus permanen data "${emp.full_name}" (${emp.employee_nik})?`,
                                                onConfirm: async () => {
                                                  await SkenaHrApi.deleteEmployee(emp.id);
                                                  setEmployees(await SkenaHrApi.getEmployees());
                                                  setUserAccounts(await SkenaHrApi.fetchUsersFromSupabase());
                                                  triggerToast(`Data "${emp.full_name}" berhasil dihapus secara permanen.`);
                                                },
                                              });
                                            }}
                                            title="Hapus Permanen"
                                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        );
                      })()}
                    </>
                  ) : (
                    /* TABEL DATABASE ORANG YANG PERNAH BEKERJA SAMA (ARSIP ALUMNI, FREELANCER, MITRA, TALENT, VENDOR) */
                    (() => {
                      const archivedEmps = employees.filter((e) => !e.is_active);
                      return (
                        <div className="space-y-3">
                          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <FolderArchive className="w-6 h-6 text-amber-700 shrink-0" />
                              <div>
                                <h4 className="text-sm font-bold text-amber-950">
                                  Database Orang yang Pernah Bekerja Sama (Arsip Alumni, Freelancer, Mitra, KOL/Talent & Vendor)
                                </h4>
                                <p className="text-xs text-amber-800">
                                  Memuat informasi personal, nama, alamat/domisili, kontak WA, email, harga budget / rate card, project yang pernah dikerjakan, dan keterangan evaluasi. Dapat ditambah atau diedit kapan saja melalui formulir di atas.
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingEmpId(null);
                                setEmpForm({
                                  employee_nik: `COL-2026-0${archivedEmps.length + 1}`,
                                  tax_bpjs_id: '-',
                                  full_name: '',
                                  gender: 'L',
                                  role_title: 'Freelancer / Mitra / Talent',
                                  department: 'Creative',
                                  employment_status: 'Freelance',
                                  contract_duration: 'Project Based',
                                  contract_start_date: todayStr,
                                  contract_end_date: todayStr,
                                  benefits_package: 'Fee Per Project',
                                  assigned_project: '',
                                  work_location: 'Makassar / On-Site',
                                  direct_supervisor: 'Creative Director',
                                  annual_leave_quota: 0,
                                  is_active: false,
                                  address_domicile: '',
                                  whatsapp_contact: '',
                                  email: '',
                                  rate_budget: '',
                                  notes: '',
                                  collaborator_category: 'Freelancer / Mitra',
                                  resign_status: 'Resigned',
                                });
                                const el = document.getElementById('employee-crud-form');
                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                                triggerToast('Silakan isi data Mitra / Kolaborator / Alumni pada formulir di atas.');
                              }}
                              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs"
                            >
                              <Plus className="w-4 h-4" /> Tambah Mitra / Orang Pernah Bekerja Sama
                            </button>
                          </div>

                          <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-sm text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-100 text-slate-700 text-xs uppercase">
                                  <th className="p-3 border-b">No</th>
                                  <th className="p-3 border-b">Nama, Kategori & Spesialisasi</th>
                                  <th className="p-3 border-b">Alamat / Domisili, WA & Email</th>
                                  <th className="p-3 border-b">Harga Budget / Rate & Project</th>
                                  <th className="p-3 border-b">Keterangan & Riwayat Kerjasama</th>
                                  <th className="p-3 border-b text-right">Aksi Administrator</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {archivedEmps.map((emp, index) => (
                                  <tr key={emp.id} className="hover:bg-slate-50 transition">
                                    <td className="p-3 text-xs font-mono text-slate-400">{index + 1}</td>
                                    <td className="p-3">
                                      <div className="font-bold text-slate-900">{emp.full_name}</div>
                                      <div className="text-xs font-mono text-slate-500">{emp.employee_nik}</div>
                                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                                        {emp.collaborator_category || 'Alumni / Mitra'}
                                      </span>
                                      <div className="text-xs text-slate-600 mt-0.5">{emp.role_title} ({emp.department})</div>
                                    </td>
                                    <td className="p-3 text-xs space-y-1">
                                      <div className="text-slate-800">📍 <strong>Domisili:</strong> {emp.address_domicile || emp.work_location || '-'}</div>
                                      <div className="text-emerald-700 font-mono">📞 <strong>WA:</strong> {emp.whatsapp_contact || '-'}</div>
                                      <div className="text-blue-700">✉️ <strong>Email:</strong> {emp.email || '-'}</div>
                                    </td>
                                    <td className="p-3 text-xs space-y-1">
                                      <div className="font-bold text-[#1E40AF]">💰 Budget/Rate: {emp.rate_budget || '-'}</div>
                                      <div className="text-slate-700">🎬 <strong>Project:</strong> {emp.assigned_project || '-'}</div>
                                      <div className="text-[11px] text-slate-500">Periode: {emp.contract_duration || '-'}</div>
                                    </td>
                                    <td className="p-3 text-xs space-y-1">
                                      <div className="text-slate-800">{emp.notes || emp.deactivation_reason || '-'}</div>
                                      {emp.deactivation_date && (
                                        <div className="text-[11px] text-slate-400 font-mono">Tgl Arsip: {emp.deactivation_date}</div>
                                      )}
                                    </td>
                                    <td className="p-3 text-right">
                                      <div className="inline-flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingEmpId(emp.id);
                                            setEmpForm({
                                              employee_nik: emp.employee_nik,
                                              tax_bpjs_id: emp.tax_bpjs_id || '',
                                              full_name: emp.full_name,
                                              gender: emp.gender || 'L',
                                              role_title: emp.role_title,
                                              department: emp.department || 'Creative',
                                              employment_status: emp.employment_status || 'Freelance',
                                              contract_duration: emp.contract_duration || '',
                                              contract_start_date: emp.contract_start_date || '',
                                              contract_end_date: emp.contract_end_date || '',
                                              benefits_package: emp.benefits_package || '',
                                              assigned_project: emp.assigned_project || '',
                                              work_location: emp.work_location || 'Makassar HQ',
                                              direct_supervisor: emp.direct_supervisor || 'Managing Director',
                                              annual_leave_quota: emp.annual_leave_quota || 0,
                                              is_active: emp.is_active ?? false,
                                              address_domicile: emp.address_domicile || '',
                                              whatsapp_contact: emp.whatsapp_contact || '',
                                              email: emp.email || '',
                                              rate_budget: emp.rate_budget || '',
                                              notes: emp.notes || '',
                                              collaborator_category: emp.collaborator_category || 'Freelancer / Mitra',
                                              resign_status: emp.resign_status || 'Resigned',
                                              resign_notice_date: emp.resign_notice_date || '',
                                              resign_effective_date: emp.resign_effective_date || '',
                                              resign_reason: emp.resign_reason || '',
                                              handover_notes: emp.handover_notes || '',
                                            });
                                            triggerToast(`Formulir siap untuk mengedit data arsip/mitra ${emp.full_name}`);
                                            const el = document.getElementById('employee-crud-form');
                                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                                          }}
                                          title="Edit Data Mitra / Arsip"
                                          className="p-1.5 text-[#1E40AF] hover:bg-blue-50 rounded-lg transition"
                                        >
                                          <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleRestoreEmployee(emp)}
                                          title="Aktifkan Menjadi Karyawan Aktif"
                                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition"
                                        >
                                          <RotateCcw className="w-3.5 h-3.5" /> Aktifkan
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setDeleteConfirm({
                                              isOpen: true,
                                              title: 'Hapus Permanen Data Arsip / Mitra',
                                              message: `Hapus permanen data "${emp.full_name}" dari database?`,
                                              onConfirm: async () => {
                                                await SkenaHrApi.deleteEmployee(emp.id);
                                                setEmployees(await SkenaHrApi.getEmployees());
                                                setUserAccounts(await SkenaHrApi.fetchUsersFromSupabase());
                                                triggerToast(`Data "${emp.full_name}" berhasil dihapus permanen.`);
                                              },
                                            });
                                          }}
                                          title="Hapus Permanen"
                                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>

              {/* CRUD KAMUS KOMPETENSI (COMPETENCY DICTIONARY) & COMPETENCY MATRIX */}
              <div id="competency-crud-form" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">Kamus Kompetensi (Competency Dictionary) & Competency Matrix</h3>
                    <p className="text-xs text-slate-500">
                      Kelola kamus kompetensi lengkap (deskripsi indikator, standar kemahiran Level 1–5, target threshold) serta matriks pemetaan kompetensi lintas jabatan & karyawan.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setCompMatrixView('dictionary')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          compMatrixView === 'dictionary' ? 'bg-[#1E40AF] text-white' : 'text-slate-600'
                        }`}
                      >
                        📖 Kamus Kompetensi (Level 1–5)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCompMatrixView('matrix')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          compMatrixView === 'matrix' ? 'bg-[#1E40AF] text-white' : 'text-slate-600'
                        }`}
                      >
                        📊 Competency Matrix (Pemetaan Tim)
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const headers = [
                          'Kode Kompetensi',
                          'Nama Kompetensi',
                          'Kategori',
                          'Passing Threshold',
                          'Standar WLA (Jam/Minggu)',
                          'Deskripsi Kamus Kompetensi',
                          'Level 1 (Basic)',
                          'Level 2 (Novice)',
                          'Level 3 (Intermediate)',
                          'Level 4 (Advanced)',
                          'Level 5 (Expert/Master)',
                        ];
                        const rows = competencies.map((c) => [
                          c.competency_code,
                          c.competency_name,
                          c.category,
                          c.target_threshold,
                          c.standard_workload_hours || 40,
                          c.description || '-',
                          c.level_1_desc || '-',
                          c.level_2_desc || '-',
                          c.level_3_desc || '-',
                          c.level_4_desc || '-',
                          c.level_5_desc || '-',
                        ]);
                        downloadExcelWorkbook(`Kamus_Kompetensi_Matrix_Skena_${todayStr}`, [
                          {
                            sheetName: 'Kamus_Kompetensi',
                            headers,
                            rows,
                            titleRows: [
                              [settings.company_name.toUpperCase()],
                              ['KAMUS KOMPETENSI (COMPETENCY DICTIONARY) & STANDAR LEVEL KEMAHIRAN 1-5'],
                            ],
                          },
                        ]);
                        triggerToast('Kamus Kompetensi berhasil diunduh (.xlsx)!');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#10B981] text-white text-xs font-bold hover:bg-emerald-600"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" /> Unduh Kamus & Matrix (.xlsx)
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSaveCompetency} className="grid grid-cols-1 md:grid-cols-6 gap-3 bg-slate-50 p-4 rounded-xl border">
                  <input
                    type="text"
                    required
                    placeholder="Kode (KPI-03)"
                    value={compForm.competency_code ?? ''}
                    onChange={(e) => setCompForm({ ...compForm, competency_code: e.target.value })}
                    className="px-3 py-2 border rounded-lg text-xs bg-white font-mono"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Nama Kompetensi / Indikator KPI"
                    value={compForm.competency_name ?? ''}
                    onChange={(e) => setCompForm({ ...compForm, competency_name: e.target.value })}
                    className="px-3 py-2 border rounded-lg text-xs bg-white md:col-span-2 font-semibold"
                  />
                  <select
                    value={compForm.category ?? 'Core KPI'}
                    onChange={(e) => setCompForm({ ...compForm, category: e.target.value as any })}
                    className="px-3 py-2 border rounded-lg text-xs bg-white font-medium"
                  >
                    <option value="Core KPI">Core KPI</option>
                    <option value="Hard Skill">Hard Skill</option>
                    <option value="Soft Skill">Soft Skill</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Passing Target (75)"
                    value={compForm.target_threshold ?? 75}
                    onChange={(e) => setCompForm({ ...compForm, target_threshold: Number(e.target.value) })}
                    className="px-3 py-2 border rounded-lg text-xs bg-white font-semibold"
                  />
                  <input
                    type="number"
                    placeholder="Standar Jam WLA (40)"
                    value={compForm.standard_workload_hours ?? 40}
                    onChange={(e) => setCompForm({ ...compForm, standard_workload_hours: Number(e.target.value) })}
                    className="px-3 py-2 border rounded-lg text-xs bg-white font-mono"
                  />

                  <div className="md:col-span-6">
                    <input
                      type="text"
                      placeholder="Deskripsi Kamus Kompetensi (Definisi perilaku/teknis yang diukur oleh indikator ini)..."
                      value={compForm.description ?? ''}
                      onChange={(e) => setCompForm({ ...compForm, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500">Level 1 (Basic)</label>
                    <input
                      type="text"
                      value={compForm.level_1_desc ?? ''}
                      onChange={(e) => setCompForm({ ...compForm, level_1_desc: e.target.value })}
                      className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500">Level 2 (Novice)</label>
                    <input
                      type="text"
                      value={compForm.level_2_desc ?? ''}
                      onChange={(e) => setCompForm({ ...compForm, level_2_desc: e.target.value })}
                      className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500">Level 3 (Intermediate)</label>
                    <input
                      type="text"
                      value={compForm.level_3_desc ?? ''}
                      onChange={(e) => setCompForm({ ...compForm, level_3_desc: e.target.value })}
                      className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500">Level 4 (Advanced)</label>
                    <input
                      type="text"
                      value={compForm.level_4_desc ?? ''}
                      onChange={(e) => setCompForm({ ...compForm, level_4_desc: e.target.value })}
                      className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500">Level 5 (Master)</label>
                    <input
                      type="text"
                      value={compForm.level_5_desc ?? ''}
                      onChange={(e) => setCompForm({ ...compForm, level_5_desc: e.target.value })}
                      className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div className="flex items-end gap-1.5">
                    <button type="submit" className="flex-1 bg-[#1E40AF] text-white rounded-lg text-xs font-bold px-3 py-2 hover:bg-blue-800">
                      {editingCompId ? 'Simpan' : 'Tambah Kamus'}
                    </button>
                    {editingCompId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCompId(null);
                          setCompForm({
                            competency_code: '',
                            competency_name: '',
                            category: 'Core KPI',
                            target_threshold: 78,
                            standard_workload_hours: 40,
                            description: '',
                          });
                        }}
                        className="px-2.5 py-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </form>

                {compMatrixView === 'dictionary' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {competencies.map((c) => (
                      <div key={c.id} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-[#1E40AF]">
                                {c.competency_code}
                              </span>
                              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                {c.category}
                              </span>
                              <span className="text-xs text-emerald-700 font-bold">
                                Target ≥ {c.target_threshold} • {c.standard_workload_hours || 40} Jam/Mgg
                              </span>
                            </div>
                            <h4 className="font-bold text-sm mt-1 text-slate-900">{c.competency_name}</h4>
                            {c.description && <p className="text-xs text-slate-600 mt-0.5">{c.description}</p>}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCompId(c.id);
                                setCompForm({
                                  competency_code: c.competency_code,
                                  competency_name: c.competency_name,
                                  category: c.category,
                                  target_threshold: c.target_threshold,
                                  standard_workload_hours: c.standard_workload_hours || 40,
                                  description: c.description || '',
                                  level_1_desc: c.level_1_desc || 'Level 1 (Basic)',
                                  level_2_desc: c.level_2_desc || 'Level 2 (Novice)',
                                  level_3_desc: c.level_3_desc || 'Level 3 (Intermediate)',
                                  level_4_desc: c.level_4_desc || 'Level 4 (Advanced)',
                                  level_5_desc: c.level_5_desc || 'Level 5 (Master)',
                                });
                                const el = document.getElementById('competency-crud-form');
                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="text-[#1E40AF] hover:bg-blue-50 p-1.5 rounded-lg"
                              title="Edit Kamus Kompetensi"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCompTarget(c);
                                setShowKpiTargetModal(true);
                              }}
                              className="text-emerald-700 hover:bg-emerald-50 p-1.5 rounded-lg"
                              title="Sesuaikan Target & Jam WLA"
                            >
                              <SlidersHorizontal className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteConfirm({
                                  isOpen: true,
                                  title: 'Hapus Kamus Kompetensi',
                                  message: `Hapus kompetensi "${c.competency_code} - ${c.competency_name}"?`,
                                  onConfirm: async () => {
                                    await SkenaHrApi.deleteCompetency(c.id);
                                    setCompetencies(await SkenaHrApi.getCompetencies());
                                    triggerToast(`Kompetensi "${c.competency_name}" berhasil dihapus.`);
                                  },
                                });
                              }}
                              className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg"
                              title="Hapus Kompetensi"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-5 gap-1.5 pt-2 border-t border-slate-100 text-[10px]">
                          {[
                            { lvl: 'L1', text: c.level_1_desc || 'Basic' },
                            { lvl: 'L2', text: c.level_2_desc || 'Novice' },
                            { lvl: 'L3', text: c.level_3_desc || 'Intermediate' },
                            { lvl: 'L4', text: c.level_4_desc || 'Advanced' },
                            { lvl: 'L5', text: c.level_5_desc || 'Master' },
                          ].map((b) => (
                            <div key={b.lvl} className="p-1.5 rounded-lg bg-slate-50 border border-slate-200">
                              <span className="font-black text-[#1E40AF] block">{b.lvl}</span>
                              <span className="text-slate-600 line-clamp-2">{b.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* COMPETENCY MATRIX INTERAKTIF LINTAS KARYAWAN & LEVEL KEMAHIRAN */
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white">
                          <th className="p-3 border border-slate-700">Karyawan & Jabatan</th>
                          {competencies.map((c) => (
                            <th key={c.id} className="p-2.5 border border-slate-700 text-center min-w-[120px]">
                              <div className="font-mono text-amber-300">{c.competency_code}</div>
                              <div className="font-semibold text-[11px]">{c.competency_name}</div>
                              <div className="text-[10px] text-slate-400">Target ≥ {c.target_threshold}</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {employees
                          .filter((e) => e.is_active)
                          .map((emp) => (
                            <tr key={emp.id} className="hover:bg-slate-50">
                              <td className="p-3 border font-bold text-slate-900 bg-slate-50">
                                <div>{emp.full_name}</div>
                                <div className="text-[10px] text-slate-500 font-normal">
                                  {emp.role_title} ({emp.department})
                                </div>
                              </td>
                              {competencies.map((c) => {
                                const rec = (kpiList || []).find(
                                  (ev) => ev.employee_id === emp.id && ev.competency_id === c.id
                                );
                                const score = rec ? Number(rec.final_kpi_score) : 0;
                                const passed = score >= c.target_threshold;
                                const level =
                                  score >= 90
                                    ? 'L5 (Master)'
                                    : score >= 82
                                    ? 'L4 (Advanced)'
                                    : score >= 75
                                    ? 'L3 (Proficient)'
                                    : score >= 65
                                    ? 'L2 (Developing)'
                                    : score > 0
                                    ? 'L1 (Basic)'
                                    : 'Belum Dinilai';
                                return (
                                  <td key={c.id} className="p-2.5 border text-center">
                                    {score > 0 ? (
                                      <div className="space-y-0.5">
                                        <span
                                          className={`inline-block px-2 py-0.5 rounded-full font-black text-xs ${
                                            passed
                                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                                          }`}
                                        >
                                          {score.toFixed(1)}
                                        </span>
                                        <div className="text-[10px] font-bold text-slate-600">{level}</div>
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 italic">-</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {/* ===================================================================
            MODUL 2: JADWAL KERJA, PRODUKSI KONTEN & KALENDER AGENDA KE DEPAN
            (DAPAT DIISI MANDIRI OLEH KARYAWAN MAUPUN DIATUR ADMINISTRATOR)
           =================================================================== */}
        {activeModule === 'schedules' && (
          <div className="space-y-6">
            {/* Form Input Jadwal Mandiri Karyawan & Administrator */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 no-print">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                <div>
                  <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#1E40AF]" />
                    {currentUser.role === 'admin'
                      ? 'Pengaturan Jadwal Shift, Produksi & Kalender Tim (Mode Administrator)'
                      : 'Input Mandiri Jadwal Shift, Liputan & Agenda Produksi Saya'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Karyawan maupun Administrator dapat mengisi jadwal kerja/produksi ke depan beserta tanggal kalender spesifik agar terangkum otomatis.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setScheduleSubTab('calendar')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                      scheduleSubTab === 'calendar'
                        ? 'bg-[#1E40AF] text-white shadow'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    📅 Rangkuman Kalender Ke Depan
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleSubTab('weekly')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                      scheduleSubTab === 'weekly'
                        ? 'bg-[#1E40AF] text-white shadow'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    🗓️ Matriks Shift Mingguan
                  </button>
                </div>
              </div>

              <form
                id="schedule-crud-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const compId = schedForm.competency_id || competencies[0]?.id || '';
                  if (!compId) {
                    triggerToast('Pilih fokus kompetensi/KPI terlebih dahulu!', 'error');
                    return;
                  }
                  setIsLoading(true);
                  try {
                    const currentEmpId = currentUser.role === 'employee' ? currentUser.employeeId : schedAssignee;
                    const assignedEmp = employees.find((emp) => emp.id === currentEmpId);
                    const payload: Omit<WorkSchedule, 'id' | 'competencies'> = {
                      ...schedForm,
                      competency_id: compId,
                      schedule_date: schedForm.schedule_date || todayStr,
                      employee_id:
                        currentUser.role === 'employee'
                          ? currentUser.employeeId
                          : schedAssignee === 'all'
                          ? undefined
                          : schedAssignee,
                      employee_name:
                        currentUser.role === 'employee'
                          ? currentUser.name
                          : schedAssignee === 'all'
                          ? 'Seluruh Tim / Lintas Divisi'
                          : assignedEmp?.full_name || currentUser.name,
                      created_by_role: currentUser.role,
                    };
                    if (editingScheduleId) {
                      await SkenaHrApi.upsertSchedule({ ...payload, id: editingScheduleId });
                      setEditingScheduleId(null);
                      triggerToast(`Jadwal "${payload.shift_code}" berhasil diperbarui!`);
                    } else {
                      await SkenaHrApi.createSchedule(payload);
                      triggerToast(
                        `Jadwal "${payload.shift_code}" untuk tanggal ${payload.schedule_date} (${payload.day_of_week}) berhasil ditambahkan ke kalender!`
                      );
                    }
                    setSchedules(await SkenaHrApi.getSchedules());
                  } catch (err: any) {
                    triggerToast(err.message, 'error');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200"
              >
                {editingScheduleId && (
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Pencil className="w-3.5 h-3.5 text-blue-700" /> Mode Edit Jadwal Kalender Aktif: {schedForm.shift_code}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingScheduleId(null);
                        triggerToast('Mode edit jadwal dibatalkan.');
                      }}
                      className="px-2.5 py-1 rounded bg-white text-rose-600 border border-rose-200 hover:bg-rose-50"
                    >
                      Batal Edit Jadwal
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                      Tanggal Kalender (Ke Depan)
                    </label>
                    <input
                      type="date"
                      required
                      value={schedForm.schedule_date ?? todayStr}
                      onChange={(e) => {
                        const dateVal = e.target.value;
                        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                        const dObj = new Date(dateVal + 'T00:00:00');
                        const autoDay = !isNaN(dObj.getTime()) ? dayNames[dObj.getDay()] : schedForm.day_of_week;
                        setSchedForm({
                          ...schedForm,
                          schedule_date: dateVal,
                          day_of_week: autoDay,
                        });
                      }}
                      className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">Hari Kerja</label>
                    <select
                      value={schedForm.day_of_week ?? 'Senin'}
                      onChange={(e) => setSchedForm({ ...schedForm, day_of_week: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-xs font-semibold bg-white"
                    >
                      {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">Jam Mulai & Selesai</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="time"
                        value={schedForm.start_time ?? '09:00'}
                        onChange={(e) => setSchedForm({ ...schedForm, start_time: e.target.value })}
                        className="px-2.5 py-2 border rounded-lg text-xs font-mono bg-white"
                      />
                      <input
                        type="time"
                        value={schedForm.end_time ?? '12:00'}
                        onChange={(e) => setSchedForm({ ...schedForm, end_time: e.target.value })}
                        className="px-2.5 py-2 border rounded-lg text-xs font-mono bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                      Personil / Penanggung Jawab
                    </label>
                    {currentUser.role === 'admin' ? (
                      <select
                        value={schedAssignee}
                        onChange={(e) => setSchedAssignee(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-xs font-semibold bg-white text-[#1E40AF]"
                      >
                        <option value="all">Seluruh Tim / Umum</option>
                        {employees
                          .filter((e) => e.is_active)
                          .map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.full_name} ({emp.role_title})
                            </option>
                          ))}
                      </select>
                    ) : (
                      <div className="px-3 py-2 border rounded-lg text-xs font-bold bg-blue-50 text-[#1E40AF] truncate">
                        👤 {currentUser.name}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                      Nama Shift / Sesi Produksi *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Shooting Konten Klien / WFO"
                      value={schedForm.shift_code ?? ''}
                      onChange={(e) => setSchedForm({ ...schedForm, shift_code: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-xs bg-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                      Fokus KPI / Kompetensi *
                    </label>
                    <select
                      value={schedForm.competency_id || competencies[0]?.id || ''}
                      onChange={(e) => setSchedForm({ ...schedForm, competency_id: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
                    >
                      <option value="">-- Pilih Fokus KPI --</option>
                      {competencies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.competency_code} - {c.competency_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                      Lokasi & Rincian Agenda Kerja
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Studio Makassar / Outdoor Liputan"
                      value={schedForm.location_agenda_notes ?? ''}
                      onChange={(e) => setSchedForm({ ...schedForm, location_agenda_notes: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#1E40AF] text-white rounded-xl text-xs font-bold px-4 py-2.5 hover:bg-blue-800 shadow transition flex items-center justify-center gap-1.5"
                  >
                    {editingScheduleId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {editingScheduleId ? 'Perbarui Jadwal Kalender' : 'Simpan ke Kalender Jadwal'}
                  </button>
                </div>
              </form>

              {/* Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">Tampilkan Agenda:</span>
                  <button
                    type="button"
                    onClick={() => setSchedFilterEmp('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      schedFilterEmp === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Semua Jadwal Tim ({schedules.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSchedFilterEmp('mine')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      schedFilterEmp === 'mine'
                        ? 'bg-[#10B981] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Jadwal Saya & Umum
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleExportSchedulesExcel}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#10B981] text-white text-xs font-bold hover:bg-emerald-600 shadow transition"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Unduh Kalender Jadwal (.xlsx)
                </button>
              </div>
            </div>

            {(() => {
              const myEmpId = currentUser.role === 'employee' ? currentUser.employeeId : selectedLoginEmpId;
              const filteredSchedules = schedules.filter((s) => {
                if (schedFilterEmp === 'all') return true;
                return !s.employee_id || s.employee_id === myEmpId || s.employee_name === currentUser.name;
              });

              if (scheduleSubTab === 'calendar') {
                // Sort chronologically by schedule_date then start_time
                const sortedByDate = [...filteredSchedules].sort((a, b) => {
                  const dateA = a.schedule_date || todayStr;
                  const dateB = b.schedule_date || todayStr;
                  if (dateA !== dateB) return dateA.localeCompare(dateB);
                  return (a.start_time || '').localeCompare(b.start_time || '');
                });

                return (
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 print-area">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                      <div>
                        <h4 className="font-bold text-base text-slate-900">
                          Rangkuman Kalender Shift, Liputan & Jadwal Produksi Ke Depan
                        </h4>
                        <p className="text-xs text-slate-500">
                          Terangkum secara kronologis berdasarkan tanggal pelaksanaan yang diinput oleh karyawan maupun administrator.
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-blue-50 text-[#1E40AF] text-xs font-bold">
                        Total Agenda Terjadwal: {sortedByDate.length} Sesi
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 uppercase">
                            <th className="p-3 border">Tanggal & Hari</th>
                            <th className="p-3 border">Jam Shift</th>
                            <th className="p-3 border">Personil / PIC</th>
                            <th className="p-3 border">Nama Shift & Sesi</th>
                            <th className="p-3 border">Fokus KPI / Kompetensi</th>
                            <th className="p-3 border">Lokasi & Catatan Agenda</th>
                            <th className="p-3 border text-center no-print">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {sortedByDate.map((item) => {
                            const canDelete =
                              currentUser.role === 'admin' ||
                              item.employee_id === currentUser.employeeId ||
                              item.employee_name === currentUser.name;
                            const isUpcoming = (item.schedule_date || todayStr) >= todayStr;
                            return (
                              <tr key={item.id} className="hover:bg-slate-50">
                                <td className="p-3 border">
                                  <div className="font-mono font-bold text-slate-900">
                                    {item.schedule_date || todayStr}
                                  </div>
                                  <span
                                    className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                                      isUpcoming
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {item.day_of_week} {isUpcoming ? '• Terjadwal' : '• Selesai'}
                                  </span>
                                </td>
                                <td className="p-3 border font-mono font-bold text-[#10B981]">
                                  {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)} WITA
                                </td>
                                <td className="p-3 border">
                                  <span className="px-2.5 py-1 rounded-full bg-blue-50 text-[#1E40AF] font-bold text-[11px]">
                                    {item.employee_name || 'Seluruh Tim Skena'}
                                  </span>
                                </td>
                                <td className="p-3 border font-bold text-slate-800">{item.shift_code}</td>
                                <td className="p-3 border font-semibold text-slate-700">
                                  {item.competencies?.competency_name || 'Kompetensi Umum'}
                                </td>
                                <td className="p-3 border text-slate-600">{item.location_agenda_notes || '-'}</td>
                                <td className="p-3 border text-center no-print">
                                  {canDelete && (
                                    <div className="inline-flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingScheduleId(item.id);
                                          setSchedForm({
                                            schedule_date: item.schedule_date || todayStr,
                                            day_of_week: item.day_of_week,
                                            shift_code: item.shift_code,
                                            start_time: item.start_time.slice(0, 5),
                                            end_time: item.end_time.slice(0, 5),
                                            competency_id: item.competency_id,
                                            location_agenda_notes: item.location_agenda_notes,
                                          });
                                          setSchedAssignee(item.employee_id || 'all');
                                          triggerToast(`Mengedit jadwal "${item.shift_code}"`);
                                          const el = document.getElementById('schedule-crud-form');
                                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        className="p-1.5 text-[#1E40AF] hover:bg-blue-50 rounded-lg transition"
                                        title="Edit Jadwal"
                                      >
                                        <Pencil className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setDeleteConfirm({
                                            isOpen: true,
                                            title: 'Hapus Jadwal Kalender',
                                            message: `Hapus jadwal "${item.shift_code}" (${item.schedule_date || item.day_of_week})?`,
                                            onConfirm: async () => {
                                              await SkenaHrApi.deleteSchedule(item.id);
                                              setSchedules(await SkenaHrApi.getSchedules());
                                              triggerToast('Jadwal berhasil dihapus.');
                                            },
                                          });
                                        }}
                                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                                        title="Hapus Jadwal"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          {sortedByDate.length === 0 && (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-slate-400">
                                Belum ada jadwal yang diinput. Silakan isi form di atas untuk menambahkan jadwal ke depan.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print-area">
                  {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((day) => {
                    const dayScheds = filteredSchedules.filter((s) => s.day_of_week === day);
                    return (
                      <div key={day} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
                        <div>
                          <div className="bg-[#1E2B6D] text-white px-4 py-2.5 font-bold text-sm flex justify-between items-center">
                            <span>{day}</span>
                            <span className="text-xs bg-blue-800 px-2.5 py-0.5 rounded-full font-semibold">{dayScheds.length} Sesi</span>
                          </div>
                          <div className="p-4 space-y-3">
                            {dayScheds.map((item) => {
                              const canDelete =
                                currentUser.role === 'admin' ||
                                item.employee_id === currentUser.employeeId ||
                                item.employee_name === currentUser.name;
                              return (
                                <div key={item.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                                  <div className="flex justify-between items-start gap-2">
                                    <div>
                                      <span className="text-xs font-bold text-[#10B981] block">
                                        {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)} • {item.shift_code}
                                      </span>
                                      {item.schedule_date && (
                                        <span className="text-[10px] font-mono text-slate-500">
                                          📅 Tanggal: {item.schedule_date}
                                        </span>
                                      )}
                                    </div>
                                    {canDelete && (
                                      <div className="inline-flex items-center gap-1 no-print">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingScheduleId(item.id);
                                            setSchedForm({
                                              schedule_date: item.schedule_date || todayStr,
                                              day_of_week: item.day_of_week,
                                              shift_code: item.shift_code,
                                              start_time: item.start_time.slice(0, 5),
                                              end_time: item.end_time.slice(0, 5),
                                              competency_id: item.competency_id,
                                              location_agenda_notes: item.location_agenda_notes,
                                            });
                                            setSchedAssignee(item.employee_id || 'all');
                                            triggerToast(`Mengedit jadwal "${item.shift_code}"`);
                                            const el = document.getElementById('schedule-crud-form');
                                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                                          }}
                                          className="text-[#1E40AF] hover:text-blue-800 p-1"
                                          title="Edit Jadwal"
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setDeleteConfirm({
                                              isOpen: true,
                                              title: 'Hapus Jadwal Shift',
                                              message: `Hapus jadwal "${item.shift_code}" pada hari ${item.day_of_week}?`,
                                              onConfirm: async () => {
                                                await SkenaHrApi.deleteSchedule(item.id);
                                                setSchedules(await SkenaHrApi.getSchedules());
                                                triggerToast('Jadwal berhasil dihapus.');
                                              },
                                            });
                                          }}
                                          className="text-rose-500 hover:text-rose-700 p-1"
                                          title="Hapus Jadwal"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="px-2 py-0.5 rounded bg-blue-100 text-[#1E40AF] text-[10px] font-bold">
                                      👤 {item.employee_name || 'Seluruh Tim'}
                                    </span>
                                  </div>
                                  <div className="font-semibold text-sm text-slate-800">
                                    {item.competencies?.competency_name || 'Kompetensi Umum'}
                                  </div>
                                  <div className="text-xs text-slate-500">{item.location_agenda_notes}</div>
                                </div>
                              );
                            })}
                            {dayScheds.length === 0 && <p className="text-xs text-slate-400 text-center py-6">Tidak ada shift dijadwalkan</p>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* ===================================================================
            MODUL 3: REKAP PRESENSI, BATCH UPSERT & LOG KEHADIRAN TERINTEGRASI
            (ADMIN: FULL CRUD TAMBAH/UBAH/GANTI NAMA/HAPUS | KARYAWAN: HANYA INPUT & LIHAT DETAIL)
           =================================================================== */}
        {/* ===================================================================
            MODUL 3: REKAP PRESENSI, KONTROL PENUH ADMIN, HITUNGAN KETERLAMBATAN (09:00 + 15M)
            & OUTPUT GRAFIK (KESELURUHAN TIM MAUPUN INDIVIDU)
           =================================================================== */}
        {activeModule === 'attendance' && (
          <div className="space-y-6">
            {/* Banner Otoritas Peran, Standar Jam Masuk 09:00 + Toleransi 15 Menit & Output Grafik */}
            <div className="bg-gradient-to-r from-[#1E2B6D] via-[#1E40AF] to-blue-800 text-white p-5 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-4 no-print">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded bg-amber-400 text-slate-900">
                    {currentUser.role === 'admin'
                      ? 'Kontrol Penuh Administrator (Edit Semua Absensi & Karyawan)'
                      : 'Mode Input Mandiri & Transparansi Grafik'}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded bg-emerald-400/20 border border-emerald-300/40 text-emerald-200 font-bold">
                    ⏰ Jam Masuk: 09:00 WITA • Toleransi Maksimal 15 Menit (s/d 09:15 WITA)
                  </span>
                </div>
                <h3 className="text-lg font-black">
                  Manajemen Absensi Lengkap, Keterangan Izin / WFH, Kalkulasi Keterlambatan & Output Grafik
                </h3>
                <p className="text-xs text-blue-100 max-w-3xl">
                  {currentUser.role === 'admin'
                    ? 'Administrator dapat mengatur dan mengedit seluruh data absensi setiap karyawan (jam masuk, status WFO/WFH/Take Content/Izin/Sakit/Cuti, lokasi, keterangan izin/WFH, hingga kuota cuti), serta memilih tampilan output dalam bentuk Grafik Keseluruhan Tim maupun Grafik Individu.'
                    : 'Masukkan kehadiran atau keterangan izin/WFH Anda serta lihat output rekapitulasi absensi dan ketepatan waktu (09:00 + toleransi 15 menit) dalam bentuk grafik maupun tabel.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setAttendanceSubTab('charts')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-900 text-xs font-black shadow transition"
                >
                  <BarChart3 className="w-4 h-4" /> Buka Output Grafik (Keseluruhan & Individu)
                </button>
                {currentUser.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuickEmpEditingId(null);
                      setQuickEmpForm({
                        employee_nik: `SKN-2026-${String(employees.length + 1).padStart(3, '0')}`,
                        full_name: '',
                        gender: 'L',
                        role_title: 'Creative Staff',
                        department: 'Creative',
                        employment_status: 'Full Time',
                        contract_duration: '12 Bulan (Jan - Des 2026)',
                        work_location: 'Makassar HQ',
                        direct_supervisor: 'Managing Director',
                        annual_leave_quota: 12,
                        is_active: true,
                      });
                      setShowQuickEmpModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-black shadow transition"
                  >
                    <Plus className="w-4 h-4" /> Tambah Karyawan Baru
                  </button>
                )}
              </div>
            </div>

            {/* PANEL KHUSUS KARYAWAN: FORM INPUT PRESENSI, WFH & KETERANGAN IZIN */}
            {currentUser.role !== 'admin' && (
              <div className="bg-white p-6 rounded-2xl border-2 border-emerald-200 shadow-xs space-y-4 no-print">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                  <div>
                    <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                      <CheckSquare className="w-5 h-5 text-[#10B981]" />
                      Form Input Kehadiran, WFH & Keterangan Izin Saya ({currentUser.name})
                    </h4>
                    <p className="text-xs text-slate-500">
                      Jam masuk standar <strong>09:00 WITA</strong> (Toleransi maksimal 15 menit s/d 09:15 WITA). Anda dapat memilih WFO, WFH, Take Content, Izin, Sakit, atau Cuti beserta keterangannya.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAttChartScope('individual');
                      setAttChartEmpId(currentUser.employeeId || employees[0]?.id || 'e-1');
                      setAttendanceSubTab('charts');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-[#1E40AF] border border-blue-200 text-xs font-bold hover:bg-blue-100"
                  >
                    <BarChart3 className="w-4 h-4" /> Lihat Grafik Absensi & Keterlambatan Saya
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Mode Kehadiran / Perizinan</label>
                    <select
                      value={selfStatus}
                      onChange={(e) => setSelfStatus(e.target.value as AttendanceStatus)}
                      className="w-full px-3 py-2 border rounded-xl text-xs font-bold bg-white text-[#1E40AF]"
                    >
                      <option value="WFO">🏢 WFO (Kantor Makassar HQ)</option>
                      <option value="WFH">🏡 WFH / WFA (Remote)</option>
                      <option value="Take Content">🎥 Take Content (Studio / Lapangan)</option>
                      <option value="Urusan Kantor">💼 Urusan Kantor (Meeting / Dinas Luar)</option>
                      <option value="Overtime">⚡ Overtime (Lembur Produksi)</option>
                      <option value="Izin">📝 Izin Resmi</option>
                      <option value="Urusan Pribadi">🏠 Urusan Pribadi</option>
                      <option value="Sakit">🏥 Izin Sakit (Medis)</option>
                      <option value="Cuti">🌴 Cuti Tahunan Resmi</option>
                      <option value="Tidak Absen">⚠️ Tidak Absen</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Tag Lokasi Kerja / Domisili</label>
                    <input
                      type="text"
                      value={selfLocation ?? ''}
                      onChange={(e) => setSelfLocation(e.target.value)}
                      placeholder="Makassar HQ / Lokasi WFH / Liputan"
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Keterangan Izin / WFH / Deliverable</label>
                    <input
                      type="text"
                      value={selfNotes ?? ''}
                      onChange={(e) => setSelfNotes(e.target.value)}
                      placeholder="Contoh: Urusan kantor klien, WFH editing, Izin urusan pribadi, dll"
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSelfCheckin}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#10B981] hover:bg-emerald-600 text-white font-black text-xs shadow transition flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Kirim Presensi / Izin Hari Ini
                  </button>
                </div>
              </div>
            )}

            {/* Navigasi Sub-Tab Modul Presensi (Termasuk Tab Grafik Keseluruhan, Individu & Perbandingan Bulanan) */}
            <div className="flex flex-wrap items-center justify-between gap-2 no-print">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setAttendanceSubTab('daily')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                    attendanceSubTab === 'daily'
                      ? 'bg-[#1E40AF] text-white shadow'
                      : 'bg-white border text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {currentUser.role === 'admin'
                    ? '1. Atur Absensi Harian & 10 Kategori Izin (Full Edit Admin)'
                    : '1. Tabel Presensi & Ketepatan Waktu Harian'}
                </button>
                <button
                  onClick={() => setAttendanceSubTab('charts')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    attendanceSubTab === 'charts'
                      ? 'bg-[#10B981] text-white shadow'
                      : 'bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  2. Output Grafik: Keseluruhan, Individu & Perbandingan Per Bulan
                </button>
                <button
                  onClick={() => setAttendanceSubTab('monthly')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                    attendanceSubTab === 'monthly'
                      ? 'bg-[#1E40AF] text-white shadow'
                      : 'bg-white border text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  3. Matriks Rekap Bulanan (10 Kategori Izin & Total Keterlambatan)
                </button>
                <button
                  onClick={() => setAttendanceSubTab('logs_detail')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                    attendanceSubTab === 'logs_detail'
                      ? 'bg-[#1E40AF] text-white shadow'
                      : 'bg-white border text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  4. Rincian Log Jam Presensi & Editor Lengkap ({monthlyAttendances.length} Log)
                </button>
              </div>
            </div>

            {/* SUB-TAB 1: TABEL PRESENSI HARIAN + KALKULASI JAM MASUK 09:00 (TOLERANSI 15 MENIT) */}
            {attendanceSubTab === 'daily' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="text-sm font-bold text-slate-700">Tanggal Presensi:</label>
                    <input
                      type="date"
                      value={selectedDate ?? ''}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        fetchDailyAttendance(e.target.value);
                      }}
                      className="px-3 py-2 border rounded-xl text-sm font-semibold bg-white"
                    />
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-600">Filter Mode/Izin:</span>
                      <select
                        value={attFilterStatus}
                        onChange={(e) => setAttFilterStatus(e.target.value)}
                        className="px-2.5 py-1.5 border rounded-xl text-xs font-bold bg-slate-50 text-slate-800"
                      >
                        <option value="Semua">Semua Status ({employees.length})</option>
                        <option value="WFO">WFO</option>
                        <option value="WFH">WFH / WFA</option>
                        <option value="Take Content">Take Content</option>
                        <option value="Urusan Kantor">Urusan Kantor</option>
                        <option value="Overtime">Overtime</option>
                        <option value="Izin">Izin Resmi</option>
                        <option value="Urusan Pribadi">Urusan Pribadi</option>
                        <option value="Sakit">Sakit</option>
                        <option value="Cuti">Cuti</option>
                        <option value="Tidak Absen">Tidak Absen</option>
                        <option value="Terlambat">Hanya yang Terlambat (&gt; 09:15)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentUser.role === 'admin' && (
                      <>
                        <button
                          type="button"
                          onClick={handleSetAllWfo}
                          className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold hover:bg-emerald-100"
                        >
                          Set Semua WFO 08:45 (1-Klik)
                        </button>
                        <button
                          type="button"
                          onClick={handleBatchSaveAttendance}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E40AF] text-white text-xs font-bold hover:bg-blue-800 shadow"
                        >
                          <Save className="w-4 h-4" /> Simpan Semua Perubahan (Batch Upsert)
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={handleExportDailyAttendanceExcel}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#10B981] text-white text-xs font-bold hover:bg-emerald-600 shadow"
                    >
                      <FileSpreadsheet className="w-4 h-4" /> Unduh Excel Harian (.xlsx)
                    </button>
                  </div>
                </div>

                {/* Ringkasan Cepat Ketepatan Waktu Tanggal Terpilih */}
                {(() => {
                  let onTime = 0;
                  let inTol = 0;
                  let late = 0;
                  let totalLateMin = 0;
                  let wfhDinasOvertime = 0;
                  let izinSakitCutiAlpa = 0;
                  employees.forEach((emp) => {
                    const rec = dailyAttendances[emp.id] || {
                      employee_id: emp.id,
                      attendance_date: selectedDate,
                      check_in_time: '08:45:00',
                      status: 'WFO' as AttendanceStatus,
                      work_location_tag: emp.work_location || 'Makassar HQ',
                      notes: '',
                    };
                    const p = analyzeAttendancePunctuality(rec.check_in_time, rec.status);
                    if (p.category === 'on_time') onTime++;
                    else if (p.category === 'within_tolerance') inTol++;
                    else if (p.category === 'late') {
                      late++;
                      totalLateMin += p.lateMinutesFrom0900;
                    } else {
                      izinSakitCutiAlpa++;
                    }
                    if (rec.status === 'WFH' || rec.status === 'Urusan Kantor' || rec.status === 'Overtime') {
                      wfhDinasOvertime++;
                    }
                  });
                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
                      <div className="p-2.5 rounded-xl bg-white border border-emerald-200">
                        <span className="text-slate-500 block">Tepat Waktu (≤ 09:00)</span>
                        <strong className="text-base font-black text-emerald-700">{onTime} Karyawan</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-amber-200">
                        <span className="text-slate-500 block">Toleransi 15m (09:01–09:15)</span>
                        <strong className="text-base font-black text-amber-700">{inTol} Karyawan</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-rose-200">
                        <span className="text-slate-500 block">Terlambat (&gt; 09:15 WITA)</span>
                        <strong className="text-base font-black text-rose-600">
                          {late} Org ({totalLateMin} Menit)
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-blue-200">
                        <span className="text-slate-500 block">WFH / Urusan Kantor / Overtime</span>
                        <strong className="text-base font-black text-[#1E40AF]">{wfhDinasOvertime} Karyawan</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-purple-200">
                        <span className="text-slate-500 block">Izin / Pribadi / Sakit / Cuti / Alpa</span>
                        <strong className="text-base font-black text-purple-700">{izinSakitCutiAlpa} Karyawan</strong>
                      </div>
                    </div>
                  );
                })()}

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 text-xs uppercase">
                        <th className="p-3 border">Karyawan & Jabatan</th>
                        <th className="p-3 border text-center">Jam Masuk (Standar 09:00)</th>
                        <th className="p-3 border">Status Ketepatan Waktu (Toleransi 15m)</th>
                        <th className="p-3 border">Mode Kehadiran / 10 Kategori Perizinan ({selectedDate})</th>
                        <th className="p-3 border">Lokasi Kerja / Domisili</th>
                        <th className="p-3 border">Keterangan Izin / WFH / Urusan Kantor</th>
                        <th className="p-3 border text-center">Grafik & Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {employees
                        .filter((emp) => {
                          if (attFilterStatus === 'Semua') return true;
                          const rec = dailyAttendances[emp.id] || {
                            employee_id: emp.id,
                            attendance_date: selectedDate,
                            check_in_time: '08:45:00',
                            status: 'WFO' as AttendanceStatus,
                            work_location_tag: emp.work_location || 'Makassar HQ',
                            notes: '',
                          };
                          if (attFilterStatus === 'Terlambat') {
                            return analyzeAttendancePunctuality(rec.check_in_time, rec.status).isLate;
                          }
                          return rec.status === attFilterStatus;
                        })
                        .map((emp) => {
                          const isAdmin = currentUser.role === 'admin';
                          const isSelfRow = currentUser.role === 'employee' && currentUser.employeeId === emp.id;
                          const canInputRow = isAdmin || isSelfRow;
                          const rec = dailyAttendances[emp.id] || {
                            employee_id: emp.id,
                            attendance_date: selectedDate,
                            check_in_time: '08:45:00',
                            status: 'WFO' as AttendanceStatus,
                            work_location_tag: emp.work_location || 'Makassar HQ',
                            notes: '',
                          };
                          const punctuality = analyzeAttendancePunctuality(rec.check_in_time, rec.status);

                          return (
                            <tr key={emp.id} className={isSelfRow ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : 'hover:bg-slate-50'}>
                              <td className="p-3 border">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                      <span>{emp.full_name}</span>
                                      {isSelfRow && (
                                        <span className="text-[10px] font-bold text-emerald-700">(Saya)</span>
                                      )}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      {emp.employee_nik} · {emp.role_title} · <span className="text-[#1E40AF] font-medium">{emp.department}</span>
                                    </div>
                                  </div>
                                  {isAdmin && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setQuickEmpEditingId(emp.id);
                                        setQuickEmpForm({ ...emp });
                                        setShowQuickEmpModal(true);
                                      }}
                                      title="Edit Nama / Jabatan / Kuota Cuti Karyawan (Admin)"
                                      className="p-1.5 rounded-lg text-[#1E40AF] hover:bg-blue-50 shrink-0"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="p-3 border text-center">
                                {canInputRow ? (
                                  <input
                                    type="time"
                                    step="1"
                                    value={rec.check_in_time || '08:45:00'}
                                    onChange={(e) => {
                                      const updatedRec = { ...rec, check_in_time: e.target.value };
                                      setDailyAttendances((prev) => ({
                                        ...prev,
                                        [emp.id]: updatedRec,
                                      }));
                                      SkenaHrApi.submitEmployeeAttendance(updatedRec).then(() => fetchMonthlyAttendance(attendanceMonth));
                                    }}
                                    className="px-2.5 py-1.5 border rounded-lg text-xs font-mono font-bold text-slate-900 bg-white border-slate-300"
                                  />
                                ) : (
                                  <span className="font-mono text-xs font-bold text-slate-700">{rec.check_in_time || '08:45:00'}</span>
                                )}
                              </td>
                              <td className="p-3 border">
                                <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold ${punctuality.badgeClass}`}>
                                  {punctuality.badgeLabel}
                                </span>
                              </td>
                              <td className="p-3 border">
                                {canInputRow ? (
                                  <div className="flex flex-wrap gap-1 max-w-xs">
                                    {(
                                      [
                                        'WFO',
                                        'WFH',
                                        'Take Content',
                                        'Urusan Kantor',
                                        'Overtime',
                                        'Izin',
                                        'Urusan Pribadi',
                                        'Sakit',
                                        'Cuti',
                                        'Tidak Absen',
                                      ] as AttendanceStatus[]
                                    ).map((st) => (
                                      <button
                                        key={st}
                                        type="button"
                                        onClick={() => {
                                          const updatedRec = {
                                            ...rec,
                                            status: st,
                                            check_in_time: rec.check_in_time || '08:45:00',
                                          };
                                          setDailyAttendances((prev) => ({
                                            ...prev,
                                            [emp.id]: updatedRec,
                                          }));
                                          SkenaHrApi.submitEmployeeAttendance(updatedRec).then(() => fetchMonthlyAttendance(attendanceMonth));
                                        }}
                                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                                          rec.status === st
                                            ? 'bg-[#1E40AF] text-white shadow-xs ring-1 ring-blue-300'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                      >
                                        {st}
                                      </button>
                                    ))}
                                  </div>
                                ) : (
                                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getAttendanceStatusBadgeClass(rec.status)}`}>
                                    {rec.status}
                                  </span>
                                )}
                              </td>
                              <td className="p-3 border">
                                {canInputRow ? (
                                  <input
                                    type="text"
                                    value={rec.work_location_tag ?? ''}
                                    onChange={(e) => {
                                      const updatedRec = { ...rec, work_location_tag: e.target.value };
                                      setDailyAttendances((prev) => ({
                                        ...prev,
                                        [emp.id]: updatedRec,
                                      }));
                                      SkenaHrApi.submitEmployeeAttendance(updatedRec);
                                    }}
                                    placeholder="Makassar HQ / Lokasi WFH / Studio"
                                    className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white"
                                  />
                                ) : (
                                  <span className="text-xs text-slate-600">{rec.work_location_tag || 'Makassar HQ'}</span>
                                )}
                              </td>
                              <td className="p-3 border">
                                {canInputRow ? (
                                  <input
                                    type="text"
                                    value={rec.notes ?? ''}
                                    onChange={(e) => {
                                      const updatedRec = { ...rec, notes: e.target.value };
                                      setDailyAttendances((prev) => ({
                                        ...prev,
                                        [emp.id]: updatedRec,
                                      }));
                                      SkenaHrApi.submitEmployeeAttendance(updatedRec);
                                    }}
                                    placeholder="Keterangan izin / alasan WFH / urusan kantor / overtime"
                                    className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white"
                                  />
                                ) : (
                                  <span className="text-xs text-slate-600">{rec.notes || '-'}</span>
                                )}
                              </td>
                              <td className="p-3 border text-center">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAttChartScope('individual');
                                      setAttChartEmpId(emp.id);
                                      setAttendanceSubTab('charts');
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition inline-flex items-center gap-1"
                                    title="Lihat Grafik Presensi & Keterlambatan Karyawan Ini"
                                  >
                                    <BarChart3 className="w-3.5 h-3.5" /> Grafik
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDetailInspectEmpId(emp.id)}
                                    className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-[#1E40AF] hover:bg-blue-100 text-xs font-bold transition inline-flex items-center gap-1"
                                    title="Lihat Detail Terintegrasi 360°"
                                  >
                                    <Eye className="w-3.5 h-3.5" /> Detail
                                  </button>
                                  {isAdmin && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setDeleteConfirm({
                                          isOpen: true,
                                          title: 'Reset / Hapus Presensi Karyawan',
                                          message: `Hapus catatan presensi ${emp.full_name} pada tanggal ${selectedDate}?`,
                                          onConfirm: async () => {
                                            await SkenaHrApi.deleteAttendanceRecord(emp.id, selectedDate);
                                            await fetchDailyAttendance(selectedDate);
                                            await fetchMonthlyAttendance(attendanceMonth);
                                            triggerToast(`Presensi ${emp.full_name} (${selectedDate}) berhasil direset.`);
                                          },
                                        });
                                      }}
                                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                                      title="Hapus / Reset Presensi Tanggal Ini (Admin)"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-TAB 2: OUTPUT GRAFIK ANALISIS PRESENSI, 10 KATEGORI IZIN & KETERLAMBATAN (KESELURUHAN, INDIVIDU & PERBANDINGAN PER BULAN) */}
            {attendanceSubTab === 'charts' && (() => {
              const isAdmin = currentUser.role === 'admin';
              const perEmployeeStats = employees.map((emp) => {
                const recs = monthlyAttendances.filter((r) => r.employee_id === emp.id);
                const wfo = recs.filter((r) => r.status === 'WFO').length;
                const wfh = recs.filter((r) => r.status === 'WFH').length;
                const content = recs.filter((r) => r.status === 'Take Content').length;
                const urusanKantor = recs.filter((r) => r.status === 'Urusan Kantor').length;
                const overtime = recs.filter((r) => r.status === 'Overtime').length;
                const izin = recs.filter((r) => r.status === 'Izin').length;
                const urusanPribadi = recs.filter((r) => r.status === 'Urusan Pribadi').length;
                const sakit = recs.filter((r) => r.status === 'Sakit').length;
                const cuti = recs.filter((r) => r.status === 'Cuti').length;
                const tidakAbsen = recs.filter((r) => r.status === 'Tidak Absen').length;

                let onTime = 0;
                let inTol = 0;
                let late = 0;
                let totalLateMin = 0;
                recs.forEach((r) => {
                  const p = analyzeAttendancePunctuality(r.check_in_time, r.status);
                  if (p.category === 'on_time') onTime++;
                  else if (p.category === 'within_tolerance') inTol++;
                  else if (p.category === 'late') {
                    late++;
                    totalLateMin += p.lateMinutesFrom0900;
                  }
                });
                const totalActive = wfo + wfh + content + urusanKantor + overtime;
                const totalPermissions = izin + urusanPribadi + sakit + cuti + tidakAbsen;
                const totalAll = totalActive + totalPermissions;
                const punctualityRate =
                  totalActive > 0 ? Math.round(((onTime + inTol) / totalActive) * 100) : 100;
                return {
                  emp,
                  recs,
                  wfo,
                  wfh,
                  content,
                  urusanKantor,
                  overtime,
                  izin,
                  urusanPribadi,
                  sakit,
                  cuti,
                  tidakAbsen,
                  onTime,
                  inTol,
                  late,
                  totalLateMin,
                  totalActive,
                  totalPermissions,
                  totalAll,
                  punctualityRate,
                };
              });

              const teamTotals = perEmployeeStats.reduce(
                (acc, s) => {
                  acc.wfo += s.wfo;
                  acc.wfh += s.wfh;
                  acc.content += s.content;
                  acc.urusanKantor += s.urusanKantor;
                  acc.overtime += s.overtime;
                  acc.izin += s.izin;
                  acc.urusanPribadi += s.urusanPribadi;
                  acc.sakit += s.sakit;
                  acc.cuti += s.cuti;
                  acc.tidakAbsen += s.tidakAbsen;
                  acc.onTime += s.onTime;
                  acc.inTol += s.inTol;
                  acc.late += s.late;
                  acc.totalLateMin += s.totalLateMin;
                  acc.totalActive += s.totalActive;
                  acc.totalPermissions += s.totalPermissions;
                  acc.totalAll += s.totalAll;
                  return acc;
                },
                {
                  wfo: 0,
                  wfh: 0,
                  content: 0,
                  urusanKantor: 0,
                  overtime: 0,
                  izin: 0,
                  urusanPribadi: 0,
                  sakit: 0,
                  cuti: 0,
                  tidakAbsen: 0,
                  onTime: 0,
                  inTol: 0,
                  late: 0,
                  totalLateMin: 0,
                  totalActive: 0,
                  totalPermissions: 0,
                  totalAll: 0,
                }
              );

              const selectedIndStat =
                perEmployeeStats.find((s) => s.emp.id === attChartEmpId) || perEmployeeStats[0];

              // Hitung Perbandingan Per Bulan & Keseluruhan dari allHistoricalAttendances
              const distinctMonths = Array.from(
                new Set(allHistoricalAttendances.map((r) => r.attendance_date.slice(0, 7)))
              )
                .filter(Boolean)
                .sort();

              const monthlyComparisonStats = distinctMonths.map((ym) => {
                const mRecs = allHistoricalAttendances.filter((r) => r.attendance_date.startsWith(ym));
                let onTime = 0;
                let inTol = 0;
                let lateCount = 0;
                let lateMinutes = 0;
                mRecs.forEach((r) => {
                  const p = analyzeAttendancePunctuality(r.check_in_time, r.status);
                  if (p.category === 'on_time') onTime++;
                  else if (p.category === 'within_tolerance') inTol++;
                  else if (p.category === 'late') {
                    lateCount++;
                    lateMinutes += p.lateMinutesFrom0900;
                  }
                });
                return {
                  ym,
                  label: formatMonthLabel(ym),
                  totalLogs: mRecs.length,
                  wfo: mRecs.filter((r) => r.status === 'WFO').length,
                  wfh: mRecs.filter((r) => r.status === 'WFH').length,
                  content: mRecs.filter((r) => r.status === 'Take Content').length,
                  urusanKantor: mRecs.filter((r) => r.status === 'Urusan Kantor').length,
                  overtime: mRecs.filter((r) => r.status === 'Overtime').length,
                  izin: mRecs.filter((r) => r.status === 'Izin').length,
                  urusanPribadi: mRecs.filter((r) => r.status === 'Urusan Pribadi').length,
                  sakit: mRecs.filter((r) => r.status === 'Sakit').length,
                  cuti: mRecs.filter((r) => r.status === 'Cuti').length,
                  tidakAbsen: mRecs.filter((r) => r.status === 'Tidak Absen').length,
                  onTime,
                  inTol,
                  lateCount,
                  lateMinutes,
                };
              });

              return (
                <div className="space-y-6">
                  {/* Bar Kontrol Periode Bulan & Pilihan Scope Grafik (Keseluruhan vs Individu vs Perbandingan Bulanan) */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 no-print">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs font-black uppercase text-slate-600">Pilih Mode Output Grafik:</span>
                      <div className="inline-flex flex-wrap rounded-xl bg-slate-100 p-1 border border-slate-200 gap-1">
                        <button
                          type="button"
                          onClick={() => setAttChartScope('overall')}
                          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                            attChartScope === 'overall'
                              ? 'bg-[#1E40AF] text-white shadow'
                              : 'text-slate-700 hover:bg-white'
                          }`}
                        >
                          <BarChart3 className="w-4 h-4" /> Grafik Keseluruhan Tim ({employees.length} Org)
                        </button>
                        <button
                          type="button"
                          onClick={() => setAttChartScope('individual')}
                          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                            attChartScope === 'individual'
                              ? 'bg-[#10B981] text-white shadow'
                              : 'text-slate-700 hover:bg-white'
                          }`}
                        >
                          <UserCheck className="w-4 h-4" /> Grafik Individu Per Karyawan
                        </button>
                        <button
                          type="button"
                          onClick={() => setAttChartScope('month_comparison')}
                          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                            attChartScope === 'month_comparison'
                              ? 'bg-purple-700 text-white shadow'
                              : 'text-slate-700 hover:bg-white'
                          }`}
                        >
                          <TrendingUp className="w-4 h-4" /> Perbandingan Per Bulan & Keseluruhan
                        </button>
                      </div>

                      {attChartScope === 'individual' && (
                        <select
                          value={selectedIndStat?.emp.id || ''}
                          onChange={(e) => setAttChartEmpId(e.target.value)}
                          className="px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 text-xs font-bold text-emerald-900"
                        >
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              👤 {emp.full_name} ({emp.employee_nik} — {emp.role_title})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <label className="text-xs font-bold text-slate-600">Periode Bulan:</label>
                      <input
                        type="month"
                        value={attendanceMonth ?? ''}
                        onChange={(e) => {
                          setAttendanceMonth(e.target.value);
                          fetchMonthlyAttendance(e.target.value);
                        }}
                        className="px-3 py-1.5 border border-blue-300 rounded-xl text-xs font-bold text-[#1E40AF] bg-blue-50"
                      />
                      <button
                        type="button"
                        onClick={handleExportMonthlyCsv}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#10B981] text-white text-xs font-bold hover:bg-emerald-600 shadow"
                      >
                        <FileSpreadsheet className="w-4 h-4" /> Unduh Data Grafik (.xlsx)
                      </button>
                    </div>
                  </div>

                  {attChartScope === 'month_comparison' ? (
                    /* ================= MODE 3: GRAFIK PERBANDINGAN PER BULAN & KESELURUHAN ================= */
                    <div className="space-y-6">
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                        <div className="border-b pb-3 flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-base text-slate-900">
                              Perbandingan Total Keterlambatan & 10 Kategori Perizinan Antar Bulan & Akumulasi Keseluruhan
                            </h4>
                            <p className="text-xs text-slate-500">
                              Membandingkan tren keterlambatan (&gt;09:15 WITA), total menit terlambat, WFH/WFA, Urusan Kantor, Overtime, Izin, Urusan Pribadi, Sakit, Cuti, dan Tidak Absen per bulan maupun keseluruhan.
                            </p>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-900 text-xs font-bold">
                            Total Log Historis: {allHistoricalAttendances.length} Catatan ({distinctMonths.length} Bulan)
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {monthlyComparisonStats.map((m) => (
                            <div key={m.ym} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <div>
                                  <h5 className="font-black text-sm text-[#1E40AF]">{m.label}</h5>
                                  <span className="text-[11px] text-slate-500 font-mono">Kode Periode: {m.ym} • {m.totalLogs} Log</span>
                                </div>
                                <div className="text-right">
                                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
                                    Terlambat: {m.lateCount}x ({m.lateMinutes} Menit)
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-5 gap-1.5 text-[11px] text-center">
                                <div className="p-2 rounded-lg bg-white border">
                                  <span className="text-slate-500 block">WFO</span>
                                  <strong className="text-blue-700 font-black">{m.wfo}</strong>
                                </div>
                                <div className="p-2 rounded-lg bg-white border">
                                  <span className="text-slate-500 block">WFH/WFA</span>
                                  <strong className="text-emerald-700 font-black">{m.wfh}</strong>
                                </div>
                                <div className="p-2 rounded-lg bg-white border">
                                  <span className="text-slate-500 block">Urusan Ktr</span>
                                  <strong className="text-indigo-700 font-black">{m.urusanKantor}</strong>
                                </div>
                                <div className="p-2 rounded-lg bg-white border">
                                  <span className="text-slate-500 block">Overtime</span>
                                  <strong className="text-cyan-700 font-black">{m.overtime}</strong>
                                </div>
                                <div className="p-2 rounded-lg bg-white border">
                                  <span className="text-slate-500 block">Content</span>
                                  <strong className="text-purple-700 font-black">{m.content}</strong>
                                </div>
                                <div className="p-2 rounded-lg bg-white border">
                                  <span className="text-slate-500 block">Izin</span>
                                  <strong className="text-amber-700 font-black">{m.izin}</strong>
                                </div>
                                <div className="p-2 rounded-lg bg-white border">
                                  <span className="text-slate-500 block">Pribadi</span>
                                  <strong className="text-yellow-700 font-black">{m.urusanPribadi}</strong>
                                </div>
                                <div className="p-2 rounded-lg bg-white border">
                                  <span className="text-slate-500 block">Sakit</span>
                                  <strong className="text-orange-700 font-black">{m.sakit}</strong>
                                </div>
                                <div className="p-2 rounded-lg bg-white border">
                                  <span className="text-slate-500 block">Cuti</span>
                                  <strong className="text-rose-700 font-black">{m.cuti}</strong>
                                </div>
                                <div className="p-2 rounded-lg bg-white border">
                                  <span className="text-slate-500 block">Tdk Absen</span>
                                  <strong className="text-red-700 font-black">{m.tidakAbsen}</strong>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-xs pt-1">
                                <span className="text-emerald-700 font-bold">≤09:00: {m.onTime}x</span>
                                <span className="text-amber-700 font-bold">Toleransi 15m: {m.inTol}x</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAttendanceMonth(m.ym);
                                    fetchMonthlyAttendance(m.ym);
                                    setAttChartScope('overall');
                                  }}
                                  className="text-[#1E40AF] font-bold hover:underline"
                                >
                                  Buka Detail Bulan Ini →
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Tabel Akumulasi Keseluruhan Lintas Bulan Per Karyawan */}
                        <div className="pt-4 border-t border-slate-200 space-y-2">
                          <h5 className="font-bold text-sm text-slate-900">
                            Rekapitulasi Total Keterlambatan & Perizinan Keseluruhan (All-Time / Lintas Bulan) Per Individu
                          </h5>
                          <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-xs text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-900 text-white uppercase">
                                  <th className="p-2.5 border border-slate-700">Karyawan</th>
                                  <th className="p-2 border border-slate-700 text-center">WFO</th>
                                  <th className="p-2 border border-slate-700 text-center">WFH/WFA</th>
                                  <th className="p-2 border border-slate-700 text-center">Content</th>
                                  <th className="p-2 border border-slate-700 text-center">Urusan Ktr</th>
                                  <th className="p-2 border border-slate-700 text-center">Overtime</th>
                                  <th className="p-2 border border-slate-700 text-center">Izin</th>
                                  <th className="p-2 border border-slate-700 text-center">Pribadi</th>
                                  <th className="p-2 border border-slate-700 text-center">Sakit</th>
                                  <th className="p-2 border border-slate-700 text-center">Cuti</th>
                                  <th className="p-2 border border-slate-700 text-center">Tdk Absen</th>
                                  <th className="p-2.5 border border-slate-700 text-center bg-rose-900">Total Terlambat (&gt;09:15)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {employees.map((emp) => {
                                  const allRecs = allHistoricalAttendances.filter((r) => r.employee_id === emp.id);
                                  let lateCount = 0;
                                  let lateMin = 0;
                                  allRecs.forEach((r) => {
                                    const p = analyzeAttendancePunctuality(r.check_in_time, r.status);
                                    if (p.category === 'late') {
                                      lateCount++;
                                      lateMin += p.lateMinutesFrom0900;
                                    }
                                  });
                                  return (
                                    <tr key={emp.id} className="hover:bg-slate-50">
                                      <td className="p-2.5 border font-bold text-slate-900">
                                        {emp.full_name} <span className="text-slate-400 font-mono">({emp.employee_nik})</span>
                                      </td>
                                      <td className="p-2 border text-center font-bold">{allRecs.filter((r) => r.status === 'WFO').length}</td>
                                      <td className="p-2 border text-center font-bold text-emerald-700">{allRecs.filter((r) => r.status === 'WFH').length}</td>
                                      <td className="p-2 border text-center font-bold text-purple-700">{allRecs.filter((r) => r.status === 'Take Content').length}</td>
                                      <td className="p-2 border text-center font-bold text-indigo-700">{allRecs.filter((r) => r.status === 'Urusan Kantor').length}</td>
                                      <td className="p-2 border text-center font-bold text-cyan-700">{allRecs.filter((r) => r.status === 'Overtime').length}</td>
                                      <td className="p-2 border text-center font-bold text-amber-700">{allRecs.filter((r) => r.status === 'Izin').length}</td>
                                      <td className="p-2 border text-center font-bold text-yellow-700">{allRecs.filter((r) => r.status === 'Urusan Pribadi').length}</td>
                                      <td className="p-2 border text-center font-bold text-orange-700">{allRecs.filter((r) => r.status === 'Sakit').length}</td>
                                      <td className="p-2 border text-center font-bold text-rose-600">{allRecs.filter((r) => r.status === 'Cuti').length}</td>
                                      <td className="p-2 border text-center font-bold text-red-700">{allRecs.filter((r) => r.status === 'Tidak Absen').length}</td>
                                      <td className="p-2.5 border text-center font-black text-rose-700 bg-rose-50">
                                        {lateCount}x ({lateMin} Menit)
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : attChartScope === 'overall' ? (
                    /* ================= MODE 1: GRAFIK KESELURUHAN TIM ================= */
                    <div className="space-y-6">
                      {/* 6 Kartu Ringkasan Eksekutif Presensi & Keterlambatan Tim */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                          <span className="text-[11px] font-bold uppercase text-slate-400">Total Kehadiran Aktif</span>
                          <div className="text-2xl font-black text-[#1E40AF] mt-1">{teamTotals.totalActive} Hari</div>
                          <span className="text-[11px] text-slate-500">WFO, WFH, Konten, Dinas & Lembur</span>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs">
                          <span className="text-[11px] font-bold uppercase text-emerald-700">Tepat Waktu (≤ 09:00)</span>
                          <div className="text-2xl font-black text-emerald-600 mt-1">{teamTotals.onTime} Log</div>
                          <span className="text-[11px] text-slate-500">Hadir ≤ 09:00:00 WITA</span>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs">
                          <span className="text-[11px] font-bold uppercase text-amber-700">Toleransi 15m (09:01–09:15)</span>
                          <div className="text-2xl font-black text-amber-600 mt-1">{teamTotals.inTol} Log</div>
                          <span className="text-[11px] text-slate-500">Batas Toleransi 15 Menit</span>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs">
                          <span className="text-[11px] font-bold uppercase text-rose-700">Total Terlambat (&gt; 09:15)</span>
                          <div className="text-2xl font-black text-rose-600 mt-1">{teamTotals.late} Kali</div>
                          <span className="text-[11px] font-bold text-rose-600">Akumulasi: {teamTotals.totalLateMin} Menit</span>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-xs">
                          <span className="text-[11px] font-bold uppercase text-purple-700">WFH, Dinas & Overtime</span>
                          <div className="text-lg font-black text-purple-700 mt-1">
                            {teamTotals.wfh} WFH · {teamTotals.urusanKantor} Dinas · {teamTotals.overtime} OT
                          </div>
                          <span className="text-[11px] text-slate-500">Take Content: {teamTotals.content} Hari</span>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-orange-200 shadow-xs">
                          <span className="text-[11px] font-bold uppercase text-orange-700">Total Perizinan & Alpa</span>
                          <div className="text-2xl font-black text-orange-600 mt-1">
                            {teamTotals.totalPermissions} Hari
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {teamTotals.izin} Izin · {teamTotals.urusanPribadi} Pribadi · {teamTotals.sakit} Sakit · {teamTotals.cuti} Cuti · {teamTotals.tidakAbsen} Alpa
                          </span>
                        </div>
                      </div>

                      {/* Grafik Proporsi 10 Kategori Kehadiran/Perizinan & Grafik Ketepatan Waktu */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                          <div className="border-b pb-3">
                            <h4 className="font-bold text-base text-slate-900">
                              Grafik Distribusi 10 Kategori Kehadiran & Perizinan ({formatMonthLabel(attendanceMonth)})
                            </h4>
                            <p className="text-xs text-slate-500">
                              Mencakup WFO, WFH/WFA, Take Content, Urusan Kantor, Overtime, Izin Resmi, Urusan Pribadi, Sakit, Cuti, dan Tidak Absen.
                            </p>
                          </div>
                          <div className="space-y-2.5">
                            {[
                              { label: '🏢 Work From Office (WFO)', count: teamTotals.wfo, color: 'bg-[#1E40AF]', text: 'text-[#1E40AF]' },
                              { label: '🏡 Work From Home / Anywhere (WFH/WFA)', count: teamTotals.wfh, color: 'bg-[#10B981]', text: 'text-emerald-700' },
                              { label: '🎥 Take Content / Liputan Studio', count: teamTotals.content, color: 'bg-purple-600', text: 'text-purple-700' },
                              { label: '💼 Urusan Kantor / Meeting Klien', count: teamTotals.urusanKantor, color: 'bg-indigo-600', text: 'text-indigo-700' },
                              { label: '⚡ Overtime (Lembur Produksi)', count: teamTotals.overtime, color: 'bg-cyan-600', text: 'text-cyan-700' },
                              { label: '📝 Izin Resmi Karyawan', count: teamTotals.izin, color: 'bg-amber-500', text: 'text-amber-700' },
                              { label: '🏠 Urusan Pribadi / Keluarga', count: teamTotals.urusanPribadi, color: 'bg-yellow-500', text: 'text-yellow-700' },
                              { label: '🏥 Izin Sakit / Istirahat Medis', count: teamTotals.sakit, color: 'bg-orange-500', text: 'text-orange-700' },
                              { label: '🌴 Cuti Tahunan', count: teamTotals.cuti, color: 'bg-rose-500', text: 'text-rose-700' },
                              { label: '⚠️ Tidak Absen / Tanpa Keterangan', count: teamTotals.tidakAbsen, color: 'bg-red-700', text: 'text-red-700' },
                            ].map((item, idx) => {
                              const pct = teamTotals.totalAll > 0 ? Math.round((item.count / teamTotals.totalAll) * 100) : 0;
                              return (
                                <div key={idx} className="space-y-1">
                                  <div className="flex justify-between text-xs font-bold">
                                    <span className={item.text}>{item.label}</span>
                                    <span className="text-slate-800">
                                      {item.count} Hari ({pct}%)
                                    </span>
                                  </div>
                                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full ${item.color} rounded-full transition-all`}
                                      style={{ width: `${Math.max(pct, item.count > 0 ? 4 : 0)}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                          <div className="border-b pb-3">
                            <h4 className="font-bold text-base text-slate-900">
                              Grafik Analisis Ketepatan Waktu & Toleransi 15 Menit (Jam Masuk 09:00)
                            </h4>
                            <p className="text-xs text-slate-500">
                              Standar Jam Masuk 09:00 WITA dengan batas toleransi maksimal 15 menit (09:15 WITA).
                            </p>
                          </div>
                          <div className="space-y-4 pt-1">
                            {[
                              {
                                label: '✓ Tepat Waktu (Check-In ≤ 09:00:00 WITA)',
                                count: teamTotals.onTime,
                                color: 'bg-emerald-500',
                                desc: 'Hadir sebelum atau tepat pukul 09:00 WITA (0 menit terlambat)',
                              },
                              {
                                label: '⏱️ Dalam Toleransi 15 Menit (09:00:01 – 09:15:00 WITA)',
                                count: teamTotals.inTol,
                                color: 'bg-amber-500',
                                desc: 'Masih dalam batas toleransi maksimal 15 menit dari pukul 09:00',
                              },
                              {
                                label: '⚠️ Terlambat / Lewat Toleransi (> 09:15:00 WITA)',
                                count: teamTotals.late,
                                color: 'bg-rose-600',
                                desc: `Total akumulasi keterlambatan tim bulan ini: ${teamTotals.totalLateMin} menit dari jam 09:00`,
                              },
                            ].map((item, idx) => {
                              const pct =
                                teamTotals.totalActive > 0
                                  ? Math.round((item.count / teamTotals.totalActive) * 100)
                                  : 0;
                              return (
                                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                                  <div className="flex justify-between items-center text-xs font-bold">
                                    <span className="text-slate-900">{item.label}</span>
                                    <span className="font-mono font-black text-sm">
                                      {item.count} Hari ({pct}%)
                                    </span>
                                  </div>
                                  <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full ${item.color} rounded-full transition-all`}
                                      style={{ width: `${Math.max(pct, item.count > 0 ? 4 : 0)}%` }}
                                    />
                                  </div>
                                  <p className="text-[11px] text-slate-500">{item.desc}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Grafik Komparasi Per Karyawan */}
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                          <div>
                            <h4 className="font-bold text-base text-slate-900">
                              Grafik Komparasi Kehadiran, 10 Kategori Perizinan & Hitungan Keterlambatan Per Karyawan
                            </h4>
                            <p className="text-xs text-slate-500">
                              Klik tombol <strong>"Lihat Grafik Individu"</strong> untuk rincian harian per karyawan atau <strong>"Edit Absensi"</strong> untuk mengubah data.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {perEmployeeStats.map((st) => {
                            const total = Math.max(st.totalAll, 1);
                            return (
                              <div
                                key={st.emp.id}
                                className="p-3.5 rounded-2xl border border-slate-200 hover:border-blue-300 bg-slate-50/60 space-y-2 transition"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div>
                                    <span className="font-bold text-sm text-slate-900">{st.emp.full_name}</span>
                                    <span className="text-xs text-slate-500 ml-2">
                                      ({st.emp.employee_nik} · {st.emp.role_title} · {st.emp.department})
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                                      ≤09:00: {st.onTime}x
                                    </span>
                                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                                      Toleransi 15m: {st.inTol}x
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded font-bold ${
                                        st.late > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                                      }`}
                                    >
                                      Terlambat (&gt;09:15): {st.late}x ({st.totalLateMin} mnt)
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAttChartEmpId(st.emp.id);
                                        setAttChartScope('individual');
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-[#1E40AF] text-white font-bold hover:bg-blue-800"
                                    >
                                      Lihat Grafik Individu →
                                    </button>
                                    {isAdmin && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setAdminAttForm({
                                            employee_id: st.emp.id,
                                            attendance_date: selectedDate,
                                            check_in_time: '08:45:00',
                                            status: 'WFO',
                                            work_location_tag: st.emp.work_location || 'Makassar HQ',
                                            notes: '',
                                            isEditing: false,
                                          });
                                          setAttendanceSubTab('logs_detail');
                                        }}
                                        className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold hover:bg-amber-200"
                                      >
                                        Edit Absensi
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Detail Badges */}
                                <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800">WFO: {st.wfo}</span>
                                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">WFH/WFA: {st.wfh}</span>
                                  <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800">Content: {st.content}</span>
                                  <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800">Urusan Kantor: {st.urusanKantor}</span>
                                  <span className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-800">Overtime: {st.overtime}</span>
                                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800">Izin: {st.izin}</span>
                                  <span className="px-2 py-0.5 rounded bg-yellow-50 text-yellow-800">Urusan Pribadi: {st.urusanPribadi}</span>
                                  <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-800">Sakit: {st.sakit}</span>
                                  <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800">Cuti: {st.cuti}</span>
                                  <span className="px-2 py-0.5 rounded bg-red-50 text-red-800">Tidak Absen: {st.tidakAbsen}</span>
                                </div>

                                {/* Stacked Horizontal Bar */}
                                <div className="w-full h-5 bg-slate-200 rounded-full overflow-hidden flex text-[10px] font-bold text-white">
                                  {st.wfo > 0 && (
                                    <div
                                      className="bg-[#1E40AF] flex items-center justify-center"
                                      style={{ width: `${(st.wfo / total) * 100}%` }}
                                    >
                                      {st.wfo} WFO
                                    </div>
                                  )}
                                  {st.wfh > 0 && (
                                    <div
                                      className="bg-[#10B981] flex items-center justify-center"
                                      style={{ width: `${(st.wfh / total) * 100}%` }}
                                    >
                                      {st.wfh} WFH
                                    </div>
                                  )}
                                  {st.content + st.urusanKantor + st.overtime > 0 && (
                                    <div
                                      className="bg-purple-600 flex items-center justify-center"
                                      style={{ width: `${((st.content + st.urusanKantor + st.overtime) / total) * 100}%` }}
                                    >
                                      {st.content + st.urusanKantor + st.overtime} Dinas/Konten/OT
                                    </div>
                                  )}
                                  {st.totalPermissions > 0 && (
                                    <div
                                      className="bg-amber-500 flex items-center justify-center"
                                      style={{ width: `${(st.totalPermissions / total) * 100}%` }}
                                    >
                                      {st.totalPermissions} Izin/Sakit/Cuti/Alpa
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* ================= MODE 2: GRAFIK INDIVIDU PER KARYAWAN ================= */
                    selectedIndStat && (
                      <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                            <div>
                              <span className="text-xs font-bold uppercase text-[#10B981]">
                                Analisis Grafik Presensi, 10 Kategori Perizinan & Keterlambatan Individu (Jam Masuk 09:00 + Toleransi 15m)
                              </span>
                              <h4 className="text-xl font-black text-slate-900 mt-0.5">
                                {selectedIndStat.emp.full_name} ({selectedIndStat.emp.employee_nik})
                              </h4>
                              <p className="text-xs text-slate-500">
                                {selectedIndStat.emp.role_title} · Departemen {selectedIndStat.emp.department} · Periode {formatMonthLabel(attendanceMonth)}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => setAttChartScope('month_comparison')}
                                className="px-3.5 py-2 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 text-xs font-bold"
                              >
                                Bandingkan Antar Bulan →
                              </button>
                              <button
                                type="button"
                                onClick={() => setAttChartScope('overall')}
                                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                              >
                                ← Kembali ke Grafik Keseluruhan Tim
                              </button>
                            </div>
                          </div>

                          {/* Kartu Ringkasan Individu Lengkap */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs">
                            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                              <span className="text-slate-500 block">WFO & WFH/WFA</span>
                              <strong className="text-sm font-black text-[#1E40AF]">
                                {selectedIndStat.wfo} WFO · {selectedIndStat.wfh} WFH
                              </strong>
                            </div>
                            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
                              <span className="text-slate-500 block">Urusan Ktr, Konten & OT</span>
                              <strong className="text-sm font-black text-indigo-800">
                                {selectedIndStat.urusanKantor} Ktr · {selectedIndStat.content} Konten · {selectedIndStat.overtime} OT
                              </strong>
                            </div>
                            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                              <span className="text-slate-500 block">Izin, Pribadi & Sakit</span>
                              <strong className="text-sm font-black text-amber-900">
                                {selectedIndStat.izin} Izin · {selectedIndStat.urusanPribadi} Pribadi · {selectedIndStat.sakit} Sakit
                              </strong>
                            </div>
                            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                              <span className="text-slate-500 block">Cuti & Tidak Absen</span>
                              <strong className="text-sm font-black text-rose-800">
                                {selectedIndStat.cuti} Cuti · {selectedIndStat.tidakAbsen} Tidak Absen
                              </strong>
                            </div>
                            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                              <span className="text-slate-500 block">≤09:00 & Toleransi 15m</span>
                              <strong className="text-sm font-black text-emerald-700">
                                {selectedIndStat.onTime} Tepat · {selectedIndStat.inTol} Toleransi
                              </strong>
                            </div>
                            <div className="p-3 rounded-xl bg-red-50 border border-red-300">
                              <span className="text-slate-500 block">Total Terlambat (&gt;09:15)</span>
                              <strong className="text-sm font-black text-red-700">
                                {selectedIndStat.late}x ({selectedIndStat.totalLateMin} Menit)
                              </strong>
                            </div>
                          </div>

                          {/* Panel Quick Edit Admin Langsung di Halaman Grafik Individu */}
                          {isAdmin && (
                            <form
                              onSubmit={async (e) => {
                                e.preventDefault();
                                setIsLoading(true);
                                try {
                                  await SkenaHrApi.submitEmployeeAttendance({
                                    employee_id: selectedIndStat.emp.id,
                                    attendance_date: adminAttForm.attendance_date || selectedDate,
                                    check_in_time: adminAttForm.check_in_time || '08:45:00',
                                    status: adminAttForm.status,
                                    work_location_tag: adminAttForm.work_location_tag || selectedIndStat.emp.work_location || 'Makassar HQ',
                                    notes: adminAttForm.notes,
                                  });
                                  const targetMonth = (adminAttForm.attendance_date || selectedDate).slice(0, 7);
                                  setAttendanceMonth(targetMonth);
                                  await fetchMonthlyAttendance(targetMonth);
                                  await fetchDailyAttendance(selectedDate);
                                  triggerToast(`Absensi ${selectedIndStat.emp.full_name} berhasil disimpan & grafik diperbarui!`);
                                } catch (err: any) {
                                  triggerToast(`Gagal menyimpan absensi: ${err.message}`, 'error');
                                } finally {
                                  setIsLoading(false);
                                }
                              }}
                              className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3"
                            >
                              <div className="text-xs font-black uppercase text-[#1E40AF] flex items-center gap-1.5">
                                <Pencil className="w-3.5 h-3.5" /> Kontrol Cepat Administrator: Tambah / Ubah Absensi, Jam Masuk, WFH, atau 10 Kategori Izin untuk {selectedIndStat.emp.full_name}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Tanggal</label>
                                  <input
                                    type="date"
                                    value={adminAttForm.attendance_date || selectedDate}
                                    onChange={(e) => setAdminAttForm({ ...adminAttForm, attendance_date: e.target.value })}
                                    className="w-full px-3 py-1.5 border rounded-xl text-xs font-bold bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Jam Check-In (WITA)</label>
                                  <input
                                    type="time"
                                    step="1"
                                    value={adminAttForm.check_in_time}
                                    onChange={(e) => setAdminAttForm({ ...adminAttForm, check_in_time: e.target.value })}
                                    className="w-full px-3 py-1.5 border rounded-xl text-xs font-mono font-bold bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Mode / 10 Kategori Izin</label>
                                  <select
                                    value={adminAttForm.status}
                                    onChange={(e) => setAdminAttForm({ ...adminAttForm, status: e.target.value as AttendanceStatus })}
                                    className="w-full px-3 py-1.5 border rounded-xl text-xs font-bold bg-white text-[#1E40AF]"
                                  >
                                    <option value="WFO">WFO (Kantor)</option>
                                    <option value="WFH">WFH / WFA (Remote)</option>
                                    <option value="Take Content">Take Content</option>
                                    <option value="Urusan Kantor">Urusan Kantor (Dinas/Klien)</option>
                                    <option value="Overtime">Overtime (Lembur)</option>
                                    <option value="Izin">Izin Resmi</option>
                                    <option value="Urusan Pribadi">Urusan Pribadi</option>
                                    <option value="Sakit">Izin Sakit</option>
                                    <option value="Cuti">Cuti Tahunan</option>
                                    <option value="Tidak Absen">Tidak Absen</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Keterangan Izin / WFH / Output</label>
                                  <input
                                    type="text"
                                    value={adminAttForm.notes}
                                    onChange={(e) => setAdminAttForm({ ...adminAttForm, notes: e.target.value })}
                                    placeholder="Keterangan izin, sakit, WFH, urusan kantor..."
                                    className="w-full px-3 py-1.5 border rounded-xl text-xs bg-white"
                                  />
                                </div>
                                <button
                                  type="submit"
                                  className="w-full py-2 px-3 rounded-xl bg-[#1E40AF] hover:bg-blue-800 text-white text-xs font-bold shadow"
                                >
                                  Simpan & Update Grafik
                                </button>
                              </div>
                            </form>
                          )}
                        </div>

                        {/* Grafik Timeline Jam Masuk Harian Individu */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                            <div>
                              <h4 className="font-bold text-base text-slate-900">
                                Grafik Timeline Jam Masuk & Ketepatan Waktu Harian — {selectedIndStat.emp.full_name}
                              </h4>
                              <p className="text-xs text-slate-500">
                                Hijau = Tepat Waktu (≤ 09:00) · Kuning = Dalam Toleransi 15 Menit (09:01–09:15) · Merah = Terlambat (&gt; 09:15 WITA).
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2.5">
                            {selectedIndStat.recs.map((rec, idx) => {
                              const p = analyzeAttendancePunctuality(rec.check_in_time, rec.status);
                              const barColor =
                                p.category === 'on_time'
                                  ? 'bg-emerald-500'
                                  : p.category === 'within_tolerance'
                                  ? 'bg-amber-500'
                                  : p.category === 'late'
                                  ? 'bg-rose-600'
                                  : 'bg-slate-400';
                              const widthPct = Math.min(100, Math.max(25, Math.round(((p.checkInMinutes - 450) / 180) * 100)));
                              return (
                                <div
                                  key={idx}
                                  className="grid grid-cols-1 md:grid-cols-12 items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                                >
                                  <div className="md:col-span-2 font-mono font-bold text-slate-800">
                                    {rec.attendance_date}
                                  </div>
                                  <div className="md:col-span-4 bg-slate-200 h-5 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full ${barColor} rounded-full flex items-center justify-end pr-2 text-[10px] font-bold text-white`}
                                      style={{ width: `${widthPct}%` }}
                                    >
                                      {rec.check_in_time || '08:45:00'} WITA
                                    </div>
                                  </div>
                                  <div className="md:col-span-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.badgeClass}`}>
                                      {rec.status} · {p.badgeLabel}
                                    </span>
                                  </div>
                                  <div className="md:col-span-3 text-slate-600 truncate" title={rec.notes || '-'}>
                                    {rec.notes || rec.work_location_tag || '-'}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              );
            })()}

            {/* SUB-TAB 3: MATRIKS REKAP BULANAN, 10 KATEGORI IZIN/WFH & AKUMULASI KETERLAMBATAN */}
            {attendanceSubTab === 'monthly' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 no-print">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="text-sm font-bold text-slate-700">Bulan Rekap:</label>
                    <button
                      type="button"
                      onClick={() => {
                        const [y, m] = (attendanceMonth || todayStr.slice(0, 7)).split('-').map(Number);
                        const prevDate = new Date(y, m - 2, 1);
                        const nextVal = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
                        setAttendanceMonth(nextVal);
                        fetchMonthlyAttendance(nextVal);
                      }}
                      className="px-2.5 py-1.5 border rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700"
                    >
                      ← Bulan Lalu
                    </button>
                    <input
                      type="month"
                      min="2024-01"
                      max="2030-12"
                      value={attendanceMonth ?? ''}
                      onChange={(e) => {
                        setAttendanceMonth(e.target.value);
                        fetchMonthlyAttendance(e.target.value);
                      }}
                      className="px-3 py-1.5 border border-blue-300 rounded-xl text-sm font-bold text-[#1E40AF] bg-blue-50"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const [y, m] = (attendanceMonth || todayStr.slice(0, 7)).split('-').map(Number);
                        const nextDate = new Date(y, m, 1);
                        const nextVal = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
                        setAttendanceMonth(nextVal);
                        fetchMonthlyAttendance(nextVal);
                      }}
                      className="px-2.5 py-1.5 border border-blue-200 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-[#1E40AF]"
                    >
                      Bulan Depan →
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAttChartScope('month_comparison');
                        setAttendanceSubTab('charts');
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 text-xs font-bold hover:bg-purple-100"
                    >
                      <TrendingUp className="w-4 h-4" /> Bandingkan Antar Bulan
                    </button>
                    <button
                      type="button"
                      onClick={handleExportMonthlyCsv}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#10B981] text-white text-xs font-bold hover:bg-emerald-600 shadow"
                    >
                      <FileSpreadsheet className="w-4 h-4" /> Unduh Matriks Rekap Bulanan (.xlsx)
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto print-area space-y-4">
                  <div className="border-b pb-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-base text-slate-900 uppercase">
                        Matriks Rekapitulasi Presensi Bulanan, 10 Kategori Perizinan & Total Keterlambatan (09:00 + 15m)
                      </h4>
                      <p className="text-xs text-slate-600 font-semibold mt-0.5">
                        Periode Bulan Rekap: <span className="text-[#1E40AF]">{formatMonthLabel(attendanceMonth)}</span> · Mencakup WFO, WFH/WFA, Content, Urusan Kantor, Overtime, Izin, Urusan Pribadi, Sakit, Cuti, dan Tidak Absen.
                      </p>
                    </div>
                    <span className="text-xs font-mono text-slate-500">Kode Bulan: {attendanceMonth}</span>
                  </div>

                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 uppercase">
                        <th className="p-2 border">NIK & Nama Karyawan</th>
                        <th className="p-1.5 border text-center text-blue-700">WFO</th>
                        <th className="p-1.5 border text-center text-emerald-700">WFH</th>
                        <th className="p-1.5 border text-center text-purple-700">Content</th>
                        <th className="p-1.5 border text-center text-indigo-700">Urusan Ktr</th>
                        <th className="p-1.5 border text-center text-cyan-700">Overtime</th>
                        <th className="p-1.5 border text-center text-amber-700">Izin</th>
                        <th className="p-1.5 border text-center text-yellow-700">Pribadi</th>
                        <th className="p-1.5 border text-center text-orange-700">Sakit</th>
                        <th className="p-1.5 border text-center text-rose-600">Cuti</th>
                        <th className="p-1.5 border text-center text-red-700">Tdk Absen</th>
                        <th className="p-1.5 border text-center text-emerald-800">≤09:00</th>
                        <th className="p-1.5 border text-center text-amber-800">Tol. 15m</th>
                        <th className="p-2 border text-center text-rose-700 bg-rose-50">Terlambat (&gt;09:15)</th>
                        <th className="p-2 border text-center">Sisa Cuti</th>
                        <th className="p-2 border text-center no-print">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((emp) => {
                        const isAdmin = currentUser.role === 'admin';
                        const recs = monthlyAttendances.filter((r) => r.employee_id === emp.id);
                        const wfo = recs.filter((r) => r.status === 'WFO').length;
                        const wfh = recs.filter((r) => r.status === 'WFH').length;
                        const content = recs.filter((r) => r.status === 'Take Content').length;
                        const urusanKantor = recs.filter((r) => r.status === 'Urusan Kantor').length;
                        const overtime = recs.filter((r) => r.status === 'Overtime').length;
                        const izin = recs.filter((r) => r.status === 'Izin').length;
                        const urusanPribadi = recs.filter((r) => r.status === 'Urusan Pribadi').length;
                        const sakit = recs.filter((r) => r.status === 'Sakit').length;
                        const cuti = recs.filter((r) => r.status === 'Cuti').length;
                        const tidakAbsen = recs.filter((r) => r.status === 'Tidak Absen').length;
                        let onTime = 0;
                        let inTol = 0;
                        let late = 0;
                        let totalLateMin = 0;
                        recs.forEach((r) => {
                          const p = analyzeAttendancePunctuality(r.check_in_time, r.status);
                          if (p.category === 'on_time') onTime++;
                          else if (p.category === 'within_tolerance') inTol++;
                          else if (p.category === 'late') {
                            late++;
                            totalLateMin += p.lateMinutesFrom0900;
                          }
                        });
                        const leave = getEmployeeLeaveStats(emp.id, emp.annual_leave_quota || 12);

                        return (
                          <tr key={emp.id} className="hover:bg-slate-50">
                            <td className="p-2 border">
                              <div className="font-bold text-slate-900">{emp.full_name}</div>
                              <div className="font-mono text-[10px] text-slate-500">{emp.employee_nik} · {emp.department}</div>
                            </td>
                            <td className="p-1.5 border text-center font-bold text-blue-700">{wfo}</td>
                            <td className="p-1.5 border text-center font-bold text-emerald-700">{wfh}</td>
                            <td className="p-1.5 border text-center font-bold text-purple-700">{content}</td>
                            <td className="p-1.5 border text-center font-bold text-indigo-700">{urusanKantor}</td>
                            <td className="p-1.5 border text-center font-bold text-cyan-700">{overtime}</td>
                            <td className="p-1.5 border text-center font-bold text-amber-700">{izin}</td>
                            <td className="p-1.5 border text-center font-bold text-yellow-700">{urusanPribadi}</td>
                            <td className="p-1.5 border text-center font-bold text-orange-700">{sakit}</td>
                            <td className="p-1.5 border text-center font-bold text-rose-600">{cuti}</td>
                            <td className="p-1.5 border text-center font-bold text-red-700">{tidakAbsen}</td>
                            <td className="p-1.5 border text-center font-bold text-emerald-700">{onTime}</td>
                            <td className="p-1.5 border text-center font-bold text-amber-700">{inTol}</td>
                            <td className="p-2 border text-center font-black text-rose-700 bg-rose-50/60">
                              {late}x ({totalLateMin}m)
                            </td>
                            <td className="p-2 border text-center">
                              {isAdmin ? (
                                <div className="inline-flex items-center gap-1">
                                  <span className="font-bold text-emerald-700">{leave.remaining}</span>/
                                  <input
                                    type="number"
                                    min={0}
                                    max={60}
                                    value={emp.annual_leave_quota ?? 12}
                                    onChange={async (e) => {
                                      const newQuota = Number(e.target.value);
                                      await SkenaHrApi.upsertEmployee({ ...emp, annual_leave_quota: newQuota });
                                      setEmployees(await SkenaHrApi.getEmployees());
                                    }}
                                    className="w-11 px-1 py-0.5 border rounded text-center font-bold bg-white text-[#1E40AF]"
                                  />
                                </div>
                              ) : (
                                <span className="font-semibold text-slate-700">
                                  {leave.remaining}/{leave.quota}
                                </span>
                              )}
                            </td>
                            <td className="p-2 border text-center no-print">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAttChartScope('individual');
                                    setAttChartEmpId(emp.id);
                                    setAttendanceSubTab('charts');
                                  }}
                                  className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold"
                                >
                                  Grafik
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDetailInspectEmpId(emp.id)}
                                  className="px-2 py-1 rounded-lg bg-blue-50 text-[#1E40AF] hover:bg-blue-100 text-[11px] font-bold"
                                >
                                  360°
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-TAB 4: RINCIAN LOG JAM PRESENSI, KETERANGAN IZIN/WFH & FULL EDITOR ADMIN */}
            {attendanceSubTab === 'logs_detail' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                  <div>
                    <h4 className="font-bold text-base text-slate-900">
                      Rincian Log Jam Presensi, 10 Kategori Perizinan & Editor Lengkap ({formatMonthLabel(attendanceMonth)})
                    </h4>
                    <p className="text-xs text-slate-500">
                      {currentUser.role === 'admin'
                        ? 'Administrator dapat menambah atau mengedit langsung seluruh kolom (Jam Check-In, 10 Kategori Kehadiran/Perizinan, Lokasi, dan Keterangan) untuk setiap karyawan.'
                        : 'Daftar transparan seluruh log jam check-in, ketepatan waktu (09:00 + toleransi 15m), dan keterangan izin/WFH.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-600">Pilih Bulan Log:</label>
                    <input
                      type="month"
                      value={attendanceMonth ?? ''}
                      onChange={(e) => {
                        setAttendanceMonth(e.target.value);
                        fetchMonthlyAttendance(e.target.value);
                      }}
                      className="px-3 py-1.5 border border-blue-300 rounded-xl text-xs font-bold text-[#1E40AF] bg-blue-50"
                    />
                  </div>
                </div>

                {/* FORM TAMBAH / EDIT LOG PRESENSI SPESIFIK (KHUSUS ADMINISTRATOR) */}
                {currentUser.role === 'admin' && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setIsLoading(true);
                      try {
                        await SkenaHrApi.submitEmployeeAttendance({
                          employee_id: adminAttForm.employee_id,
                          attendance_date: adminAttForm.attendance_date,
                          check_in_time: adminAttForm.check_in_time || '08:45:00',
                          status: adminAttForm.status,
                          work_location_tag: adminAttForm.work_location_tag || 'Makassar HQ',
                          notes: adminAttForm.notes,
                        });
                        const targetMonth = adminAttForm.attendance_date.slice(0, 7);
                        setAttendanceMonth(targetMonth);
                        await fetchMonthlyAttendance(targetMonth);
                        await fetchDailyAttendance(selectedDate);
                        const empObj = employees.find((em) => em.id === adminAttForm.employee_id);
                        triggerToast(
                          adminAttForm.isEditing
                            ? `Log presensi ${empObj?.full_name || ''} tanggal ${adminAttForm.attendance_date} berhasil diperbarui!`
                            : `Log presensi baru untuk ${empObj?.full_name || ''} tanggal ${adminAttForm.attendance_date} berhasil ditambahkan!`
                        );
                        setAdminAttForm((prev) => ({ ...prev, notes: '', isEditing: false }));
                      } catch (err: any) {
                        triggerToast(`Gagal menyimpan log presensi: ${err.message}`, 'error');
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-[#1E40AF] flex items-center gap-1.5">
                        {adminAttForm.isEditing ? <Pencil className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        {adminAttForm.isEditing
                          ? `Mode Edit Log Presensi Tanggal ${adminAttForm.attendance_date}`
                          : 'Tambah / Tetapkan Log Presensi, Izin, atau WFH Baru (Kontrol Penuh Administrator)'}
                      </span>
                      {adminAttForm.isEditing && (
                        <button
                          type="button"
                          onClick={() => setAdminAttForm((prev) => ({ ...prev, isEditing: false, notes: '' }))}
                          className="text-xs font-bold text-rose-600 hover:underline"
                        >
                          Batal Edit
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Pilih Karyawan</label>
                        <select
                          value={adminAttForm.employee_id}
                          onChange={(e) => setAdminAttForm({ ...adminAttForm, employee_id: e.target.value })}
                          className="w-full px-3 py-2 border rounded-xl text-xs font-bold bg-white text-slate-900"
                        >
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.full_name} ({emp.employee_nik})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Tanggal</label>
                        <input
                          type="date"
                          required
                          value={adminAttForm.attendance_date}
                          onChange={(e) => setAdminAttForm({ ...adminAttForm, attendance_date: e.target.value })}
                          className="w-full px-3 py-2 border rounded-xl text-xs font-bold bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Jam Check-In (09:00)</label>
                        <input
                          type="time"
                          step="1"
                          value={adminAttForm.check_in_time}
                          onChange={(e) => setAdminAttForm({ ...adminAttForm, check_in_time: e.target.value })}
                          className="w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">10 Kategori Status / Izin</label>
                        <select
                          value={adminAttForm.status}
                          onChange={(e) => setAdminAttForm({ ...adminAttForm, status: e.target.value as AttendanceStatus })}
                          className="w-full px-3 py-2 border rounded-xl text-xs font-bold bg-white text-[#1E40AF]"
                        >
                          <option value="WFO">WFO (Kantor)</option>
                          <option value="WFH">WFH / WFA (Remote)</option>
                          <option value="Take Content">Take Content</option>
                          <option value="Urusan Kantor">Urusan Kantor</option>
                          <option value="Overtime">Overtime (Lembur)</option>
                          <option value="Izin">Izin Resmi</option>
                          <option value="Urusan Pribadi">Urusan Pribadi</option>
                          <option value="Sakit">Izin Sakit</option>
                          <option value="Cuti">Cuti Tahunan</option>
                          <option value="Tidak Absen">Tidak Absen</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2 px-3 rounded-xl bg-[#1E40AF] hover:bg-blue-800 text-white text-xs font-bold shadow transition"
                      >
                        {adminAttForm.isEditing ? 'Simpan Perubahan Log' : '+ Simpan Log Presensi'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Tag Lokasi Kerja / Domisili WFH</label>
                        <input
                          type="text"
                          value={adminAttForm.work_location_tag}
                          onChange={(e) => setAdminAttForm({ ...adminAttForm, work_location_tag: e.target.value })}
                          placeholder="Makassar HQ / Lokasi WFH / Lokasi Liputan"
                          className="w-full px-3 py-1.5 border rounded-xl text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Keterangan Izin / Alasan WFH / Deliverable</label>
                        <input
                          type="text"
                          value={adminAttForm.notes}
                          onChange={(e) => setAdminAttForm({ ...adminAttForm, notes: e.target.value })}
                          placeholder="Rincian keterangan izin dari karyawan, WFH, urusan kantor, overtime, atau output kerja"
                          className="w-full px-3 py-1.5 border rounded-xl text-xs bg-white"
                        />
                      </div>
                    </div>
                  </form>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 uppercase">
                        <th className="p-2.5 border">Tanggal</th>
                        <th className="p-2.5 border">Jam (WITA)</th>
                        <th className="p-2.5 border">NIK & Nama Karyawan</th>
                        <th className="p-2.5 border">Mode / Izin</th>
                        <th className="p-2.5 border">Ketepatan Waktu (09:00 + 15m)</th>
                        <th className="p-2.5 border">Lokasi Kerja</th>
                        <th className="p-2.5 border">Keterangan Izin / WFH / Output</th>
                        {currentUser.role === 'admin' && <th className="p-2.5 border text-center">Aksi Admin</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyAttendances.map((rec, idx) => {
                        const emp = employees.find((e) => e.id === rec.employee_id);
                        const p = analyzeAttendancePunctuality(rec.check_in_time, rec.status);
                        return (
                          <tr key={`${rec.employee_id}-${rec.attendance_date}-${idx}`} className="hover:bg-slate-50">
                            <td className="p-2.5 border font-mono font-bold text-slate-900">{rec.attendance_date}</td>
                            <td className="p-2.5 border font-mono font-bold text-emerald-700">{rec.check_in_time || '08:45:00'}</td>
                            <td className="p-2.5 border">
                              <div className="font-bold text-slate-900">{emp?.full_name || 'Karyawan'}</div>
                              <div className="text-[11px] text-slate-500">{emp?.employee_nik || '-'} · {emp?.department || '-'}</div>
                            </td>
                            <td className="p-2.5 border">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getAttendanceStatusBadgeClass(rec.status)}`}>
                                {rec.status}
                              </span>
                            </td>
                            <td className="p-2.5 border">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.badgeClass}`}>
                                {p.badgeLabel}
                              </span>
                            </td>
                            <td className="p-2.5 border text-slate-700">{rec.work_location_tag || 'Makassar HQ'}</td>
                            <td className="p-2.5 border text-slate-600">{rec.notes || '-'}</td>
                            {currentUser.role === 'admin' && (
                              <td className="p-2.5 border text-center">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAdminAttForm({
                                        employee_id: rec.employee_id,
                                        attendance_date: rec.attendance_date,
                                        check_in_time: rec.check_in_time || '08:45:00',
                                        status: rec.status,
                                        work_location_tag: rec.work_location_tag || 'Makassar HQ',
                                        notes: rec.notes || '',
                                        isEditing: true,
                                      });
                                    }}
                                    className="p-1.5 text-[#1E40AF] hover:bg-blue-50 rounded-lg"
                                    title="Edit Log Presensi Ini"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDeleteConfirm({
                                        isOpen: true,
                                        title: 'Hapus Log Presensi',
                                        message: `Hapus catatan presensi ${emp?.full_name || ''} pada tanggal ${rec.attendance_date}?`,
                                        onConfirm: async () => {
                                          await SkenaHrApi.deleteAttendanceRecord(rec.employee_id, rec.attendance_date);
                                          await fetchMonthlyAttendance(attendanceMonth);
                                          await fetchDailyAttendance(selectedDate);
                                          triggerToast('Catatan log presensi berhasil dihapus.');
                                        },
                                      });
                                    }}
                                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                                    title="Hapus Log Presensi Ini"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                      {monthlyAttendances.length === 0 && (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400">
                            Belum ada log presensi pada bulan {formatMonthLabel(attendanceMonth)}.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            MODUL BARU: SENIN DI SKENA & BINCANG KENYANG (SETIAP JUMAT)
           =================================================================== */}
        {activeModule === 'sharing_sessions' && (
          <div className="space-y-6">
            {/* Banner Header Senin Di Skena & Bincang Kenyang */}
            <div className="bg-gradient-to-r from-[#1E2B6D] via-[#1E40AF] to-indigo-800 text-white p-6 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-4 no-print">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-amber-400 text-slate-900 text-xs font-black uppercase">
                    Kultur & Berbagi Ilmu Internal Skena
                  </span>
                  <span className="text-xs text-blue-200 font-semibold">
                    Senin Di Skena (Setiap Senin) • Bincang Kenyang (Setiap Jumat)
                  </span>
                </div>
                <h3 className="text-xl font-black">
                  Jadwal Petugas, Materi & Dokumentasi: Senin Di Skena & Bincang Kenyang
                </h3>
                <p className="text-xs text-blue-100 max-w-3xl">
                  Administrator dapat menambahkan jadwal petugas/pemateri, judul materi yang dibawakan, ringkasan bahasan/menu konsumsi, mengubah status, maupun menghapus jadwal.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const rows = sharingSessions.map((s, idx) => [
                      idx + 1,
                      s.program_type,
                      s.session_date,
                      s.speaker_name,
                      s.speaker_role || s.speaker_department || '-',
                      s.topic_title,
                      s.material_summary || '-',
                      s.status,
                      s.remarks || '-',
                    ]);
                    downloadStructuredExcel(
                      `Jadwal_Senin_Di_Skena_Bincang_Kenyang_${todayStr}.xlsx`,
                      'SeninSkena_BincangKenyang',
                      `${settings.company_name.toUpperCase()} — JADWAL SENIN DI SKENA & BINCANG KENYANG`,
                      `Dicetak Tanggal: ${todayStr} | Total Sesi: ${sharingSessions.length}`,
                      [
                        'No',
                        'Program Kegiatan',
                        'Tanggal Pelaksanaan',
                        'Nama Petugas / Pemateri',
                        'Jabatan / Divisi',
                        'Materi yang Disampaikan',
                        'Ringkasan Materi / Menu',
                        'Status',
                        'Keterangan',
                      ],
                      rows
                    );
                    triggerToast('Jadwal Senin Di Skena & Bincang Kenyang berhasil diunduh (.xlsx)!');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10B981] hover:bg-emerald-600 text-white text-xs font-black shadow transition"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Unduh Rekap Jadwal (.xlsx)
                </button>
              </div>
            </div>

            {/* Ringkasan Statistik Sesi */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold uppercase text-slate-400">Total Sesi Terdaftar</span>
                <div className="text-2xl font-black text-slate-900 mt-1">{sharingSessions.length} Sesi</div>
                <span className="text-[11px] text-slate-500">Senin Di Skena & Bincang Kenyang</span>
              </div>
              <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 shadow-xs">
                <span className="text-[11px] font-bold uppercase text-[#1E40AF]">Senin Di Skena (Setiap Senin)</span>
                <div className="text-2xl font-black text-[#1E40AF] mt-1">
                  {sharingSessions.filter((s) => s.program_type === 'Senin Di Skena').length} Sesi
                </div>
                <span className="text-[11px] text-blue-700">Sharing kreatif, tren & bedah kampanye</span>
              </div>
              <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 shadow-xs">
                <span className="text-[11px] font-bold uppercase text-amber-800">Bincang Kenyang (Setiap Jumat)</span>
                <div className="text-2xl font-black text-amber-800 mt-1">
                  {sharingSessions.filter((s) => s.program_type === 'Bincang Kenyang').length} Sesi
                </div>
                <span className="text-[11px] text-amber-700">Makan siang bersama & obrolan santai Jumat</span>
              </div>
              <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-xs">
                <span className="text-[11px] font-bold uppercase text-emerald-800">Sesi Terlaksana / Selesai</span>
                <div className="text-2xl font-black text-emerald-700 mt-1">
                  {sharingSessions.filter((s) => s.status === 'Selesai').length} Selesai
                </div>
                <span className="text-[11px] text-emerald-700">
                  {sharingSessions.filter((s) => s.status === 'Terjadwal').length} Terjadwal Mendatang
                </span>
              </div>
            </div>

            {/* Form Input / Edit Jadwal Senin Di Skena & Bincang Kenyang (Admin) */}
            {currentUser.role === 'admin' && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!sharingForm.speaker_name?.trim() || !sharingForm.topic_title?.trim()) {
                    triggerToast('Nama petugas dan judul materi yang disampaikan wajib diisi!', 'error');
                    return;
                  }
                  setIsLoading(true);
                  try {
                    await SkenaHrApi.upsertSharingSession({
                      ...sharingForm,
                      ...(editingSharingId ? { id: editingSharingId } : {}),
                    });
                    const updated = await SkenaHrApi.getSharingSessions();
                    setSharingSessions(updated);
                    setEditingSharingId(null);
                    setSharingForm({
                      program_type: sharingForm.program_type || 'Senin Di Skena',
                      session_date: todayStr,
                      speaker_employee_id: '',
                      speaker_name: '',
                      speaker_role: '',
                      topic_title: '',
                      material_summary: '',
                      status: 'Terjadwal',
                      documentation_link: '',
                      remarks: '',
                    });
                    triggerToast(
                      editingSharingId
                        ? 'Jadwal & materi berhasil diperbarui!'
                        : `Jadwal ${sharingForm.program_type} baru berhasil ditambahkan!`
                    );
                  } catch (err: any) {
                    triggerToast(`Gagal menyimpan sesi: ${err.message}`, 'error');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className="bg-white p-6 rounded-2xl border-2 border-blue-200 shadow-xs space-y-4 no-print"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                  <div>
                    <h4 className="font-bold text-base text-slate-900">
                      {editingSharingId
                        ? `Mode Edit Jadwal: ${sharingForm.program_type} — ${sharingForm.speaker_name}`
                        : 'Tambah Jadwal Petugas & Materi (Senin Di Skena / Bincang Kenyang)'}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Pilih program (Senin Di Skena atau Bincang Kenyang Setiap Jumat), pilih atau ketik nama petugas yang membawakan materi, judul materi, dan keterangan.
                    </p>
                  </div>
                  {editingSharingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSharingId(null);
                        setSharingForm({
                          program_type: 'Senin Di Skena',
                          session_date: todayStr,
                          speaker_employee_id: '',
                          speaker_name: '',
                          speaker_role: '',
                          topic_title: '',
                          material_summary: '',
                          status: 'Terjadwal',
                          documentation_link: '',
                          remarks: '',
                        });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold"
                    >
                      Batal Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Program Kegiatan *</label>
                    <select
                      value={sharingForm.program_type ?? 'Senin Di Skena'}
                      onChange={(e) => setSharingForm({ ...sharingForm, program_type: e.target.value as SharingProgramType })}
                      className="w-full px-3 py-2 border rounded-xl text-xs font-bold bg-white text-[#1E40AF]"
                    >
                      <option value="Senin Di Skena">Senin Di Skena (Setiap Senin)</option>
                      <option value="Bincang Kenyang">Bincang Kenyang (Setiap Jumat)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Tanggal Pelaksanaan *</label>
                    <input
                      type="date"
                      required
                      value={sharingForm.session_date ?? todayStr}
                      onChange={(e) => setSharingForm({ ...sharingForm, session_date: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Pilih Petugas dari Karyawan</label>
                    <select
                      value={sharingForm.speaker_employee_id ?? ''}
                      onChange={(e) => {
                        const empId = e.target.value;
                        const emp = employees.find((item) => item.id === empId);
                        if (emp) {
                          setSharingForm({
                            ...sharingForm,
                            speaker_employee_id: emp.id,
                            speaker_name: emp.full_name,
                            speaker_role: `${emp.role_title} (${emp.department})`,
                          });
                        } else {
                          setSharingForm({ ...sharingForm, speaker_employee_id: '' });
                        }
                      }}
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-white font-semibold"
                    >
                      <option value="">-- Ketik Manual / Pilih Karyawan --</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.full_name} — {emp.role_title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Nama Petugas / Pemateri *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nama yang membawakan materi"
                      value={sharingForm.speaker_name ?? ''}
                      onChange={(e) => setSharingForm({ ...sharingForm, speaker_name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs font-bold bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Jabatan / Divisi Petugas</label>
                    <input
                      type="text"
                      placeholder="Creative Director / Social Media"
                      value={sharingForm.speaker_role ?? ''}
                      onChange={(e) => setSharingForm({ ...sharingForm, speaker_role: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Materi yang Disampaikan *</label>
                    <input
                      type="text"
                      required
                      placeholder="Judul materi / topik bahasan yang dibawakan..."
                      value={sharingForm.topic_title ?? ''}
                      onChange={(e) => setSharingForm({ ...sharingForm, topic_title: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Status Pelaksanaan</label>
                    <select
                      value={sharingForm.status ?? 'Terjadwal'}
                      onChange={(e) => setSharingForm({ ...sharingForm, status: e.target.value as any })}
                      className="w-full px-3 py-2 border rounded-xl text-xs font-bold bg-white"
                    >
                      <option value="Terjadwal">Terjadwal</option>
                      <option value="Selesai">Selesai</option>
                      <option value="Ditunda">Ditunda</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Ringkasan Materi / Poin Utama</label>
                    <input
                      type="text"
                      placeholder="Ringkasan materi yang disampaikan..."
                      value={sharingForm.material_summary ?? ''}
                      onChange={(e) => setSharingForm({ ...sharingForm, material_summary: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Keterangan / Menu Konsumsi / Catatan</label>
                    <input
                      type="text"
                      placeholder="Keterangan sesi, ruangan, atau konsumsi Jumat..."
                      value={sharingForm.remarks ?? ''}
                      onChange={(e) => setSharingForm({ ...sharingForm, remarks: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-[#1E40AF] hover:bg-blue-800 text-white font-black text-xs shadow transition flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    {editingSharingId ? 'Simpan Perubahan Jadwal' : '+ Simpan Jadwal & Materi'}
                  </button>
                </div>
              </form>
            )}

            {/* Filter Tab & Tabel Daftar Sesi */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  {(['Semua', 'Senin Di Skena', 'Bincang Kenyang'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setSharingTab(tab)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                        sharingTab === tab
                          ? 'bg-[#1E40AF] text-white shadow'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {tab === 'Semua'
                        ? `Semua Program (${sharingSessions.length})`
                        : tab === 'Senin Di Skena'
                        ? `Senin Di Skena — Setiap Senin (${sharingSessions.filter((s) => s.program_type === 'Senin Di Skena').length})`
                        : `Bincang Kenyang — Setiap Jumat (${sharingSessions.filter((s) => s.program_type === 'Bincang Kenyang').length})`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 uppercase">
                      <th className="p-2.5 border">Program & Hari</th>
                      <th className="p-2.5 border">Tanggal</th>
                      <th className="p-2.5 border">Nama Petugas / Pemateri</th>
                      <th className="p-2.5 border">Materi yang Disampaikan</th>
                      <th className="p-2.5 border">Ringkasan Bahasan</th>
                      <th className="p-2.5 border">Keterangan</th>
                      <th className="p-2.5 border text-center">Status</th>
                      {currentUser.role === 'admin' && <th className="p-2.5 border text-center no-print">Aksi Admin</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {sharingSessions
                      .filter((s) => sharingTab === 'Semua' || s.program_type === sharingTab)
                      .map((session) => (
                        <tr key={session.id} className="hover:bg-slate-50">
                          <td className="p-2.5 border">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                session.program_type === 'Senin Di Skena'
                                  ? 'bg-blue-100 text-[#1E40AF]'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {session.program_type}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {session.program_type === 'Senin Di Skena' ? 'Rutin Setiap Senin' : 'Rutin Setiap Jumat'}
                            </div>
                          </td>
                          <td className="p-2.5 border font-mono font-bold text-slate-800">{session.session_date}</td>
                          <td className="p-2.5 border">
                            <div className="font-bold text-slate-900">{session.speaker_name}</div>
                            {(session.speaker_role || session.speaker_department) && (
                              <div className="text-[11px] text-slate-500">
                                {session.speaker_role || session.speaker_department}
                              </div>
                            )}
                          </td>
                          <td className="p-2.5 border font-bold text-[#1E40AF]">{session.topic_title}</td>
                          <td className="p-2.5 border text-slate-600">{session.material_summary || '-'}</td>
                          <td className="p-2.5 border text-slate-600">{session.remarks || '-'}</td>
                          <td className="p-2.5 border text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                session.status === 'Selesai'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : session.status === 'Ditunda'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {session.status}
                            </span>
                          </td>
                          {currentUser.role === 'admin' && (
                            <td className="p-2.5 border text-center no-print">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const nextStatus = session.status === 'Selesai' ? 'Terjadwal' : 'Selesai';
                                    await SkenaHrApi.upsertSharingSession({ ...session, status: nextStatus });
                                    setSharingSessions(await SkenaHrApi.getSharingSessions());
                                    triggerToast(`Status sesi "${session.topic_title}" diubah menjadi ${nextStatus}.`);
                                  }}
                                  className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold"
                                  title="Tandai Selesai / Terjadwal"
                                >
                                  ✓ {session.status === 'Selesai' ? 'Buka' : 'Selesai'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingSharingId(session.id);
                                    setSharingForm({ ...session });
                                  }}
                                  className="p-1.5 text-[#1E40AF] hover:bg-blue-50 rounded-lg"
                                  title="Edit Jadwal & Materi"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeleteConfirm({
                                      isOpen: true,
                                      title: `Hapus Jadwal ${session.program_type}`,
                                      message: `Hapus jadwal "${session.topic_title}" oleh ${session.speaker_name} (${session.session_date})?`,
                                      onConfirm: async () => {
                                        await SkenaHrApi.deleteSharingSession(session.id);
                                        setSharingSessions(await SkenaHrApi.getSharingSessions());
                                        triggerToast('Jadwal berhasil dihapus.');
                                      },
                                    });
                                  }}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                                  title="Hapus Jadwal"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    {sharingSessions.filter((s) => sharingTab === 'Semua' || s.program_type === sharingTab).length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-400">
                          Belum ada jadwal pada kategori ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            MODUL BARU: ONE YEAR PLAN (ROADMAP TAHUNAN, CHECKLIST & TARGET Q1-Q4)
           =================================================================== */}
        {activeModule === 'one_year_plan' && (
          <div className="space-y-6">
            {/* Banner Header One Year Plan */}
            <div className="bg-gradient-to-r from-[#1E2B6D] via-[#1E40AF] to-emerald-800 text-white p-6 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-4 no-print">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-amber-400 text-slate-900 text-xs font-black uppercase">
                    Strategic Roadmap & Action Plan {settings.period_year}
                  </span>
                  <span className="text-xs text-blue-100 font-semibold">
                    Selesai: {oneYearPlans.filter((p) => p.is_completed).length} / {oneYearPlans.length} Target ({oneYearPlans.length > 0 ? Math.round((oneYearPlans.filter((p) => p.is_completed).length / oneYearPlans.length) * 100) : 0}%)
                  </span>
                </div>
                <h3 className="text-xl font-black">
                  One Year Plan & Checklist Eksekusi Tahunan — {settings.company_name}
                </h3>
                <p className="text-xs text-blue-100 max-w-3xl">
                  Administrator dapat mengisi rencana tahunan (Q1–Q4), menambah inisiatif baru, memberikan centang selesai, mengatur persentase progres, mengedit detail, maupun menghapus item.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const rows = oneYearPlans.map((p, idx) => [
                      idx + 1,
                      p.quarter,
                      p.month_label || p.target_month || '-',
                      p.title || p.objective_title || '-',
                      p.category || p.department || '-',
                      p.pic_name,
                      p.target_metric || p.key_result_kpi || '-',
                      `${p.progress_pct}%`,
                      p.is_completed ? 'SELESAI (✓)' : p.status || 'On Track',
                      p.notes || '-',
                    ]);
                    downloadStructuredExcel(
                      `One_Year_Plan_Skena_${settings.period_year}.xlsx`,
                      'One_Year_Plan',
                      `${settings.company_name.toUpperCase()} — ONE YEAR PLAN & STRATEGIC ROADMAP (${settings.period_year})`,
                      `Total Inisiatif: ${oneYearPlans.length} | Selesai: ${oneYearPlans.filter((p) => p.is_completed).length}`,
                      [
                        'No',
                        'Kuartal',
                        'Target Bulan',
                        'Judul Rencana / Inisiatif',
                        'Kategori / Divisi',
                        'PIC / Penanggung Jawab',
                        'Target Output / KPI',
                        'Progres (%)',
                        'Status Checklist',
                        'Catatan',
                      ],
                      rows
                    );
                    triggerToast('Data One Year Plan berhasil diunduh (.xlsx)!');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10B981] hover:bg-emerald-600 text-white text-xs font-black shadow transition"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Unduh One Year Plan (.xlsx)
                </button>
              </div>
            </div>

            {/* Progress Bar Kuartal Q1 - Q4 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((q) => {
                const qItems = oneYearPlans.filter((p) => p.quarter === q);
                const qDone = qItems.filter((p) => p.is_completed).length;
                const qPct = qItems.length > 0 ? Math.round((qDone / qItems.length) * 100) : 0;
                return (
                  <div key={q} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-[#1E40AF] text-xs font-black">{q} Roadmap</span>
                      <span className="text-xs font-black text-emerald-700">{qDone}/{qItems.length} Selesai ({qPct}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#10B981] rounded-full transition-all" style={{ width: `${qPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Form Tambah / Edit One Year Plan (Admin) */}
            {currentUser.role === 'admin' && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const resolvedTitle = (oneYearForm.title || oneYearForm.objective_title || '').trim();
                  if (!resolvedTitle) {
                    triggerToast('Judul inisiatif One Year Plan wajib diisi!', 'error');
                    return;
                  }
                  setIsLoading(true);
                  try {
                    const isDone = Boolean(oneYearForm.is_completed) || Number(oneYearForm.progress_pct) >= 100;
                    await SkenaHrApi.upsertOneYearPlan({
                      ...oneYearForm,
                      ...(editingOneYearId ? { id: editingOneYearId } : {}),
                      is_completed: isDone,
                      progress_pct: isDone ? 100 : Number(oneYearForm.progress_pct ?? 0),
                      status: isDone ? 'Completed' : (oneYearForm.status || 'On Track'),
                    });
                    setOneYearPlans(await SkenaHrApi.getOneYearPlans());
                    setEditingOneYearId(null);
                    setOneYearForm({
                      quarter: 'Q1',
                      month_label: 'Januari - Maret',
                      title: '',
                      category: 'Company Strategy',
                      pic_name: 'Managing Director & HR Lead',
                      target_metric: '',
                      is_completed: false,
                      progress_pct: 0,
                      status: 'On Track',
                      notes: '',
                    });
                    triggerToast(editingOneYearId ? 'Item One Year Plan berhasil diperbarui!' : 'Inisiatif baru berhasil ditambahkan ke One Year Plan!');
                  } catch (err: any) {
                    triggerToast(`Gagal menyimpan One Year Plan: ${err.message}`, 'error');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className="bg-white p-6 rounded-2xl border-2 border-blue-200 shadow-xs space-y-4 no-print"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                  <div>
                    <h4 className="font-bold text-base text-slate-900">
                      {editingOneYearId ? `Edit Item One Year Plan: ${oneYearForm.title}` : 'Tambah Rencana / Target Baru ke One Year Plan'}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Isi kuartal, bulan pelaksanaan, judul rencana, kategori, PIC, metrik target, dan progres capaian.
                    </p>
                  </div>
                  {editingOneYearId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingOneYearId(null);
                        setOneYearForm({
                          quarter: 'Q1',
                          month_label: 'Januari - Maret',
                          title: '',
                          category: 'Company Strategy',
                          pic_name: 'Managing Director & HR Lead',
                          target_metric: '',
                          is_completed: false,
                          progress_pct: 0,
                          status: 'On Track',
                          notes: '',
                        });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold"
                    >
                      Batal Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Kuartal *</label>
                    <select
                      value={oneYearForm.quarter ?? 'Q1'}
                      onChange={(e) => setOneYearForm({ ...oneYearForm, quarter: e.target.value as any })}
                      className="w-full px-3 py-2 border rounded-xl text-xs font-bold bg-white text-[#1E40AF]"
                    >
                      <option value="Q1">Q1 (Januari – Maret)</option>
                      <option value="Q2">Q2 (April – Juni)</option>
                      <option value="Q3">Q3 (Juli – September)</option>
                      <option value="Q4">Q4 (Oktober – Desember)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Target Bulan</label>
                    <input
                      type="text"
                      placeholder="Contoh: Februari 2026"
                      value={oneYearForm.month_label ?? oneYearForm.target_month ?? ''}
                      onChange={(e) =>
                        setOneYearForm({
                          ...oneYearForm,
                          month_label: e.target.value,
                          target_month: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Kategori / Divisi</label>
                    <select
                      value={oneYearForm.category ?? oneYearForm.department ?? 'Company Strategy'}
                      onChange={(e) =>
                        setOneYearForm({
                          ...oneYearForm,
                          category: e.target.value,
                          department: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-white font-semibold"
                    >
                      <option value="Company Strategy">Company Strategy</option>
                      <option value="HR & Culture">HR & Culture</option>
                      <option value="Creative & Production">Creative & Production</option>
                      <option value="Sales & Revenue">Sales & Revenue</option>
                      <option value="CSR & Community">CSR & Community</option>
                      <option value="Creative">Creative</option>
                      <option value="Sales & Marketing">Sales & Marketing</option>
                      <option value="Operasional">Operasional</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">PIC / Penanggung Jawab</label>
                    <input
                      type="text"
                      placeholder="Managing Director / Creative Lead"
                      value={oneYearForm.pic_name ?? ''}
                      onChange={(e) => setOneYearForm({ ...oneYearForm, pic_name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Judul Rencana / Inisiatif Tahunan *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Peluncuran Studio Podcast Baru & Rekrutmen Batch Q2"
                      value={oneYearForm.title ?? oneYearForm.objective_title ?? ''}
                      onChange={(e) =>
                        setOneYearForm({
                          ...oneYearForm,
                          title: e.target.value,
                          objective_title: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-xl text-xs font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Target Metrik / Output</label>
                    <input
                      type="text"
                      placeholder="Contoh: 100% Terimplementasi / 5 Klien Retainer"
                      value={oneYearForm.target_metric ?? oneYearForm.key_result_kpi ?? ''}
                      onChange={(e) =>
                        setOneYearForm({
                          ...oneYearForm,
                          target_metric: e.target.value,
                          key_result_kpi: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Progres (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={oneYearForm.progress_pct ?? 0}
                        onChange={(e) => setOneYearForm({ ...oneYearForm, progress_pct: Number(e.target.value) })}
                        className="w-full px-2.5 py-2 border rounded-xl text-xs font-bold bg-white text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Status</label>
                      <select
                        value={oneYearForm.status ?? 'On Track'}
                        onChange={(e) => setOneYearForm({ ...oneYearForm, status: e.target.value as any })}
                        className="w-full px-2 py-2 border rounded-xl text-xs font-bold bg-white"
                      >
                        <option value="Planned">Planned</option>
                        <option value="On Track">On Track</option>
                        <option value="At Risk">At Risk</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      placeholder="Catatan detail eksekusi / tindak lanjut..."
                      value={oneYearForm.notes ?? ''}
                      onChange={(e) => setOneYearForm({ ...oneYearForm, notes: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <label className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(oneYearForm.is_completed)}
                        onChange={(e) =>
                          setOneYearForm({
                            ...oneYearForm,
                            is_completed: e.target.checked,
                            progress_pct: e.target.checked ? 100 : oneYearForm.progress_pct,
                            status: e.target.checked ? 'Completed' : 'On Track',
                          })
                        }
                        className="w-4 h-4 rounded text-emerald-600"
                      />
                      Tandai Selesai (✓)
                    </label>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-[#1E40AF] hover:bg-blue-800 text-white font-black text-xs shadow transition inline-flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      {editingOneYearId ? 'Simpan Perubahan' : '+ Tambah ke One Year Plan'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Daftar Checklist One Year Plan */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  {(['Semua', 'Q1', 'Q2', 'Q3', 'Q4'] as const).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setOneYearQuarterFilter(q)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                        oneYearQuarterFilter === q
                          ? 'bg-[#1E40AF] text-white shadow'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {q === 'Semua' ? `Semua Kuartal (${oneYearPlans.length})` : `${q} (${oneYearPlans.filter((p) => p.quarter === q).length})`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {oneYearPlans
                  .filter((p) => oneYearQuarterFilter === 'Semua' || p.quarter === oneYearQuarterFilter)
                  .map((plan) => (
                    <div
                      key={plan.id}
                      className={`p-4 rounded-2xl border transition flex flex-wrap items-center justify-between gap-4 ${
                        plan.is_completed
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-white border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-[260px]">
                        <button
                          type="button"
                          onClick={async () => {
                            const nextDone = !plan.is_completed;
                            await SkenaHrApi.upsertOneYearPlan({
                              ...plan,
                              is_completed: nextDone,
                              progress_pct: nextDone ? 100 : Math.min(plan.progress_pct, 90),
                              status: nextDone ? 'Completed' : 'On Track',
                            });
                            setOneYearPlans(await SkenaHrApi.getOneYearPlans());
                            triggerToast(
                              nextDone
                                ? `Target "${plan.title || plan.objective_title}" ditandai SELESAI (✓)!`
                                : `Status selesai pada "${plan.title || plan.objective_title}" dibuka kembali.`
                            );
                          }}
                          className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center font-black text-xs transition shrink-0 ${
                            plan.is_completed
                              ? 'bg-[#10B981] border-[#10B981] text-white'
                              : 'bg-white border-slate-300 text-transparent hover:border-blue-500'
                          }`}
                          title="Klik untuk memberikan centang selesai / batal selesai"
                        >
                          ✓
                        </button>
                        <div className="space-y-1 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-blue-100 text-[#1E40AF] text-[10px] font-black">
                              {plan.quarter} • {plan.month_label || plan.target_month}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                              {plan.category || plan.department}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                plan.is_completed || plan.status === 'Completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : plan.status === 'At Risk'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {plan.is_completed ? '✓ Completed' : plan.status || 'On Track'}
                            </span>
                          </div>
                          <h4
                            className={`font-bold text-sm ${
                              plan.is_completed ? 'line-through text-slate-500' : 'text-slate-900'
                            }`}
                          >
                            {plan.title || plan.objective_title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                            <span>PIC: <strong>{plan.pic_name}</strong></span>
                            <span>Target Output: <strong className="text-[#1E40AF]">{plan.target_metric || plan.key_result_kpi || '-'}</strong></span>
                            {plan.notes && <span className="italic text-slate-500">"{plan.notes}"</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-36">
                          <div className="flex justify-between text-[11px] font-bold mb-1">
                            <span className="text-slate-500">Progres</span>
                            <span className="text-[#1E40AF]">{plan.progress_pct}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${plan.is_completed ? 'bg-[#10B981]' : 'bg-[#1E40AF]'}`}
                              style={{ width: `${plan.progress_pct}%` }}
                            />
                          </div>
                        </div>

                        {currentUser.role === 'admin' && (
                          <div className="flex items-center gap-1 no-print">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingOneYearId(plan.id);
                                setOneYearForm({
                                  ...plan,
                                  title: plan.title || plan.objective_title || '',
                                  objective_title: plan.objective_title || plan.title || '',
                                  month_label: plan.month_label || plan.target_month || '',
                                  target_month: plan.target_month || plan.month_label || '',
                                  category: plan.category || plan.department || 'Company Strategy',
                                  department: plan.department || plan.category || 'Company Strategy',
                                  target_metric: plan.target_metric || plan.key_result_kpi || '',
                                  key_result_kpi: plan.key_result_kpi || plan.target_metric || '',
                                });
                              }}
                              className="p-1.5 text-[#1E40AF] hover:bg-blue-50 rounded-lg"
                              title="Edit Rencana Ini"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteConfirm({
                                  isOpen: true,
                                  title: 'Hapus Item One Year Plan',
                                  message: `Hapus rencana "${plan.title || plan.objective_title}" (${plan.quarter}) dari One Year Plan?`,
                                  onConfirm: async () => {
                                    await SkenaHrApi.deleteOneYearPlan(plan.id);
                                    setOneYearPlans(await SkenaHrApi.getOneYearPlans());
                                    triggerToast('Item One Year Plan berhasil dihapus.');
                                  },
                                });
                              }}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                              title="Hapus Rencana Ini"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            MODUL 4: JURNAL SPRINT HARIAN, LOG PRODUKSI & LMS
           =================================================================== */}
        {activeModule === 'logs' && (
          <div className="space-y-6">
            <form
              id="log-crud-form"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!logForm.project_deliverable_topic?.trim() || !logForm.execution_details?.trim()) {
                  triggerToast('Topik Deliverable & Rincian Eksekusi wajib diisi!', 'error');
                  return;
                }
                setIsLoading(true);
                try {
                  const payload: Partial<ActivityLog> = {
                    ...logForm,
                    log_date: logForm.log_date || new Date().toISOString().slice(0, 10),
                    sprint_session_info: logForm.sprint_session_info || 'Sprint Harian (09:00 - 17:00 WITA)',
                    competency_id: logForm.competency_id || competencies[0]?.id || 'comp-kpi-01',
                    project_deliverable_topic: logForm.project_deliverable_topic.trim(),
                    execution_details: logForm.execution_details.trim(),
                    blocker_evaluator_notes: (logForm.blocker_evaluator_notes || '').trim(),
                    total_active_team: Number(logForm.total_active_team ?? 0),
                    total_on_leave: Number(logForm.total_on_leave ?? 0),
                  };

                  if (editingLogId && currentUser.role === 'admin') {
                    await SkenaHrApi.upsertActivityLog({ ...payload, id: editingLogId });
                    setEditingLogId(null);
                    triggerToast('Jurnal Sprint & LMS berhasil diperbarui & tersinkronisasi ke Database Cloud!');
                  } else {
                    await SkenaHrApi.createActivityLog(payload);
                    triggerToast('Jurnal Sprint & LMS baru berhasil disimpan & tersinkronisasi ke Database Cloud!');
                  }

                  const freshLogs = await SkenaHrApi.getActivityLogs();
                  setActivityLogs([...freshLogs]);
                  setLogForm((prev) => ({
                    ...prev,
                    project_deliverable_topic: '',
                    execution_details: '',
                    blocker_evaluator_notes: '',
                  }));
                } catch (err: any) {
                  triggerToast(`Gagal menyimpan jurnal: ${err.message}`, 'error');
                } finally {
                  setIsLoading(false);
                }
              }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 no-print"
            >
              <div className="border-b pb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-slate-800">
                      {editingLogId
                        ? 'Mode Edit Jurnal Aktivitas Sprint, LMS & Evaluasi Operasional'
                        : 'Input Jurnal Aktivitas Sprint, LMS & Evaluasi Operasional Harian'}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        currentUser.role === 'admin'
                          ? 'bg-blue-100 text-[#1E40AF]'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {currentUser.role === 'admin' ? 'Akses Penuh Admin (Input, Edit & Hapus)' : 'Mode Input Karyawan'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mencatat deliverable project, materi LMS yang dipelajari, hambatan, serta otomatis menghitung jumlah tim aktif & cuti. Tersinkronisasi langsung secara real-time.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {editingLogId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingLogId(null);
                        setLogForm((prev) => ({
                          ...prev,
                          project_deliverable_topic: '',
                          execution_details: '',
                          blocker_evaluator_notes: '',
                        }));
                        triggerToast('Mode edit jurnal dibatalkan.');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold hover:bg-rose-100"
                    >
                      Batal Edit Jurnal
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      setIsLoading(true);
                      try {
                        for (const item of activityLogs) {
                          await SkenaHrApi.upsertActivityLog(item);
                        }
                        const refreshed = await SkenaHrApi.getActivityLogs();
                        setActivityLogs([...refreshed]);
                        triggerToast(`Berhasil menyinkronkan ${refreshed.length} Jurnal Sprint & LMS ke Database Cloud!`);
                      } catch (err: any) {
                        triggerToast(`Gagal sinkronisasi jurnal: ${err.message}`, 'error');
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 text-[#1E40AF] border border-blue-200 text-xs font-bold hover:bg-blue-100 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Sinkronkan Jurnal Sekarang
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Tanggal Log (Sinkron Presensi)</label>
                  <input
                    type="date"
                    value={logForm.log_date ?? ''}
                    onChange={(e) => syncAttendanceToLogDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Sesi Sprint / Jam Kerja</label>
                  <input
                    type="text"
                    value={logForm.sprint_session_info ?? ''}
                    onChange={(e) => setLogForm({ ...logForm, sprint_session_info: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Kompetensi / KPI Terkait</label>
                  <select
                    value={logForm.competency_id ?? ''}
                    onChange={(e) => setLogForm({ ...logForm, competency_id: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white"
                  >
                    {competencies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.competency_code} - {c.competency_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200 text-center">
                    <span className="text-[11px] font-bold text-emerald-700 block">Tim Aktif</span>
                    <span className="text-lg font-black text-emerald-800">{logForm.total_active_team ?? 0} Org</span>
                  </div>
                  <div className="bg-rose-50 p-2 rounded-lg border border-rose-200 text-center">
                    <span className="text-[11px] font-bold text-rose-700 block">Tim Cuti</span>
                    <span className="text-lg font-black text-rose-800">{logForm.total_on_leave ?? 0} Org</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Topik Deliverable Project / Materi LMS *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Produksi Video Kampanye Q4 & Modul LMS Copywriting"
                    value={logForm.project_deliverable_topic ?? ''}
                    onChange={(e) => setLogForm({ ...logForm, project_deliverable_topic: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Rincian Eksekusi & Aktivitas Belajar *</label>
                  <input
                    type="text"
                    required
                    placeholder="Brief review, shooting studio, color grading, QA internal"
                    value={logForm.execution_details ?? ''}
                    onChange={(e) => setLogForm({ ...logForm, execution_details: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Catatan Blocker / Evaluasi HR & Lead</label>
                  <input
                    type="text"
                    placeholder="Kendala teknis rendering / Kebutuhan alat pencahayaan tambahan"
                    value={logForm.blocker_evaluator_notes ?? ''}
                    onChange={(e) => setLogForm({ ...logForm, blocker_evaluator_notes: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white"
                  />
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={handleExportLogsCsv}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#10B981] text-white text-sm font-semibold hover:bg-emerald-600 shadow"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Unduh Jurnal Operasional (.xlsx)
                </button>
                <button type="submit" className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#1E40AF] text-white text-sm font-semibold hover:bg-blue-800 shadow">
                  <Save className="w-4 h-4" /> {editingLogId ? 'Simpan Perubahan Jurnal' : 'Simpan Jurnal Aktivitas'}
                </button>
              </div>
            </form>

            {/* Rekap Jurnal Siap Unduh Excel */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs print-area space-y-4">
              <div className="border-b pb-3 flex flex-wrap justify-between items-center gap-2">
                <div>
                  <h4 className="font-bold text-lg text-slate-900">Rekapitulasi Jurnal Operasional, Sprint & LMS — {settings.company_name}</h4>
                  <p className="text-xs text-slate-500">Periode: {settings.period_term} ({settings.period_year}) • Divisi: {settings.department_scope}</p>
                </div>
                <div className="flex flex-wrap gap-2 no-print">
                  <button
                    type="button"
                    onClick={handleExportLogsCsv}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10B981] text-white text-xs font-bold hover:bg-emerald-600 shadow"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Unduh Jurnal Operasional (.xlsx)
                  </button>
                </div>
              </div>
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-xs uppercase">
                    <th className="p-2.5 border">Tanggal & Sesi</th>
                    <th className="p-2.5 border">Kompetensi / KPI</th>
                    <th className="p-2.5 border">Topik Project / Materi LMS</th>
                    <th className="p-2.5 border">Eksekusi & Blocker</th>
                    <th className="p-2.5 border text-center">Tim Hadir / Cuti</th>
                    {currentUser.role === 'admin' && <th className="p-2.5 border text-center no-print">Aksi Admin</th>}
                  </tr>
                </thead>
                <tbody>
                  {activityLogs.map((log) => {
                    const resolvedCompName =
                      log.competencies?.competency_name ||
                      competencies.find((c) => c.id === log.competency_id || c.competency_code === log.competency_id)?.competency_name ||
                      'Kompetensi Umum';
                    const isBeingEdited = editingLogId === log.id;
                    return (
                      <tr key={log.id} className={isBeingEdited ? 'bg-blue-50/70' : 'hover:bg-slate-50'}>
                        <td className="p-2.5 border text-xs">
                          <div className="font-bold text-slate-900">{log.log_date}</div>
                          <div className="text-slate-500">{log.sprint_session_info}</div>
                        </td>
                        <td className="p-2.5 border font-semibold text-[#1E40AF]">{resolvedCompName}</td>
                        <td className="p-2.5 border font-medium">{log.project_deliverable_topic}</td>
                        <td className="p-2.5 border text-xs">
                          <div className="text-slate-700">{log.execution_details}</div>
                          {log.blocker_evaluator_notes && <div className="text-rose-600 mt-1 font-medium">Hambatan: {log.blocker_evaluator_notes}</div>}
                        </td>
                        <td className="p-2.5 border text-center font-bold">
                          <span className="text-emerald-700">{log.total_active_team} Aktif</span> / <span className="text-rose-600">{log.total_on_leave} Cuti</span>
                        </td>
                        {currentUser.role === 'admin' && (
                          <td className="p-2.5 border text-center no-print">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (log.id) setEditingLogId(log.id);
                                  setLogForm({
                                    log_date: log.log_date,
                                    sprint_session_info: log.sprint_session_info,
                                    competency_id: log.competency_id || competencies[0]?.id || 'comp-kpi-01',
                                    project_deliverable_topic: log.project_deliverable_topic,
                                    execution_details: log.execution_details,
                                    blocker_evaluator_notes: log.blocker_evaluator_notes || '',
                                    total_active_team: log.total_active_team,
                                    total_on_leave: log.total_on_leave,
                                  });
                                  triggerToast(`Mode edit aktif untuk jurnal "${log.project_deliverable_topic}" (${log.log_date})`);
                                  const el = document.getElementById('log-crud-form');
                                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="px-2 py-1 text-xs font-bold text-[#1E40AF] bg-blue-50 hover:bg-blue-100 rounded-lg inline-flex items-center gap-1"
                                title="Edit Jurnal"
                              >
                                <Pencil className="w-3.5 h-3.5" /> Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteConfirm({
                                    isOpen: true,
                                    title: 'Hapus Jurnal Operasional',
                                    message: `Hapus jurnal "${log.project_deliverable_topic}" tanggal ${log.log_date}?`,
                                    onConfirm: async () => {
                                      if (log.id) {
                                        await SkenaHrApi.deleteActivityLog(log.id);
                                      }
                                      const refreshed = await SkenaHrApi.getActivityLogs();
                                      setActivityLogs([...refreshed]);
                                      if (editingLogId === log.id) {
                                        setEditingLogId(null);
                                      }
                                      triggerToast('Jurnal berhasil dihapus & disinkronkan.');
                                    },
                                  });
                                }}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                                title="Hapus Jurnal"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {activityLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">Belum ada jurnal tersimpan</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="grid grid-cols-2 text-center pt-8 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Mengetahui,</p>
                  <p className="font-semibold text-xs mt-1">Managing Director</p>
                  <div className="h-16" />
                  <p className="font-bold underline">{settings.managing_director_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Dicatat Oleh,</p>
                  <p className="font-semibold text-xs mt-1">Human Capital / HR Lead</p>
                  <div className="h-16" />
                  <p className="font-bold underline">{settings.hr_lead_name}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            MODUL 5: BUKU EVALUASI KPI, SKILL LEVEL & WORKLOAD ANALYSIS (WLA)
            (ADMIN: FULL CRUD TAMBAH/UBAH/GANTI NAMA/HAPUS | KARYAWAN: HANYA INPUT & LIHAT DETAIL)
           =================================================================== */}
        {activeModule === 'kpi_workload' && (
          <div className="space-y-6">
            {/* Banner Otoritas Peran & Integrasi Buku Evaluasi KPI & WLA */}
            <div className="bg-gradient-to-r from-[#1E2B6D] via-[#1E40AF] to-blue-800 text-white p-5 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-4 no-print">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded bg-amber-400 text-slate-900">
                    {currentUser.role === 'admin'
                      ? 'Kontrol Penuh Administrator (Full CRUD)'
                      : 'Mode Input Mandiri Karyawan'}
                  </span>
                  <span className="text-xs text-blue-200">
                    Kalkulasi Dinamis: {kpiWeights.sprint_weight_pct}% Rata-rata Sprint (M1–M4) + {kpiWeights.skill_weight_pct}% Observasi Skill + {kpiWeights.project_weight_pct}% Delivery Project
                  </span>
                </div>
                <h3 className="text-lg font-black">
                  Buku Evaluasi KPI, Current Skill Level & Working Load Analysis (WLA)
                </h3>
                <p className="text-xs text-blue-100 max-w-3xl">
                  {currentUser.role === 'admin'
                    ? 'Administrator dapat mengatur proporsi bobot KPI, menambah indikator KPI baru, mengganti nama/kode indikator, menetapkan Passing Threshold & Standar Jam WLA, mengubah seluruh skor, maupun menghapus data.'
                    : 'Sebagai Karyawan, Anda hanya dapat menginput realisasi capaian Sprint & jam kerja aktual untuk akun Anda sendiri, serta melihat detail evaluasi & integrasi presensi secara transparan.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentUser.role === 'admin' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowInlineCompCrud((prev) => !prev)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-black shadow transition"
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                      {showInlineCompCrud ? 'Tutup Manajemen Indikator KPI' : '+ Tambah / Ganti Nama / Hapus Indikator KPI'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickEmpEditingId(null);
                        setQuickEmpForm({
                          employee_nik: `SKN-2026-${String(employees.length + 1).padStart(3, '0')}`,
                          full_name: '',
                          gender: 'L',
                          role_title: 'Creative Staff',
                          department: 'Creative',
                          employment_status: 'Full Time',
                          contract_duration: '12 Bulan (Jan - Des 2026)',
                          work_location: 'Makassar HQ',
                          direct_supervisor: 'Managing Director',
                          annual_leave_quota: 12,
                          is_active: true,
                        });
                        setShowQuickEmpModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/20 transition"
                    >
                      <Plus className="w-4 h-4" /> Tambah Karyawan Baru
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setActiveModule('attendance')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/20 transition"
                >
                  <CheckSquare className="w-4 h-4" /> Buka Rekap Presensi →
                </button>
              </div>
            </div>

            {/* PANEL PENGATURAN PROPORSI BOBOT PENILAIAN KPI (ADMINISTRATOR) */}
            {currentUser.role === 'admin' && (
              <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs flex flex-wrap items-center justify-between gap-4 no-print">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-[#1E40AF]" />
                    Pengaturan Proporsi & Bobot Penilaian KPI (Dapat Disesuaikan Administrator)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Sesuaikan persentase bobot penilaian antara Rata-rata Sprint Mingguan (M1–M4), Observasi Skill Review, dan Final Project Delivery.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border">
                    <span className="text-xs font-bold text-slate-700">Bobot Sprint (M1–M4):</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={kpiWeights.sprint_weight_pct}
                      onChange={(e) => setKpiWeights({ ...kpiWeights, sprint_weight_pct: Number(e.target.value) })}
                      className="w-14 px-2 py-1 border rounded-lg text-xs font-black text-[#1E40AF] text-center bg-white"
                    />
                    <span className="text-xs font-bold text-slate-500">%</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border">
                    <span className="text-xs font-bold text-slate-700">Bobot Skill Review:</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={kpiWeights.skill_weight_pct}
                      onChange={(e) => setKpiWeights({ ...kpiWeights, skill_weight_pct: Number(e.target.value) })}
                      className="w-14 px-2 py-1 border rounded-lg text-xs font-black text-emerald-700 text-center bg-white"
                    />
                    <span className="text-xs font-bold text-slate-500">%</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border">
                    <span className="text-xs font-bold text-slate-700">Bobot Final Project:</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={kpiWeights.project_weight_pct}
                      onChange={(e) => setKpiWeights({ ...kpiWeights, project_weight_pct: Number(e.target.value) })}
                      className="w-14 px-2 py-1 border rounded-lg text-xs font-black text-purple-700 text-center bg-white"
                    />
                    <span className="text-xs font-bold text-slate-500">%</span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const total =
                        Number(kpiWeights.sprint_weight_pct) +
                        Number(kpiWeights.skill_weight_pct) +
                        Number(kpiWeights.project_weight_pct);
                      const saved = await SkenaHrApi.saveKpiWeightConfig(kpiWeights);
                      setKpiWeights(saved);
                      triggerToast(
                        `Proporsi Bobot KPI berhasil disimpan (${saved.sprint_weight_pct}% Sprint + ${saved.skill_weight_pct}% Skill + ${saved.project_weight_pct}% Project = ${total}%)!`
                      );
                    }}
                    className="px-4 py-2 rounded-xl bg-[#1E40AF] hover:bg-blue-800 text-white text-xs font-black shadow transition"
                  >
                    Simpan Proporsi KPI
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const def = { sprint_weight_pct: 50, skill_weight_pct: 30, project_weight_pct: 20 };
                      const saved = await SkenaHrApi.saveKpiWeightConfig(def);
                      setKpiWeights(saved);
                      triggerToast('Proporsi bobot KPI dikembalikan ke standar 50% : 30% : 20%.');
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold"
                  >
                    Reset 50/30/20
                  </button>
                </div>
              </div>
            )}

            {/* PANEL KHUSUS ADMIN: CRUD KAMUS INDIKATOR KPI & STANDAR JAM WLA LANGSUNG DI BUKU EVALUASI */}
            {currentUser.role === 'admin' && showInlineCompCrud && (
              <div className="bg-white p-6 rounded-2xl border-2 border-blue-200 shadow-xs space-y-4 no-print">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                  <div>
                    <h4 className="font-bold text-base text-slate-900">
                      Manajemen Indikator KPI, Ganti Nama Kompetensi & Standar Beban Kerja (Khusus Administrator)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Tambah indikator KPI baru, ubah/ganti nama indikator, sesuaikan target kelulusan & standar jam kerja per minggu, atau hapus indikator.
                    </p>
                  </div>
                  {editingCompId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCompId(null);
                        setCompForm({
                          competency_code: '',
                          competency_name: '',
                          category: 'Core KPI',
                          target_threshold: 78,
                          standard_workload_hours: 40,
                        });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold"
                    >
                      Batal Edit Indikator
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveCompetency} className="grid grid-cols-1 md:grid-cols-6 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 items-end">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Kode KPI *</label>
                    <input
                      type="text"
                      required
                      placeholder="KPI-CRE-05"
                      value={compForm.competency_code ?? ''}
                      onChange={(e) => setCompForm({ ...compForm, competency_code: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-xs bg-white font-mono font-bold"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Nama Indikator KPI / Kompetensi *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nama Indikator KPI"
                      value={compForm.competency_name ?? ''}
                      onChange={(e) => setCompForm({ ...compForm, competency_name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-xs bg-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Kategori</label>
                    <select
                      value={compForm.category ?? 'Core KPI'}
                      onChange={(e) => setCompForm({ ...compForm, category: e.target.value as any })}
                      className="w-full px-3 py-2 border rounded-lg text-xs bg-white font-semibold"
                    >
                      <option value="Core KPI">Core KPI</option>
                      <option value="Hard Skill">Hard Skill</option>
                      <option value="Soft Skill">Soft Skill</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Target & Jam WLA/Mgg</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        title="Target Kelulusan"
                        value={compForm.target_threshold ?? 75}
                        onChange={(e) => setCompForm({ ...compForm, target_threshold: Number(e.target.value) })}
                        className="px-2 py-2 border rounded-lg text-xs bg-white font-bold text-center text-[#1E40AF]"
                      />
                      <input
                        type="number"
                        min={10}
                        max={80}
                        title="Standar Jam Kerja/Minggu"
                        value={compForm.standard_workload_hours ?? 40}
                        onChange={(e) => setCompForm({ ...compForm, standard_workload_hours: Number(e.target.value) })}
                        className="px-2 py-2 border rounded-lg text-xs bg-white font-bold text-center text-emerald-700"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#1E40AF] text-white rounded-xl text-xs font-bold px-3 py-2.5 hover:bg-blue-800 shadow"
                  >
                    {editingCompId ? 'Simpan Perubahan KPI' : '+ Tambah Indikator KPI'}
                  </button>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {competencies.map((c) => (
                    <div
                      key={c.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                        c.id === selectedCompId ? 'border-[#1E40AF] bg-blue-50/40' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-mono font-bold text-[#1E40AF]">
                          {c.competency_code} · <span className="text-slate-500 font-sans">{c.category}</span>
                        </div>
                        <div className="text-xs font-bold text-slate-900 truncate">{c.competency_name}</div>
                        <div className="text-[11px] text-slate-500">
                          Target: <strong>{c.target_threshold}</strong> · Standar WLA: <strong>{c.standard_workload_hours || 40} Jam/Mgg</strong>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCompId(c.id);
                            setCompForm({
                              competency_code: c.competency_code,
                              competency_name: c.competency_name,
                              category: c.category,
                              target_threshold: c.target_threshold,
                              standard_workload_hours: c.standard_workload_hours || 40,
                            });
                          }}
                          className="p-1.5 text-[#1E40AF] hover:bg-blue-100 rounded-lg"
                          title="Ganti Nama / Ubah Indikator KPI"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteConfirm({
                              isOpen: true,
                              title: 'Hapus Indikator KPI',
                              message: `Hapus indikator "${c.competency_code} - ${c.competency_name}" dari Buku Evaluasi KPI?`,
                              onConfirm: async () => {
                                await SkenaHrApi.deleteCompetency(c.id);
                                const updated = await SkenaHrApi.getCompetencies();
                                setCompetencies(updated);
                                if (selectedCompId === c.id && updated[0]) {
                                  setSelectedCompId(updated[0].id);
                                }
                                triggerToast(`Indikator "${c.competency_name}" berhasil dihapus.`);
                              },
                            });
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                          title="Hapus Indikator KPI"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PANEL KHUSUS KARYAWAN: FORM INPUT CAPAIAN SPRINT & REALISASI JAM KERJA (WLA) MANDIRI */}
            {currentUser.role !== 'admin' && (
              <div className="bg-white p-6 rounded-2xl border-2 border-emerald-200 shadow-xs space-y-4 no-print">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                  <div>
                    <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-[#10B981]" />
                      Form Input Mandiri Capaian Sprint & Realisasi Jam Kerja (WLA) — {currentUser.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Masukkan laporan realisasi nilai Sprint/Project dan jam kerja mingguan Anda. Data ini langsung terintegrasi ke Buku Evaluasi KPI & WLA untuk ditinjau Administrator.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetailInspectEmpId(currentUser.employeeId || employees[0]?.id || 'e-1')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-[#1E40AF] border border-blue-200 text-xs font-bold hover:bg-blue-100"
                  >
                    <Eye className="w-4 h-4" /> Lihat Detail 360° KPI, WLA & Presensi Saya
                  </button>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const myEmpId = currentUser.employeeId || employees[0]?.id;
                    if (!myEmpId || !selectedCompId) return;
                    const activeComp = competencies.find((c) => c.id === selectedCompId);
                    const stdHours = activeComp?.standard_workload_hours || 40;
                    const computedWlaPct = Math.round((empKpiInputForm.actualHoursWeek / stdHours) * 100);
                    const existingRow = inlineKpiMap[myEmpId] || {
                      employee_id: myEmpId,
                      competency_id: selectedCompId,
                      period_year: settings.period_year,
                      period_term: settings.period_term,
                      kpi_q1: 82,
                      kpi_q2: 85,
                      kpi_q3: 86,
                      kpi_q4: 88,
                      mid_review_score: 85,
                      final_project_score: 86,
                      current_skill_level: 3,
                      workload_percentage: computedWlaPct,
                      performance_narrative: '',
                    };
                    const updatedRow: KpiEvaluation = {
                      ...existingRow,
                      [empKpiInputForm.sprintField]: Number(empKpiInputForm.scoreValue),
                      workload_percentage: computedWlaPct,
                      performance_narrative: empKpiInputForm.deliverableNotes
                        ? `[Input Karyawan ${todayStr} • ${empKpiInputForm.actualHoursWeek}/${stdHours} Jam (${computedWlaPct}% WLA)]: ${empKpiInputForm.deliverableNotes}`
                        : existingRow.performance_narrative,
                    };
                    setIsLoading(true);
                    try {
                      await SkenaHrApi.upsertKpiEvaluation(updatedRow);
                      setInlineKpiMap((prev) => ({ ...prev, [myEmpId]: updatedRow }));
                      const refreshed = await SkenaHrApi.getKpiEvaluations(settings.period_year, settings.period_term);
                      setKpiList(refreshed);
                      triggerToast('Input capaian Sprint & realisasi jam kerja (WLA) Anda berhasil disimpan ke Buku Evaluasi!');
                    } catch (err: any) {
                      triggerToast(`Gagal mengirim input KPI: ${err.message}`, 'error');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end bg-emerald-50/40 p-4 rounded-xl border border-emerald-200"
                >
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">Komponen Sprint / Project</label>
                    <select
                      value={empKpiInputForm.sprintField}
                      onChange={(e) => setEmpKpiInputForm({ ...empKpiInputForm, sprintField: e.target.value as any })}
                      className="w-full px-3 py-2 border rounded-xl text-xs font-bold bg-white text-[#1E40AF]"
                    >
                      <option value="kpi_q1">Sprint Minggu 1 (M1)</option>
                      <option value="kpi_q2">Sprint Minggu 2 (M2)</option>
                      <option value="kpi_q3">Sprint Minggu 3 (M3)</option>
                      <option value="kpi_q4">Sprint Minggu 4 (M4)</option>
                      <option value="final_project_score">Final Project Delivery (20%)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">Nilai Capaian Mandiri (0-100)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      required
                      value={empKpiInputForm.scoreValue}
                      onChange={(e) => setEmpKpiInputForm({ ...empKpiInputForm, scoreValue: Number(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-xl text-xs font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                      Jam Kerja Aktual / Mgg (Standar: {competencies.find((c) => c.id === selectedCompId)?.standard_workload_hours || 40}j)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={80}
                      required
                      value={empKpiInputForm.actualHoursWeek}
                      onChange={(e) => setEmpKpiInputForm({ ...empKpiInputForm, actualHoursWeek: Number(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-xl text-xs font-bold bg-white text-emerald-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">Bukti Deliverable / Catatan</label>
                    <input
                      type="text"
                      placeholder="Ringkasan hasil sprint / link output"
                      value={empKpiInputForm.deliverableNotes}
                      onChange={(e) => setEmpKpiInputForm({ ...empKpiInputForm, deliverableNotes: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-[#10B981] hover:bg-emerald-600 text-white font-black text-xs shadow transition"
                  >
                    Masukkan ke Buku Evaluasi
                  </button>
                </form>
              </div>
            )}

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 print-area">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">
                    Tabel Terintegrasi Buku Evaluasi KPI, Skill Level, WLA & Kehadiran
                  </h3>
                  {(() => {
                    const curComp = competencies.find((c) => c.id === selectedCompId);
                    return (
                      <p className="text-xs text-slate-500">
                        Indikator Aktif: <strong className="text-[#1E40AF]">{curComp?.competency_code} — {curComp?.competency_name}</strong> · Passing Target: <strong>{curComp?.target_threshold || 75}</strong> · Standar Beban Kerja: <strong>{curComp?.standard_workload_hours || 40} Jam/Minggu</strong>
                      </p>
                    );
                  })()}
                </div>
                <div className="flex flex-wrap items-center gap-2 no-print">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold uppercase text-slate-500">Pilih Indikator KPI:</label>
                    <select
                      value={selectedCompId ?? ''}
                      onChange={(e) => setSelectedCompId(e.target.value)}
                      className="px-3.5 py-2 border border-blue-300 rounded-xl text-xs font-bold text-[#1E40AF] bg-blue-50"
                    >
                      {competencies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.competency_code} - {c.competency_name} (Target: {c.target_threshold} | WLA: {c.standard_workload_hours || 40}j)
                        </option>
                      ))}
                    </select>
                  </div>
                  {currentUser.role === 'admin' && (
                    <>
                      {(() => {
                        const curComp = competencies.find((c) => c.id === selectedCompId);
                        if (!curComp) return null;
                        return (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCompTarget(curComp);
                              setShowKpiTargetModal(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1E40AF] text-xs font-bold border border-blue-200 transition"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Edit Nama & Target KPI Ini
                          </button>
                        );
                      })()}
                      <button
                        type="button"
                        onClick={handleBatchSaveAllKpiRows}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1E40AF] text-white text-xs font-bold hover:bg-blue-800 shadow transition"
                      >
                        <Save className="w-4 h-4" /> Simpan Semua KPI Sekaligus
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={handleExportKpiCsv}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10B981] text-white text-xs font-bold hover:bg-emerald-600 shadow transition"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Unduh Buku Evaluasi KPI & WLA (.xlsx)
                  </button>
                </div>
              </div>

              {/* Filter Departemen untuk Penilaian KPI */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 no-print">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5 text-slate-400" /> Filter Departemen:
                  </span>
                  {['Semua', 'Creative', 'Sales & Marketing', 'Operasional', 'Managing Director'].map((dept) => (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => setKpiDeptFilter(dept)}
                      className={`px-3 py-1.5 rounded-lg font-bold transition ${
                        kpiDeptFilter === dept
                          ? 'bg-[#1E40AF] text-white shadow-xs'
                          : 'bg-white border text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
                <span className="text-slate-500">
                  Menampilkan: <strong>{employees.filter((e) => kpiDeptFilter === 'Semua' || e.department === kpiDeptFilter).length}</strong> Karyawan
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 uppercase">
                      <th className="p-2.5 border">Karyawan, Jabatan & Integrasi Presensi</th>
                      <th className="p-2.5 border text-center">Sprint M1</th>
                      <th className="p-2.5 border text-center">Sprint M2</th>
                      <th className="p-2.5 border text-center">Sprint M3</th>
                      <th className="p-2.5 border text-center">Sprint M4 ({kpiWeights.sprint_weight_pct}%)</th>
                      <th className="p-2.5 border text-center">Skill Rev ({kpiWeights.skill_weight_pct}%)</th>
                      <th className="p-2.5 border text-center">Project ({kpiWeights.project_weight_pct}%)</th>
                      <th className="p-2.5 border text-center">Skor Akhir</th>
                      <th className="p-2.5 border text-center">Skill (1-5)</th>
                      <th className="p-2.5 border text-center">Workload (%) & Jam</th>
                      <th className="p-2.5 border">Deskripsi Capaian & Catatan Evaluasi</th>
                      <th className="p-2.5 border text-center no-print">Detail & Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees
                      .filter((emp) => kpiDeptFilter === 'Semua' || emp.department === kpiDeptFilter)
                      .map((emp) => {
                        const row = inlineKpiMap[emp.id];
                        if (!row) return null;
                        const isAdmin = currentUser.role === 'admin';
                        const isSelfRow = currentUser.role === 'employee' && currentUser.employeeId === emp.id;
                        const canInputSprint = isAdmin || isSelfRow;

                        const finalScore = calculateRowScore(row);
                        const activeComp = competencies.find((c) => c.id === selectedCompId);
                        const target = activeComp?.target_threshold || 75;
                        const stdHours = activeComp?.standard_workload_hours || 40;
                        const estActualHours = Math.round(((row.workload_percentage ?? 85) / 100) * stdHours);
                        const isPass = finalScore >= target;

                        const empAttRecs = monthlyAttendances.filter((r) => r.employee_id === emp.id);
                        const activeAttCount = empAttRecs.filter((r) => r.status !== 'Cuti').length;
                        const cutiAttCount = empAttRecs.filter((r) => r.status === 'Cuti').length;
                        const attPct =
                          activeAttCount + cutiAttCount > 0
                            ? Math.round((activeAttCount / (activeAttCount + cutiAttCount)) * 100)
                            : 100;

                        return (
                          <tr key={emp.id} className={isSelfRow ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : 'hover:bg-slate-50'}>
                            <td className="p-2.5 border">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="font-bold text-slate-900 flex items-center gap-1">
                                    <span>{emp.full_name}</span>
                                    {isSelfRow && <span className="text-[10px] font-bold text-emerald-700">(Saya)</span>}
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-0.5">
                                    <span className="font-semibold text-slate-700">{emp.role_title}</span> · {emp.department} · {emp.employment_status}
                                  </div>
                                  <div className="text-[10px] text-slate-500 mt-0.5">
                                    Presensi Aktif: <strong className="text-emerald-700">{attPct}%</strong> ({activeAttCount} Hadir / {cutiAttCount} Cuti)
                                  </div>
                                </div>
                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setQuickEmpEditingId(emp.id);
                                      setQuickEmpForm({ ...emp });
                                      setShowQuickEmpModal(true);
                                    }}
                                    title="Ganti Nama / Ubah Jabatan & Kontrak Karyawan (Khusus Admin)"
                                    className="p-1 text-[#1E40AF] hover:bg-blue-50 rounded shrink-0 no-print"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                            {(['kpi_q1', 'kpi_q2', 'kpi_q3', 'kpi_q4', 'mid_review_score', 'final_project_score'] as const).map((field) => {
                              const fieldEditable = isAdmin || (isSelfRow && field !== 'mid_review_score');
                              return (
                                <td key={field} className="p-1.5 border text-center">
                                  {fieldEditable ? (
                                    <input
                                      type="number"
                                      min={0}
                                      max={100}
                                      value={row[field] ?? 0}
                                      onChange={(e) => {
                                        const updatedRow = { ...row, [field]: Number(e.target.value) };
                                        setInlineKpiMap((prev) => ({
                                          ...prev,
                                          [emp.id]: updatedRow,
                                        }));
                                        SkenaHrApi.upsertKpiEvaluation(updatedRow);
                                      }}
                                      className="w-14 px-1.5 py-1 text-center border rounded font-semibold bg-white"
                                    />
                                  ) : (
                                    <span className="font-mono font-bold text-slate-700">{row[field] ?? 0}</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="p-2.5 border text-center">
                              <div className={`font-black text-xs ${isPass ? 'text-emerald-700' : 'text-rose-600'}`}>
                                {finalScore}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {isPass ? 'Lulus' : `< ${target}`}
                              </div>
                            </td>
                            <td className="p-1.5 border text-center">
                              {isAdmin ? (
                                <select
                                  value={row.current_skill_level ?? 3}
                                  onChange={(e) => {
                                    const updatedRow = { ...row, current_skill_level: Number(e.target.value) };
                                    setInlineKpiMap((prev) => ({
                                      ...prev,
                                      [emp.id]: updatedRow,
                                    }));
                                    SkenaHrApi.upsertKpiEvaluation(updatedRow);
                                  }}
                                  className="px-2 py-1 border rounded font-bold text-[#1E40AF] bg-white"
                                >
                                  {[1, 2, 3, 4, 5].map((lvl) => (
                                    <option key={lvl} value={lvl}>
                                      Lv.{lvl}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="font-bold text-[#1E40AF]">Lv.{row.current_skill_level ?? 3}</span>
                              )}
                            </td>
                            <td className="p-1.5 border text-center">
                              {canInputSprint ? (
                                <div className="space-y-0.5">
                                  <input
                                    type="number"
                                    min={0}
                                    max={200}
                                    value={row.workload_percentage ?? 80}
                                    onChange={(e) => {
                                      const updatedRow = { ...row, workload_percentage: Number(e.target.value) };
                                      setInlineKpiMap((prev) => ({
                                        ...prev,
                                        [emp.id]: updatedRow,
                                      }));
                                      SkenaHrApi.upsertKpiEvaluation(updatedRow);
                                    }}
                                    className={`w-16 px-1.5 py-1 text-center border rounded font-bold ${
                                      (row.workload_percentage ?? 80) > 100
                                        ? 'bg-rose-50 text-rose-700 border-rose-300'
                                        : (row.workload_percentage ?? 80) >= 80
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                        : 'bg-amber-50 text-amber-700 border-amber-300'
                                    }`}
                                  />
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    ≈{estActualHours}/{stdHours}j
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <span className="font-bold text-slate-800">{row.workload_percentage ?? 80}%</span>
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    ≈{estActualHours}/{stdHours}j
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="p-2 border">
                              {canInputSprint ? (
                                <div className="flex gap-1.5 items-center">
                                  <input
                                    type="text"
                                    value={row.performance_narrative ?? ''}
                                    onChange={(e) => {
                                      const updatedRow = { ...row, performance_narrative: e.target.value };
                                      setInlineKpiMap((prev) => ({
                                        ...prev,
                                        [emp.id]: updatedRow,
                                      }));
                                      SkenaHrApi.upsertKpiEvaluation(updatedRow);
                                    }}
                                    placeholder={isAdmin ? 'Klik bintang untuk narasi otomatis...' : 'Input catatan progres Anda...'}
                                    className="w-full px-2 py-1 border rounded text-xs bg-white"
                                  />
                                  {isAdmin && (
                                    <button
                                      type="button"
                                      title="Generate Narasi Capaian & Beban Kerja Otomatis"
                                      onClick={() => generateAutoNarrative(emp, row)}
                                      className="p-1.5 rounded bg-blue-50 text-[#1E40AF] hover:bg-blue-100 shrink-0 transition"
                                    >
                                      <Sparkles className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-600">{row.performance_narrative || '-'}</span>
                              )}
                            </td>
                            <td className="p-2 border text-center no-print">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setDetailInspectEmpId(emp.id)}
                                  className="px-2 py-1.5 rounded-lg bg-blue-50 text-[#1E40AF] hover:bg-blue-100 font-bold text-xs inline-flex items-center gap-1"
                                  title="Lihat Detail Terintegrasi 360° (Semua KPI, WLA & Presensi)"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Detail
                                </button>
                                {isAdmin && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleSaveSingleKpiRow(emp.id)}
                                      className="px-2.5 py-1.5 rounded-lg bg-[#10B981] text-white font-bold hover:bg-emerald-600 shadow text-xs"
                                    >
                                      Simpan
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSingleKpiRow(emp)}
                                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition"
                                      title="Reset / Hapus Nilai KPI Karyawan Ini"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            MODUL 6: GENERATOR RAPOR KARYAWAN BULANAN SIAP CETAK (A4) DENGAN LOGO SKENA
           =================================================================== */}
        {activeModule === 'report_card' && (
          <div className="space-y-6">
            {/* Panel Kontrol Rapor Bulanan & IDP (Hanya Admin yang dapat mengedit; Karyawan read-only & cetak/unduh) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 no-print">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-bold text-slate-700">Karyawan:</label>
                    {currentUser.role === 'admin' ? (
                      <select
                        value={selectedReportEmpId}
                        onChange={(e) => setSelectedReportEmpId(e.target.value)}
                        className="px-4 py-2 border border-blue-300 rounded-xl text-sm font-bold text-[#1E40AF] bg-blue-50"
                      >
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.full_name} — ({emp.employment_status})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="font-bold text-[#1E40AF] text-sm px-3 py-1.5 rounded-lg bg-blue-50">
                        {currentUser.name} ({currentUser.employeeNik})
                      </span>
                    )}
                  </div>

                  {/* Pemilih Bulan Rapor (Rapor Per Bulan) */}
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                    <Calendar className="w-4 h-4 text-[#1E40AF]" />
                    <span className="text-xs font-bold text-slate-700">Bulan Rapor:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const [y, m] = (reportMonth || todayStr.slice(0, 7)).split('-').map(Number);
                        const prev = new Date(y, m - 2, 1);
                        setReportMonth(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`);
                      }}
                      className="px-2 py-0.5 rounded bg-white border text-xs font-bold hover:bg-slate-100"
                      title="Bulan Sebelumnya"
                    >
                      ←
                    </button>
                    <input
                      type="month"
                      min="2024-01"
                      max="2030-12"
                      value={reportMonth}
                      onChange={(e) => setReportMonth(e.target.value)}
                      className="px-2 py-1 border border-blue-200 rounded-lg text-xs font-bold text-[#1E40AF] bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const [y, m] = (reportMonth || todayStr.slice(0, 7)).split('-').map(Number);
                        const next = new Date(y, m, 1);
                        setReportMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`);
                      }}
                      className="px-2 py-0.5 rounded bg-white border text-xs font-bold hover:bg-slate-100"
                      title="Bulan Selanjutnya"
                    >
                      →
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {currentUser.role === 'admin' && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!selectedReportEmpId) return;
                        setIsLoading(true);
                        try {
                          const savedReport = await SkenaHrApi.upsertEmployeeReport({
                            ...empReportData,
                            employee_id: selectedReportEmpId,
                            period_year: settings.period_year,
                            period_term: settings.period_term,
                          });
                          setEmpReportData(savedReport);
                          triggerToast(`Data Rapor Bulanan (${formatMonthLabel(reportMonth)}), IDP & Talent Pipeline tersimpan secara Realtime!`);
                        } catch (err: any) {
                          triggerToast(err.message, 'error');
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 shadow"
                    >
                      <Save className="w-4 h-4" /> Simpan Keputusan Rapor
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleExportEmployeeReportCsv}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#10B981] text-white text-xs font-bold hover:bg-emerald-600 shadow"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Unduh Rapor Bulanan Resmi (.xlsx)
                  </button>
                </div>
              </div>

              {currentUser.role === 'admin' && (
                <>
                  {/* Rekomendasi Sistematika Pengembangan Diri (IDP) Sesuai Departemen */}
                  {(() => {
                    const emp = employees.find((e) => e.id === selectedReportEmpId);
                    if (!emp) return null;
                    const rec = getIdpRecommendations(emp);
                    return (
                      <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 p-4 rounded-2xl border border-purple-200 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-600" />
                            <div>
                              <h4 className="font-bold text-xs text-purple-950 uppercase tracking-wide">
                                Rekomendasi Individual Development Plan (IDP) — Departemen {emp.department}
                              </h4>
                              <p className="text-[11px] text-purple-700">
                                Berdasarkan evaluasi jabatan <strong>{emp.role_title}</strong> dan skema kontrak <strong>{emp.employment_status}</strong>.
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setEmpReportData({
                                ...empReportData,
                                idp_lms_modules: rec.modules,
                                career_decision: rec.careerDecision,
                                next_role_assignment: rec.nextRole,
                                talent_pipeline_box: rec.talentBox,
                                behavioral_culture_notes: rec.cultureNotes,
                                hr_director_notes: rec.directorNotes,
                              });
                              triggerToast(`Rekomendasi IDP & Karir untuk ${emp.full_name} berhasil diterapkan!`);
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 text-white font-black text-xs hover:bg-purple-700 shadow-sm transition"
                          >
                            <Sparkles className="w-4 h-4" /> Terapkan Rekomendasi IDP Otomatis
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 text-xs">
                          <div className="bg-white/80 p-2.5 rounded-xl border border-purple-100">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">Rekomendasi Karir:</span>
                            <span className="font-bold text-purple-900">{rec.careerDecision}</span> → <span className="font-semibold text-slate-700">{rec.nextRole}</span>
                          </div>
                          <div className="bg-white/80 p-2.5 rounded-xl border border-purple-100">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">Talent Box:</span>
                            <span className="font-bold text-[#1E40AF]">{rec.talentBox}</span>
                          </div>
                          <div className="bg-white/80 p-2.5 rounded-xl border border-purple-100">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">Fokus Kursus LMS:</span>
                            <span className="font-medium text-slate-700 line-clamp-1">{rec.modules[0]?.module_name || 'Agile Sprint'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-600">Pemetaan 9-Box Talent Pipeline</label>
                      <select
                        value={empReportData.talent_pipeline_box ?? 'High Potential - High Performer (Star)'}
                        onChange={(e) => setEmpReportData({ ...empReportData, talent_pipeline_box: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border rounded-lg text-sm font-semibold bg-white"
                      >
                        <option value="High Potential - High Performer (Star)">High Potential - High Performer (Star)</option>
                        <option value="Core Player (Future Star)">Core Player (Future Star)</option>
                        <option value="Solid Professional (Key Contributor)">Solid Professional (Key Contributor)</option>
                        <option value="Inconsistent Player (Needs Coaching)">Inconsistent Player (Needs Coaching)</option>
                        <option value="Underperformer (Performance Improvement Plan)">Underperformer (Performance Improvement Plan)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600">Keputusan Karir & Kontrak</label>
                      <select
                        value={empReportData.career_decision ?? 'Promote / Grade Up'}
                        onChange={(e) => setEmpReportData({ ...empReportData, career_decision: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border rounded-lg text-sm font-semibold text-[#1E40AF] bg-white"
                      >
                        <option value="Pass Probation to Full Time">Lulus Probation ke Full Time</option>
                        <option value="Promote / Grade Up">Promosi Jabatan / Grade Up</option>
                        <option value="Extend Performance Contract">Perpanjang Kontrak Performance / Freelance</option>
                        <option value="Retain Current Role">Pertahankan di Posisi Saat Ini</option>
                        <option value="Performance Improvement Plan (PIP)">Program Pembinaan (PIP)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600">Penugasan Jabatan / Proyek Berikutnya</label>
                      <input
                        type="text"
                        value={empReportData.next_role_assignment ?? ''}
                        onChange={(e) => setEmpReportData({ ...empReportData, next_role_assignment: e.target.value })}
                        placeholder="Contoh: Senior Creative Lead"
                        className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase text-slate-600">
                        Individual Development Plan (IDP) & LMS Modules
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setEmpReportData({
                            ...empReportData,
                            idp_lms_modules: [
                              ...empReportData.idp_lms_modules,
                              { module_name: '', category: 'LMS Course', target_date: todayStr, status: 'In Progress', score: '-' },
                            ],
                          })
                        }
                        className="text-xs font-semibold text-[#1E40AF] hover:underline"
                      >
                        + Tambah Baris Modul Manual
                      </button>
                    </div>
                    {empReportData.idp_lms_modules.map((mod, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-2 bg-slate-50 p-2.5 rounded-lg border">
                        <input
                          type="text"
                          placeholder="Nama Modul LMS / Program Pengembangan"
                          value={mod.module_name ?? ''}
                          onChange={(e) => {
                            const copy = [...empReportData.idp_lms_modules];
                            copy[idx].module_name = e.target.value;
                            setEmpReportData({ ...empReportData, idp_lms_modules: copy });
                          }}
                          className="px-2.5 py-1.5 border rounded text-xs md:col-span-2 bg-white font-semibold"
                        />
                        <select
                          value={mod.category ?? 'LMS Course'}
                          onChange={(e) => {
                            const copy = [...empReportData.idp_lms_modules];
                            copy[idx].category = e.target.value as any;
                            setEmpReportData({ ...empReportData, idp_lms_modules: copy });
                          }}
                          className="px-2.5 py-1.5 border rounded text-xs bg-white"
                        >
                          <option value="LMS Course">LMS Course</option>
                          <option value="Mentoring">1-on-1 Mentoring</option>
                          <option value="Project Assignment">Stretch Project</option>
                        </select>
                        <select
                          value={mod.status ?? 'In Progress'}
                          onChange={(e) => {
                            const copy = [...empReportData.idp_lms_modules];
                            copy[idx].status = e.target.value as any;
                            setEmpReportData({ ...empReportData, idp_lms_modules: copy });
                          }}
                          className="px-2.5 py-1.5 border rounded text-xs bg-white font-bold"
                        >
                          <option value="Completed">Completed</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Planned">Planned</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Saran / Catatan Mentor"
                          value={mod.mentor_notes ?? ''}
                          onChange={(e) => {
                            const copy = [...empReportData.idp_lms_modules];
                            copy[idx].mentor_notes = e.target.value;
                            setEmpReportData({ ...empReportData, idp_lms_modules: copy });
                          }}
                          className="px-2.5 py-1.5 border rounded text-xs bg-white"
                        />
                        <div className="flex gap-1">
                          <input
                            type="text"
                            placeholder="Skor"
                            value={mod.score ?? ''}
                            onChange={(e) => {
                              const copy = [...empReportData.idp_lms_modules];
                              copy[idx].score = e.target.value;
                              setEmpReportData({ ...empReportData, idp_lms_modules: copy });
                            }}
                            className="w-full px-2 py-1.5 border rounded text-xs bg-white font-bold text-center"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const copy = empReportData.idp_lms_modules.filter((_, i) => i !== idx);
                              setEmpReportData({ ...empReportData, idp_lms_modules: copy });
                            }}
                            className="text-rose-500 px-1.5 hover:text-rose-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-600">Catatan Budaya Kerja & Human Capital Lead</label>
                      <textarea
                        rows={2}
                        value={empReportData.behavioral_culture_notes ?? ''}
                        onChange={(e) => setEmpReportData({ ...empReportData, behavioral_culture_notes: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border rounded-lg text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600">Catatan Strategis Managing Director / Atasan</label>
                      <textarea
                        rows={2}
                        value={empReportData.hr_director_notes ?? ''}
                        onChange={(e) => setEmpReportData({ ...empReportData, hr_director_notes: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border rounded-lg text-xs bg-white"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* OUTPUT GRAFIK PELACAKAN IDP & LMS: SECARA KESELURUHAN TIM & PER INDIVIDU */}
              <div className="pt-4 border-t border-slate-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-[#1E40AF]" />
                      Output Grafik Pelacakan LMS & Individual Development Plan (IDP)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Pantau realisasi penyelesaian modul pembelajaran LMS, mentoring, dan stretch project baik per individu maupun secara keseluruhan tim.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIdpViewMode('overall')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                        idpViewMode === 'overall'
                          ? 'bg-[#1E40AF] text-white shadow'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Grafik Keseluruhan Tim ({employees.filter((e) => e.is_active !== false).length} Karyawan)
                    </button>
                    <button
                      type="button"
                      onClick={() => setIdpViewMode('individual')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                        idpViewMode === 'individual'
                          ? 'bg-[#10B981] text-white shadow'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Grafik Individu Terpilih
                    </button>
                  </div>
                </div>

                {idpViewMode === 'overall' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {employees
                      .filter((e) => e.is_active !== false)
                      .map((empItem) => {
                        const rep =
                          empItem.id === selectedReportEmpId
                            ? empReportData
                            : allReportsMap[empItem.id];
                        const mods = rep?.idp_lms_modules?.length
                          ? rep.idp_lms_modules
                          : getIdpRecommendations(empItem).modules;
                        const completed = mods.filter((m) => m.status === 'Completed').length;
                        const inProg = mods.filter((m) => m.status === 'In Progress').length;
                        const planned = mods.filter((m) => m.status === 'Planned').length;
                        const pct = mods.length > 0 ? Math.round((completed / mods.length) * 100) : 0;

                        return (
                          <div
                            key={empItem.id}
                            onClick={() => setSelectedReportEmpId(empItem.id)}
                            className={`p-3.5 rounded-xl border cursor-pointer transition space-y-2 ${
                              empItem.id === selectedReportEmpId
                                ? 'border-[#1E40AF] bg-blue-50/40'
                                : 'border-slate-200 bg-slate-50/60 hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <div className="font-bold text-xs text-slate-900">{empItem.full_name}</div>
                                <div className="text-[10px] text-slate-500">{empItem.role_title} • {empItem.department}</div>
                              </div>
                              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#1E40AF] text-[10px] font-black">
                                {pct}% Selesai
                              </span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
                              <div
                                className="h-full bg-[#10B981]"
                                style={{ width: `${mods.length ? (completed / mods.length) * 100 : 0}%` }}
                                title={`Completed: ${completed}`}
                              />
                              <div
                                className="h-full bg-blue-500"
                                style={{ width: `${mods.length ? (inProg / mods.length) * 100 : 0}%` }}
                                title={`In Progress: ${inProg}`}
                              />
                              <div
                                className="h-full bg-amber-400"
                                style={{ width: `${mods.length ? (planned / mods.length) * 100 : 0}%` }}
                                title={`Planned: ${planned}`}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] font-semibold text-slate-600">
                              <span className="text-emerald-700">✓ {completed} Selesai</span>
                              <span className="text-blue-700">● {inProg} Berjalan</span>
                              <span className="text-amber-700">○ {planned} Rencana</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    {empReportData.idp_lms_modules.map((mod, idx) => {
                      const pct = mod.status === 'Completed' ? 100 : mod.status === 'In Progress' ? 60 : 20;
                      return (
                        <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div>
                              <span className="font-bold text-slate-900">{mod.module_name || 'Modul IDP/LMS'}</span>
                              <span className="ml-2 px-2 py-0.5 rounded bg-blue-50 text-[#1E40AF] text-[10px] font-bold">
                                {mod.category}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-slate-600">Skor: {mod.score || '-'}</span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  mod.status === 'Completed'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : mod.status === 'In Progress'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {mod.status} ({pct}%)
                              </span>
                            </div>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                mod.status === 'Completed'
                                  ? 'bg-[#10B981]'
                                  : mod.status === 'In Progress'
                                  ? 'bg-[#1E40AF]'
                                  : 'bg-amber-400'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          {mod.mentor_notes && (
                            <p className="text-[11px] text-slate-600 italic">
                              Saran / Catatan Mentor: "{mod.mentor_notes}"
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* =================================================================
                LEMBAR PRATINJAU RAPOR RESMI A4 SIAP CETAK (DENGAN LOGO SKENA RESMI)
               ================================================================= */}
            {(() => {
              const targetEmpId = currentUser.role === 'employee' && currentUser.employeeId ? currentUser.employeeId : selectedReportEmpId;
              const emp = employees.find((e) => e.id === targetEmpId);
              if (!emp) {
                return (
                  <div className="bg-white p-8 rounded-2xl border text-center text-slate-400">
                    Pilih karyawan untuk menampilkan lembar rapor resmi.
                  </div>
                );
              }
              const empKpis = kpiList.filter((k) => k.employee_id === emp.id);
              const monthAtts = empReportAttendances.filter(
                (a) => !reportMonth || a.attendance_date.startsWith(reportMonth)
              );
              const wfoCount = monthAtts.filter((a) => a.status === 'WFO').length;
              const wfhCount = monthAtts.filter((a) => a.status === 'WFH').length;
              const contentCount = monthAtts.filter((a) => a.status === 'Take Content').length;
              const cutiCount = monthAtts.filter((a) => a.status === 'Cuti').length;

              return (
                <div className="bg-white mx-auto max-w-[210mm] p-8 md:p-10 rounded-2xl border border-slate-300 shadow-lg print-area space-y-6 text-slate-900">
                  {/* KOP RESMI DOKUMEN DENGAN LOGO SKENA */}
                  <div className="border-b-4 border-double border-slate-900 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <img
                        src={SKENA_LOGO_SRC}
                        alt="Skena Wahana Kreatif"
                        className="h-14 w-auto object-contain"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                        }}
                      />
                      <div>
                        <h1 className="text-xl font-black uppercase tracking-tight text-[#1E2B6D]">{settings.company_name}</h1>
                        <p className="text-xs font-semibold text-slate-700">
                          {settings.industry_sector} • Makassar HQ
                        </p>
                        <p className="text-xs text-slate-500">Rapor Bulanan Evaluasi Kinerja Karyawan, WLA, IDP & Talent Pipeline</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 rounded bg-slate-900 text-white text-xs font-bold uppercase tracking-wide">
                        RAPOR BULANAN RESMI (A4)
                      </span>
                      <p className="text-xs font-bold text-[#1E40AF] mt-1">
                        Bulan Evaluasi: {formatMonthLabel(reportMonth)}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Siklus: {settings.period_term} ({settings.period_year})
                      </p>
                    </div>
                  </div>

                  {/* IDENTITAS KARYAWAN & SKEMA KONTRAK */}
                  <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="space-y-1">
                      <div>
                        <span className="text-slate-500 w-32 inline-block">Nama Karyawan:</span>
                        <strong className="text-sm">{emp.full_name}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 w-32 inline-block">NIK / ID Karyawan:</span>
                        <span className="font-mono">{emp.employee_nik}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 w-32 inline-block">Jabatan & Divisi:</span>
                        <span className="font-semibold">
                          {emp.role_title} ({emp.department})
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div>
                        <span className="text-slate-500 w-36 inline-block">Status Kontrak:</span>
                        <strong className="text-[#1E40AF] uppercase">{emp.employment_status}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 w-36 inline-block">Durasi & Lokasi:</span>
                        <span>
                          {emp.contract_duration} • {emp.work_location}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 w-36 inline-block">Benefit / Project:</span>
                        <span>
                          {emp.employment_status === 'Full Time'
                            ? emp.benefits_package || 'BPJS Kes/TK & Tunjangan Standar'
                            : emp.assigned_project || emp.benefits_package || '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* TABEL 1: CAPAIAN KPI, SKILL LEVEL & WORKLOAD ANALYSIS */}
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                      A. Evaluasi Key Performance Indicator (KPI), Kompetensi & Working Load Analysis (WLA)
                    </h2>
                    <table className="w-full text-xs border-collapse border border-slate-300">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="p-2 border border-slate-300 text-left">Kode & Kompetensi / KPI</th>
                          <th className="p-2 border border-slate-300 text-center">Kategori</th>
                          <th className="p-2 border border-slate-300 text-center">Target</th>
                          <th className="p-2 border border-slate-300 text-center">Skor Akhir</th>
                          <th className="p-2 border border-slate-300 text-center">Skill (1-5)</th>
                          <th className="p-2 border border-slate-300 text-center">Beban Kerja</th>
                          <th className="p-2 border border-slate-300 text-left">Analisis Capaian & Beban Kerja</th>
                        </tr>
                      </thead>
                      <tbody>
                        {competencies.map((comp) => {
                          const ev = empKpis.find((k) => k.competency_id === comp.id);
                          const score = ev ? ev.final_kpi_score ?? calculateRowScore(ev) : 0;
                          return (
                            <tr key={comp.id}>
                              <td className="p-2 border border-slate-300 font-semibold">
                                {comp.competency_code} - {comp.competency_name}
                              </td>
                              <td className="p-2 border border-slate-300 text-center">{comp.category}</td>
                              <td className="p-2 border border-slate-300 text-center">{comp.target_threshold}</td>
                              <td className="p-2 border border-slate-300 text-center font-bold">{ev ? score : '-'}</td>
                              <td className="p-2 border border-slate-300 text-center">{ev ? `Lv.${ev.current_skill_level}` : '-'}</td>
                              <td className="p-2 border border-slate-300 text-center font-semibold">
                                {ev ? `${ev.workload_percentage}%` : '-'}
                              </td>
                              <td className="p-2 border border-slate-300 text-[11px] leading-relaxed">
                                {ev?.performance_narrative || 'Kompetensi telah dinilai sesuai standar target tim kreatif.'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* TABEL 2: INDIVIDUAL DEVELOPMENT PLAN (IDP) & LMS */}
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                      B. Individual Development Plan (IDP) & Learning Management System (LMS)
                    </h2>
                    <table className="w-full text-xs border-collapse border border-slate-300">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="p-2 border border-slate-300 text-left">Modul Pembelajaran / Program Pengembangan</th>
                          <th className="p-2 border border-slate-300 text-center">Metode</th>
                          <th className="p-2 border border-slate-300 text-center">Status Penyelesaian</th>
                          <th className="p-2 border border-slate-300 text-center">Skor / Evaluasi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {empReportData.idp_lms_modules.map((m, i) => (
                          <tr key={i}>
                            <td className="p-2 border border-slate-300 font-medium">{m.module_name}</td>
                            <td className="p-2 border border-slate-300 text-center">{m.category}</td>
                            <td className="p-2 border border-slate-300 text-center font-semibold">{m.status}</td>
                            <td className="p-2 border border-slate-300 text-center">{m.score}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* TABEL 3: AKUMULASI PRESENSI & KEPUTUSAN TALENT PIPELINE */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                        C. Rekapitulasi Presensi Bulanan ({formatMonthLabel(reportMonth)})
                      </h2>
                      <table className="w-full text-xs border-collapse border border-slate-300">
                        <tbody>
                          <tr>
                            <td className="p-2 border border-slate-300">Hadir Work From Office (WFO)</td>
                            <td className="p-2 border border-slate-300 font-bold text-right">{wfoCount} Hari</td>
                          </tr>
                          <tr>
                            <td className="p-2 border border-slate-300">Hadir Work From Home (WFH)</td>
                            <td className="p-2 border border-slate-300 font-bold text-right">{wfhCount} Hari</td>
                          </tr>
                          <tr>
                            <td className="p-2 border border-slate-300">Produksi Lapangan (Take Content)</td>
                            <td className="p-2 border border-slate-300 font-bold text-right">{contentCount} Hari</td>
                          </tr>
                          <tr>
                            <td className="p-2 border border-slate-300">Cuti / Izin Resmi</td>
                            <td className="p-2 border border-slate-300 font-bold text-right">{cutiCount} Hari</td>
                          </tr>
                          <tr className="bg-blue-50/50">
                            <td className="p-2 border border-slate-300 font-bold text-slate-800">Sisa Kuota Cuti Tahunan</td>
                            <td className="p-2 border border-slate-300 font-bold text-right text-[#1E40AF]">
                              {getEmployeeLeaveStats(emp.id, emp.annual_leave_quota || 12).remaining} Hari (dari {emp.annual_leave_quota || 12} Hari)
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="p-3.5 rounded-xl border-2 border-slate-800 bg-slate-50 space-y-1.5 text-xs">
                      <div className="font-black uppercase text-slate-700">D. Keputusan Talent Pipeline & Status Karir</div>
                      <div>
                        <span className="text-slate-500">Kategori 9-Box Talent:</span>{' '}
                        <strong className="text-[#1E40AF]">{empReportData.talent_pipeline_box}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Keputusan Manajemen:</span>{' '}
                        <strong className="text-emerald-700 uppercase">{empReportData.career_decision}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Penugasan / Role Baru:</span>{' '}
                        <strong>{empReportData.next_role_assignment || '-'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* CATATAN EVALUASI */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="p-3 border border-slate-300 rounded-lg">
                      <strong className="block mb-1 uppercase text-slate-600">Catatan Budaya Kerja & Human Capital:</strong>
                      <p className="leading-relaxed text-slate-700">{empReportData.behavioral_culture_notes}</p>
                    </div>
                    <div className="p-3 border border-slate-300 rounded-lg">
                      <strong className="block mb-1 uppercase text-slate-600">Catatan Managing Director / Atasan:</strong>
                      <p className="leading-relaxed text-slate-700">{empReportData.hr_director_notes}</p>
                    </div>
                  </div>

                  {/* KOLOM TANDA TANGAN RESMI */}
                  <div className="grid grid-cols-3 text-center text-xs pt-6">
                    <div>
                      <p className="text-slate-600">Karyawan Yang Dinilai,</p>
                      <div className="h-16" />
                      <p className="font-bold underline text-slate-900">{emp.full_name}</p>
                      <p className="text-slate-500">NIK: {emp.employee_nik}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Human Capital / HR Lead,</p>
                      <div className="h-16" />
                      <p className="font-bold underline text-slate-900">{settings.hr_lead_name}</p>
                      <p className="text-slate-500">ID: {settings.hr_lead_id}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Menyetujui, Managing Director</p>
                      <div className="h-16" />
                      <p className="font-bold underline text-slate-900">{settings.managing_director_name}</p>
                      <p className="text-slate-500">ID: {settings.managing_director_id}</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ===================================================================
            MODUL BARU: STRUKTUR ORGANISASI (BAGAN HIERARKI PT SKENA)
            (HANYA DAPAT DIAKSES OLEH ADMINISTRATOR)
           =================================================================== */}
        {activeModule === 'org_chart' && (
          currentUser.role !== 'admin' ? (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4 max-w-lg mx-auto">
              <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Akses Struktur Organisasi Terbatas</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Struktur hierarki organisasi internal hanya dapat dilihat dan dikelola oleh Administrator (Managing Director & Human Capital).
              </p>
              <button
                onClick={() => setActiveModule('performance_analytics')}
                className="px-5 py-2.5 rounded-xl bg-[#1E40AF] text-white text-xs font-bold hover:bg-blue-800"
              >
                Kembali ke Dashboard Saya
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Struktur Organisasi */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-blue-50 text-[#1E40AF]">
                      <Network className="w-5 h-5" />
                    </span>
                    <h3 className="text-xl font-black text-slate-900">
                      Bagan Struktur Organisasi — PT Skena Wahana Kreatif
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Bagan hierarki menyesuaikan data karyawan aktif secara real-time dari database.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5 text-slate-400" /> Filter Divisi:
                  </span>
                  {['Semua', 'Managing Director', 'Creative', 'Sales & Marketing', 'Operasional'].map((dept) => (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => setOrgDepartmentFilter(dept)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        orgDepartmentFilter === dept
                          ? 'bg-[#1E40AF] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {dept}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleExportOrgChartExcel}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#10B981] text-white text-xs font-bold hover:bg-emerald-600 shadow transition"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Unduh Struktur Organisasi (.xlsx)
                  </button>
                </div>
              </div>

              {/* Render Diagram Hierarki Organisasi */}
              {(() => {
                const activeEmps = employees.filter((e) => e.is_active);
                // Level 1: Managing Director
                const mdList = activeEmps.filter(
                  (e) =>
                    e.role_title.toLowerCase().includes('managing director') ||
                    e.department === 'Managing Director'
                );
                // Level 2: Division Heads / Managers / Leads
                const leadsList = activeEmps.filter((e) => {
                  if (mdList.some((m) => m.id === e.id)) return false;
                  const title = e.role_title.toLowerCase();
                  return (
                    title.includes('director') ||
                    title.includes('manager') ||
                    title.includes('head') ||
                    title.includes('lead')
                  );
                });
                // Level 3: Specialists, Staff & Operations
                const staffList = activeEmps.filter(
                  (e) => !mdList.some((m) => m.id === e.id) && !leadsList.some((l) => l.id === e.id)
                );

                const renderCard = (emp: Employee, borderAccent: string = 'border-blue-500') => {
                  const leave = getEmployeeLeaveStats(emp.id, emp.annual_leave_quota || 12);
                  return (
                    <div
                      key={emp.id}
                      className={`bg-white rounded-2xl border-2 ${borderAccent} p-4 shadow-sm hover:shadow-md transition space-y-2 min-w-[240px] max-w-[280px] text-left`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#1E2B6D] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                          {emp.full_name
                            .split(' ')
                            .slice(0, 2)
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs text-slate-900 truncate">{emp.full_name}</h4>
                          <p className="text-[11px] font-semibold text-[#1E40AF] truncate">{emp.role_title}</p>
                          <span className="text-[10px] text-slate-500 block font-mono">{emp.employee_nik}</span>
                        </div>
                      </div>
                      <div className="pt-1.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1 text-[10px]">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                          {emp.department}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold ${
                            emp.employment_status === 'Full Time'
                              ? 'bg-blue-100 text-blue-800'
                              : emp.employment_status === 'Full Time Performance Based'
                              ? 'bg-emerald-100 text-emerald-800'
                              : emp.employment_status === 'Probation'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {emp.employment_status === 'Full Time Performance Based' ? 'Perf Based' : emp.employment_status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500">
                        <span>Sisa Cuti: <strong className="text-blue-900">{leave.remaining} Hari</strong></span>
                        <span className="text-slate-400">HQ: {emp.work_location || 'Makassar'}</span>
                      </div>
                      <div className="pt-1.5 border-t border-slate-100 flex items-center justify-end gap-1.5 no-print">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingEmpId(emp.id);
                            setEmpForm({
                              employee_nik: emp.employee_nik,
                              tax_bpjs_id: emp.tax_bpjs_id || '',
                              full_name: emp.full_name,
                              gender: emp.gender || 'L',
                              role_title: emp.role_title,
                              department: emp.department || 'Creative',
                              employment_status: emp.employment_status || 'Full Time',
                              contract_duration: emp.contract_duration || '',
                              benefits_package: emp.benefits_package || '',
                              assigned_project: emp.assigned_project || '',
                              work_location: emp.work_location || 'Makassar HQ',
                              direct_supervisor: emp.direct_supervisor || 'Managing Director',
                              annual_leave_quota: emp.annual_leave_quota || 12,
                              is_active: emp.is_active ?? true,
                            });
                            setActiveModule('dashboard');
                            triggerToast(`Membuka editor profil untuk ${emp.full_name}`);
                          }}
                          className="px-2 py-1 rounded-lg bg-blue-50 text-[#1E40AF] hover:bg-blue-100 text-[10px] font-bold flex items-center gap-1"
                        >
                          <Pencil className="w-3 h-3" /> Edit Profil
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReportEmpId(emp.id);
                            setActiveModule('report_card');
                          }}
                          className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold flex items-center gap-1"
                        >
                          <Award className="w-3 h-3" /> Rapor
                        </button>
                      </div>
                    </div>
                  );
                };

                return (
                  <div className="bg-slate-100/60 p-6 md:p-8 rounded-3xl border border-slate-200 overflow-x-auto space-y-10 print-area text-center">
                    {/* LEVEL 1: TOP EXECUTIVE (MANAGING DIRECTOR) */}
                    {(orgDepartmentFilter === 'Semua' || orgDepartmentFilter === 'Managing Director') && (
                      <div className="flex flex-col items-center">
                        <span className="px-3 py-1 bg-blue-900 text-white rounded-full text-[10px] font-black uppercase tracking-wider mb-3">
                          Pimpinan Eksekutif / Level 1
                        </span>
                        <div className="flex flex-wrap justify-center gap-4">
                          {mdList.map((emp) => renderCard(emp, 'border-[#1E40AF] ring-2 ring-blue-300'))}
                        </div>
                        {leadsList.length > 0 && <div className="w-0.5 h-8 bg-blue-400 my-2" />}
                      </div>
                    )}

                    {/* LEVEL 2: DIVISION DIRECTORS, HEADS & MANAGERS */}
                    <div className="flex flex-col items-center">
                      <span className="px-3 py-1 bg-indigo-800 text-white rounded-full text-[10px] font-black uppercase tracking-wider mb-3">
                        Kepala Divisi & Project Manager / Level 2
                      </span>
                      <div className="flex flex-wrap justify-center gap-4">
                        {leadsList
                          .filter(
                            (e) => orgDepartmentFilter === 'Semua' || e.department === orgDepartmentFilter
                          )
                          .map((emp) => renderCard(emp, 'border-indigo-500'))}
                      </div>
                      {staffList.length > 0 && <div className="w-0.5 h-8 bg-indigo-300 my-2" />}
                    </div>

                    {/* LEVEL 3: SPECIALISTS & OPERATIONAL TEAMS */}
                    <div className="flex flex-col items-center">
                      <span className="px-3 py-1 bg-emerald-800 text-white rounded-full text-[10px] font-black uppercase tracking-wider mb-3">
                        Tim Spesialis, Kreator & Eksekusi Lapangan / Level 3
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 justify-items-center">
                        {staffList
                          .filter(
                            (e) => orgDepartmentFilter === 'Semua' || e.department === orgDepartmentFilter
                          )
                          .map((emp) => renderCard(emp, 'border-emerald-500'))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )
        )}

        {/* ===================================================================
            MODUL BARU: JOB PROFILE & KURIKULUM PEMBELAJARAN LMS (KHUSUS ADMIN)
           =================================================================== */}
        {activeModule === 'job_profiles_lms' && (
          currentUser.role !== 'admin' ? (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4 max-w-lg mx-auto">
              <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Akses Modul HR Khusus Admin</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pengelolaan Job Profile dan Kurikulum Pembelajaran LMS hanya dapat diubah oleh Administrator (Human Capital & Managing Director).
              </p>
              <button
                onClick={() => setActiveModule('performance_analytics')}
                className="px-5 py-2.5 rounded-xl bg-[#1E40AF] text-white text-xs font-bold hover:bg-blue-800"
              >
                Kembali ke Dashboard Saya
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header & Sub-Tabs */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    Job Profile & Kurikulum Pembelajaran LMS
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Kelola deskripsi jabatan, kualifikasi minimum, kamus tanggung jawab, serta kurikulum materi pembelajaran internal. Tersinkronisasi langsung secara real-time.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      setIsLoading(true);
                      try {
                        for (const jp of jobProfiles) {
                          await SkenaHrApi.upsertJobProfile(jp);
                        }
                        for (const course of lmsCurriculumList) {
                          await SkenaHrApi.upsertLmsCurriculum(course);
                        }
                        const [freshJobs, freshLms] = await Promise.all([
                          SkenaHrApi.getJobProfiles(),
                          SkenaHrApi.getLmsCurriculum(),
                        ]);
                        setJobProfiles([...freshJobs]);
                        setLmsCurriculumList([...freshLms]);
                        triggerToast(
                          `Berhasil menyinkronkan ${freshJobs.length} Job Profile & ${freshLms.length} Kurikulum LMS ke Server Cloud!`
                        );
                      } catch (err: any) {
                        triggerToast(`Gagal sinkronisasi Job Profile & LMS: ${err.message}`, 'error');
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-50 text-[#1E40AF] border border-blue-200 hover:bg-blue-100 transition flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" /> Sinkronkan Data Sekarang
                  </button>
                  <button
                    type="button"
                    onClick={handleExportJobProfilesLmsExcel}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow transition flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Unduh Job Profile & Kurikulum LMS (.xlsx)
                  </button>
                  <button
                    type="button"
                    onClick={() => setJobLmsSubTab('job_profiles')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      jobLmsSubTab === 'job_profiles'
                        ? 'bg-[#1E40AF] text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <BookMarked className="w-4 h-4" /> Deskripsi Jabatan ({jobProfiles.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setJobLmsSubTab('curriculum')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      jobLmsSubTab === 'curriculum'
                        ? 'bg-[#10B981] text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Award className="w-4 h-4" /> Kurikulum LMS ({lmsCurriculumList.length})
                  </button>
                </div>
              </div>

              {/* SUB-TAB 1: JOB PROFILES (DESKRIPSI JABATAN) */}
              {jobLmsSubTab === 'job_profiles' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-700">
                      Daftar Job Profile Resmi — PT Skena Wahana Kreatif
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingJobProfile({
                          role_title: '',
                          department: 'Creative',
                          summary: 'Bertanggung jawab atas eksekusi proyek sesuai standar kreatif dan operasional Skena.',
                          reports_to: 'Managing Director',
                          direct_supervisor: 'Managing Director',
                          key_responsibilities: [
                            'Menjalankan eksekusi proyek kreatif harian sesuai brief.',
                            'Menjaga standar kualitas dan konsistensi estetika brand.'
                          ],
                          requirements: [
                            'Pengalaman relevan minimal 1-2 tahun.',
                            'Menguasai software dan tools industri kreatif.'
                          ],
                          technical_competencies: [
                            'Pengalaman relevan minimal 1-2 tahun.',
                            'Menguasai software dan tools industri kreatif.'
                          ],
                          behavioral_traits: [
                            'Proaktif, komunikatif, dan adaptif terhadap tren digital.'
                          ],
                          core_kpis: ['Ketepatan waktu deadline (95%)', 'Kualitas output & revisi minimal']
                        });
                        setShowJobProfileModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1E40AF] text-white text-xs font-bold hover:bg-blue-800 shadow transition"
                    >
                      <Plus className="w-4 h-4" /> Tambah Job Profile Baru
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {jobProfiles.map((jp) => {
                      const displayReqs =
                        jp.requirements && jp.requirements.length > 0
                          ? jp.requirements
                          : jp.technical_competencies || [];
                      const displaySupervisor = jp.reports_to || jp.direct_supervisor || 'Managing Director';
                      return (
                        <div
                          key={jp.id}
                          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between"
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-start justify-between gap-2 border-b pb-2.5">
                              <div>
                                <h4 className="font-bold text-base text-slate-900">{jp.role_title}</h4>
                                <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs">
                                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#1E40AF] font-bold">
                                    {jp.department}
                                  </span>
                                  <span className="text-slate-500">
                                    Atasan: <strong>{displaySupervisor}</strong>
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const reqs =
                                      jp.requirements && jp.requirements.length > 0
                                        ? jp.requirements
                                        : jp.technical_competencies || [];
                                    setEditingJobProfile({
                                      ...jp,
                                      summary: jp.summary || '',
                                      reports_to: displaySupervisor,
                                      direct_supervisor: displaySupervisor,
                                      key_responsibilities: jp.key_responsibilities || [],
                                      requirements: reqs,
                                      technical_competencies: reqs,
                                      behavioral_traits: jp.behavioral_traits || [],
                                      core_kpis: jp.core_kpis || [],
                                    });
                                    setShowJobProfileModal(true);
                                  }}
                                  className="px-2.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition inline-flex items-center gap-1"
                                  title="Edit Job Profile"
                                >
                                  <Pencil className="w-3.5 h-3.5" /> Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteJobProfile(jp.id, jp.role_title)}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  title="Hapus Job Profile"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {jp.summary && (
                              <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                "{jp.summary}"
                              </p>
                            )}

                            <div className="text-xs space-y-1.5">
                              <span className="font-bold text-slate-800 uppercase tracking-wide text-[10px] block">
                                Tanggung Jawab Utama:
                              </span>
                              <ul className="list-disc pl-4 space-y-1 text-slate-600">
                                {(jp.key_responsibilities || []).map((r, i) => (
                                  <li key={i}>{r}</li>
                                ))}
                              </ul>
                            </div>

                            <div className="text-xs space-y-1.5">
                              <span className="font-bold text-slate-800 uppercase tracking-wide text-[10px] block">
                                Kualifikasi & Kompetensi Teknis:
                              </span>
                              <ul className="list-disc pl-4 space-y-1 text-slate-600">
                                {displayReqs.map((req: string, i: number) => (
                                  <li key={i}>{req}</li>
                                ))}
                              </ul>
                            </div>

                            {jp.behavioral_traits && jp.behavioral_traits.length > 0 && (
                              <div className="text-xs space-y-1.5">
                                <span className="font-bold text-slate-800 uppercase tracking-wide text-[10px] block">
                                  Karakter & Soft Skills:
                                </span>
                                <ul className="list-disc pl-4 space-y-1 text-slate-600">
                                  {jp.behavioral_traits.map((trait: string, i: number) => (
                                    <li key={i}>{trait}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* ALUR KERJA / WORKFLOW STEPS JABATAN */}
                            {jp.workflow_steps && jp.workflow_steps.length > 0 && (
                              <div className="text-xs space-y-1.5 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                                <span className="font-bold text-[#1E40AF] uppercase tracking-wide text-[10px] block">
                                  Alur Kerja / SOP Flow Pekerjaan ({jp.workflow_steps.length} Tahap):
                                </span>
                                <ol className="list-decimal pl-4 space-y-1 text-slate-700 font-medium">
                                  {jp.workflow_steps.map((step: any, i: number) => (
                                    <li key={i}>
                                      {typeof step === 'string'
                                        ? step
                                        : `${step.stage_title}${step.description ? ` — ${step.description}` : ''}${step.pic_output ? ` (${step.pic_output})` : ''}`}
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            )}

                            {/* CHECKLIST PEKERJAAN INTERAKTIF */}
                            {jp.job_checklists && jp.job_checklists.length > 0 && (
                              <div className="text-xs space-y-1.5 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                                <span className="font-bold text-emerald-900 uppercase tracking-wide text-[10px] block">
                                  Checklist Pekerjaan Jabatan ({jp.job_checklists.filter((c) => c.is_completed ?? c.is_checked).length}/{jp.job_checklists.length} Selesai):
                                </span>
                                <div className="space-y-1">
                                  {jp.job_checklists.map((chk, i) => {
                                    const checked = Boolean(chk.is_completed ?? chk.is_checked);
                                    const textLabel = chk.task || chk.label || '';
                                    return (
                                      <label
                                        key={chk.id || i}
                                        className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={async (e) => {
                                            const nextChecklists = (jp.job_checklists || []).map((item, idx) =>
                                              idx === i
                                                ? { ...item, is_completed: e.target.checked, is_checked: e.target.checked }
                                                : item
                                            );
                                            const updatedJp = { ...jp, job_checklists: nextChecklists };
                                            await SkenaHrApi.upsertJobProfile(updatedJp);
                                            setJobProfiles(await SkenaHrApi.getJobProfiles());
                                          }}
                                          className="w-3.5 h-3.5 rounded text-emerald-600"
                                        />
                                        <span className={checked ? 'line-through text-slate-400' : 'font-medium'}>
                                          {textLabel}
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                            {(jp.core_kpis || []).map((kpi: string, i: number) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold"
                              >
                                ✓ {kpi}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SUB-TAB 2: LMS CURRICULUM (KURIKULUM PEMBELAJARAN) */}
              {jobLmsSubTab === 'curriculum' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap justify-between items-center gap-3 bg-white p-4 rounded-xl border border-slate-200">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="font-bold text-slate-700">Filter Kategori LMS:</span>
                      {['Semua', 'Creative & Production', 'Sales & Marketing', 'Leadership & Operations', 'Soft Skills & Agility'].map(
                        (cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedLmsCategory(cat)}
                            className={`px-3 py-1.5 rounded-xl font-bold transition text-xs ${
                              selectedLmsCategory === cat
                                ? 'bg-[#10B981] text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {cat}
                          </button>
                        )
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingLmsCourse({
                          title: '',
                          department: 'Creative',
                          category: 'Creative & Production',
                          duration_hours: 8,
                          level: 'Intermediate',
                          status: 'Aktif',
                          description: 'Modul pembelajaran aplikatif untuk peningkatan kompetensi tim Skena.',
                          target_competency_codes: ['KPI-CRE-01'],
                          target_roles: ['Semua Role'],
                          learning_objectives: [
                            'Memahami fundamental materi pelatihan secara mendalam.',
                            'Mampu mengimplementasikan pada studi kasus proyek nyata Skena.'
                          ],
                          key_skills_learned: [
                            'Memahami fundamental materi pelatihan secara mendalam.',
                            'Mampu mengimplementasikan pada studi kasus proyek nyata Skena.'
                          ]
                        });
                        setShowLmsModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#10B981] text-white text-xs font-bold hover:bg-emerald-600 shadow transition"
                    >
                      <Plus className="w-4 h-4" /> Tambah Materi LMS Baru
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lmsCurriculumList
                      .filter(
                        (c) => selectedLmsCategory === 'Semua' || c.category === selectedLmsCategory
                      )
                      .map((course) => {
                        const displayObjectives =
                          course.learning_objectives && course.learning_objectives.length > 0
                            ? course.learning_objectives
                            : course.key_skills_learned || [];
                        return (
                          <div
                            key={course.id}
                            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between"
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2 border-b pb-2">
                                <div>
                                  <div className="flex flex-wrap items-center gap-1">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                      {course.category || 'Creative & Production'}
                                    </span>
                                    {course.level && (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                                        {course.level}
                                      </span>
                                    )}
                                    {course.status && (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                                        {course.status}
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="font-bold text-sm text-slate-900 mt-1.5">{course.title}</h4>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const objs =
                                        course.learning_objectives && course.learning_objectives.length > 0
                                          ? course.learning_objectives
                                          : course.key_skills_learned || [];
                                      setEditingLmsCourse({
                                        ...course,
                                        department: course.department || 'Creative',
                                        category: course.category || 'Creative & Production',
                                        duration_hours: Number(course.duration_hours ?? 8),
                                        level: course.level || 'Intermediate',
                                        status: course.status || 'Aktif',
                                        description: course.description || '',
                                        target_roles: course.target_roles || ['Semua Tim Skena'],
                                        target_competency_codes: course.target_competency_codes || ['KPI-CRE-01'],
                                        learning_objectives: objs,
                                        key_skills_learned: objs,
                                      });
                                      setShowLmsModal(true);
                                    }}
                                    className="px-2 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition inline-flex items-center gap-1"
                                    title="Edit Materi LMS"
                                  >
                                    <Pencil className="w-3.5 h-3.5" /> Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLmsCourse(course.id, course.title)}
                                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                    title="Hapus Materi LMS"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {course.description && (
                                <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                  {course.description}
                                </p>
                              )}

                              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                <span>⏱️ Durasi: <strong>{course.duration_hours} Jam</strong></span>
                                <span>Target: <strong>{(course.target_roles || ['Semua Tim Skena']).join(', ')}</strong></span>
                              </div>

                              <div className="text-xs space-y-1">
                                <span className="text-[10px] font-bold text-slate-700 uppercase">
                                  Sasaran Belajar & Kompetensi:
                                </span>
                                <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                                  {displayObjectives.map((obj: string, i: number) => (
                                    <li key={i}>{obj}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                              {(course.target_competency_codes || ['KPI-CRE-01']).map((code: string, i: number) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded bg-blue-50 text-[#1E40AF] text-[10px] font-mono font-bold"
                                >
                                  {code}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {/* ===================================================================
            MODUL 9: MANAJEMEN DATABASE AKUN (USERNAME & PASSWORD) & SINKRONISASI SISTEM
            (HANYA BISA DICEK, DIBUAT, DIUBAH & DIHAPUS OLEH ADMINISTRATOR)
           =================================================================== */}
        {activeModule === 'user_accounts_db' && (
          currentUser.role !== 'admin' ? (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4 max-w-lg mx-auto">
              <div className="w-14 h-14 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Akses Database Akun & Sistem Ditolak</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Database seluruh akun (Username & Password) serta pengaturan integrasi server bersifat rahasia dan hanya dapat diakses oleh Administrator (Managing Director & Human Capital).
              </p>
              <button
                onClick={() => setActiveModule('performance_analytics')}
                className="px-5 py-2.5 rounded-xl bg-[#1E40AF] text-white text-xs font-bold hover:bg-blue-800"
              >
                Kembali ke Portal Karyawan
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* PANEL 1: STATUS INTEGRASI SERVER CLOUD ENTERPRISE (KHUSUS ADMINISTRATOR) */}
              <div className="bg-gradient-to-r from-[#1E2B6D] via-[#1E40AF] to-blue-800 text-white p-6 rounded-2xl shadow-lg space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-white/15 backdrop-blur-xs">
                      <Database className="w-6 h-6 text-amber-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black">
                          Pusat Sinkronisasi Data & Kredensial Enterprise PT Skena Wahana Kreatif
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-400 text-slate-900">
                          Sistem Cloud Terintegrasi Aktif
                        </span>
                      </div>
                      <p className="text-xs text-blue-100 mt-0.5">
                        Seluruh data akun login, karyawan, presensi, keterangan izin/WFH, dan buku evaluasi KPI tersimpan secara permanen dan terintegrasi penuh secara real-time.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleSyncAllToSupabase}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#10B981] hover:bg-emerald-600 text-white text-xs font-black shadow-md transition"
                    >
                      <RefreshCw className="w-4 h-4" /> Sinkronkan Seluruh Data Sekarang
                    </button>
                  </div>
                </div>
              </div>

              {/* PANEL 2: FORM BUAT AKUN BARU / UBAH AKUN (KHUSUS ADMINISTRATOR) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <KeyRound className="w-5 h-5 text-[#1E40AF]" />
                      {editingAdminAccId
                        ? `Edit Akun Login User: ${adminAccForm.name} (@${adminAccForm.username})`
                        : 'Buat Akun Login Baru (Admin / Karyawan)'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Administrator dapat membuat akun baru, mengubah username & password akun siapa saja, atau mengubah hak akses (Role Admin / Karyawan).
                    </p>
                  </div>
                  {editingAdminAccId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAdminAccId(null);
                        setAdminAccForm({
                          id: '',
                          name: '',
                          username: '',
                          password: 'password123',
                          email: '',
                          role: 'employee',
                          employeeId: '',
                          employeeNik: '',
                          roleTitle: 'Creative Staff',
                          department: 'Creative',
                          employmentStatus: 'Full Time',
                        });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold hover:bg-rose-100"
                    >
                      Batal Edit Akun
                    </button>
                  )}
                </div>

                <form
                  id="admin-account-crud-form"
                  onSubmit={handleAdminSaveUserAccount}
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200"
                >
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Hubungkan ke Karyawan (Opsional)</label>
                    <select
                      value={adminAccForm.employeeId ?? ''}
                      onChange={(e) => {
                        const empId = e.target.value;
                        const emp = employees.find((item) => item.id === empId);
                        if (emp) {
                          const slug =
                            emp.full_name
                              .toLowerCase()
                              .trim()
                              .split(/\s+/)[0]
                              .replace(/[^a-z0-9]/g, '') || 'user';
                          setAdminAccForm((prev) => ({
                            ...prev,
                            employeeId: emp.id,
                            employeeNik: emp.employee_nik,
                            name: emp.full_name,
                            username: prev.username || slug,
                            email: prev.email || `${slug}@skena.id`,
                            roleTitle: emp.role_title,
                            department: emp.department,
                            employmentStatus: emp.employment_status,
                          }));
                        } else {
                          setAdminAccForm((prev) => ({ ...prev, employeeId: '', employeeNik: '' }));
                        }
                      }}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-xs bg-white font-semibold text-[#1E40AF]"
                    >
                      <option value="">-- Akun Mandiri / Pilih Karyawan --</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.full_name} ({emp.employee_nik} - {emp.role_title})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Nama Lengkap Pengguna *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nama Lengkap"
                      value={adminAccForm.name ?? ''}
                      onChange={(e) => setAdminAccForm({ ...adminAccForm, name: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-xs bg-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#1E40AF]">Username Login *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: budi.skena"
                      value={adminAccForm.username ?? ''}
                      onChange={(e) => setAdminAccForm({ ...adminAccForm, username: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-blue-300 rounded-lg text-xs bg-white font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-emerald-700">Password Login *</label>
                    <input
                      type="text"
                      required
                      placeholder="Password akun"
                      value={adminAccForm.password ?? ''}
                      onChange={(e) => setAdminAccForm({ ...adminAccForm, password: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-emerald-300 rounded-lg text-xs bg-white font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Role / Hak Akses *</label>
                    <select
                      value={adminAccForm.role}
                      onChange={(e) =>
                        setAdminAccForm({ ...adminAccForm, role: e.target.value as 'admin' | 'employee' })
                      }
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-xs bg-white font-bold text-slate-800"
                    >
                      <option value="employee">Portal Karyawan (Employee)</option>
                      <option value="admin">Administrator HR / MD (Full Access)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Email Pengguna *</label>
                    <input
                      type="email"
                      required
                      placeholder="nama@skena.id"
                      value={adminAccForm.email ?? ''}
                      onChange={(e) => setAdminAccForm({ ...adminAccForm, email: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Jabatan / Role Title</label>
                    <input
                      type="text"
                      placeholder="Contoh: Graphic Designer"
                      value={adminAccForm.roleTitle ?? ''}
                      onChange={(e) => setAdminAccForm({ ...adminAccForm, roleTitle: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-xs bg-white"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#1E40AF] hover:bg-blue-800 text-white text-xs font-bold shadow transition"
                    >
                      {editingAdminAccId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      {editingAdminAccId ? 'Simpan Perubahan Akun' : 'Buat Akun Baru'}
                    </button>
                  </div>
                </form>
              </div>

              {/* PANEL 3: TABEL DATABASE AKUN USERNAME & PASSWORD (KHUSUS ADMIN) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      Database Kredensial Akun Login (Username & Password) — {userAccounts.length} Akun Terdaftar
                    </h3>
                    <p className="text-xs text-slate-500">
                      Hanya Administrator yang dapat mengecek daftar username & password ini, serta mengubah, mereset, atau menghapus akun pengguna.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAllPasswordsAdmin((prev) => !prev)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 transition"
                    >
                      <Eye className="w-4 h-4 text-[#1E40AF]" />
                      {showAllPasswordsAdmin ? 'Sembunyikan Password' : 'Tampilkan Semua Password'}
                    </button>
                    <button
                      type="button"
                      onClick={handleExportUserAccountsExcel}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10B981] hover:bg-emerald-600 text-white text-xs font-bold shadow transition"
                    >
                      <FileSpreadsheet className="w-4 h-4" /> Unduh Database Akun (.xlsx)
                    </button>
                  </div>
                </div>

                {/* Filter & Pencarian Akun */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="font-bold text-slate-600 mr-1">Filter Role:</span>
                    {[
                      { key: 'all', label: `Semua Akun (${userAccounts.length})` },
                      {
                        key: 'admin',
                        label: `Administrator (${userAccounts.filter((u) => u.role === 'admin').length})`,
                      },
                      {
                        key: 'employee',
                        label: `Karyawan (${userAccounts.filter((u) => u.role === 'employee').length})`,
                      },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setAccRoleFilter(tab.key as any)}
                        className={`px-3 py-1.5 rounded-xl font-bold transition ${
                          accRoleFilter === tab.key
                            ? 'bg-[#1E40AF] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari nama, username, email, NIK..."
                      value={accSearchQuery}
                      onChange={(e) => setAccSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 uppercase">
                        <th className="p-3 border-b">No</th>
                        <th className="p-3 border-b">Nama Pengguna & Jabatan</th>
                        <th className="p-3 border-b">Role Akses</th>
                        <th className="p-3 border-b">Username Login</th>
                        <th className="p-3 border-b">Password Aktif</th>
                        <th className="p-3 border-b">Email & NIK Karyawan</th>
                        <th className="p-3 border-b text-right">Aksi Administrator</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {userAccounts
                        .filter((u) => {
                          if (accRoleFilter !== 'all' && u.role !== accRoleFilter) return false;
                          const q = accSearchQuery.trim().toLowerCase();
                          if (!q) return true;
                          return (
                            (u.name || '').toLowerCase().includes(q) ||
                            (u.username || '').toLowerCase().includes(q) ||
                            (u.email || '').toLowerCase().includes(q) ||
                            (u.employeeNik || '').toLowerCase().includes(q) ||
                            (u.roleTitle || '').toLowerCase().includes(q)
                          );
                        })
                        .map((acc, idx) => (
                          <tr key={acc.id} className="hover:bg-slate-50 transition">
                            <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                            <td className="p-3">
                              <div className="font-bold text-slate-900">{acc.name}</div>
                              <div className="text-[11px] text-slate-500">
                                {acc.roleTitle || '-'} • <strong>{acc.department || 'Creative'}</strong>
                              </div>
                            </td>
                            <td className="p-3">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  acc.role === 'admin'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : 'bg-blue-50 text-[#1E40AF] border border-blue-200'
                                }`}
                              >
                                {acc.role === 'admin' ? '🛡️ Administrator' : '👤 Karyawan'}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#1E40AF] font-mono font-bold">
                                {acc.username}
                              </span>
                            </td>
                            <td className="p-3 font-mono">
                              {showAllPasswordsAdmin ? (
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                                  {acc.password || 'password123'}
                                </span>
                              ) : (
                                <span className="text-slate-400 tracking-widest">••••••••</span>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="text-slate-700 font-medium">{acc.email}</div>
                              <div className="text-[10px] font-mono text-slate-400">
                                NIK: {acc.employeeNik || 'Akun Mandiri'}
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingAdminAccId(acc.id);
                                    setAdminAccForm({
                                      id: acc.id,
                                      name: acc.name || '',
                                      username: acc.username || '',
                                      password: acc.password || 'password123',
                                      email: acc.email || '',
                                      role: acc.role,
                                      employeeId: acc.employeeId || '',
                                      employeeNik: acc.employeeNik || '',
                                      roleTitle: acc.roleTitle || '',
                                      department: acc.department || 'Creative',
                                      employmentStatus: acc.employmentStatus || 'Full Time',
                                    });
                                    const el = document.getElementById('admin-account-crud-form');
                                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                                  }}
                                  className="p-1.5 rounded-lg text-[#1E40AF] hover:bg-blue-50 transition"
                                  title="Edit Username / Password / Role Akun"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await SkenaHrApi.upsertUserAccountAsync({
                                      ...acc,
                                      password: 'password123',
                                    });
                                    setUserAccounts(await SkenaHrApi.fetchUsersFromSupabase());
                                    triggerToast(`Password akun @${acc.username} direset ke default ("password123").`);
                                  }}
                                  className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition"
                                  title="Reset Password ke Default (password123)"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAdminDeleteUserAccount(acc)}
                                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition"
                                  title="Hapus Akun dari Database"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )
        )}
      </main>

      {/* =====================================================================
          MODAL 1: KONFIRMASI NONAKTIFKAN KARYAWAN KE ARSIP
         ===================================================================== */}
      {showDeactivateModal && deactivatingEmp && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2.5 text-amber-600">
              <UserX className="w-6 h-6" />
              <h3 className="text-lg font-bold">Nonaktifkan / Pindahkan ke Arsip</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Karyawan <strong>{deactivatingEmp.full_name}</strong> ({deactivatingEmp.employee_nik} - {deactivatingEmp.role_title}) akan dipindahkan ke Arsip Karyawan Nonaktif. Data historis dan evaluasi tetap tersimpan aman.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Tanggal Efektif Nonaktif</label>
                <input
                  type="date"
                  value={deactivateDate ?? ''}
                  onChange={(e) => setDeactivateDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-xs bg-white font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Alasan Nonaktif / Keluar</label>
                <select
                  value={deactivateReason ?? 'Resign Sukarela'}
                  onChange={(e) => setDeactivateReason(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-xs bg-white font-bold"
                >
                  <option value="Resign Sukarela">Resign Sukarela</option>
                  <option value="Masa Kontrak Berakhir">Masa Kontrak Berakhir</option>
                  <option value="Transisi Karir">Transisi Karir</option>
                  <option value="Pindah Domisili">Pindah Domisili</option>
                  <option value="Keluar Berdasarkan Kesepakatan Bersama">Keluar Berdasarkan Kesepakatan Bersama</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeactivateModal(false);
                  setDeactivatingEmp(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleArchiveEmployeeConfirm}
                className="px-5 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 shadow"
              >
                Konfirmasi Pindahkan ke Arsip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: PENGATURAN AKUN SAYA (MANDIRI KARYAWAN & ADMINISTRATOR)
         ===================================================================== */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2.5 text-[#1E40AF]">
                <KeyRound className="w-6 h-6" />
                <h3 className="text-lg font-bold">Pengaturan Akun, Username & Password Saya</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAccountModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-slate-700 space-y-1">
              <div className="font-bold text-[#1E40AF]">
                Kredensial Login Aktif Saat Ini:
              </div>
              <div className="font-mono">
                Username: <strong>{currentUser.username || 'user'}</strong> • Password: <strong>{currentUser.password || 'password123'}</strong>
              </div>
              <p className="text-[11px] text-slate-500">
                Ubah Username atau Password di bawah ini. Saat Anda keluar (Logout), Anda dapat masuk kembali menggunakan Username dan Password baru Anda.
              </p>
            </div>
            <form onSubmit={handleSaveAccount} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Nama Lengkap Tampilan *</label>
                <input
                  type="text"
                  required
                  value={accountForm.name ?? ''}
                  onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-sm bg-white font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                <div>
                  <label className="text-xs font-bold text-[#1E40AF]">Username Login Baru *</label>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan username baru"
                    value={accountForm.username ?? ''}
                    onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-blue-300 rounded-xl text-sm bg-white font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-emerald-800">Password Login Baru *</label>
                    <button
                      type="button"
                      onClick={() => setAccountForm({ ...accountForm, password: 'password123' })}
                      className="text-[10px] font-bold text-blue-700 hover:underline"
                      title="Kembalikan ke password default"
                    >
                      Set Default
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan password baru"
                    value={accountForm.password ?? ''}
                    onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-emerald-300 rounded-xl text-sm bg-white font-mono font-bold text-slate-900"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Email Kantor / Pribadi *</label>
                <input
                  type="email"
                  required
                  value={accountForm.email ?? ''}
                  onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-sm bg-white font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Jabatan / Role</label>
                  <input
                    type="text"
                    value={accountForm.roleTitle ?? ''}
                    onChange={(e) => setAccountForm({ ...accountForm, roleTitle: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Departemen</label>
                  <input
                    type="text"
                    value={accountForm.department ?? ''}
                    onChange={(e) => setAccountForm({ ...accountForm, department: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-sm bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAccountModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 rounded-xl bg-[#1E40AF] text-white text-xs font-bold hover:bg-blue-800 disabled:opacity-60 shadow flex items-center gap-1.5"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Menyimpan Perubahan...
                    </>
                  ) : (
                    'Simpan Username & Password Baru'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: PENYESUAIAN TARGET KPI & STANDAR WLA (KHUSUS ADMIN)
         ===================================================================== */}
      {showKpiTargetModal && editingCompTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2.5 text-[#1E40AF]">
              <SlidersHorizontal className="w-6 h-6" />
              <h3 className="text-lg font-bold">Sesuaikan Target KPI & Standar WLA</h3>
            </div>
            <p className="text-xs text-slate-600">
              Administrator dapat menyesuaikan nilai passing threshold dan standar beban kerja agar relevan dengan dinamika agensi.
            </p>
            <form onSubmit={handleSaveKpiTarget} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Nama Kompetensi / KPI</label>
                <input
                  type="text"
                  required
                  value={editingCompTarget.competency_name ?? ''}
                  onChange={(e) =>
                    setEditingCompTarget({ ...editingCompTarget, competency_name: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-sm bg-white font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Passing Target Threshold</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={editingCompTarget.target_threshold ?? 75}
                    onChange={(e) =>
                      setEditingCompTarget({
                        ...editingCompTarget,
                        target_threshold: Number(e.target.value)
                      })
                    }
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-sm bg-white font-bold text-[#1E40AF]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Standar Jam Kerja / Mgg</label>
                  <input
                    type="number"
                    min={10}
                    max={80}
                    value={editingCompTarget.standard_workload_hours ?? 40}
                    onChange={(e) =>
                      setEditingCompTarget({
                        ...editingCompTarget,
                        standard_workload_hours: Number(e.target.value)
                      })
                    }
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-sm bg-white font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Kategori</label>
                <select
                  value={editingCompTarget.category ?? 'Core KPI'}
                  onChange={(e) =>
                    setEditingCompTarget({ ...editingCompTarget, category: e.target.value as any })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-xs bg-white font-medium"
                >
                  <option value="Core KPI">Core KPI</option>
                  <option value="Hard Skill">Hard Skill</option>
                  <option value="Soft Skill">Soft Skill</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowKpiTargetModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1E40AF] text-white text-xs font-bold hover:bg-blue-800 shadow"
                >
                  Simpan Penyesuaian Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 4: TAMBAH / EDIT JOB PROFILE (KHUSUS ADMIN)
         ===================================================================== */}
      {showJobProfileModal && editingJobProfile && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2.5 text-[#1E40AF]">
                <BookMarked className="w-6 h-6" />
                <h3 className="text-lg font-bold">
                  {editingJobProfile.id ? 'Edit Job Profile' : 'Tambah Job Profile Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowJobProfileModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveJobProfile} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Nama Jabatan / Role *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Motion Designer"
                    value={editingJobProfile.role_title ?? ''}
                    onChange={(e) => setEditingJobProfile({ ...editingJobProfile, role_title: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-sm bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Departemen *</label>
                  <select
                    value={editingJobProfile.department ?? 'Creative'}
                    onChange={(e) => setEditingJobProfile({ ...editingJobProfile, department: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-sm bg-white font-medium"
                  >
                    <option value="Creative">Creative</option>
                    <option value="Sales & Marketing">Sales & Marketing</option>
                    <option value="Operasional">Operasional</option>
                    <option value="Managing Director">Managing Director</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Atasan Langsung (Reports To)</label>
                <input
                  type="text"
                  placeholder="Contoh: Creative Director / Managing Director"
                  value={editingJobProfile.reports_to ?? editingJobProfile.direct_supervisor ?? ''}
                  onChange={(e) =>
                    setEditingJobProfile({
                      ...editingJobProfile,
                      reports_to: e.target.value,
                      direct_supervisor: e.target.value,
                    })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-sm bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Ringkasan Peran (Role Summary)</label>
                <textarea
                  rows={2}
                  value={editingJobProfile.summary ?? ''}
                  onChange={(e) => setEditingJobProfile({ ...editingJobProfile, summary: e.target.value })}
                  placeholder="Ringkasan tanggung jawab strategis jabatan ini..."
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-xs bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Tanggung Jawab Utama (Satu baris per item)
                </label>
                <textarea
                  rows={3}
                  value={(editingJobProfile.key_responsibilities ?? []).join('\n')}
                  onChange={(e) =>
                    setEditingJobProfile({
                      ...editingJobProfile,
                      key_responsibilities: e.target.value.split('\n'),
                    })
                  }
                  placeholder="Membuat aset visual kampanye&#10;Melakukan quality check sebelum publish"
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-xs bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Kualifikasi & Kompetensi Teknis (Satu baris per item)
                </label>
                <textarea
                  rows={3}
                  value={(editingJobProfile.requirements ?? editingJobProfile.technical_competencies ?? []).join('\n')}
                  onChange={(e) => {
                    const lines = e.target.value.split('\n');
                    setEditingJobProfile({
                      ...editingJobProfile,
                      requirements: lines,
                      technical_competencies: lines,
                    });
                  }}
                  placeholder="Minimal 1 tahun pengalaman&#10;Mahir Adobe Suite & Figma"
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-xs bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Karakter & Soft Skills Utama (Satu baris per item)
                </label>
                <textarea
                  rows={2}
                  value={(editingJobProfile.behavioral_traits ?? []).join('\n')}
                  onChange={(e) =>
                    setEditingJobProfile({
                      ...editingJobProfile,
                      behavioral_traits: e.target.value.split('\n'),
                    })
                  }
                  placeholder="Komunikatif & kolaboratif&#10;Berorientasi detail dan deadline"
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-xs bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">
                  KPI & Tolok Ukur Utama (Satu baris per item)
                </label>
                <textarea
                  rows={2}
                  value={(editingJobProfile.core_kpis ?? []).join('\n')}
                  onChange={(e) =>
                    setEditingJobProfile({
                      ...editingJobProfile,
                      core_kpis: e.target.value.split('\n'),
                    })
                  }
                  placeholder="Ketepatan waktu deadline (95%)&#10;Zero critical error"
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-xs bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#1E40AF]">
                  Alur Kerja / SOP Flow Pekerjaan (Satu baris per tahap)
                </label>
                <textarea
                  rows={3}
                  value={(editingJobProfile.workflow_steps ?? [])
                    .map((s: any) =>
                      typeof s === 'string'
                        ? s
                        : `${s.stage_title}${s.description ? ` — ${s.description}` : ''}`
                    )
                    .join('\n')}
                  onChange={(e) =>
                    setEditingJobProfile({
                      ...editingJobProfile,
                      workflow_steps: e.target.value
                        .split('\n')
                        .filter((s) => s.trim() !== '')
                        .map((line, idx) => ({
                          step_number: idx + 1,
                          stage_title: line,
                          description: '',
                          pic_output: editingJobProfile.role_title || 'PIC',
                        })),
                    })
                  }
                  placeholder="1. Menerima brief kreatif & riset referensi&#10;2. Eksekusi draft & internal review&#10;3. Finalisasi & serah terima aset"
                  className="w-full mt-1 px-3 py-2 border border-blue-200 rounded-xl text-xs bg-blue-50/30"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-emerald-800">
                  Checklist Pekerjaan Jabatan (Satu baris per checklist)
                </label>
                <textarea
                  rows={3}
                  value={(editingJobProfile.job_checklists ?? []).map((c) => c.task || c.label || '').join('\n')}
                  onChange={(e) => {
                    const lines = e.target.value.split('\n');
                    setEditingJobProfile({
                      ...editingJobProfile,
                      job_checklists: lines
                        .filter((l) => l.trim() !== '')
                        .map((l, idx) => ({
                          id: editingJobProfile.job_checklists?.[idx]?.id || `chk-${idx + 1}`,
                          task: l,
                          label: l,
                          frequency: 'Harian',
                          is_completed:
                            editingJobProfile.job_checklists?.[idx]?.is_completed ??
                            editingJobProfile.job_checklists?.[idx]?.is_checked ??
                            false,
                          is_checked:
                            editingJobProfile.job_checklists?.[idx]?.is_completed ??
                            editingJobProfile.job_checklists?.[idx]?.is_checked ??
                            false,
                        })),
                    });
                  }}
                  placeholder="Cek kelengkapan brief harian&#10;Backup file project ke cloud drive&#10;Update status deliverable di sprint log"
                  className="w-full mt-1 px-3 py-2 border border-emerald-200 rounded-xl text-xs bg-emerald-50/30"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowJobProfileModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1E40AF] text-white text-xs font-bold hover:bg-blue-800 shadow"
                >
                  Simpan & Sinkronkan Job Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 5: TAMBAH / EDIT KURIKULUM LMS (KHUSUS ADMIN)
         ===================================================================== */}
      {showLmsModal && editingLmsCourse && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2.5 text-[#10B981]">
                <Award className="w-6 h-6" />
                <h3 className="text-lg font-bold">
                  {editingLmsCourse.id ? 'Edit Kurikulum LMS' : 'Tambah Kurikulum Pembelajaran Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLmsModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveLmsCourse} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Judul Pelatihan / Kursus LMS *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Storytelling & Hook Optimization"
                  value={editingLmsCourse.title ?? ''}
                  onChange={(e) => setEditingLmsCourse({ ...editingLmsCourse, title: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-sm bg-white font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Kategori</label>
                  <select
                    value={editingLmsCourse.category ?? 'Creative & Production'}
                    onChange={(e) => setEditingLmsCourse({ ...editingLmsCourse, category: e.target.value as any })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-xs bg-white font-medium"
                  >
                    <option value="Creative & Production">Creative & Production</option>
                    <option value="Sales & Marketing">Sales & Marketing</option>
                    <option value="Leadership & Operations">Leadership & Operations</option>
                    <option value="Soft Skills & Agility">Soft Skills & Agility</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Estimasi Durasi (Jam)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={editingLmsCourse.duration_hours ?? 8}
                    onChange={(e) => setEditingLmsCourse({ ...editingLmsCourse, duration_hours: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-sm bg-white font-semibold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Departemen Fokus</label>
                  <select
                    value={editingLmsCourse.department ?? 'Creative'}
                    onChange={(e) => setEditingLmsCourse({ ...editingLmsCourse, department: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-xs bg-white font-medium"
                  >
                    <option value="Creative">Creative</option>
                    <option value="Sales & Marketing">Sales & Marketing</option>
                    <option value="Operasional">Operasional</option>
                    <option value="All Departments">All Departments</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Level</label>
                  <select
                    value={editingLmsCourse.level ?? 'Intermediate'}
                    onChange={(e) => setEditingLmsCourse({ ...editingLmsCourse, level: e.target.value as any })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-xs bg-white font-medium"
                  >
                    <option value="Fundamental">Fundamental</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Status</label>
                  <select
                    value={editingLmsCourse.status ?? 'Aktif'}
                    onChange={(e) => setEditingLmsCourse({ ...editingLmsCourse, status: e.target.value as any })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-xs bg-white font-medium"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Deskripsi Singkat Modul LMS</label>
                <textarea
                  rows={2}
                  value={editingLmsCourse.description ?? ''}
                  onChange={(e) => setEditingLmsCourse({ ...editingLmsCourse, description: e.target.value })}
                  placeholder="Ringkasan materi pembelajaran dan tujuan praktis..."
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-xs bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Target Jabatan / Roles (Pisahkan dengan koma atau baris baru)
                </label>
                <input
                  type="text"
                  placeholder="Social Media Specialist, Content Creator, Copywriter"
                  value={(editingLmsCourse.target_roles ?? []).join(', ')}
                  onChange={(e) =>
                    setEditingLmsCourse({
                      ...editingLmsCourse,
                      target_roles: [e.target.value],
                    })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-xs bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Kode KPI Terkait (Pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  placeholder="KPI-CRE-01, KPI-MKT-02"
                  value={(editingLmsCourse.target_competency_codes ?? []).join(', ')}
                  onChange={(e) =>
                    setEditingLmsCourse({
                      ...editingLmsCourse,
                      target_competency_codes: [e.target.value],
                    })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-xs bg-white font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Sasaran Belajar / Learning Objectives (Satu baris per item)
                </label>
                <textarea
                  rows={3}
                  value={(editingLmsCourse.learning_objectives ?? editingLmsCourse.key_skills_learned ?? []).join('\n')}
                  onChange={(e) => {
                    const lines = e.target.value.split('\n');
                    setEditingLmsCourse({
                      ...editingLmsCourse,
                      learning_objectives: lines,
                      key_skills_learned: lines,
                    });
                  }}
                  placeholder="Memahami formula 3 detik pertama video&#10;Mampu merancang script carousel informatif"
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-xs bg-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowLmsModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#10B981] text-white text-xs font-bold hover:bg-emerald-600 shadow"
                >
                  Simpan & Sinkronkan Materi LMS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 6: KONFIRMASI PENGHAPUSAN DATA (PENGGANTI WINDOW.CONFIRM)
         ===================================================================== */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600">
              <Trash2 className="w-6 h-6" />
              <h3 className="text-lg font-bold">{deleteConfirm.title}</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{deleteConfirm.message}</p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() =>
                  setDeleteConfirm({
                    isOpen: false,
                    title: '',
                    message: '',
                    onConfirm: () => {},
                  })
                }
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  const fn = deleteConfirm.onConfirm;
                  setDeleteConfirm({
                    isOpen: false,
                    title: '',
                    message: '',
                    onConfirm: () => {},
                  });
                  await fn();
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow"
              >
                Ya, Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 7: QUICK ADD / EDIT / GANTI NAMA KARYAWAN (KHUSUS ADMINISTRATOR)
         ===================================================================== */}
      {showQuickEmpModal && currentUser.role === 'admin' && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2 text-[#1E40AF]">
                <Edit3 className="w-5 h-5" />
                <h3 className="text-lg font-bold">
                  {quickEmpEditingId ? 'Ganti Nama / Ubah Data Karyawan' : 'Tambah Karyawan Baru ke Evaluasi & Presensi'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickEmpModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!quickEmpForm.full_name?.trim() || !quickEmpForm.employee_nik?.trim()) {
                  triggerToast('NIK dan Nama Lengkap wajib diisi!', 'error');
                  return;
                }
                setIsLoading(true);
                try {
                  await SkenaHrApi.upsertEmployee({
                    ...quickEmpForm,
                    ...(quickEmpEditingId ? { id: quickEmpEditingId } : {}),
                  });
                  const updatedEmps = await SkenaHrApi.getEmployees();
                  setEmployees(updatedEmps);
                  setUserAccounts(SkenaHrApi.getUsers());
                  setShowQuickEmpModal(false);
                  triggerToast(
                    quickEmpEditingId
                      ? `Data & nama karyawan "${quickEmpForm.full_name}" berhasil diperbarui di seluruh modul!`
                      : `Karyawan baru "${quickEmpForm.full_name}" berhasil ditambahkan!`
                  );
                } catch (err: any) {
                  triggerToast(`Gagal menyimpan karyawan: ${err.message}`, 'error');
                } finally {
                  setIsLoading(false);
                }
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">NIK Karyawan *</label>
                  <input
                    type="text"
                    required
                    value={quickEmpForm.employee_nik ?? ''}
                    onChange={(e) => setQuickEmpForm({ ...quickEmpForm, employee_nik: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-xs font-mono font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Kuota Cuti Tahunan (Hari)</label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={quickEmpForm.annual_leave_quota ?? 12}
                    onChange={(e) => setQuickEmpForm({ ...quickEmpForm, annual_leave_quota: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-xs font-bold bg-white text-[#1E40AF]"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Nama Lengkap Karyawan *</label>
                <input
                  type="text"
                  required
                  value={quickEmpForm.full_name ?? ''}
                  onChange={(e) => setQuickEmpForm({ ...quickEmpForm, full_name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-sm font-bold bg-white text-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Jabatan / Role *</label>
                  <input
                    type="text"
                    required
                    value={quickEmpForm.role_title ?? ''}
                    onChange={(e) => setQuickEmpForm({ ...quickEmpForm, role_title: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-xs font-semibold bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Departemen *</label>
                  <select
                    value={quickEmpForm.department ?? 'Creative'}
                    onChange={(e) => setQuickEmpForm({ ...quickEmpForm, department: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-xs font-semibold bg-white"
                  >
                    <option value="Creative">Creative</option>
                    <option value="Sales & Marketing">Sales & Marketing</option>
                    <option value="Operasional">Operasional</option>
                    <option value="Managing Director">Managing Director</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Status Kontrak</label>
                  <select
                    value={quickEmpForm.employment_status ?? 'Full Time'}
                    onChange={(e) =>
                      setQuickEmpForm({ ...quickEmpForm, employment_status: e.target.value as EmploymentStatus })
                    }
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-xs font-semibold bg-white"
                  >
                    <option value="Full Time">Full Time</option>
                    <option value="Full Time Performance Based">Full Time Performance Based</option>
                    <option value="Probation">Probation</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Lokasi Kerja Default</label>
                  <input
                    type="text"
                    value={quickEmpForm.work_location ?? 'Makassar HQ'}
                    onChange={(e) => setQuickEmpForm({ ...quickEmpForm, work_location: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-xs bg-white"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t">
                {quickEmpEditingId ? (
                  <button
                    type="button"
                    onClick={() => {
                      const empObj = employees.find((e) => e.id === quickEmpEditingId);
                      if (!empObj) return;
                      setShowQuickEmpModal(false);
                      setDeleteConfirm({
                        isOpen: true,
                        title: 'Hapus Karyawan dari Sistem',
                        message: `Hapus permanen data karyawan "${empObj.full_name}" beserta evaluasinya?`,
                        onConfirm: async () => {
                          await SkenaHrApi.deleteEmployee(empObj.id);
                          setEmployees(await SkenaHrApi.getEmployees());
                          triggerToast(`Karyawan "${empObj.full_name}" berhasil dihapus.`);
                        },
                      });
                    }}
                    className="px-3 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus Karyawan Ini
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowQuickEmpModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#1E40AF] text-white text-xs font-bold hover:bg-blue-800 shadow"
                  >
                    Simpan Penetapan Admin
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 8: DETAIL TERINTEGRASI 360° (EVALUASI KPI, WLA & REKAP PRESENSI)
         ===================================================================== */}
      {detailInspectEmpId && (() => {
        const inspectEmp = employees.find((e) => e.id === detailInspectEmpId);
        if (!inspectEmp) return null;
        const isAdmin = currentUser.role === 'admin';
        const empRecs = monthlyAttendances.filter((r) => r.employee_id === inspectEmp.id);
        const wfo = empRecs.filter((r) => r.status === 'WFO').length;
        const wfh = empRecs.filter((r) => r.status === 'WFH').length;
        const content = empRecs.filter((r) => r.status === 'Take Content').length;
        const cuti = empRecs.filter((r) => r.status === 'Cuti').length;
        const leave = getEmployeeLeaveStats(inspectEmp.id, inspectEmp.annual_leave_quota || 12);

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4 no-print">
            <div className="bg-white rounded-3xl max-w-5xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                <div>
                  <div className="text-xs font-bold uppercase text-[#1E40AF]">
                    Rincian Integrasi 360° · Buku Evaluasi KPI, Beban Kerja (WLA) & Rekap Presensi
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mt-0.5">
                    {inspectEmp.full_name} ({inspectEmp.employee_nik})
                  </h3>
                  <p className="text-xs text-slate-500">
                    {inspectEmp.role_title} · Departemen {inspectEmp.department} · Skema Kontrak: <strong>{inspectEmp.employment_status}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuickEmpEditingId(inspectEmp.id);
                        setQuickEmpForm({ ...inspectEmp });
                        setShowQuickEmpModal(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-blue-50 text-[#1E40AF] border border-blue-200 text-xs font-bold hover:bg-blue-100 inline-flex items-center gap-1.5"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Ganti Nama / Edit Profil
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReportEmpId(inspectEmp.id);
                      setDetailInspectEmpId(null);
                      setActiveModule('report_card');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#10B981] text-white text-xs font-bold hover:bg-emerald-600 inline-flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" /> Buka Rapor A4
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailInspectEmpId(null)}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                  >
                    ✕ Tutup
                  </button>
                </div>
              </div>

              {/* Ringkasan Metrik Integrasi */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">Hadir WFO / WFH</span>
                  <strong className="text-base font-black text-[#1E40AF]">{wfo} WFO · {wfh} WFH</strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">Take Content / Studio</span>
                  <strong className="text-base font-black text-purple-700">{content} Hari</strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">Cuti & Sisa Kuota</span>
                  <strong className="text-base font-black text-rose-600">{cuti} Cuti (Sisa {leave.remaining}/{leave.quota})</strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">Periode Evaluasi</span>
                  <strong className="text-sm font-black text-slate-800">{settings.period_term} {settings.period_year}</strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">Lokasi Default</span>
                  <strong className="text-sm font-black text-slate-800">{inspectEmp.work_location || 'Makassar HQ'}</strong>
                </div>
              </div>

              {/* Bagian 1: Tabel Detail Seluruh Indikator KPI & WLA Karyawan Ini */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900">
                  1. Detail Evaluasi Seluruh Indikator KPI & Working Load Analysis (WLA) — {inspectEmp.full_name}
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 uppercase">
                        <th className="p-2.5 border">Kode & Nama Indikator KPI</th>
                        <th className="p-2 border text-center">Target</th>
                        <th className="p-2 border text-center">M1</th>
                        <th className="p-2 border text-center">M2</th>
                        <th className="p-2 border text-center">M3</th>
                        <th className="p-2 border text-center">M4</th>
                        <th className="p-2 border text-center">Skill (30%)</th>
                        <th className="p-2 border text-center">Project (20%)</th>
                        <th className="p-2 border text-center">Skor Akhir</th>
                        <th className="p-2 border text-center">WLA (%) & Jam</th>
                        <th className="p-2.5 border">Catatan / Narasi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {competencies.map((comp) => {
                        const match = kpiList.find(
                          (k) =>
                            k.employee_id === inspectEmp.id &&
                            k.competency_id === comp.id &&
                            k.period_year === settings.period_year &&
                            k.period_term === settings.period_term
                        ) || {
                          employee_id: inspectEmp.id,
                          competency_id: comp.id,
                          period_year: settings.period_year,
                          period_term: settings.period_term,
                          kpi_q1: 82,
                          kpi_q2: 85,
                          kpi_q3: 86,
                          kpi_q4: 88,
                          mid_review_score: 85,
                          final_project_score: 86,
                          current_skill_level: 3,
                          workload_percentage: 85,
                          performance_narrative: '',
                        };
                        const score = calculateRowScore(match);
                        const stdHours = comp.standard_workload_hours || 40;
                        const actualHours = Math.round(((match.workload_percentage || 85) / 100) * stdHours);
                        return (
                          <tr key={comp.id} className="hover:bg-slate-50">
                            <td className="p-2.5 border">
                              <div className="font-mono font-bold text-[#1E40AF]">{comp.competency_code}</div>
                              <div className="font-semibold text-slate-900">{comp.competency_name}</div>
                            </td>
                            <td className="p-2 border text-center font-bold">{comp.target_threshold}</td>
                            <td className="p-2 border text-center font-mono">{match.kpi_q1}</td>
                            <td className="p-2 border text-center font-mono">{match.kpi_q2}</td>
                            <td className="p-2 border text-center font-mono">{match.kpi_q3}</td>
                            <td className="p-2 border text-center font-mono">{match.kpi_q4}</td>
                            <td className="p-2 border text-center font-mono">{match.mid_review_score}</td>
                            <td className="p-2 border text-center font-mono">{match.final_project_score}</td>
                            <td className="p-2 border text-center font-black text-[#1E40AF]">{score}</td>
                            <td className="p-2 border text-center">
                              <div className="font-bold text-emerald-700">{match.workload_percentage}%</div>
                              <div className="text-[10px] font-mono text-slate-500">
                                {actualHours}/{stdHours} Jam
                              </div>
                            </td>
                            <td className="p-2.5 border text-slate-600">{match.performance_narrative || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bagian 2: Rincian Log Kehadiran, Ketepatan Waktu (09:00 + 15m) & Deliverable Harian Karyawan Ini */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900">
                  2. Rincian Log Presensi, Ketepatan Waktu (09:00 + 15m) & Keterangan Izin/WFH Bulan {formatMonthLabel(attendanceMonth)} ({empRecs.length} Catatan)
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 uppercase">
                        <th className="p-2.5 border">Tanggal</th>
                        <th className="p-2.5 border">Jam Check-In</th>
                        <th className="p-2.5 border">Mode / Izin</th>
                        <th className="p-2.5 border">Ketepatan Waktu (09:00 + 15m)</th>
                        <th className="p-2.5 border">Lokasi Kerja / Liputan</th>
                        <th className="p-2.5 border">Keterangan Izin / WFH / Deliverable</th>
                      </tr>
                    </thead>
                    <tbody>
                      {empRecs.map((r, i) => {
                        const p = analyzeAttendancePunctuality(r.check_in_time, r.status);
                        return (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2 border font-mono font-bold">{r.attendance_date}</td>
                            <td className="p-2 border font-mono text-emerald-700 font-bold">{r.check_in_time || '08:45:00'}</td>
                            <td className="p-2 border">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getAttendanceStatusBadgeClass(r.status)}`}>
                                {r.status}
                              </span>
                            </td>
                            <td className="p-2 border">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.badgeClass}`}>
                                {p.badgeLabel}
                              </span>
                            </td>
                            <td className="p-2 border text-slate-700">{r.work_location_tag || 'Makassar HQ'}</td>
                            <td className="p-2 border text-slate-600">{r.notes || '-'}</td>
                          </tr>
                        );
                      })}
                      {empRecs.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-slate-400">
                            Belum ada log presensi tercatat pada bulan ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
