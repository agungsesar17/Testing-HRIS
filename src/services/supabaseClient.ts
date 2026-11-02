import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

// ============================================================================
// HARDCODED SUPABASE CREDENTIALS (PERMANENT & DIRECT CONNECTION)
// ============================================================================
export const SUPABASE_URL = 'https://qmrxilteqperjqqlaghv.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtcnhpbHRlcXBlcmpxcWxhZ2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyNjk4MzAsImV4cCI6MjEwODg0NTgzMH0.cCqdeGBGAqFRchegMk25jCo4Asnb4ok_oxMBTAYsVrA';

export const DEFAULT_SUPABASE_URL = SUPABASE_URL;
export const DEFAULT_SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

// Client Supabase langsung dibuat dan terhubung permanen saat aplikasi pertama kali dimuat
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 20,
    },
  },
});

let realtimeChannel: RealtimeChannel | null = null;
let realtimeStatus: 'disconnected' | 'connecting' | 'connected' | 'error' = 'connecting';
let lastSyncTimestamp: string = new Date().toLocaleTimeString('id-ID', { hour12: false });

type RealtimeListener = (payload: { table: string; eventType: string; timestamp: string }) => void;
const realtimeListeners = new Set<RealtimeListener>();

export const subscribeRealtimeUpdates = (listener: RealtimeListener): (() => void) => {
  realtimeListeners.add(listener);
  return () => {
    realtimeListeners.delete(listener);
  };
};

const notifyRealtimeListeners = (table: string, eventType: string) => {
  lastSyncTimestamp = new Date().toLocaleTimeString('id-ID', { hour12: false });
  realtimeListeners.forEach((fn) => {
    try {
      fn({ table, eventType, timestamp: lastSyncTimestamp });
    } catch (e) {
      console.warn('Realtime listener error:', e);
    }
  });
};

export const getRealtimeStatus = () => ({
  status: realtimeStatus,
  lastSync: lastSyncTimestamp,
  lastSyncTime: lastSyncTimestamp,
  lastChangedTable: 'all',
  isConfigured: true,
});

// Helper: cek apakah string merupakan format UUID yang valid
const isValidUuid = (val?: string | null): boolean => {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
};

// Generator UUID v4 kompatibel untuk semua tabel (baik kolom UUID maupun TEXT)
export const generateUuid = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const setupRealtimeSubscription = (client: SupabaseClient) => {
  try {
    realtimeStatus = 'connecting';
    realtimeChannel = client
      .channel('skena-hris-live-db')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          const table = payload.table || 'database';
          const eventType = payload.eventType || 'UPDATE';
          notifyRealtimeListeners(table, eventType);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          realtimeStatus = 'connected';
          notifyRealtimeListeners('system', 'SUBSCRIBED');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          realtimeStatus = 'error';
        }
      });
  } catch (err) {
    console.warn('Realtime subscription warning:', err);
    realtimeStatus = 'error';
  }
};

// Langsung jalankan langganan Realtime saat aplikasi dimuat
setupRealtimeSubscription(supabase);

export const initSupabaseRuntime = (_url?: string, _anonKey?: string): SupabaseClient => {
  return supabase;
};

export const getSupabase = (): SupabaseClient => {
  return supabase;
};

export const isSupabaseConfigured = (): boolean => {
  return true;
};

export const getSupabaseCredentials = (): { url: string; anonKey: string } => ({
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
});

// ============================================================================
// DEFINISI TIPE DATA TYPESCRIPT (11 TABEL UTAMA)
// ============================================================================

export type EmploymentStatus = 'Probation' | 'Full Time' | 'Full Time Performance Based' | 'Freelance';
export type AttendanceStatus =
  | 'WFO'
  | 'WFH'
  | 'Take Content'
  | 'Urusan Kantor'
  | 'Sakit'
  | 'Cuti'
  | 'Overtime'
  | 'Tidak Absen'
  | 'Izin'
  | 'Urusan Pribadi';

export type CollaboratorCategory =
  | 'Karyawan Internal'
  | 'Alumni / Ex-Karyawan'
  | 'Freelancer / Mitra'
  | 'KOL / Talent'
  | 'Vendor';

export type ResignStatus = 'Aktif' | 'One Month Notice (Resign)' | 'Resigned';

export interface CompanySettings {
  id?: string;
  company_name: string;
  industry_sector: string;
  department_scope: string;
  evaluation_cycle: string;
  period_year: string;
  period_term: string;
  hr_lead_name: string;
  hr_lead_id: string;
  managing_director_name: string;
  managing_director_id: string;
}

export interface Employee {
  id: string;
  employee_nik: string;
  tax_bpjs_id: string;
  full_name: string;
  gender: 'L' | 'P';
  role_title: string;
  department: string;
  employment_status: EmploymentStatus;
  contract_duration: string;
  contract_start_date?: string;
  contract_end_date?: string;
  benefits_package: string;
  assigned_project: string;
  work_location: string;
  direct_supervisor: string;
  is_active: boolean;
  annual_leave_quota?: number;
  deactivation_reason?: string | null;
  deactivation_date?: string | null;
  // Informasi Personal, Kolaborator / Arsip & Budget
  address_domicile?: string;
  whatsapp_contact?: string;
  email?: string;
  rate_budget?: string;
  notes?: string;
  collaborator_category?: CollaboratorCategory;
  // Informasi Resign & One Month Notice
  resign_status?: ResignStatus;
  resign_notice_date?: string;
  resign_effective_date?: string;
  resign_reason?: string;
  handover_notes?: string;
}

export interface JobChecklistItem {
  id: string;
  task: string;
  label?: string;
  frequency: 'Harian' | 'Mingguan' | 'Bulanan' | 'Per Sprint / Project' | 'Rutin';
  is_completed: boolean;
  is_checked?: boolean;
}

export interface JobWorkflowStep {
  step_number: number;
  stage_title: string;
  description: string;
  pic_output: string;
}

export interface JobProfile {
  id: string;
  role_title: string;
  department: string;
  summary?: string;
  key_responsibilities: string[];
  technical_competencies?: string[];
  behavioral_traits?: string[];
  direct_supervisor?: string;
  reports_to?: string;
  requirements?: string[];
  core_kpis?: string[];
  job_checklists?: JobChecklistItem[];
  workflow_steps?: JobWorkflowStep[];
}

export interface LmsCurriculum {
  id: string;
  title: string;
  department?: string;
  category:
    | 'Creative Design'
    | 'Sales & Pipeline'
    | 'Operations & Finance'
    | 'Leadership & Agile'
    | 'Creative & Production'
    | 'Sales & Marketing'
    | 'Leadership & Operations'
    | 'Soft Skills & Agility';
  duration_hours: number;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  description?: string;
  key_skills_learned?: string[];
  status?: 'Aktif' | 'Arsip';
  target_roles?: string[];
  target_competency_codes?: string[];
  learning_objectives?: string[];
}

export interface Competency {
  id: string;
  competency_code: string;
  competency_name: string;
  category: 'Hard Skill' | 'Soft Skill' | 'Core KPI';
  target_threshold: number;
  standard_workload_hours: number;
  description?: string;
  level_descriptors?: string[];
  level_1_desc?: string;
  level_2_desc?: string;
  level_3_desc?: string;
  level_4_desc?: string;
  level_5_desc?: string;
}

export interface WorkSchedule {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  shift_code: string;
  competency_id: string;
  location_agenda_notes: string;
  competencies?: Competency;
  schedule_date?: string;
  employee_id?: string;
  employee_name?: string;
  created_by_role?: 'admin' | 'employee';
  status?: 'Confirmed' | 'Tentative' | 'Completed';
}

export interface AttendanceRecord {
  id?: string;
  employee_id: string;
  attendance_date: string;
  check_in_time?: string;
  check_out_time?: string;
  status: AttendanceStatus;
  work_location_tag: string;
  notes: string;
  permission_reason?: string;
}

export interface ActivityLog {
  id?: string;
  log_date: string;
  schedule_id?: string | null;
  competency_id: string;
  sprint_session_info: string;
  project_deliverable_topic: string;
  execution_details: string;
  blocker_evaluator_notes: string;
  total_active_team: number;
  total_on_leave: number;
  competencies?: Competency;
}

export interface KpiEvaluation {
  id?: string;
  employee_id: string;
  competency_id: string;
  period_year: string;
  period_term: string;
  kpi_q1: number;
  kpi_q2: number;
  kpi_q3: number;
  kpi_q4: number;
  mid_review_score: number;
  final_project_score: number;
  final_kpi_score?: number;
  current_skill_level: number;
  workload_percentage: number;
  performance_narrative: string;
}

export interface KpiWeightConfig {
  sprint_weight_pct: number; // default 50
  skill_weight_pct: number;  // default 30
  project_weight_pct: number; // default 20
}

export interface IdpLmsItem {
  module_name: string;
  category: 'LMS Course' | 'Mentoring' | 'Project Assignment';
  target_date: string;
  status: 'Completed' | 'In Progress' | 'Planned';
  score: string;
  mentor_notes?: string;
}

export interface EmployeeReport {
  id?: string;
  employee_id: string;
  period_year: string;
  period_term: string;
  idp_lms_modules: IdpLmsItem[];
  behavioral_culture_notes: string;
  hr_director_notes: string;
  talent_pipeline_box: string;
  career_decision: string;
  next_role_assignment: string;
  report_date: string;
}

export type SharingProgramType = 'Senin Di Skena' | 'Bincang Kenyang';

export interface SharingSessionItem {
  id: string;
  program_type: SharingProgramType;
  session_date: string;
  day_label?: string;
  speaker_employee_id?: string;
  speaker_name: string;
  speaker_department?: string;
  speaker_role?: string;
  topic_title: string;
  material_summary: string;
  documentation_link?: string;
  remarks: string;
  status: 'Terjadwal' | 'Selesai' | 'Ditunda';
}

export interface OneYearPlanItem {
  id: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Tahunan';
  target_month?: string;
  month_label?: string;
  department?: string;
  category?: string;
  objective_title?: string;
  title?: string;
  key_result_kpi?: string;
  target_metric?: string;
  pic_name: string;
  budget_estimate?: string;
  progress_pct: number;
  is_completed: boolean;
  status?: 'Planned' | 'On Track' | 'At Risk' | 'Completed';
  notes: string;
}

export interface ExecutiveReminderItem {
  id: string;
  category: string;
  title: string;
  schedule_info?: string;
  recurrence_label?: string;
  due_date: string;
  pic_name?: string;
  assigned_to?: string;
  priority: 'Tinggi' | 'Sedang' | 'Normal' | 'Urgent' | 'High';
  is_completed: boolean;
  notes: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  username?: string;
  password?: string;
  role: 'admin' | 'employee';
  employeeId?: string;
  employeeNik?: string;
  roleTitle?: string;
  department?: string;
  employmentStatus?: EmploymentStatus;
}

// ============================================================================
// DATA AWAL SEED / DEMO MEMORI JIKA BELUM TERHUBUNG SUPABASE
// ============================================================================

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  id: '00000000-0000-4000-8000-000000000001',
  company_name: 'PT Skena Wahana Kreatif',
  industry_sector: 'Creative & Digital Media Agency',
  department_scope: 'Operasional, Sales & Marketing, Creative & Managing Director',
  evaluation_cycle: 'Quarterly & Semi-Annual Performance Review',
  period_year: '2026',
  period_term: 'Semester 2 (Jul - Des)',
  hr_lead_name: 'Agun Sesar',
  hr_lead_id: 'HC-SKENA-001',
  managing_director_name: 'Uswatun Hasanah',
  managing_director_id: 'MD-SKENA-001',
};

export const DEFAULT_COMPETENCIES: Competency[] = [
  // Creative KPIs
  {
    id: 'c-cre-1',
    competency_code: 'KPI-CRE-01',
    competency_name: 'Kualitas Konten & Estetika Visual (Art Excellence)',
    category: 'Core KPI',
    target_threshold: 82,
    standard_workload_hours: 40,
  },
  {
    id: 'c-cre-2',
    competency_code: 'KPI-CRE-02',
    competency_name: 'Kuantitas & On-Time Delivery Content Sprint',
    category: 'Core KPI',
    target_threshold: 85,
    standard_workload_hours: 40,
  },
  {
    id: 'c-cre-3',
    competency_code: 'KPI-CRE-03',
    competency_name: 'Audience Reach, Virality & Engagement Rate',
    category: 'Core KPI',
    target_threshold: 78,
    standard_workload_hours: 38,
  },
  {
    id: 'c-cre-4',
    competency_code: 'KPI-CRE-04',
    competency_name: 'Project Management Velocity & Zero Major Revision',
    category: 'Core KPI',
    target_threshold: 80,
    standard_workload_hours: 40,
  },
  // Sales & Marketing KPIs
  {
    id: 'c-sm-1',
    competency_code: 'KPI-SM-01',
    competency_name: 'Jumlah Sales & Target Omset Penjualan (Revenue Closing)',
    category: 'Core KPI',
    target_threshold: 80,
    standard_workload_hours: 40,
  },
  {
    id: 'c-sm-2',
    competency_code: 'KPI-SM-02',
    competency_name: 'Jumlah & Kualitas Leads (MQL & SQL Pipeline Conversion)',
    category: 'Core KPI',
    target_threshold: 78,
    standard_workload_hours: 40,
  },
  {
    id: 'c-sm-3',
    competency_code: 'KPI-SM-03',
    competency_name: 'Pendapatan, ROAS Kampanye & Efisiensi Akusisi Klien',
    category: 'Hard Skill',
    target_threshold: 75,
    standard_workload_hours: 38,
  },
  {
    id: 'c-sm-4',
    competency_code: 'KPI-SM-04',
    competency_name: 'Client Retention Rate & Kepuasan Brand Retainer',
    category: 'Core KPI',
    target_threshold: 82,
    standard_workload_hours: 40,
  },
  // Operasional KPIs
  {
    id: 'c-ops-1',
    competency_code: 'KPI-OPS-01',
    competency_name: 'Kualitas Pelayanan Internal & SLA Response Time',
    category: 'Core KPI',
    target_threshold: 85,
    standard_workload_hours: 40,
  },
  {
    id: 'c-ops-2',
    competency_code: 'KPI-OPS-02',
    competency_name: 'Akurasi Laporan Keuangan, Kas & Budget Compliance',
    category: 'Hard Skill',
    target_threshold: 88,
    standard_workload_hours: 40,
  },
  {
    id: 'c-ops-3',
    competency_code: 'KPI-OPS-03',
    competency_name: 'Efisiensi Logistik, Fasilitas & Inventaris Studio',
    category: 'Hard Skill',
    target_threshold: 80,
    standard_workload_hours: 40,
  },
  {
    id: 'c-ops-4',
    competency_code: 'KPI-OPS-04',
    competency_name: 'Retensi SDM, Kepatuhan SOP & Layanan Human Capital',
    category: 'Core KPI',
    target_threshold: 84,
    standard_workload_hours: 40,
  },
  // Strategic Managing Director KPI
  {
    id: 'c-dir-1',
    competency_code: 'KPI-DIR-01',
    competency_name: 'Visi Strategis Perusahaan & Manajemen Lintas Divisi',
    category: 'Core KPI',
    target_threshold: 88,
    standard_workload_hours: 45,
  },
];

const offsetDateIso = (daysOffset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
};

export const DEFAULT_EMPLOYEES: Employee[] = [
  {
    id: 'e-1',
    employee_nik: 'SKN-DIR-001',
    tax_bpjs_id: 'NPWP-81293841 / BPJS-01928374',
    full_name: 'Uswatun Hasanah',
    gender: 'P',
    role_title: 'Managing Director',
    department: 'Managing Director',
    employment_status: 'Full Time',
    contract_duration: 'Perjanjian Kerja Waktu Tidak Tertentu (PKWTT)',
    contract_start_date: '2023-01-10',
    contract_end_date: 'PKWTT (Permanen)',
    benefits_package: 'BPJS Kesehatan & Ketenagakerjaan, Executive Health Plan, Car & Device Allowance',
    assigned_project: 'Executive Agency Leadership & High-Level Strategic Accounts',
    work_location: 'Makassar HQ',
    direct_supervisor: 'Board of Directors',
    is_active: true,
    annual_leave_quota: 12,
    address_domicile: 'Jl. Boulevard Panakkukang, Makassar',
    whatsapp_contact: '0811-4401-889',
    email: 'uswatun@skena.id',
    rate_budget: 'Executive Retainer Tier A',
    notes: 'Managing Director & Principal Approver',
    collaborator_category: 'Karyawan Internal',
    resign_status: 'Aktif',
  },
  {
    id: 'e-2',
    employee_nik: 'SKN-OPS-001',
    tax_bpjs_id: 'NPWP-72819302 / BPJS-02837461',
    full_name: 'Andi Muhammad Nurhaldi',
    gender: 'L',
    role_title: 'Staff Finance',
    department: 'Operasional',
    employment_status: 'Full Time',
    contract_duration: '12 Bulan (PKWT)',
    contract_start_date: offsetDateIso(-315),
    contract_end_date: offsetDateIso(50), // H-2 Bulan (50 hari lagi)
    benefits_package: 'BPJS Kesehatan & Ketenagakerjaan, Tunjangan Kehadiran & Lembur',
    assigned_project: 'Agency Cashflow, Client Invoicing & Tax Compliance',
    work_location: 'Makassar HQ',
    direct_supervisor: 'Managing Director',
    is_active: true,
    annual_leave_quota: 12,
    address_domicile: 'Jl. Hertasning Baru, Makassar',
    whatsapp_contact: '0812-4102-3391',
    email: 'nurhaldi@skena.id',
    rate_budget: 'Rp 5.800.000 / Bulan',
    notes: 'PIC Pengajuan Budget Hari Rabu & Rekonsiliasi Pajak Bulanan',
    collaborator_category: 'Karyawan Internal',
    resign_status: 'Aktif',
  },
  {
    id: 'e-3',
    employee_nik: 'SKN-OPS-002',
    tax_bpjs_id: 'NPWP-61928301 / BPJS-03847562',
    full_name: 'Nur Sukmayanti Tri Utami',
    gender: 'P',
    role_title: 'General Affair',
    department: 'Operasional',
    employment_status: 'Full Time',
    contract_duration: '12 Bulan (PKWT)',
    contract_start_date: offsetDateIso(-200),
    contract_end_date: offsetDateIso(165),
    benefits_package: 'BPJS Kesehatan & Ketenagakerjaan, Tunjangan Fasilitas Kantor',
    assigned_project: 'Studio Maintenance, Procurement & Office Logistics',
    work_location: 'Makassar HQ',
    direct_supervisor: 'Managing Director',
    is_active: true,
    annual_leave_quota: 12,
    address_domicile: 'Jl. Perintis Kemerdekaan KM 9, Makassar',
    whatsapp_contact: '0813-5521-9082',
    email: 'sukmayanti@skena.id',
    rate_budget: 'Rp 5.200.000 / Bulan',
    notes: 'PIC Inventaris Studio, Konsumsi Bincang Kenyang & Logistik CSR',
    collaborator_category: 'Karyawan Internal',
    resign_status: 'Aktif',
  },
  {
    id: 'e-4',
    employee_nik: 'SKN-HC-001',
    tax_bpjs_id: 'NPWP-51827364 / BPJS-04857612',
    full_name: 'Agun Sesar',
    gender: 'L',
    role_title: 'Staff Human Capital',
    department: 'Operasional',
    employment_status: 'Full Time',
    contract_duration: '12 Bulan (PKWT)',
    contract_start_date: offsetDateIso(-180),
    contract_end_date: offsetDateIso(185),
    benefits_package: 'BPJS Kesehatan & Ketenagakerjaan, Tunjangan Profesional HC',
    assigned_project: 'Talent Acquisition, Performance Review & Employee Welfare',
    work_location: 'Makassar HQ',
    direct_supervisor: 'Managing Director',
    is_active: true,
    annual_leave_quota: 12,
    address_domicile: 'Jl. Pettarani, Makassar',
    whatsapp_contact: '0811-4609-771',
    email: 'agun@skena.id',
    rate_budget: 'Rp 6.200.000 / Bulan',
    notes: 'Lead Administrator HRIS, KPI, LMS & Moderator Senin Di Skena',
    collaborator_category: 'Karyawan Internal',
    resign_status: 'Aktif',
  },
  {
    id: 'e-5',
    employee_nik: 'SKN-CRE-001',
    tax_bpjs_id: 'NPWP-41728394 / BPJS-05948371',
    full_name: 'Gery Jimmiawan',
    gender: 'L',
    role_title: 'Creative Director',
    department: 'Creative',
    employment_status: 'Full Time',
    contract_duration: 'Perjanjian Kerja Waktu Tidak Tertentu (PKWTT)',
    contract_start_date: '2023-03-01',
    contract_end_date: 'PKWTT (Permanen)',
    benefits_package: 'BPJS Kesehatan & Ketenagakerjaan, Creative Production Allowance, Leadership Bonus',
    assigned_project: 'Creative Master Direction & Agency Flagship Campaigns',
    work_location: 'Makassar HQ & Studio',
    direct_supervisor: 'Managing Director',
    is_active: true,
    annual_leave_quota: 12,
    address_domicile: 'Jl. Tanjung Bunga, Makassar',
    whatsapp_contact: '0812-4299-1102',
    email: 'gery@skena.id',
    rate_budget: 'Rp 11.500.000 / Bulan',
    notes: 'Creative Director & Mentor Utama IDP Creative',
    collaborator_category: 'Karyawan Internal',
    resign_status: 'Aktif',
  },
  {
    id: 'e-6',
    employee_nik: 'SKN-CRE-002',
    tax_bpjs_id: 'NPWP-31827465 / BPJS-06958472',
    full_name: 'Ahmad Aufar',
    gender: 'L',
    role_title: 'Art Director',
    department: 'Creative',
    employment_status: 'Full Time',
    contract_duration: '12 Bulan (PKWT)',
    contract_start_date: offsetDateIso(-320),
    contract_end_date: offsetDateIso(45), // H-2 Bulan (45 hari lagi)
    benefits_package: 'BPJS Kesehatan & Ketenagakerjaan, Device & Software License Allowance',
    assigned_project: 'Visual Identity, Key Visual & Editorial Design Standards',
    work_location: 'Makassar HQ',
    direct_supervisor: 'Creative Director',
    is_active: true,
    annual_leave_quota: 12,
    address_domicile: 'Jl. Alauddin, Makassar',
    whatsapp_contact: '0821-8891-4402',
    email: 'aufar@skena.id',
    rate_budget: 'Rp 7.500.000 / Bulan',
    notes: 'Kontrak masuk periode review H-2 Bulan untuk perpanjangan tahun depan',
    collaborator_category: 'Karyawan Internal',
    resign_status: 'Aktif',
  },
  {
    id: 'e-7',
    employee_nik: 'SKN-CRE-003',
    tax_bpjs_id: 'NPWP-21938475 / BPJS-07968583',
    full_name: 'Mochammad Raihan',
    gender: 'L',
    role_title: 'Graphic Designer',
    department: 'Creative',
    employment_status: 'Full Time Performance Based',
    contract_duration: '12 Bulan (PKWT)',
    contract_start_date: offsetDateIso(-330),
    contract_end_date: offsetDateIso(35), // H-2 Bulan (35 hari lagi)
    benefits_package: 'BPJS Ketenagakerjaan, Insentif Output Sprint Desain',
    assigned_project: 'Digital Social Assets, Feeds & Marketing Collaterals',
    work_location: 'Makassar HQ',
    direct_supervisor: 'Art Director',
    is_active: true,
    annual_leave_quota: 12,
    address_domicile: 'Jl. Antang Raya, Makassar',
    whatsapp_contact: '0852-9910-3341',
    email: 'raihan@skena.id',
    rate_budget: 'Rp 5.400.000 / Bulan',
    notes: 'Mengajukan One Month Notice untuk lanjut studi S2 Desain di Bandung',
    collaborator_category: 'Karyawan Internal',
    resign_status: 'One Month Notice (Resign)',
    resign_notice_date: offsetDateIso(-9),
    resign_effective_date: offsetDateIso(21),
    resign_reason: 'Melanjutkan Studi Magister Desain & Relokasi ke Bandung',
    handover_notes: 'Serah terima master template Figma & aset retainer F&B ke Ahmad Aufar sebelum H-5 efektif resign',
  },
  {
    id: 'e-8',
    employee_nik: 'SKN-CRE-004',
    tax_bpjs_id: 'NPWP-12837465 / BPJS-08978694',
    full_name: 'Fahmi Huwaidy',
    gender: 'L',
    role_title: 'Project Manager',
    department: 'Creative',
    employment_status: 'Full Time',
    contract_duration: '12 Bulan (PKWT)',
    contract_start_date: offsetDateIso(-210),
    contract_end_date: offsetDateIso(155),
    benefits_package: 'BPJS Kesehatan & Ketenagakerjaan, Project Milestones Incentive',
    assigned_project: 'Creative Sprint Tracking & Client Milestone Delivery',
    work_location: 'Makassar HQ',
    direct_supervisor: 'Creative Director',
    is_active: true,
    annual_leave_quota: 12,
    address_domicile: 'Jl. Cendrawasih, Makassar',
    whatsapp_contact: '0813-4091-2281',
    email: 'fahmi@skena.id',
    rate_budget: 'Rp 6.800.000 / Bulan',
    notes: 'Scrum Master & Koordinator Sprint Harian',
    collaborator_category: 'Karyawan Internal',
    resign_status: 'Aktif',
  },
  {
    id: 'e-9',
    employee_nik: 'SKN-CRE-005',
    tax_bpjs_id: 'NPWP-41728394 / BPJS-05948371-B',
    full_name: 'Gery Jimmiawan (PM)',
    gender: 'L',
    role_title: 'Project Manager',
    department: 'Creative',
    employment_status: 'Full Time Performance Based',
    contract_duration: '12 Bulan (PKWT)',
    contract_start_date: offsetDateIso(-240),
    contract_end_date: offsetDateIso(125),
    benefits_package: 'BPJS Ketenagakerjaan, Project Delivery Incentive',
    assigned_project: 'Key Account Production Delivery & Cross-Team Timeline',
    work_location: 'Makassar HQ & On-Site',
    direct_supervisor: 'Creative Director',
    is_active: true,
    annual_leave_quota: 12,
    address_domicile: 'Jl. Tanjung Bunga, Makassar',
    whatsapp_contact: '0812-4299-1102',
    email: 'gery.pm@skena.id',
    rate_budget: 'Rp 4.500.000 / Project Retainer',
    notes: 'Dual Role PM untuk Key Account Kampanye Nasional',
    collaborator_category: 'Karyawan Internal',
    resign_status: 'Aktif',
  },
  {
    id: 'e-10',
    employee_nik: 'SKN-CRE-006',
    tax_bpjs_id: 'NPWP-91827364 / BPJS-09988705',
    full_name: 'Wafiq Nurul Ayni',
    gender: 'P',
    role_title: 'Social Media Specialist',
    department: 'Creative',
    employment_status: 'Full Time',
    contract_duration: '12 Bulan (PKWT)',
    contract_start_date: offsetDateIso(-310),
    contract_end_date: offsetDateIso(55), // H-2 Bulan (55 hari lagi)
    benefits_package: 'BPJS Kesehatan & Ketenagakerjaan, Content Performance Bonus',
    assigned_project: 'Organic Community Growth & Content Calendar Strategy',
    work_location: 'Makassar HQ',
    direct_supervisor: 'Creative Director',
    is_active: true,
    annual_leave_quota: 12,
    address_domicile: 'Jl. Toddopuli Raya, Makassar',
    whatsapp_contact: '0822-9182-7741',
    email: 'wafiq@skena.id',
    rate_budget: 'Rp 5.500.000 / Bulan',
    notes: 'Performa sangat baik, direkomendasikan perpanjangan kontrak H-2 bulan',
    collaborator_category: 'Karyawan Internal',
    resign_status: 'Aktif',
  },
  {
    id: 'e-11',
    employee_nik: 'SKN-CRE-007',
    tax_bpjs_id: 'NPWP-82736451 / BPJS-10998816',
    full_name: 'Azizah Putri Aulia',
    gender: 'P',
    role_title: 'Social Media Specialist',
    department: 'Creative',
    employment_status: 'Full Time Performance Based',
    contract_duration: '12 Bulan (PKWT)',
    contract_start_date: offsetDateIso(-260),
    contract_end_date: offsetDateIso(105),
    benefits_package: 'BPJS Ketenagakerjaan, Content Performance Bonus',
    assigned_project: 'Brand Retainers, Copywriting & TikTok Community',
    work_location: 'Makassar HQ',
    direct_supervisor: 'Creative Director',
    is_active: true,
    annual_leave_quota: 12,
    address_domicile: 'Jl. Racing Centre, Makassar',
    whatsapp_contact: '0853-4192-8830',
    email: 'azizah@skena.id',
    rate_budget: 'Rp 5.300.000 / Bulan',
    notes: 'Lead TikTok & Reels Copywriting Retainer',
    collaborator_category: 'Karyawan Internal',
    resign_status: 'Aktif',
  },
  {
    id: 'e-12',
    employee_nik: 'SKN-CRE-008',
    tax_bpjs_id: 'NPWP-73645182 / BPJS-11908927',
    full_name: 'Andi Dea Amalia',
    gender: 'P',
    role_title: 'Social Media Specialist',
    department: 'Creative',
    employment_status: 'Probation',
    contract_duration: '3 Bulan Probation',
    contract_start_date: offsetDateIso(-72),
    contract_end_date: offsetDateIso(18), // H-1 Bulan / Segera Habis (18 hari lagi)
    benefits_package: 'BPJS Ketenagakerjaan, Tunjangan Transport & Komunikasi',
    assigned_project: 'Content Curation & Micro-Campaign Support',
    work_location: 'Makassar HQ',
    direct_supervisor: 'Creative Director',
    is_active: true,
    annual_leave_quota: 12,
    address_domicile: 'Jl. Tamalate, Makassar',
    whatsapp_contact: '0812-8839-1920',
    email: 'dea@skena.id',
    rate_budget: 'Rp 4.200.000 / Bulan',
    notes: 'Masa Probation berakhir 18 hari lagi — jadwalkan sidang evaluasi kelulusan',
    collaborator_category: 'Karyawan Internal',
    resign_status: 'Aktif',
  },
  {
    id: 'e-13',
    employee_nik: 'SKN-CRE-009',
    tax_bpjs_id: 'NPWP-64518273 / BPJS-12919038',
    full_name: 'Muh. Arfa',
    gender: 'L',
    role_title: 'Videographer',
    department: 'Creative',
    employment_status: 'Full Time Performance Based',
    contract_duration: '12 Bulan (PKWT)',
    contract_start_date: offsetDateIso(-338),
    contract_end_date: offsetDateIso(27), // H-1 Bulan (27 hari lagi)
    benefits_package: 'BPJS Ketenagakerjaan, Camera & Gear Allowance, Shoot Fee',
    assigned_project: 'Commercial Shoot, Live Event Coverage & Studio Filming',
    work_location: 'Studio Utama Makassar & On-Location',
    direct_supervisor: 'Creative Director',
    is_active: true,
    annual_leave_quota: 12,
    address_domicile: 'Jl. Gowa Raya / Sungguminasa',
    whatsapp_contact: '0821-9044-5512',
    email: 'arfa@skena.id',
    rate_budget: 'Rp 6.000.000 / Bulan + Shoot Incentive',
    notes: 'Kontrak tersisa < 1 bulan, perlu perpanjangan PKWT & perawatan gear Sony FX3',
    collaborator_category: 'Karyawan Internal',
    resign_status: 'Aktif',
  },
  {
    id: 'e-14',
    employee_nik: 'SKN-CRE-010',
    tax_bpjs_id: 'NPWP-55627384 / BPJS-13929149',
    full_name: 'Andi Muhammad Fajar Maulana Ramahdan',
    gender: 'L',
    role_title: 'Video Editor',
    department: 'Creative',
    employment_status: 'Full Time Performance Based',
    contract_duration: '12 Bulan (PKWT)',
    contract_start_date: offsetDateIso(-220),
    contract_end_date: offsetDateIso(145),
    benefits_package: 'BPJS Ketenagakerjaan, Editing Rig Allowance, Rendering Incentive',
    assigned_project: 'Post-Production, Color Grading & Short-Form Video Reels',
    work_location: 'Makassar HQ & Remote',
    direct_supervisor: 'Creative Director',
    is_active: true,
    annual_leave_quota: 12,
    address_domicile: 'Jl. BTP Tamalanrea, Makassar',
    whatsapp_contact: '0852-4219-8873',
    email: 'fajar@skena.id',
    rate_budget: 'Rp 5.800.000 / Bulan',
    notes: 'Lead Post-Production & Motion Graphic Reels',
    collaborator_category: 'Karyawan Internal',
    resign_status: 'Aktif',
  },
  {
    id: 'e-15',
    employee_nik: 'SKN-SM-001',
    tax_bpjs_id: 'NPWP-46738291 / BPJS-14939250',
    full_name: 'Noviar Mamala',
    gender: 'L',
    role_title: 'Business Development Manager',
    department: 'Sales & Marketing',
    employment_status: 'Full Time',
    contract_duration: 'Perjanjian Kerja Waktu Tidak Tertentu (PKWTT)',
    contract_start_date: '2023-06-01',
    contract_end_date: 'PKWTT (Permanen)',
    benefits_package: 'BPJS Kesehatan & Ketenagakerjaan, Target Revenue Commission, Entertainment Budget',
    assigned_project: 'Corporate B2B Retainer Sales & Agency Partnership Strategy',
    work_location: 'Makassar HQ & Client Visit',
    direct_supervisor: 'Managing Director',
    is_active: true,
    annual_leave_quota: 12,
    address_domicile: 'Jl. Citraland Celebes, Makassar',
    whatsapp_contact: '0811-4188-902',
    email: 'noviar@skena.id',
    rate_budget: 'Rp 9.500.000 / Bulan + Komisi Closing',
    notes: 'Head of Sales Pipeline & B2B Key Account',
    collaborator_category: 'Karyawan Internal',
    resign_status: 'Aktif',
  },
  {
    id: 'e-16',
    employee_nik: 'SKN-SM-002',
    tax_bpjs_id: 'NPWP-37849302 / BPJS-15949361',
    full_name: 'Mutmainna Hamdi',
    gender: 'P',
    role_title: 'Sales & Marketing Staff',
    department: 'Sales & Marketing',
    employment_status: 'Full Time Performance Based',
    contract_duration: '12 Bulan (PKWT)',
    contract_start_date: offsetDateIso(-325),
    contract_end_date: offsetDateIso(40), // H-2 Bulan (40 hari lagi)
    benefits_package: 'BPJS Ketenagakerjaan, Closing Commission, Travel Allowance',
    assigned_project: 'Lead Prospecting, Proposal Pitching & Brand Activation',
    work_location: 'Makassar HQ',
    direct_supervisor: 'Business Development Manager',
    is_active: true,
    annual_leave_quota: 12,
    address_domicile: 'Jl. Rappocini Raya, Makassar',
    whatsapp_contact: '0823-4491-7762',
    email: 'mutmainna@skena.id',
    rate_budget: 'Rp 5.300.000 / Bulan + Komisi',
    notes: 'Mengajukan One Month Notice karena mengikuti penempatan suami ke Jakarta',
    collaborator_category: 'Karyawan Internal',
    resign_status: 'One Month Notice (Resign)',
    resign_notice_date: offsetDateIso(-16),
    resign_effective_date: offsetDateIso(14),
    resign_reason: 'Relokasi Domisili Keluarga ke Jakarta',
    handover_notes: 'Database leads Q4 dan kontak klien aktif diserahkan ke Noviar Mamala & Sri Mulyati Idris',
  },
  {
    id: 'e-17',
    employee_nik: 'SKN-SM-003',
    tax_bpjs_id: 'NPWP-28950413 / BPJS-16959472',
    full_name: 'Sri Mulyati Idris',
    gender: 'P',
    role_title: 'Sales & Marketing Admin',
    department: 'Sales & Marketing',
    employment_status: 'Full Time',
    contract_duration: '12 Bulan (PKWT)',
    contract_start_date: offsetDateIso(-190),
    contract_end_date: offsetDateIso(175),
    benefits_package: 'BPJS Kesehatan & Ketenagakerjaan, Tunjangan Administrasi CRM',
    assigned_project: 'CRM Management, Sales Contract Administration & Client Onboarding',
    work_location: 'Makassar HQ',
    direct_supervisor: 'Business Development Manager',
    is_active: true,
    annual_leave_quota: 12,
    address_domicile: 'Jl. Veteran Selatan, Makassar',
    whatsapp_contact: '0813-5590-1128',
    email: 'srimulyati@skena.id',
    rate_budget: 'Rp 5.100.000 / Bulan',
    notes: 'Admin Kontrak Klien, BAST & CRM Pipeline',
    collaborator_category: 'Karyawan Internal',
    resign_status: 'Aktif',
  },
  {
    id: 'e-18',
    employee_nik: 'SKN-CRE-011',
    tax_bpjs_id: 'NPWP-19061524 / BPJS-17969583',
    full_name: 'Feby Kurniya',
    gender: 'P',
    role_title: 'Senior Project Manager',
    department: 'Creative',
    employment_status: 'Full Time',
    contract_duration: '12 Bulan (PKWT)',
    contract_start_date: offsetDateIso(-312),
    contract_end_date: offsetDateIso(53), // H-2 Bulan (53 hari lagi)
    benefits_package: 'BPJS Kesehatan & Ketenagakerjaan, Senior PM Allowance, Project Retention Bonus',
    assigned_project: 'High-Impact Multi-Brand Production & Cross-Agency Agile Sprints',
    work_location: 'Makassar HQ',
    direct_supervisor: 'Creative Director',
    is_active: true,
    annual_leave_quota: 12,
    address_domicile: 'Jl. Pengayoman, Makassar',
    whatsapp_contact: '0811-4490-332',
    email: 'feby@skena.id',
    rate_budget: 'Rp 8.200.000 / Bulan',
    notes: 'Kontrak masuk H-2 bulan, diproyeksikan naik menjadi PKWTT',
    collaborator_category: 'Karyawan Internal',
    resign_status: 'Aktif',
  },
  // =========================================================================
  // DATABASE ARSIP & ORANG YANG PERNAH BEKERJA SAMA (MITRA / FREELANCE / ALUMNI / TALENT)
  // =========================================================================
  {
    id: 'e-arc-1',
    employee_nik: 'SKN-MITRA-001',
    tax_bpjs_id: 'NPWP-90128374',
    full_name: 'Reza Pratama Putra',
    gender: 'L',
    role_title: '3D Motion & VFX Artist',
    department: 'Creative',
    employment_status: 'Freelance',
    contract_duration: 'Project Based (Per Kampanye)',
    contract_start_date: '2026-02-01',
    contract_end_date: '2026-08-30',
    benefits_package: 'Project Fee Based + Royalty Render',
    assigned_project: '3D Billboard CGI Kampanye Otomotif & Mall Makassar',
    work_location: 'Remote (Bandung - Makassar)',
    direct_supervisor: 'Creative Director',
    is_active: false,
    annual_leave_quota: 0,
    deactivation_reason: 'Kontrak Project Selesai — Tersimpan di Database Mitra Aktif Siap Panggil',
    deactivation_date: '2026-08-30',
    address_domicile: 'Dago, Bandung / Panakkukang Makassar',
    whatsapp_contact: '0812-2091-8834',
    email: 'reza.vfx@gmail.com',
    rate_budget: 'Rp 4.500.000 - Rp 7.000.000 / Video CGI',
    notes: 'Spesialis Blender & Unreal Engine FOOH. Respon cepat, kualitas render sangat rapi.',
    collaborator_category: 'Freelancer / Mitra',
    resign_status: 'Resigned',
  },
  {
    id: 'e-arc-2',
    employee_nik: 'SKN-TALENT-002',
    tax_bpjs_id: 'NPWP-88273645',
    full_name: 'Nabila Maharani',
    gender: 'P',
    role_title: 'KOL / Host Live & Brand Ambassador',
    department: 'Sales & Marketing',
    employment_status: 'Freelance',
    contract_duration: 'Per Kampanye / Endorsement',
    contract_start_date: '2026-04-10',
    contract_end_date: '2026-09-15',
    benefits_package: 'Fee Per Konten & Komisi Affiliate',
    assigned_project: 'Kampanye Ramadhan Skincare, F&B Grand Opening & Host Podcast Skena',
    work_location: 'Makassar (Studio & On-Site)',
    direct_supervisor: 'Business Development Manager',
    is_active: false,
    annual_leave_quota: 0,
    deactivation_reason: 'Kolaborator Talent / KOL Eksternal (Arsip Mitra)',
    deactivation_date: '2026-09-15',
    address_domicile: 'Jl. CPI Tanjung Bunga, Makassar',
    whatsapp_contact: '0811-4100-992',
    email: 'nabila.kol@skenatalent.id',
    rate_budget: 'Rp 1.800.000 / Reels | Rp 3.500.000 / Paket Bundling Event',
    notes: 'Engagement rate Instagram & TikTok tinggi di audiens Makassar umur 18-30 tahun.',
    collaborator_category: 'KOL / Talent',
    resign_status: 'Resigned',
  },
  {
    id: 'e-arc-3',
    employee_nik: 'SKN-ALUMNI-003',
    tax_bpjs_id: 'NPWP-77364512 / BPJS-8819201',
    full_name: 'Kevin Wijaya Kusuma',
    gender: 'L',
    role_title: 'Senior Copywriter & Scriptwriter',
    department: 'Creative',
    employment_status: 'Full Time',
    contract_duration: '12 Bulan (2025 - 2026)',
    contract_start_date: '2025-05-01',
    contract_end_date: '2026-05-01',
    benefits_package: 'BPJS Kesehatan & Ketenagakerjaan',
    assigned_project: 'TVC Scriptwriting, Manifesto Brand & Kampanye Pemerintahan',
    work_location: 'Makassar HQ',
    direct_supervisor: 'Creative Director',
    is_active: false,
    annual_leave_quota: 12,
    deactivation_reason: 'Alumni Karyawan (Resign Baik-Baik — Lanjut Freelance Copywriter)',
    deactivation_date: '2026-05-01',
    address_domicile: 'Jl. Gunung Bawakaraeng, Makassar',
    whatsapp_contact: '0852-5510-7789',
    email: 'kevin.copy@gmail.com',
    rate_budget: 'Rp 1.500.000 / Deck Pitching atau Script TVC',
    notes: 'Alumni tim Creative Skena. Masih sering dipakai freelance saat high-season pitching tender.',
    collaborator_category: 'Alumni / Ex-Karyawan',
    resign_status: 'Resigned',
    resign_notice_date: '2026-04-01',
    resign_effective_date: '2026-05-01',
    resign_reason: 'Membangun Studio Penulisan Independen',
    handover_notes: 'Seluruh bank copywriting & deck manifesto sudah tersimpan di Google Drive Skena.',
  },
  {
    id: 'e-arc-4',
    employee_nik: 'SKN-VENDOR-004',
    tax_bpjs_id: 'NPWP-66192837',
    full_name: 'Dimas Prakoso (Lensa Timur Production)',
    gender: 'L',
    role_title: 'Drone Pilot FPV & Lighting Gaffer',
    department: 'Creative',
    employment_status: 'Freelance',
    contract_duration: 'On-Call Vendor Produksi',
    contract_start_date: '2026-01-15',
    contract_end_date: '2026-10-01',
    benefits_package: 'Sewa Alat & Jasa Operator Harian',
    assigned_project: 'Aerial Shoot Kawasan Industri, Company Profile & Event Outdoor',
    work_location: 'Makassar, Maros & Parepare',
    direct_supervisor: 'Creative Director',
    is_active: false,
    annual_leave_quota: 0,
    deactivation_reason: 'Vendor & Partner Produksi Lapangan (Arsip Kolaborator)',
    deactivation_date: '2026-10-01',
    address_domicile: 'Jl. Sultan Hasanuddin, Gowa / Makassar',
    whatsapp_contact: '0813-4277-6601',
    email: 'lensatimur.prod@gmail.com',
    rate_budget: 'Rp 2.500.000 / Shift Drone FPV + Lighting Package',
    notes: 'Memiliki lisensi pilot drone resmi & perlengkapan Aputure lengkap.',
    collaborator_category: 'Vendor',
    resign_status: 'Resigned',
  },
];

export const DEFAULT_USERS: AppUser[] = [
  // 2 Official Admins
  {
    id: 'u-admin-1',
    name: 'Uswatun Hasanah',
    email: 'uswatun@skena.id',
    username: 'uswatun',
    password: 'password123',
    role: 'admin',
    roleTitle: 'Managing Director',
    department: 'Managing Director',
    employeeId: 'e-1',
    employeeNik: 'SKN-DIR-001',
    employmentStatus: 'Full Time',
  },
  {
    id: 'u-admin-2',
    name: 'Agun Sesar',
    email: 'agun@skena.id',
    username: 'agun',
    password: 'password123',
    role: 'admin',
    roleTitle: 'Staff Human Capital',
    department: 'Operasional',
    employeeId: 'e-4',
    employeeNik: 'SKN-HC-001',
    employmentStatus: 'Full Time',
  },
  // All 18 Employee User Accounts
  {
    id: 'u-emp-1',
    name: 'Uswatun Hasanah',
    email: 'uswatun.emp@skena.id',
    username: 'uswatun.emp',
    password: 'password123',
    role: 'employee',
    employeeId: 'e-1',
    employeeNik: 'SKN-DIR-001',
    roleTitle: 'Managing Director',
    department: 'Managing Director',
    employmentStatus: 'Full Time',
  },
  {
    id: 'u-emp-2',
    name: 'Andi Muhammad Nurhaldi',
    email: 'nurhaldi@skena.id',
    username: 'nurhaldi',
    password: 'password123',
    role: 'employee',
    employeeId: 'e-2',
    employeeNik: 'SKN-OPS-001',
    roleTitle: 'Staff Finance',
    department: 'Operasional',
    employmentStatus: 'Full Time',
  },
  {
    id: 'u-emp-3',
    name: 'Nur Sukmayanti Tri Utami',
    email: 'sukmayanti@skena.id',
    username: 'sukmayanti',
    password: 'password123',
    role: 'employee',
    employeeId: 'e-3',
    employeeNik: 'SKN-OPS-002',
    roleTitle: 'General Affair',
    department: 'Operasional',
    employmentStatus: 'Full Time',
  },
  {
    id: 'u-emp-4',
    name: 'Agun Sesar',
    email: 'agun.emp@skena.id',
    username: 'agun.emp',
    password: 'password123',
    role: 'employee',
    employeeId: 'e-4',
    employeeNik: 'SKN-HC-001',
    roleTitle: 'Staff Human Capital',
    department: 'Operasional',
    employmentStatus: 'Full Time',
  },
  {
    id: 'u-emp-5',
    name: 'Gery Jimmiawan',
    email: 'gery.cd@skena.id',
    username: 'gery.cd',
    password: 'password123',
    role: 'employee',
    employeeId: 'e-5',
    employeeNik: 'SKN-CRE-001',
    roleTitle: 'Creative Director',
    department: 'Creative',
    employmentStatus: 'Full Time',
  },
  {
    id: 'u-emp-6',
    name: 'Ahmad Aufar',
    email: 'aufar@skena.id',
    username: 'aufar',
    password: 'password123',
    role: 'employee',
    employeeId: 'e-6',
    employeeNik: 'SKN-CRE-002',
    roleTitle: 'Art Director',
    department: 'Creative',
    employmentStatus: 'Full Time',
  },
  {
    id: 'u-emp-7',
    name: 'Mochammad Raihan',
    email: 'raihan@skena.id',
    username: 'raihan',
    password: 'password123',
    role: 'employee',
    employeeId: 'e-7',
    employeeNik: 'SKN-CRE-003',
    roleTitle: 'Graphic Designer',
    department: 'Creative',
    employmentStatus: 'Full Time Performance Based',
  },
  {
    id: 'u-emp-8',
    name: 'Fahmi Huwaidy',
    email: 'fahmi@skena.id',
    username: 'fahmi',
    password: 'password123',
    role: 'employee',
    employeeId: 'e-8',
    employeeNik: 'SKN-CRE-004',
    roleTitle: 'Project Manager',
    department: 'Creative',
    employmentStatus: 'Full Time',
  },
  {
    id: 'u-emp-9',
    name: 'Gery Jimmiawan (PM)',
    email: 'gery.pm@skena.id',
    username: 'gery.pm',
    password: 'password123',
    role: 'employee',
    employeeId: 'e-9',
    employeeNik: 'SKN-CRE-005',
    roleTitle: 'Project Manager',
    department: 'Creative',
    employmentStatus: 'Full Time Performance Based',
  },
  {
    id: 'u-emp-10',
    name: 'Wafiq Nurul Ayni',
    email: 'wafiq@skena.id',
    username: 'wafiq',
    password: 'password123',
    role: 'employee',
    employeeId: 'e-10',
    employeeNik: 'SKN-CRE-006',
    roleTitle: 'Social Media Specialist',
    department: 'Creative',
    employmentStatus: 'Full Time',
  },
  {
    id: 'u-emp-11',
    name: 'Azizah Putri Aulia',
    email: 'azizah@skena.id',
    username: 'azizah',
    password: 'password123',
    role: 'employee',
    employeeId: 'e-11',
    employeeNik: 'SKN-CRE-007',
    roleTitle: 'Social Media Specialist',
    department: 'Creative',
    employmentStatus: 'Full Time Performance Based',
  },
  {
    id: 'u-emp-12',
    name: 'Andi Dea Amalia',
    email: 'dea@skena.id',
    username: 'dea',
    password: 'password123',
    role: 'employee',
    employeeId: 'e-12',
    employeeNik: 'SKN-CRE-008',
    roleTitle: 'Social Media Specialist',
    department: 'Creative',
    employmentStatus: 'Probation',
  },
  {
    id: 'u-emp-13',
    name: 'Muh. Arfa',
    email: 'arfa@skena.id',
    username: 'arfa',
    password: 'password123',
    role: 'employee',
    employeeId: 'e-13',
    employeeNik: 'SKN-CRE-009',
    roleTitle: 'Videographer',
    department: 'Creative',
    employmentStatus: 'Full Time Performance Based',
  },
  {
    id: 'u-emp-14',
    name: 'Andi Muhammad Fajar Maulana Ramahdan',
    email: 'fajar@skena.id',
    username: 'fajar',
    password: 'password123',
    role: 'employee',
    employeeId: 'e-14',
    employeeNik: 'SKN-CRE-010',
    roleTitle: 'Video Editor',
    department: 'Creative',
    employmentStatus: 'Full Time Performance Based',
  },
  {
    id: 'u-emp-15',
    name: 'Noviar Mamala',
    email: 'noviar@skena.id',
    username: 'noviar',
    password: 'password123',
    role: 'employee',
    employeeId: 'e-15',
    employeeNik: 'SKN-SM-001',
    roleTitle: 'Business Development Manager',
    department: 'Sales & Marketing',
    employmentStatus: 'Full Time',
  },
  {
    id: 'u-emp-16',
    name: 'Mutmainna Hamdi',
    email: 'mutmainna@skena.id',
    username: 'mutmainna',
    password: 'password123',
    role: 'employee',
    employeeId: 'e-16',
    employeeNik: 'SKN-SM-002',
    roleTitle: 'Sales & Marketing Staff',
    department: 'Sales & Marketing',
    employmentStatus: 'Full Time Performance Based',
  },
  {
    id: 'u-emp-17',
    name: 'Sri Mulyati Idris',
    email: 'sri@skena.id',
    username: 'sri',
    password: 'password123',
    role: 'employee',
    employeeId: 'e-17',
    employeeNik: 'SKN-SM-003',
    roleTitle: 'Sales & Marketing Admin',
    department: 'Sales & Marketing',
    employmentStatus: 'Full Time',
  },
  {
    id: 'u-emp-18',
    name: 'Feby Kurniya',
    email: 'feby@skena.id',
    username: 'feby',
    password: 'password123',
    role: 'employee',
    employeeId: 'e-18',
    employeeNik: 'SKN-CRE-011',
    roleTitle: 'Senior Project Manager',
    department: 'Creative',
    employmentStatus: 'Full Time',
  },
];

export const DEFAULT_JOB_PROFILES: JobProfile[] = [
  {
    id: 'jp-1',
    role_title: 'Managing Director',
    department: 'Managing Director',
    summary: 'Pemimpin eksekutif tertinggi agensi yang bertanggung jawab atas visi strategis, pertumbuhan bisnis nasional, tata kelola korporat, dan profitabilitas agensi.',
    key_responsibilities: [
      'Menetapkan arah strategis jangka panjang, OKR tahunan agensi, dan ekspansi pasar',
      'Memimpin negosiasi kemitraan strategis korporat dan retensi brand skala besar',
      'Memastikan tata kelola finansial, kepatuhan hukum, dan integritas operasional agensi',
      'Membina jajaran direktur dan manajer divisi untuk mencapai keunggulan kerja agensi',
    ],
    technical_competencies: ['Strategic Agency Leadership', 'Financial & Cashflow Governance', 'B2B High-Stakes Negotiation', 'Brand Scalability'],
    behavioral_traits: ['Visioner', 'Tegas & Berintegritas', 'Ketahanan Tinggi (Resilient)', 'Inspiratif'],
    direct_supervisor: 'Board of Founders',
    reports_to: 'Board of Founders',
    requirements: ['Strategic Agency Leadership', 'Financial & Cashflow Governance', 'B2B High-Stakes Negotiation'],
    core_kpis: ['KPI-DIR-01: Visi Strategis Perusahaan & Manajemen Lintas Divisi'],
  },
  {
    id: 'jp-2',
    role_title: 'Creative Director',
    department: 'Creative',
    summary: 'Pemimpin kreatif agensi yang memegang otoritas atas standar estetika visual, konsep kampanye, kurasi mutu karya, dan kepemimpinan tim produksi.',
    key_responsibilities: [
      'Menetapkan artistic vision dan tone of voice visual untuk seluruh klien agensi',
      'Mengawasi sprint kreatif tim desain grafis, videografi, video editor, dan media sosial',
      'Melakukan kurasi dan persetujuan akhir (final sign-off) sebelum deliverable dipublikasi',
      'Membimbing tim produksi dalam eksplorasi tren visual modern dan generative AI tools',
    ],
    technical_competencies: ['Creative Direction', 'Art Direction', 'Campaign Conception', 'Agile Production Sprint', 'Brand Identity'],
    behavioral_traits: ['Standar Estetika Tinggi', 'Kritis & Konstruktif', 'Komunikatif', 'Inovatif'],
    direct_supervisor: 'Managing Director',
    reports_to: 'Managing Director',
    requirements: ['Creative Direction', 'Art Direction', 'Campaign Conception', 'Agile Production Sprint'],
    core_kpis: ['KPI-CRE-01: Kualitas Konten & Estetika Visual', 'KPI-CRE-04: Zero Major Revision'],
  },
  {
    id: 'jp-3',
    role_title: 'Art Director',
    department: 'Creative',
    summary: 'Memimpin eksekusi visual, pembuatan key visual komersial, moodboard, dan keselarasan grafis lintas platform.',
    key_responsibilities: [
      'Membuat Key Visual (KV), brand guidelines, dan sistem tipografi proyek klien',
      'Mengarahkan desainer grafis dalam mengeksekusi aset digital sesuai moodboard',
      'Memastikan akurasi warna, layout, dan hierarki visual pada setiap deliverable',
      'Kolaborasi dengan tim videografer untuk penataan komposisi frame dan lighting',
    ],
    technical_competencies: ['Graphic Design Systems', 'Adobe Photoshop & Illustrator', 'Figma', 'Typography & Color Theory'],
    behavioral_traits: ['Teliti', 'Eksploratif', 'Solutif', 'Kerja Sama Tim'],
    direct_supervisor: 'Creative Director',
    reports_to: 'Creative Director',
    requirements: ['Graphic Design Systems', 'Adobe Photoshop & Illustrator', 'Figma', 'Typography & Color Theory'],
    core_kpis: ['KPI-CRE-01: Kualitas Konten & Estetika Visual', 'KPI-CRE-02: On-Time Delivery Sprint'],
  },
  {
    id: 'jp-4',
    role_title: 'Senior Project Manager',
    department: 'Creative',
    summary: 'Mengelola siklus hidup proyek kreatif end-to-end dengan kepatuhan timeline yang ketat, mitigasi resiko revisi, dan relasi klien yang harmonis.',
    key_responsibilities: [
      'Menyusun timeline sprint, alokasi kapasitas tim, dan target milestone mingguan',
      'Menjadi penghubung utama antara brief klien dan kapasitas eksekusi tim internal',
      'Mengendalikan scope creep dan membatasi putaran revisi sesuai SLA kontrak',
      'Memimpin daily stand-up dan evaluasi sprint retrospective tim kreatif',
    ],
    technical_competencies: ['Agile Project Management', 'Client Stakeholder Management', 'Scope & Budget Control', 'Risk Mitigation'],
    behavioral_traits: ['Terorganisir Rapi', 'Tahan Tekanan', 'Diplomatis', 'Proaktif'],
    direct_supervisor: 'Creative Director',
    reports_to: 'Creative Director',
    requirements: ['Agile Project Management', 'Client Stakeholder Management', 'Scope & Budget Control'],
    core_kpis: ['KPI-CRE-04: Project Management Velocity', 'KPI-CRE-02: On-Time Delivery Content Sprint'],
  },
  {
    id: 'jp-5',
    role_title: 'Social Media Specialist',
    department: 'Creative',
    summary: 'Merancang strategi kalender konten media sosial, riset algoritma, penulisan hook viral, dan interaksi komunitas brand.',
    key_responsibilities: [
      'Menyusun monthly content calendar untuk Instagram, TikTok, dan platform digital klien',
      'Menulis hook tajam dan copywriting persuasif yang relevan dengan Gen-Z & profesional',
      'Menganalisis performa reach, impressions, dwell time, dan shareability konten',
      'Melakukan interaksi komunitas aktif pada jam tayang prime time audiens',
    ],
    technical_competencies: ['Viral Hook Writing', 'TikTok & IG Algorithm Analysis', 'Content Strategy', 'Community Management'],
    behavioral_traits: ['Peka Tren (Trend-Savvy)', 'Adaptif Cepat', 'Kreatif', 'Komunikatif'],
    direct_supervisor: 'Creative Director',
    reports_to: 'Creative Director',
    requirements: ['Viral Hook Writing', 'TikTok & IG Algorithm Analysis', 'Content Strategy'],
    core_kpis: ['KPI-CRE-03: Audience Reach, Virality & Engagement Rate'],
  },
  {
    id: 'jp-6',
    role_title: 'Videographer',
    department: 'Creative',
    summary: 'Mengeksekusi perekaman video komersial dengan penguasaan kamera cinema, teknik pencahayaan sinematik, gimbal stabilizer, dan audio jernih.',
    key_responsibilities: [
      'Mengoperasikan kamera cinema, lensa prime/zoom, dan rig stabilizer profesional',
      'Menata sistem pencahayaan 3-point lighting di studio maupun lokasi outdoor klien',
      'Memastikan perekaman visual dan audio minim noise teknis',
      'Melakukan perawatan preventif berkala atas inventaris kamera dan gear studio',
    ],
    technical_competencies: ['Cinematography', 'Commercial Lighting Setup', 'Gimbal Operation', 'Audio Capture & Studio Care'],
    behavioral_traits: ['Sigap di Lapangan', 'Fokus Tinggi', 'Disiplin Waktu', 'Kolaboratif'],
    direct_supervisor: 'Creative Director',
    reports_to: 'Creative Director',
    requirements: ['Cinematography', 'Commercial Lighting Setup', 'Gimbal Operation'],
    core_kpis: ['KPI-CRE-01: Kualitas Konten & Estetika Visual', 'KPI-CRE-02: On-Time Delivery'],
  },
  {
    id: 'jp-7',
    role_title: 'Video Editor',
    department: 'Creative',
    summary: 'Mengolah materi visual mentah menjadi video dinamis dengan tempo potong tajam, color grading sinematik, sound effect, dan motion graphics.',
    key_responsibilities: [
      'Melakukan trimming dan assembling footage ritmis mengikuti audio beat track',
      'Melakukan color grading dan color balancing sesuai standar visual identitas brand',
      'Menambahkan subtitle dinamis, lower-thirds, dan elemen motion graphics',
      'Merender video multi-format (9:16 untuk Reels/TikTok dan 16:9 untuk YouTube/Display)',
    ],
    technical_competencies: ['Adobe Premiere Pro', 'DaVinci Resolve Color', 'After Effects Motion', 'Sound Design & Fast Render'],
    behavioral_traits: ['Sabar & Teliti', 'Sense Ritme Kuat', 'Kecepatan Visual Tinggi'],
    direct_supervisor: 'Creative Director',
    reports_to: 'Creative Director',
    requirements: ['Adobe Premiere Pro', 'DaVinci Resolve Color', 'After Effects Motion'],
    core_kpis: ['KPI-CRE-02: Kuantitas & On-Time Delivery Sprint', 'KPI-CRE-01: Estetika Visual'],
  },
  {
    id: 'jp-8',
    role_title: 'Business Development Manager',
    department: 'Sales & Marketing',
    summary: 'Memimpin ekspansi omset agensi melalui akuisisi klien korporat baru, negosiasi retainer, dan penyusunan proposal komersial bernilai tinggi.',
    key_responsibilities: [
      'Menyusun strategi penetrasi pasar regional dan nasional untuk layanan agensi',
      'Menyusun proposal pitching kreatif dan memimpin presentasi penawaran ke brand klien',
      'Mencapai target omset kuartalan dan retensi klien retainer jangka panjang',
      'Mengelola CRM leads pipeline dari prospek awal hingga closing kontrak resmi',
    ],
    technical_competencies: ['B2B Solution Selling', 'Commercial Pitching', 'CRM Pipeline Management', 'Retainer Contract Structuring'],
    behavioral_traits: ['Persuasif', 'Target-Oriented', 'Membangun Relasi Luas', 'Percaya Diri'],
    direct_supervisor: 'Managing Director',
    reports_to: 'Managing Director',
    requirements: ['B2B Solution Selling', 'Commercial Pitching', 'CRM Pipeline Management'],
    core_kpis: ['KPI-SM-01: Target Omset Penjualan', 'KPI-SM-04: Client Retention Rate'],
  },
  {
    id: 'jp-9',
    role_title: 'Staff Finance',
    department: 'Operasional',
    summary: 'Mengelola tata kelola arus kas harian agensi, invoicing klien, kepatuhan pajak usaha, rekonsiliasi bank, dan laporan keuangan.',
    key_responsibilities: [
      'Menerbitkan invoice tepat waktu dan menindaklanjuti pembayaran piutang klien',
      'Mencatat arus kas masuk dan keluar agensi dengan tingkat akurasi 100%',
      'Mengelola administrasi perpajakan agensi (PPh 21, PPh 23, PPN)',
      'Menyusun rekonsiliasi bank dan laporan laba rugi bulanan untuk Managing Director',
    ],
    technical_competencies: ['Taxation & Accounting Standards', 'Financial Reconciliation', 'Cashflow Modeling', 'Spreadsheet Mastery'],
    behavioral_traits: ['Akurat', 'Pruden & Jujur', 'Disiplin Dokumen', 'Menjaga Kerahasiaan'],
    direct_supervisor: 'Managing Director',
    reports_to: 'Managing Director',
    requirements: ['Taxation & Accounting Standards', 'Financial Reconciliation', 'Cashflow Modeling'],
    core_kpis: ['KPI-OPS-02: Akurasi Laporan Keuangan, Kas & Budget Compliance'],
  },
  {
    id: 'jp-10',
    role_title: 'Staff Human Capital',
    department: 'Operasional',
    summary: 'Mengelola siklus SDM agensi dari data kontrak kerja, presensi harian, evaluasi kinerja KPI/WLA, hingga pengembangan kompetensi (IDP/LMS).',
    key_responsibilities: [
      'Mengelola master data karyawan, masa berlaku kontrak, dan paket benefit BPJS',
      'Memantau kepatuhan presensi harian serta sisa kuota cuti tahunan tim',
      'Memfasilitasi siklus evaluasi kinerja kuartalan, WLA, dan pemetaan 9-box talent',
      'Mengorganisir program kurikulum pelatihan internal (LMS) dan kesejahteraan karyawan',
    ],
    technical_competencies: ['HRIS Administration', 'Performance Appraisal Systems', 'Labor Law & Contract Compliance', 'Employee Relations'],
    behavioral_traits: ['Empatik & Adil', 'Objektif', 'Menjaga Privasi', 'Komunikatif'],
    direct_supervisor: 'Managing Director',
    reports_to: 'Managing Director',
    requirements: ['HRIS Administration', 'Performance Appraisal Systems', 'Labor Law Compliance'],
    core_kpis: ['KPI-OPS-04: Retensi SDM, Kepatuhan SOP & Layanan Human Capital'],
  },
];

export const DEFAULT_LMS_CURRICULUM: LmsCurriculum[] = [
  {
    id: 'lms-1',
    title: 'Visual Storytelling & Cross-Platform Art Direction',
    department: 'Creative',
    category: 'Creative & Production',
    duration_hours: 16,
    level: 'Advanced',
    description: 'Panduan komprehensif merancang visual identity kampanye 360 derajat, tone of voice estetika, dan standar kualitas agensi.',
    key_skills_learned: ['Art Direction', 'Key Visual Conception', 'Visual Hierarchy', 'Brand Bible Design'],
    learning_objectives: ['Art Direction', 'Key Visual Conception', 'Visual Hierarchy', 'Brand Bible Design'],
    target_roles: ['Creative Director', 'Art Director', 'Graphic Designer'],
    target_competency_codes: ['KPI-CRE-01', 'KPI-CRE-04'],
    status: 'Aktif',
  },
  {
    id: 'lms-2',
    title: 'DaVinci Resolve Color Grading & High-Velocity Video Editing',
    department: 'Creative',
    category: 'Creative & Production',
    duration_hours: 20,
    level: 'Intermediate',
    description: 'Workflow editing video reels berkecepatan tinggi, color science sinematik, nodes grading, dan sound design immersive.',
    key_skills_learned: ['Color Grading Nodes', 'LUT Creation', 'Audio Dynamic Leveling', 'Format Multi-Ratio Export'],
    learning_objectives: ['Color Grading Nodes', 'LUT Creation', 'Audio Dynamic Leveling', 'Format Multi-Ratio Export'],
    target_roles: ['Video Editor', 'Videographer'],
    target_competency_codes: ['KPI-CRE-01', 'KPI-CRE-02'],
    status: 'Aktif',
  },
  {
    id: 'lms-3',
    title: 'Short-Form Viral Hooks & TikTok Scriptwriting',
    department: 'Creative',
    category: 'Creative & Production',
    duration_hours: 12,
    level: 'Intermediate',
    description: 'Teknik meracik opening 3 detik pertama yang mematikan scroll, retensi tontonan tinggi, dan riset audio trending.',
    key_skills_learned: ['Viral Hook Formulas', 'Audience Dwell Time Optimization', 'Short Scriptwriting', 'Trend Hacking'],
    learning_objectives: ['Viral Hook Formulas', 'Audience Dwell Time Optimization', 'Short Scriptwriting', 'Trend Hacking'],
    target_roles: ['Social Media Specialist'],
    target_competency_codes: ['KPI-CRE-03'],
    status: 'Aktif',
  },
  {
    id: 'lms-4',
    title: 'Agile Creative Sprint & Revision SLA Control',
    department: 'Creative',
    category: 'Leadership & Operations',
    duration_hours: 14,
    level: 'Advanced',
    description: 'Framework Scrum & Kanban untuk tim kreatif agensi: mengontrol kapasitas produksi, membatasi revisi liar, dan komunikasi klien.',
    key_skills_learned: ['Sprint Capacity Planning', 'SLA Revision Agreements', 'Standup Moderation', 'Client Boundary Management'],
    learning_objectives: ['Sprint Capacity Planning', 'SLA Revision Agreements', 'Standup Moderation', 'Client Boundary Management'],
    target_roles: ['Senior Project Manager', 'Project Manager', 'Creative Director'],
    target_competency_codes: ['KPI-CRE-02', 'KPI-CRE-04'],
    status: 'Aktif',
  },
  {
    id: 'lms-5',
    title: 'Enterprise B2B Retainer Sales & Value-Based Pricing',
    department: 'Sales & Marketing',
    category: 'Sales & Marketing',
    duration_hours: 18,
    level: 'Advanced',
    description: 'Strategi closing kontrak retainer multi-bulan untuk korporat, value pricing non-komoditas, dan pitching dewan direksi.',
    key_skills_learned: ['Value-Based Proposal', 'Objection Handling', 'Contract Retainer Structuring', 'Executive Pitching'],
    learning_objectives: ['Value-Based Proposal', 'Objection Handling', 'Contract Retainer Structuring', 'Executive Pitching'],
    target_roles: ['Business Development Manager', 'Sales & Marketing Staff'],
    target_competency_codes: ['KPI-SM-01', 'KPI-SM-02', 'KPI-SM-04'],
    status: 'Aktif',
  },
  {
    id: 'lms-6',
    title: 'Modern Creative Studio Logistics & GA Preventif',
    department: 'Operasional',
    category: 'Leadership & Operations',
    duration_hours: 10,
    level: 'Beginner',
    description: 'Standarisasi pemeliharaan fasilitas studio, checklist kelayakan kamera dan lighting, serta efisiensi pengadaan kantor.',
    key_skills_learned: ['Facility Audit', 'Preventive Maintenance', 'Asset Tagging & Depreciation', 'Vendor Sourcing'],
    learning_objectives: ['Facility Audit', 'Preventive Maintenance', 'Asset Tagging & Depreciation', 'Vendor Sourcing'],
    target_roles: ['General Affair'],
    target_competency_codes: ['KPI-OPS-01', 'KPI-OPS-03'],
    status: 'Aktif',
  },
  {
    id: 'lms-7',
    title: 'Tax Compliance, Cashflow & Client Invoicing Governance',
    department: 'Operasional',
    category: 'Leadership & Operations',
    duration_hours: 16,
    level: 'Intermediate',
    description: 'Tata kelola perpajakan agensi periklanan digital, mitigasi piutang macet, dan rekonsiliasi arus kas harian.',
    key_skills_learned: ['PPh 23 & PPN Agensi', 'Aging Receivables Control', 'Cashflow Forecasting', 'Audit Trail'],
    learning_objectives: ['PPh 23 & PPN Agensi', 'Aging Receivables Control', 'Cashflow Forecasting', 'Audit Trail'],
    target_roles: ['Staff Finance'],
    target_competency_codes: ['KPI-OPS-02'],
    status: 'Aktif',
  },
  {
    id: 'lms-8',
    title: 'Talent Management & 9-Box Performance Appraisal',
    department: 'Operasional',
    category: 'Soft Skills & Agility',
    duration_hours: 14,
    level: 'Intermediate',
    description: 'Sistematika penilaian kinerja objektif, pemetaan 9-box talent matrix, dan penyusunan Individual Development Plan (IDP).',
    key_skills_learned: ['9-Box Matrix Calibration', 'Objective KPI Setting', 'IDP Mentoring Blueprint', 'Constructive Feedback Delivery'],
    learning_objectives: ['9-Box Matrix Calibration', 'Objective KPI Setting', 'IDP Mentoring Blueprint', 'Constructive Feedback Delivery'],
    target_roles: ['Staff Human Capital', 'Managing Director'],
    target_competency_codes: ['KPI-OPS-04', 'KPI-DIR-01'],
    status: 'Aktif',
  },
];

const todayIso = new Date().toISOString().split('T')[0];

export const DEFAULT_SCHEDULES: WorkSchedule[] = [
  {
    id: 's-1',
    day_of_week: 'Senin',
    start_time: '09:00:00',
    end_time: '12:00:00',
    shift_code: 'Morning Sprint & Editorial Alignment',
    competency_id: 'c-cre-2',
    location_agenda_notes: 'Ruang Rapat Utama HQ - Review OKR, Storyboard & Sprint Planning',
    competencies: DEFAULT_COMPETENCIES[1],
    schedule_date: todayIso,
    employee_name: 'Seluruh Tim Skena',
    created_by_role: 'admin',
    status: 'Confirmed',
  },
  {
    id: 's-2',
    day_of_week: 'Selasa',
    start_time: '10:00:00',
    end_time: '12:30:00',
    shift_code: 'B2B Pipeline & Sales Deal Review',
    competency_id: 'c-sm-1',
    location_agenda_notes: 'Meeting Room Skena - Evaluasi Funnel Leads & Target Revenue',
    competencies: DEFAULT_COMPETENCIES[4],
    schedule_date: todayIso,
    employee_name: 'Tim Sales & Marketing',
    created_by_role: 'admin',
    status: 'Confirmed',
  },
  {
    id: 's-3',
    day_of_week: 'Rabu',
    start_time: '13:00:00',
    end_time: '17:00:00',
    shift_code: 'Commercial Shoot & Live Production',
    competency_id: 'c-cre-1',
    location_agenda_notes: 'Studio Produksi Skena & On-Site Location Makassar',
    competencies: DEFAULT_COMPETENCIES[0],
    schedule_date: todayIso,
    employee_name: 'Tim Creative & Produksi',
    created_by_role: 'admin',
    status: 'Confirmed',
  },
  {
    id: 's-4',
    day_of_week: 'Kamis',
    start_time: '14:00:00',
    end_time: '16:00:00',
    shift_code: 'Operations, Finance & HC Alignment',
    competency_id: 'c-ops-1',
    location_agenda_notes: 'Operational Desk HQ - Evaluasi SLA, Fasilitas & Cashflow',
    competencies: DEFAULT_COMPETENCIES[8],
    schedule_date: todayIso,
    employee_name: 'Tim Operasional',
    created_by_role: 'admin',
    status: 'Confirmed',
  },
  {
    id: 's-5',
    day_of_week: 'Jumat',
    start_time: '15:00:00',
    end_time: '17:30:00',
    shift_code: 'LMS Creative Upskilling & QA Retrospective',
    competency_id: 'c-cre-4',
    location_agenda_notes: 'Auditorium Skena - Sharing Session, IDP & Evaluasi Sprint',
    competencies: DEFAULT_COMPETENCIES[3],
    schedule_date: todayIso,
    employee_name: 'Seluruh Tim Skena',
    created_by_role: 'admin',
    status: 'Confirmed',
  },
];

export const DEFAULT_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'log-1',
    log_date: todayIso,
    schedule_id: 's-1',
    competency_id: 'c-cre-2',
    sprint_session_info: 'Morning Sprint (09:00 - 12:00)',
    project_deliverable_topic: 'Brand Launch Campaign - Delivery Batch 1 (Creative & Social Media)',
    execution_details: 'Penyusunan timeline 18 aset video TikTok & Reels, penentuan moodboard serta breakdown tugas antar Project Manager.',
    blocker_evaluator_notes: 'Semua brief dari klien lengkap; shooting dijadwalkan besok siang di studio.',
    total_active_team: 18,
    total_on_leave: 0,
    competencies: DEFAULT_COMPETENCIES[1],
  },
  {
    id: 'log-2',
    log_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    schedule_id: 's-2',
    competency_id: 'c-sm-1',
    sprint_session_info: 'Sales & Marketing Review (10:00 - 12:30)',
    project_deliverable_topic: 'B2B Client Pitching & Retainer Contract Finalization',
    execution_details: 'Presentasi proposal kampanye ke 2 brand korporat regional dan review closing deal kuartal ini.',
    blocker_evaluator_notes: 'Follow-up draft kontrak legal memerlukan review finance.',
    total_active_team: 17,
    total_on_leave: 1,
    competencies: DEFAULT_COMPETENCIES[4],
  },
];

export const DEFAULT_KPI_EVALUATIONS: KpiEvaluation[] = [
  {
    id: 'kpi-1',
    employee_id: 'e-1',
    competency_id: 'c-dir-1',
    period_year: '2026',
    period_term: 'Semester 2 (Jul - Des)',
    kpi_q1: 92,
    kpi_q2: 94,
    kpi_q3: 95,
    kpi_q4: 95,
    mid_review_score: 95,
    final_project_score: 96,
    final_kpi_score: 94.7,
    current_skill_level: 5,
    workload_percentage: 100,
    performance_narrative:
      'Kepemimpinan eksekutif sangat kokoh, pertumbuhan agensi melampaui target tahunan dan sinergi 3 divisi sangat solid.',
  },
  {
    id: 'kpi-2',
    employee_id: 'e-4',
    competency_id: 'c-ops-4',
    period_year: '2026',
    period_term: 'Semester 2 (Jul - Des)',
    kpi_q1: 88,
    kpi_q2: 90,
    kpi_q3: 89,
    kpi_q4: 91,
    mid_review_score: 90,
    final_project_score: 92,
    final_kpi_score: 90.15,
    current_skill_level: 4,
    workload_percentage: 92,
    performance_narrative:
      'Manajemen data karyawan dan pemantauan presensi harian terkelola dengan sangat rapi dan tertib.',
  },
  {
    id: 'kpi-3',
    employee_id: 'e-5',
    competency_id: 'c-cre-1',
    period_year: '2026',
    period_term: 'Semester 2 (Jul - Des)',
    kpi_q1: 90,
    kpi_q2: 92,
    kpi_q3: 94,
    kpi_q4: 93,
    mid_review_score: 92,
    final_project_score: 95,
    final_kpi_score: 92.85,
    current_skill_level: 5,
    workload_percentage: 98,
    performance_narrative:
      'Visi artistik dan standar estetika visual agensi terjaga di level tertinggi pada semua output proyek klien.',
  },
  {
    id: 'kpi-4',
    employee_id: 'e-15',
    competency_id: 'c-sm-1',
    period_year: '2026',
    period_term: 'Semester 2 (Jul - Des)',
    kpi_q1: 85,
    kpi_q2: 88,
    kpi_q3: 90,
    kpi_q4: 89,
    mid_review_score: 88,
    final_project_score: 91,
    final_kpi_score: 88.6,
    current_skill_level: 4,
    workload_percentage: 95,
    performance_narrative:
      'Pencapaian target revenue B2B sangat memuaskan, hubungan baik dengan klien korporat terjalin harmonis.',
  },
  {
    id: 'kpi-5',
    employee_id: 'e-14',
    competency_id: 'c-cre-2',
    period_year: '2026',
    period_term: 'Semester 2 (Jul - Des)',
    kpi_q1: 84,
    kpi_q2: 86,
    kpi_q3: 88,
    kpi_q4: 90,
    mid_review_score: 87,
    final_project_score: 89,
    final_kpi_score: 87.4,
    current_skill_level: 4,
    workload_percentage: 104,
    performance_narrative:
      'Kecepatan rendering video reels luar biasa cepat dengan kualitas grading warna yang tajam dan dinamis.',
  },
];

const isNonCheckInStatus = (st: AttendanceStatus): boolean =>
  st === 'Cuti' || st === 'Izin' || st === 'Sakit' || st === 'Tidak Absen' || st === 'Urusan Pribadi';

const generateInitialAttendances = (): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  // Variasi jam masuk (Standar 09:00 WITA, Toleransi Maksimal 15 Menit s/d 09:15 WITA):
  // <= 09:00 (Tepat Waktu), 09:01 - 09:15 (Dalam Toleransi 15 Menit), > 09:15 (Terlambat)
  const times = [
    '08:38:00',
    '08:45:00',
    '08:52:00',
    '08:58:00',
    '09:00:00',
    '09:06:00', // Dalam toleransi 15 menit (+6 mnt)
    '09:12:00', // Dalam toleransi 15 menit (+12 mnt)
    '09:15:00', // Batas akhir toleransi 15 menit (+15 mnt)
    '09:24:00', // Terlambat (+24 mnt dari 09:00 / +9 mnt lewat toleransi)
    '09:38:00', // Terlambat (+38 mnt dari 09:00 / +23 mnt lewat toleransi)
    '08:49:00',
    '08:55:00',
  ];
  const activeEmps = DEFAULT_EMPLOYEES.filter((e) => e.is_active);
  // Generate 42 hari ke belakang (mencakup bulan berjalan dan bulan sebelumnya untuk perbandingan antar bulan)
  for (let d = 0; d < 42; d++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - d);
    if (targetDate.getDay() === 0) continue; // skip Sunday
    const dateStr = targetDate.toISOString().split('T')[0];

    activeEmps.forEach((emp, idx) => {
      let status: AttendanceStatus = 'WFO';
      let tag = emp.work_location || 'Makassar HQ';
      const checkTime = times[(idx + d) % times.length];
      let checkOutTime = '17:30:00';
      let notes = 'Hadir kerja di kantor (WFO) — Sprint Harian';

      if (checkTime > '09:15:00') {
        notes = 'Hadir WFO (Terlambat melewati batas toleransi 09:15 — Kendala lalu lintas pagi)';
      } else if (checkTime > '09:00:00') {
        notes = 'Hadir WFO (Masuk dalam batas toleransi 15 menit 09:00-09:15)';
      }

      if ((idx === 7 && d % 5 === 0) || (idx === 10 && d % 6 === 1)) {
        status = 'WFH';
        tag = 'Remote Home Office (WFH/WFA)';
        notes = 'Keterangan WFH/WFA: Pengerjaan desain visual deck & revisi aset kampanye dari rumah';
      } else if (idx === 12 && d % 4 === 0) {
        status = 'Take Content';
        tag = 'Studio Produksi Skena';
        notes = 'Produksi shooting video commercial reels & lighting setup di studio';
      } else if (idx === 14 && d % 5 === 2) {
        status = 'Urusan Kantor';
        tag = 'Client Visit Makassar';
        notes = 'Urusan Kantor: Pitching deck klien korporat & survey lokasi event';
      } else if ((idx === 5 || idx === 13) && d % 7 === 3) {
        status = 'Overtime';
        tag = 'Makassar HQ (Lembur Produksi)';
        checkOutTime = '21:15:00';
        notes = 'Overtime: Finalisasi render kampanye utama & master key visual sebelum deadline klien';
      } else if (idx === 4 && d % 11 === 1) {
        status = 'Izin';
        tag = 'Izin Karyawan';
        notes = 'Keterangan Izin: Mengurus administrasi dokumen kependudukan & keluarga (Disetujui HR)';
      } else if (idx === 11 && d % 13 === 3) {
        status = 'Sakit';
        tag = 'Istirahat Medis';
        notes = 'Keterangan Sakit: Istirahat pemulihan kesehatan (Surat keterangan dokter terlampir)';
      } else if (idx === 2 && d % 14 === 5) {
        status = 'Cuti';
        tag = 'Cuti Resmi';
        notes = 'Keterangan Cuti: Cuti tahunan keperluan keluarga';
      } else if (idx === 6 && d % 15 === 4) {
        status = 'Urusan Pribadi';
        tag = 'Izin Urusan Pribadi';
        notes = 'Urusan Pribadi: Keperluan keluarga mendadak dengan konfirmasi ke atasan langsung';
      } else if (idx === 15 && d === 6) {
        status = 'Tidak Absen';
        tag = 'Belum Check-In';
        notes = 'Tidak Absen: Lupa melakukan presensi pagi saat langsung menuju lokasi klien';
      }

      const isLeaveType = isNonCheckInStatus(status);

      records.push({
        id: `att-seed-${dateStr}-${emp.id}`,
        employee_id: emp.id,
        attendance_date: dateStr,
        check_in_time: isLeaveType ? '-' : checkTime,
        check_out_time: isLeaveType ? '-' : checkOutTime,
        status,
        work_location_tag: tag,
        notes,
      });
    });
  }
  return records;
};

export const DEFAULT_KPI_WEIGHTS: KpiWeightConfig = {
  sprint_weight_pct: 50,
  skill_weight_pct: 30,
  project_weight_pct: 20,
};

export const DEFAULT_SHARING_SESSIONS: SharingSessionItem[] = [
  {
    id: 'ss-senin-1',
    program_type: 'Senin Di Skena',
    session_date: offsetDateIso(-7),
    day_label: 'Senin Pagi (09:15 - 10:15 WITA)',
    speaker_employee_id: 'e-5',
    speaker_name: 'Gery Jimmiawan',
    speaker_department: 'Creative',
    topic_title: 'Creative Storytelling & High-Retention Hook di 3 Detik Pertama Reels',
    material_summary:
      'Bedah struktur visual hook, pacing audio, dan psikologi audiens Makassar untuk meningkatkan watch time kampanye klien.',
    remarks: 'Seluruh tim Creative & Social Media hadir lengkap, deck materi telah dibagikan di grup.',
    status: 'Selesai',
  },
  {
    id: 'ss-senin-2',
    program_type: 'Senin Di Skena',
    session_date: offsetDateIso(0),
    day_label: 'Senin Pagi (09:15 - 10:15 WITA)',
    speaker_employee_id: 'e-6',
    speaker_name: 'Ahmad Aufar',
    speaker_department: 'Creative',
    topic_title: 'Design System, Typography Hierarchy & Konsistensi Brand Guideline 2026',
    material_summary:
      'Standarisasi grid desain Skena, pemilihan palet kontras tinggi, dan cara mempercepat waktu pengerjaan desain harian hingga 35%.',
    remarks: 'Wajib membawa laptop untuk sesi praktik langsung template Figma.',
    status: 'Terjadwal',
  },
  {
    id: 'ss-senin-3',
    program_type: 'Senin Di Skena',
    session_date: offsetDateIso(7),
    day_label: 'Senin Pagi (09:15 - 10:15 WITA)',
    speaker_employee_id: 'e-15',
    speaker_name: 'Noviar Mamala',
    speaker_department: 'Sales & Marketing',
    topic_title: 'Consultative Selling & Cara Membaca Kebutuhan Klien Korporat B2B',
    material_summary:
      'Teknik menyusun proposal pitching yang langsung menjawab pain-point omset klien serta strategi negosiasi nilai kontrak retainer.',
    remarks: 'Persiapan deck studi kasus klien F&B dan Properti.',
    status: 'Terjadwal',
  },
  {
    id: 'ss-jumat-1',
    program_type: 'Bincang Kenyang',
    session_date: offsetDateIso(-3),
    day_label: 'Jumat Siang (12:30 - 14:00 WITA)',
    speaker_employee_id: 'e-4',
    speaker_name: 'Agun Sesar',
    speaker_department: 'Operasional',
    topic_title: 'Work-Life Balance, Manajemen Energi Sprint & Apresiasi Tim Bulanan',
    material_summary:
      'Sesi makan siang bersama seluruh tim sambil diskusi santai evaluasi budaya kerja, komunikasi lintas divisi, dan kesehatan mental.',
    remarks: 'Menu Konsumsi: Coto Makassar & Es Pisang Ijo (PIC: General Affair Nur Sukmayanti).',
    status: 'Selesai',
  },
  {
    id: 'ss-jumat-2',
    program_type: 'Bincang Kenyang',
    session_date: offsetDateIso(4),
    day_label: 'Jumat Siang (12:30 - 14:00 WITA)',
    speaker_employee_id: 'e-18',
    speaker_name: 'Feby Kurniya',
    speaker_department: 'Creative',
    topic_title: 'Behind The Scene: Bedah Sukses Produksi Multi-Brand Tanpa Revisi Mayor',
    material_summary:
      'Sharing santai sambil makan siang hari Jumat mengenai tips manajemen ekspektasi klien dan koordinasi lapangan antara PM, Videographer, dan Editor.',
    remarks: 'Menu Konsumsi: Ayam Bakar Rica & Kopi Susu Literan Studio.',
    status: 'Terjadwal',
  },
  {
    id: 'ss-jumat-3',
    program_type: 'Bincang Kenyang',
    session_date: offsetDateIso(11),
    day_label: 'Jumat Siang (12:30 - 14:00 WITA)',
    speaker_employee_id: 'e-10',
    speaker_name: 'Wafiq Nurul Ayni',
    speaker_department: 'Creative',
    topic_title: 'Tren Algoritma TikTok & Instagram Kuartal Depan + Brainstorming Ide Konten',
    material_summary:
      'Diskusi santai bedah akun viral lokal & nasional sambil makan siang bersama setiap hari Jumat.',
    remarks: 'Menu Konsumsi: Nasi Kuning Riburane & Snack Box.',
    status: 'Terjadwal',
  },
];

export const DEFAULT_ONE_YEAR_PLANS: OneYearPlanItem[] = [
  {
    id: 'oyp-1',
    quarter: 'Q1',
    target_month: 'Januari - Maret 2026',
    department: 'Managing Director',
    objective_title: 'Standarisasi SOP Agensi, Struktur Organisasi & Implementasi HRIS Terpadu',
    key_result_kpi: '100% Karyawan memiliki Job Profile, KPI jelas, dan sistem presensi terintegrasi',
    pic_name: 'Uswatun Hasanah & Agun Sesar',
    budget_estimate: 'Rp 18.000.000',
    progress_pct: 100,
    is_completed: true,
    notes: 'Telah selesai dan berjalan efektif di seluruh divisi PT Skena Wahana Kreatif.',
  },
  {
    id: 'oyp-2',
    quarter: 'Q1',
    target_month: 'Februari - Maret 2026',
    department: 'Creative',
    objective_title: 'Upgrade Studio Utama Makassar & Standarisasi Gear Produksi Sinematik',
    key_result_kpi: 'Kapasitas produksi video naik 40% dengan zero bottleneck alat shooting',
    pic_name: 'Gery Jimmiawan & Muh. Arfa',
    budget_estimate: 'Rp 45.000.000',
    progress_pct: 100,
    is_completed: true,
    notes: 'Pengadaan lighting Aputure, audio wireless & workstation editing selesai.',
  },
  {
    id: 'oyp-3',
    quarter: 'Q2',
    target_month: 'April - Juni 2026',
    department: 'Sales & Marketing',
    objective_title: 'Akuisisi 8 Klien Retainer Korporat Tier-1 di Sulawesi Selatan',
    key_result_kpi: 'Pertumbuhan pendapatan berulang (Monthly Recurring Revenue) minimal 35%',
    pic_name: 'Noviar Mamala & Mutmainna Hamdi',
    budget_estimate: 'Rp 25.000.000',
    progress_pct: 85,
    is_completed: false,
    notes: '7 dari 8 klien retainer telah menandatangani kontrak tahunan; 1 klien tahap finalisasi MoU.',
  },
  {
    id: 'oyp-4',
    quarter: 'Q3',
    target_month: 'Juli - September 2026',
    department: 'Operasional',
    objective_title: 'Program CSR Bulanan Skena Berbagi & Kampanye Dampak Sosial Komunitas Kreatif',
    key_result_kpi: '12 aksi CSR terlaksana rutin setiap bulan + publikasi dampak sosial positif',
    pic_name: 'Nur Sukmayanti Tri Utami & Agun Sesar',
    budget_estimate: 'Rp 30.000.000',
    progress_pct: 75,
    is_completed: false,
    notes: 'Berjalan rutin setiap akhir bulan bersama panti asuhan & komunitas UMKM lokal Makassar.',
  },
  {
    id: 'oyp-5',
    quarter: 'Q4',
    target_month: 'Oktober - Desember 2026',
    department: 'Creative',
    objective_title: 'Peluncuran Layanan Baru: 3D FOOH CGI Campaign & Full-Funnel Performance Ads',
    key_result_kpi: 'Minimal 5 project flagship 3D CGI & peningkatan skor rata-rata KPI tim Creative > 86',
    pic_name: 'Gery Jimmiawan, Ahmad Aufar & Feby Kurniya',
    budget_estimate: 'Rp 35.000.000',
    progress_pct: 60,
    is_completed: false,
    notes: 'Kurikulum LMS & kolaborasi mitra 3D artist sedang berjalan aktif.',
  },
  {
    id: 'oyp-6',
    quarter: 'Tahunan',
    target_month: 'Desember 2026',
    department: 'Operasional',
    objective_title: 'Evaluasi Kontrak Tahunan (H-2 Bulan), Retensi Top Talent & Townhall Awarding 2026',
    key_result_kpi: 'Retensi karyawan kunci > 90%, transisi handover mulus, dan penyusunan RKAP 2027',
    pic_name: 'Uswatun Hasanah, Agun Sesar & Andi Muhammad Nurhaldi',
    budget_estimate: 'Rp 40.000.000',
    progress_pct: 45,
    is_completed: false,
    notes: 'Review kontrak H-2 bulan sedang berlangsung untuk 6 karyawan.',
  },
];

export const DEFAULT_EXECUTIVE_REMINDERS: ExecutiveReminderItem[] = [
  {
    id: 'rem-wed-budget',
    category: 'Pengajuan Budget Rabu',
    title: 'Pengajuan & Approval Budget Operasional / Produksi Mingguan (Setiap Hari Rabu)',
    schedule_info: 'Rutin Setiap Hari Rabu (Batas Cut-Off Pukul 14:00 WITA)',
    recurrence_label: 'Rutin Setiap Hari Rabu (Batas Cut-Off Pukul 14:00 WITA)',
    due_date: offsetDateIso(2),
    pic_name: 'Andi Muhammad Nurhaldi (Finance) & Para Lead Divisi',
    assigned_to: 'Andi Muhammad Nurhaldi (Finance) & Para Lead Divisi',
    priority: 'Urgent',
    is_completed: false,
    notes: 'Rekap RAB produksi shooting, iklan berbayar, konsumsi Jumat Bincang Kenyang, dan reimburse operasional.',
  },
  {
    id: 'rem-payroll',
    category: 'Waktu Penggajian (Payroll)',
    title: 'Proses Rekonsiliasi Presensi, KPI Incentive & Pencairan Gaji Bulanan (Payroll)',
    schedule_info: 'Rutin Setiap Tanggal 25 - 28 Setiap Bulan',
    recurrence_label: 'Rutin Setiap Tanggal 25 - 28 Setiap Bulan',
    due_date: offsetDateIso(8),
    pic_name: 'Andi Muhammad Nurhaldi (Finance) & Agun Sesar (HC)',
    assigned_to: 'Andi Muhammad Nurhaldi (Finance) & Agun Sesar (HC)',
    priority: 'High',
    is_completed: false,
    notes: 'Pastikan potongan/toleransi keterlambatan 15 menit, lembur (overtime), dan komisi sales sudah diverifikasi.',
  },
  {
    id: 'rem-csr-monthly',
    category: 'Jadwal CSR Bulanan',
    title: 'Jadwal Kegiatan CSR Bulanan "Skena Berdampak" & Dokumentasi Sosial',
    schedule_info: 'Rutin Minggu Ke-4 Setiap Bulan',
    recurrence_label: 'Rutin Minggu Ke-4 Setiap Bulan',
    due_date: offsetDateIso(10),
    pic_name: 'Nur Sukmayanti Tri Utami (GA) & Tim Creative',
    assigned_to: 'Nur Sukmayanti Tri Utami (GA) & Tim Creative',
    priority: 'High',
    is_completed: false,
    notes: 'Penyaluran donasi bulanan, kelas edukasi kreatif gratis untuk UMKM/pelajar Makassar, dan liputan dokumentasi.',
  },
  {
    id: 'rem-contract-h2',
    category: 'Kontrak Karyawan',
    title: 'Evaluasi Perpanjangan Kontrak Karyawan Masuk H-2 Bulan (≤ 60 Hari)',
    schedule_info: 'Alert Otomatis H-2 Bulan Sebelum Tanggal Berakhir Kontrak',
    recurrence_label: 'Alert Otomatis H-2 Bulan Sebelum Tanggal Berakhir Kontrak',
    due_date: offsetDateIso(14),
    pic_name: 'Agun Sesar (HC) & Uswatun Hasanah (MD)',
    assigned_to: 'Agun Sesar (HC) & Uswatun Hasanah (MD)',
    priority: 'Urgent',
    is_completed: false,
    notes: 'Review kinerja & keputusan perpanjangan PKWT untuk Andi Dea Amalia, Muh. Arfa, Mochammad Raihan, Mutmainna Hamdi, Ahmad Aufar, Andi Muhammad Nurhaldi, Feby Kurniya, dan Wafiq Nurul Ayni.',
  },
  {
    id: 'rem-resign-notice',
    category: 'Resign & Handover',
    title: 'Monitoring Handover & Exit Clearance Karyawan One Month Notice',
    schedule_info: 'Countdown Sisa Waktu Kerja Sebelum Tanggal Efektif Resign',
    recurrence_label: 'Countdown Sisa Waktu Kerja Sebelum Tanggal Efektif Resign',
    due_date: offsetDateIso(12),
    pic_name: 'Agun Sesar (HC), Ahmad Aufar & Noviar Mamala',
    assigned_to: 'Agun Sesar (HC), Ahmad Aufar & Noviar Mamala',
    priority: 'Urgent',
    is_completed: false,
    notes: 'Pastikan serah terima file desain Mochammad Raihan (sisa 21 hari) dan pipeline klien Mutmainna Hamdi (sisa 14 hari) tuntas 100%.',
  },
];

// In-Memory store + Session Override Cache so user edits are NEVER lost
let localSettings: CompanySettings = { ...DEFAULT_COMPANY_SETTINGS };
let settingsEditedInSession = false;
let localEmployees: Employee[] = DEFAULT_EMPLOYEES.map((e) => ({ ...e, annual_leave_quota: e.annual_leave_quota ?? 12 }));
const editedEmployeesMap = new Map<string, Employee>();
const deletedEmployeeIds = new Set<string>();

let localCompetencies: Competency[] = [...DEFAULT_COMPETENCIES];
const editedCompetenciesMap = new Map<string, Competency>();
const deletedCompetencyIds = new Set<string>();

let localSchedules: WorkSchedule[] = [...DEFAULT_SCHEDULES];
const editedSchedulesMap = new Map<string, WorkSchedule>();
const deletedScheduleIds = new Set<string>();

let localActivityLogs: ActivityLog[] = [...DEFAULT_ACTIVITY_LOGS];
const editedLogsMap = new Map<string, ActivityLog>();
const deletedLogIds = new Set<string>();

let localAttendances: AttendanceRecord[] = generateInitialAttendances();
const editedAttendancesMap = new Map<string, AttendanceRecord>();
const deletedAttendanceKeys = new Set<string>();

let localKpiList: KpiEvaluation[] = [...DEFAULT_KPI_EVALUATIONS];
const editedKpiMap = new Map<string, KpiEvaluation>();
const deletedKpiKeys = new Set<string>();

let localKpiWeights: KpiWeightConfig = { ...DEFAULT_KPI_WEIGHTS };
let localSharingSessions: SharingSessionItem[] = [...DEFAULT_SHARING_SESSIONS];
let localOneYearPlans: OneYearPlanItem[] = [...DEFAULT_ONE_YEAR_PLANS];
let localExecutiveReminders: ExecutiveReminderItem[] = [...DEFAULT_EXECUTIVE_REMINDERS];

let localReports: Record<string, EmployeeReport> = {};
let localJobProfiles: JobProfile[] = [...DEFAULT_JOB_PROFILES];
const editedJobProfilesMap = new Map<string, JobProfile>();
const deletedJobProfileIds = new Set<string>();

let localCurriculum: LmsCurriculum[] = [...DEFAULT_LMS_CURRICULUM];
const editedCurriculumMap = new Map<string, LmsCurriculum>();
const deletedCurriculumIds = new Set<string>();

let localUsers: AppUser[] = [...DEFAULT_USERS];
const editedUsersMap = new Map<string, AppUser>();
const deletedUserIds = new Set<string>();

// ============================================================================
// LAYANAN CRUD REAL-TIME KE SUPABASE (DENGAN AUTO-ADAPTIVE FALLBACK & LIVE SYNC)
// ============================================================================

const requireClient = (): SupabaseClient => {
  const client = getSupabase();
  if (!client) throw new Error('Koneksi Supabase belum dikonfigurasi.');
  return client;
};

export const SkenaHrApi = {
  // 1. Company Settings
  async getSettings(): Promise<CompanySettings | null> {
    const client = getSupabase();
    if (!client) return localSettings;
    try {
      const { data, error } = await client
        .from('company_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        console.warn('Supabase getSettings fallback to RAM:', error.message);
        return localSettings;
      }
      if (data && !settingsEditedInSession) {
        localSettings = { ...localSettings, ...data };
      } else if (data && settingsEditedInSession) {
        localSettings = { ...data, ...localSettings, id: data.id || localSettings.id };
      }
      return localSettings;
    } catch {
      return localSettings;
    }
  },

  async upsertSettings(payload: CompanySettings): Promise<CompanySettings> {
    settingsEditedInSession = true;
    localSettings = { ...localSettings, ...payload };
    notifyRealtimeListeners('company_settings', 'UPDATE');

    const client = getSupabase();
    if (!client) return localSettings;

    try {
      const { data: existing } = await client
        .from('company_settings')
        .select('id')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const targetId = existing?.id || payload.id || generateUuid();
      const dbPayload = {
        company_name: localSettings.company_name,
        industry_sector: localSettings.industry_sector,
        department_scope: localSettings.department_scope,
        evaluation_cycle: localSettings.evaluation_cycle,
        period_year: localSettings.period_year,
        period_term: localSettings.period_term,
        hr_lead_name: localSettings.hr_lead_name,
        hr_lead_id: localSettings.hr_lead_id,
        managing_director_name: localSettings.managing_director_name,
        managing_director_id: localSettings.managing_director_id,
        updated_at: new Date().toISOString(),
      };

      if (existing?.id) {
        const { data, error } = await client
          .from('company_settings')
          .update(dbPayload)
          .eq('id', existing.id)
          .select()
          .single();
        if (!error && data) {
          localSettings = { ...localSettings, ...data };
          return localSettings;
        }
      }

      const { data, error } = await client
        .from('company_settings')
        .upsert({ id: targetId, ...dbPayload }, { onConflict: 'id' })
        .select()
        .single();
      if (!error && data) {
        localSettings = { ...localSettings, ...data };
      }
    } catch (e: any) {
      console.warn('Supabase upsertSettings adaptive fallback:', e?.message);
    }
    return localSettings;
  },

  // 2. Employees Master & Collaborator Archive
  async getEmployees(): Promise<Employee[]> {
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client.from('employees').select('*').order('full_name', { ascending: true });
        if (!error && data && data.length > 0) {
          // Merge remote data with seed metadata & any in-session edits so edits never disappear
          const mergedMap = new Map<string, Employee>();
          data.forEach((row: any) => {
            if (deletedEmployeeIds.has(row.id) || deletedEmployeeIds.has(row.employee_nik)) return;
            const seedMatch = DEFAULT_EMPLOYEES.find(
              (d) => d.id === row.id || d.employee_nik === row.employee_nik
            );
            const emp: Employee = {
              id: row.id,
              employee_nik: row.employee_nik,
              tax_bpjs_id: row.tax_bpjs_id || seedMatch?.tax_bpjs_id || '',
              full_name: row.full_name,
              gender: row.gender === 'P' ? 'P' : 'L',
              role_title: row.role_title,
              department: row.department,
              employment_status: row.employment_status || seedMatch?.employment_status || 'Full Time',
              contract_duration: row.contract_duration || seedMatch?.contract_duration || '12 Bulan',
              contract_start_date: row.contract_start_date || seedMatch?.contract_start_date || '2026-01-01',
              contract_end_date: row.contract_end_date || seedMatch?.contract_end_date || offsetDateIso(120),
              benefits_package: row.benefits_package || seedMatch?.benefits_package || '',
              assigned_project: row.assigned_project || seedMatch?.assigned_project || '',
              work_location: row.work_location || seedMatch?.work_location || 'Makassar HQ',
              direct_supervisor: row.direct_supervisor || seedMatch?.direct_supervisor || 'Managing Director',
              is_active: row.is_active ?? true,
              annual_leave_quota: row.annual_leave_quota ?? seedMatch?.annual_leave_quota ?? 12,
              deactivation_reason: row.deactivation_reason || seedMatch?.deactivation_reason || undefined,
              deactivation_date: row.deactivation_date || seedMatch?.deactivation_date || undefined,
              address_domicile: row.address_domicile || seedMatch?.address_domicile || 'Makassar',
              whatsapp_contact: row.whatsapp_contact || seedMatch?.whatsapp_contact || '-',
              email: row.email || seedMatch?.email || `${(row.employee_nik || 'staff').toLowerCase()}@skena.id`,
              rate_budget: row.rate_budget || seedMatch?.rate_budget || '-',
              notes: row.notes || seedMatch?.notes || '',
              collaborator_category:
                row.collaborator_category ||
                seedMatch?.collaborator_category ||
                (row.is_active === false ? 'Alumni / Ex-Karyawan' : 'Karyawan Internal'),
              resign_status:
                row.resign_status ||
                seedMatch?.resign_status ||
                (row.is_active === false ? 'Resigned' : 'Aktif'),
              resign_notice_date: row.resign_notice_date || seedMatch?.resign_notice_date,
              resign_effective_date: row.resign_effective_date || seedMatch?.resign_effective_date,
              resign_reason: row.resign_reason || seedMatch?.resign_reason,
              handover_notes: row.handover_notes || seedMatch?.handover_notes,
            };
            mergedMap.set(emp.id, emp);
          });

          // Pastikan seed arsip kolaborator tetap muncul bila belum ada di tabel remote
          DEFAULT_EMPLOYEES.filter((e) => !e.is_active).forEach((arcEmp) => {
            if (deletedEmployeeIds.has(arcEmp.id) || deletedEmployeeIds.has(arcEmp.employee_nik)) return;
            const existsByNik = Array.from(mergedMap.values()).some((m) => m.employee_nik === arcEmp.employee_nik);
            if (!existsByNik && !mergedMap.has(arcEmp.id)) {
              mergedMap.set(arcEmp.id, { ...arcEmp });
            }
          });

          // Apply any local overrides that may not have persisted to a legacy schema
          editedEmployeesMap.forEach((editedEmp) => {
            if (deletedEmployeeIds.has(editedEmp.id)) return;
            for (const [k, v] of mergedMap.entries()) {
              if (k === editedEmp.id || v.employee_nik === editedEmp.employee_nik) {
                mergedMap.delete(k);
              }
            }
            mergedMap.set(editedEmp.id, editedEmp);
          });

          localEmployees = Array.from(mergedMap.values());
        }
      } catch (e: any) {
        console.warn('Supabase getEmployees fallback:', e?.message);
      }
    }
    return [...localEmployees];
  },

  async upsertEmployee(payload: Partial<Employee>): Promise<Employee> {
    const idx = localEmployees.findIndex(
      (e) => (payload.id && e.id === payload.id) || (payload.employee_nik && e.employee_nik === payload.employee_nik)
    );
    const previousEmp = idx >= 0 ? localEmployees[idx] : null;
    const targetId = payload.id || previousEmp?.id || generateUuid();

    const isAct = payload.is_active ?? previousEmp?.is_active ?? true;

    const updatedLocal: Employee = {
      id: targetId,
      employee_nik: (
        payload.employee_nik ||
        previousEmp?.employee_nik ||
        `SKN-${Math.floor(Math.random() * 9000 + 1000)}`
      ).trim(),
      tax_bpjs_id: payload.tax_bpjs_id ?? previousEmp?.tax_bpjs_id ?? '',
      full_name: (payload.full_name || previousEmp?.full_name || 'Karyawan').trim(),
      gender: payload.gender || previousEmp?.gender || 'L',
      role_title: (payload.role_title || previousEmp?.role_title || 'Creative Staff').trim(),
      department: payload.department || previousEmp?.department || 'Creative',
      employment_status: payload.employment_status || previousEmp?.employment_status || 'Full Time',
      contract_duration: payload.contract_duration ?? previousEmp?.contract_duration ?? '12 Bulan',
      contract_start_date: payload.contract_start_date ?? previousEmp?.contract_start_date ?? todayIso,
      contract_end_date: payload.contract_end_date ?? previousEmp?.contract_end_date ?? offsetDateIso(365),
      benefits_package: payload.benefits_package ?? previousEmp?.benefits_package ?? '',
      assigned_project: payload.assigned_project ?? previousEmp?.assigned_project ?? '',
      work_location: payload.work_location ?? previousEmp?.work_location ?? 'Makassar HQ',
      direct_supervisor: payload.direct_supervisor ?? previousEmp?.direct_supervisor ?? 'Managing Director',
      is_active: isAct,
      annual_leave_quota: Number(payload.annual_leave_quota ?? previousEmp?.annual_leave_quota ?? 12),
      deactivation_reason:
        isAct === false
          ? payload.deactivation_reason || previousEmp?.deactivation_reason || 'Arsip / Kolaborator'
          : null,
      deactivation_date:
        isAct === false
          ? payload.deactivation_date || previousEmp?.deactivation_date || todayIso
          : null,
      address_domicile: payload.address_domicile ?? previousEmp?.address_domicile ?? 'Makassar',
      whatsapp_contact: payload.whatsapp_contact ?? previousEmp?.whatsapp_contact ?? '',
      email: payload.email ?? previousEmp?.email ?? '',
      rate_budget: payload.rate_budget ?? previousEmp?.rate_budget ?? '',
      notes: payload.notes ?? previousEmp?.notes ?? '',
      collaborator_category:
        payload.collaborator_category ??
        previousEmp?.collaborator_category ??
        (isAct ? 'Karyawan Internal' : 'Freelancer / Mitra'),
      resign_status:
        payload.resign_status ??
        previousEmp?.resign_status ??
        (isAct ? 'Aktif' : 'Resigned'),
      resign_notice_date: payload.resign_notice_date ?? previousEmp?.resign_notice_date ?? '',
      resign_effective_date: payload.resign_effective_date ?? previousEmp?.resign_effective_date ?? '',
      resign_reason: payload.resign_reason ?? previousEmp?.resign_reason ?? '',
      handover_notes: payload.handover_notes ?? previousEmp?.handover_notes ?? '',
    };

    if (idx >= 0) localEmployees[idx] = updatedLocal;
    else localEmployees.push(updatedLocal);

    editedEmployeesMap.set(updatedLocal.id, updatedLocal);
    deletedEmployeeIds.delete(updatedLocal.id);

    // Sinkronkan juga informasi karyawan ke akun user terkait secara real-time
    localUsers = localUsers.map((u) => {
      if (u.employeeId === updatedLocal.id || (previousEmp && u.employeeNik === previousEmp.employee_nik)) {
        const syncedUser: AppUser = {
          ...u,
          name: updatedLocal.full_name,
          employeeId: updatedLocal.id,
          employeeNik: updatedLocal.employee_nik,
          roleTitle: updatedLocal.role_title,
          department: updatedLocal.department,
          employmentStatus: updatedLocal.employment_status,
        };
        editedUsersMap.set(syncedUser.id, syncedUser);
        return syncedUser;
      }
      return u;
    });

    notifyRealtimeListeners('employees', idx >= 0 ? 'UPDATE' : 'INSERT');

    const client = getSupabase();
    if (!client) return updatedLocal;

    const dbRow: Record<string, any> = {
      id: updatedLocal.id,
      employee_nik: updatedLocal.employee_nik,
      tax_bpjs_id: updatedLocal.tax_bpjs_id || '',
      full_name: updatedLocal.full_name,
      gender: updatedLocal.gender,
      role_title: updatedLocal.role_title,
      department: updatedLocal.department,
      employment_status: updatedLocal.employment_status,
      contract_duration: updatedLocal.contract_duration || '',
      benefits_package: updatedLocal.benefits_package || '',
      assigned_project: updatedLocal.assigned_project || '',
      work_location: updatedLocal.work_location || 'Makassar HQ',
      direct_supervisor: updatedLocal.direct_supervisor || 'Managing Director',
      annual_leave_quota: updatedLocal.annual_leave_quota ?? 12,
      deactivation_reason: updatedLocal.deactivation_reason || null,
      deactivation_date: updatedLocal.deactivation_date || null,
      is_active: updatedLocal.is_active,
    };

    try {
      const { data, error } = await client
        .from('employees')
        .upsert(dbRow, { onConflict: 'id' })
        .select()
        .single();

      if (!error && data) {
        const merged = { ...data, ...updatedLocal };
        editedEmployeesMap.set(data.id, merged);
        return merged;
      }

      const { id: _omitId, ...rowWithoutId } = dbRow;
      const lookupNik = previousEmp?.employee_nik || updatedLocal.employee_nik;
      const { data: existingByNik } = await client
        .from('employees')
        .select('id')
        .eq('employee_nik', lookupNik)
        .limit(1)
        .maybeSingle();

      if (existingByNik?.id) {
        const { data: updatedByNik, error: errUpdate } = await client
          .from('employees')
          .update(rowWithoutId)
          .eq('id', existingByNik.id)
          .select()
          .single();
        if (!errUpdate && updatedByNik) {
          return { ...updatedByNik, ...updatedLocal, id: updatedLocal.id };
        }
      } else {
        const fallbackRow = { ...rowWithoutId, id: isValidUuid(updatedLocal.id) ? updatedLocal.id : generateUuid() };
        const { data: inserted } = await client
          .from('employees')
          .upsert(fallbackRow, { onConflict: 'employee_nik' })
          .select()
          .single();
        if (inserted) {
          return { ...inserted, ...updatedLocal, id: updatedLocal.id };
        }
      }
    } catch (e: any) {
      console.warn('Supabase upsertEmployee adaptive fallback:', e?.message);
    }

    return updatedLocal;
  },

  async bulkInsertEmployees(payloads: Partial<Employee>[]): Promise<void> {
    for (const p of payloads) {
      await this.upsertEmployee(p);
    }
  },

  async deleteEmployee(id: string): Promise<void> {
    const targetEmp = localEmployees.find((e) => e.id === id);
    deletedEmployeeIds.add(id);
    if (targetEmp?.employee_nik) deletedEmployeeIds.add(targetEmp.employee_nik);
    editedEmployeesMap.delete(id);

    localEmployees = localEmployees.filter((e) => e.id !== id);
    localAttendances = localAttendances.filter((a) => a.employee_id !== id);
    localKpiList = localKpiList.filter((k) => k.employee_id !== id);
    localUsers = localUsers.filter((u) => u.employeeId !== id);
    Object.keys(localReports).forEach((k) => {
      if (k.startsWith(`${id}-`)) delete localReports[k];
    });
    notifyRealtimeListeners('employees', 'DELETE');

    const client = getSupabase();
    if (!client) return;
    try {
      await client.from('attendances').delete().eq('employee_id', id);
      await client.from('kpi_evaluations').delete().eq('employee_id', id);
      await client.from('employee_reports').delete().eq('employee_id', id);
      await client.from('employees').delete().eq('id', id);
      if (targetEmp?.employee_nik) {
        await client.from('employees').delete().eq('employee_nik', targetEmp.employee_nik);
      }
    } catch (err: any) {
      console.warn('Supabase cascade delete fallback:', err.message);
    }
  },

  async archiveEmployee(id: string, reason: string, date: string): Promise<Employee> {
    const existing = localEmployees.find((e) => e.id === id);
    if (!existing) throw new Error('Karyawan tidak ditemukan');
    return this.upsertEmployee({
      ...existing,
      id,
      is_active: false,
      resign_status: 'Resigned',
      deactivation_reason: reason,
      deactivation_date: date || todayIso,
    });
  },

  async restoreEmployee(id: string): Promise<Employee> {
    const existing = localEmployees.find((e) => e.id === id);
    if (!existing) throw new Error('Karyawan tidak ditemukan');
    return this.upsertEmployee({
      ...existing,
      id,
      is_active: true,
      resign_status: 'Aktif',
      deactivation_reason: null,
      deactivation_date: null,
    });
  },

  // 3. Competencies & KPI Matrix
  async getCompetencies(): Promise<Competency[]> {
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client
          .from('competencies')
          .select('*')
          .order('competency_code', { ascending: true });
        if (!error && data && data.length > 0) {
          const mergedMap = new Map<string, Competency>();
          data.forEach((row: any) => {
            if (deletedCompetencyIds.has(row.id) || deletedCompetencyIds.has(row.competency_code)) return;
            mergedMap.set(row.id, {
              id: row.id,
              competency_code: row.competency_code,
              competency_name: row.competency_name,
              category: row.category || 'Core KPI',
              target_threshold: Number(row.target_threshold ?? 75),
              standard_workload_hours: Number(row.standard_workload_hours ?? 40),
              description: row.description,
              level_descriptors: row.level_descriptors,
            });
          });
          editedCompetenciesMap.forEach((edited) => {
            if (deletedCompetencyIds.has(edited.id)) return;
            for (const [k, v] of mergedMap.entries()) {
              if (k === edited.id || v.competency_code === edited.competency_code) {
                mergedMap.delete(k);
              }
            }
            mergedMap.set(edited.id, edited);
          });
          localCompetencies = Array.from(mergedMap.values());
        }
      } catch (e: any) {
        console.warn('Supabase getCompetencies fallback:', e?.message);
      }
    }
    return [...localCompetencies];
  },

  async createCompetency(payload: Omit<Competency, 'id'>): Promise<Competency> {
    const created: Competency = { id: generateUuid(), ...payload };
    return this.upsertCompetency(created);
  },

  async upsertCompetency(payload: Partial<Competency>): Promise<Competency> {
    const idx = localCompetencies.findIndex(
      (c) => (payload.id && c.id === payload.id) || (payload.competency_code && c.competency_code === payload.competency_code)
    );
    const prevComp = idx >= 0 ? localCompetencies[idx] : null;
    const item: Competency = {
      id: payload.id || prevComp?.id || generateUuid(),
      competency_code: (payload.competency_code || prevComp?.competency_code || 'KPI-NEW').trim(),
      competency_name: (payload.competency_name || prevComp?.competency_name || 'Indikator KPI').trim(),
      category: payload.category || prevComp?.category || 'Core KPI',
      target_threshold: Number(payload.target_threshold ?? prevComp?.target_threshold ?? 75),
      standard_workload_hours: Number(payload.standard_workload_hours ?? prevComp?.standard_workload_hours ?? 40),
      description: payload.description ?? prevComp?.description,
      level_descriptors: payload.level_descriptors ?? prevComp?.level_descriptors,
      level_1_desc: payload.level_1_desc ?? prevComp?.level_1_desc ?? 'Dasar / Perlu supervisi penuh',
      level_2_desc: payload.level_2_desc ?? prevComp?.level_2_desc ?? 'Mampu eksekusi tugas rutin',
      level_3_desc: payload.level_3_desc ?? prevComp?.level_3_desc ?? 'Mandiri & memenuhi standar Skena',
      level_4_desc: payload.level_4_desc ?? prevComp?.level_4_desc ?? 'Mahir & mampu memecahkan masalah kompleks',
      level_5_desc: payload.level_5_desc ?? prevComp?.level_5_desc ?? 'Expert / Mentor lintas tim',
    };

    if (idx >= 0) localCompetencies[idx] = item;
    else localCompetencies.push(item);

    editedCompetenciesMap.set(item.id, item);
    deletedCompetencyIds.delete(item.id);
    notifyRealtimeListeners('competencies', idx >= 0 ? 'UPDATE' : 'INSERT');

    const client = getSupabase();
    if (!client) return item;

    try {
      const {
        description: _d,
        level_descriptors: _l,
        level_1_desc: _l1,
        level_2_desc: _l2,
        level_3_desc: _l3,
        level_4_desc: _l4,
        level_5_desc: _l5,
        ...dbComp
      } = item;
      const { data, error } = await client
        .from('competencies')
        .upsert(dbComp, { onConflict: 'id' })
        .select()
        .single();
      if (!error && data) return { ...item, ...data };

      const { id: _omitId, ...withoutId } = dbComp;
      const lookupCode = prevComp?.competency_code || item.competency_code;
      const { data: existing } = await client
        .from('competencies')
        .select('id')
        .eq('competency_code', lookupCode)
        .limit(1)
        .maybeSingle();
      if (existing?.id) {
        await client.from('competencies').update(withoutId).eq('id', existing.id);
      } else {
        await client
          .from('competencies')
          .upsert({ ...withoutId, id: isValidUuid(item.id) ? item.id : generateUuid() }, { onConflict: 'competency_code' });
      }
    } catch (e: any) {
      console.warn('Supabase upsertCompetency fallback:', e?.message);
    }
    return item;
  },

  async deleteCompetency(id: string): Promise<void> {
    const comp = localCompetencies.find((c) => c.id === id);
    deletedCompetencyIds.add(id);
    if (comp?.competency_code) deletedCompetencyIds.add(comp.competency_code);
    editedCompetenciesMap.delete(id);
    localCompetencies = localCompetencies.filter((c) => c.id !== id);
    notifyRealtimeListeners('competencies', 'DELETE');

    const client = getSupabase();
    if (!client) return;
    try {
      await client.from('competencies').delete().eq('id', id);
      if (comp?.competency_code) {
        await client.from('competencies').delete().eq('competency_code', comp.competency_code);
      }
    } catch (e: any) {
      console.warn('Supabase deleteCompetency fallback:', e?.message);
    }
  },

  // 4. Work Schedules
  async getSchedules(): Promise<WorkSchedule[]> {
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client
          .from('work_schedules')
          .select('*')
          .order('start_time', { ascending: true });
        if (!error && data && data.length > 0) {
          const mergedMap = new Map<string, WorkSchedule>();
          data.forEach((row: any) => {
            if (deletedScheduleIds.has(row.id)) return;
            const comp =
              localCompetencies.find((c) => c.id === row.competency_id || c.competency_code === row.competency_id) ||
              localCompetencies[0];
            mergedMap.set(row.id, {
              ...row,
              competencies: comp,
            });
          });
          editedSchedulesMap.forEach((edited) => {
            if (!deletedScheduleIds.has(edited.id)) {
              mergedMap.set(edited.id, edited);
            }
          });
          localSchedules = Array.from(mergedMap.values());
        }
      } catch (e: any) {
        console.warn('Supabase getSchedules fallback:', e?.message);
      }
    }
    return localSchedules.map((s) => ({
      ...s,
      competencies:
        s.competencies ||
        localCompetencies.find((c) => c.id === s.competency_id || c.competency_code === s.competency_id),
    }));
  },

  async createSchedule(payload: Omit<WorkSchedule, 'id' | 'competencies'>): Promise<WorkSchedule> {
    return this.upsertSchedule({ ...payload, id: generateUuid() });
  },

  async upsertSchedule(payload: Partial<WorkSchedule> & { id?: string }): Promise<WorkSchedule> {
    const targetId = payload.id || generateUuid();
    const idx = localSchedules.findIndex((s) => s.id === targetId);
    const prev = idx >= 0 ? localSchedules[idx] : null;
    const comp = localCompetencies.find(
      (c) => c.id === (payload.competency_id || prev?.competency_id) || c.competency_code === payload.competency_id
    );

    const updated: WorkSchedule = {
      id: targetId,
      day_of_week: payload.day_of_week || prev?.day_of_week || 'Senin',
      start_time: payload.start_time || prev?.start_time || '09:00',
      end_time: payload.end_time || prev?.end_time || '12:00',
      shift_code: payload.shift_code || prev?.shift_code || 'Sprint & Content Production',
      competency_id: payload.competency_id || prev?.competency_id || localCompetencies[0]?.id || 'c-cre-1',
      location_agenda_notes: payload.location_agenda_notes ?? prev?.location_agenda_notes ?? '',
      schedule_date: payload.schedule_date || prev?.schedule_date || todayIso,
      employee_id: payload.employee_id !== undefined ? payload.employee_id : prev?.employee_id,
      employee_name: payload.employee_name || prev?.employee_name || 'Seluruh Tim Skena',
      created_by_role: payload.created_by_role || prev?.created_by_role || 'admin',
      status: payload.status || prev?.status || 'Confirmed',
      competencies: comp || prev?.competencies,
    };

    if (idx >= 0) localSchedules[idx] = updated;
    else localSchedules.unshift(updated);

    editedSchedulesMap.set(updated.id, updated);
    deletedScheduleIds.delete(updated.id);
    notifyRealtimeListeners('work_schedules', idx >= 0 ? 'UPDATE' : 'INSERT');

    const client = getSupabase();
    if (!client) return updated;

    try {
      const { competencies: _c, ...cleanFull } = updated;
      const { data, error } = await client
        .from('work_schedules')
        .upsert(cleanFull, { onConflict: 'id' })
        .select('*')
        .maybeSingle();
      if (!error && data) {
        return { ...updated, ...data, competencies: comp };
      }

      const legacyPayload: Record<string, any> = {
        id: isValidUuid(updated.id) ? updated.id : generateUuid(),
        day_of_week: updated.day_of_week,
        start_time: updated.start_time,
        end_time: updated.end_time,
        shift_code: updated.shift_code,
        location_agenda_notes: updated.location_agenda_notes,
      };
      if (isValidUuid(updated.competency_id)) {
        legacyPayload.competency_id = updated.competency_id;
      }
      await client.from('work_schedules').upsert(legacyPayload, { onConflict: 'id' });
    } catch (e: any) {
      console.warn('Supabase upsertSchedule fallback:', e?.message);
    }
    return updated;
  },

  async deleteSchedule(id: string): Promise<void> {
    deletedScheduleIds.add(id);
    editedSchedulesMap.delete(id);
    localSchedules = localSchedules.filter((s) => s.id !== id);
    notifyRealtimeListeners('work_schedules', 'DELETE');

    const client = getSupabase();
    if (!client) return;
    try {
      await client.from('work_schedules').delete().eq('id', id);
    } catch (e: any) {
      console.warn('Supabase deleteSchedule fallback:', e?.message);
    }
  },

  // 5. Attendances (10 Kategori Kehadiran & Perizinan — Jam Masuk 09:00 + Toleransi 15 Menit)
  normalizeAttendanceRowFromDb(row: any): AttendanceRecord {
    let status: AttendanceStatus = (row.status as AttendanceStatus) || 'WFO';
    let notes = String(row.notes || '');
    let checkIn = row.check_in_time || (isNonCheckInStatus(status) ? '-' : '08:50:00');
    let checkOut = row.check_out_time || (isNonCheckInStatus(status) ? '-' : '17:30:00');

    const timeMatch = notes.match(/^\[JAM:([0-9:-]+)\]\s*/i);
    if (timeMatch) {
      checkIn = timeMatch[1];
      notes = notes.replace(/^\[JAM:([0-9:-]+)\]\s*/i, '');
    }

    const prefixMap: Array<{ tag: string; st: AttendanceStatus }> = [
      { tag: '[IZIN]', st: 'Izin' },
      { tag: '[SAKIT]', st: 'Sakit' },
      { tag: '[URUSAN_KANTOR]', st: 'Urusan Kantor' },
      { tag: '[OVERTIME]', st: 'Overtime' },
      { tag: '[TIDAK_ABSEN]', st: 'Tidak Absen' },
      { tag: '[URUSAN_PRIBADI]', st: 'Urusan Pribadi' },
    ];
    for (const pm of prefixMap) {
      if (notes.toUpperCase().startsWith(pm.tag)) {
        status = pm.st;
        notes = notes.slice(pm.tag.length).trim();
        if (!row.check_in_time && isNonCheckInStatus(status)) checkIn = '-';
        break;
      }
    }

    return {
      id: row.id,
      employee_id: row.employee_id,
      attendance_date: row.attendance_date,
      check_in_time: checkIn,
      check_out_time: checkOut,
      status,
      work_location_tag: row.work_location_tag || 'Makassar HQ',
      notes,
    };
  },

  async saveSingleAttendanceToDb(rec: AttendanceRecord): Promise<void> {
    const client = getSupabase();
    if (!client) return;

    const cleanNotes = (rec.notes || '')
      .replace(/^\[(IZIN|SAKIT|URUSAN_KANTOR|OVERTIME|TIDAK_ABSEN|URUSAN_PRIBADI)\]\s*/i, '')
      .trim();
    const isLeave = isNonCheckInStatus(rec.status);
    const checkInVal = isLeave ? '-' : rec.check_in_time || '08:55:00';

    try {
      const fullPayload: Record<string, any> = {
        ...(isValidUuid(rec.id) ? { id: rec.id } : {}),
        employee_id: rec.employee_id,
        attendance_date: rec.attendance_date,
        check_in_time: checkInVal,
        status: rec.status,
        work_location_tag: rec.work_location_tag || 'Makassar HQ',
        notes: cleanNotes,
      };
      const { error: err1 } = await client
        .from('attendances')
        .upsert(fullPayload, { onConflict: 'employee_id,attendance_date' });
      if (!err1) return;

      // Fallback untuk tabel dengan CHECK constraint status lama ('WFO','WFH','Take Content','Cuti')
      let compatStatus: string = rec.status;
      let prefix = '';
      if (rec.status === 'Izin') {
        compatStatus = 'Cuti';
        prefix = '[IZIN] ';
      } else if (rec.status === 'Sakit') {
        compatStatus = 'Cuti';
        prefix = '[SAKIT] ';
      } else if (rec.status === 'Urusan Kantor') {
        compatStatus = 'Take Content';
        prefix = '[URUSAN_KANTOR] ';
      } else if (rec.status === 'Overtime') {
        compatStatus = 'WFO';
        prefix = '[OVERTIME] ';
      } else if (rec.status === 'Tidak Absen') {
        compatStatus = 'Cuti';
        prefix = '[TIDAK_ABSEN] ';
      } else if (rec.status === 'Urusan Pribadi') {
        compatStatus = 'Cuti';
        prefix = '[URUSAN_PRIBADI] ';
      }

      const compatPayload: Record<string, any> = {
        ...(isValidUuid(rec.id) ? { id: rec.id } : {}),
        employee_id: rec.employee_id,
        attendance_date: rec.attendance_date,
        check_in_time: checkInVal,
        status: compatStatus,
        work_location_tag: rec.work_location_tag || 'Makassar HQ',
        notes: `${prefix}${cleanNotes}`.trim(),
      };
      const { error: err2 } = await client
        .from('attendances')
        .upsert(compatPayload, { onConflict: 'employee_id,attendance_date' });
      if (!err2) return;

      const { check_in_time: _ct, ...legacyPayload } = compatPayload;
      legacyPayload.notes = `${checkInVal && checkInVal !== '-' ? `[JAM:${checkInVal}] ` : ''}${prefix}${cleanNotes}`.trim();
      await client.from('attendances').upsert(legacyPayload, { onConflict: 'employee_id,attendance_date' });
    } catch (e: any) {
      console.warn('Attendance sync warning:', e?.message);
    }
  },

  async getAttendancesByDate(date: string): Promise<AttendanceRecord[]> {
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client.from('attendances').select('*').eq('attendance_date', date);
        if (!error && data) {
          data.forEach((row: any) => {
            const key = `${row.employee_id}-${row.attendance_date}`;
            if (deletedAttendanceKeys.has(key)) return;
            if (!editedAttendancesMap.has(key)) {
              const idx = localAttendances.findIndex(
                (a) => a.employee_id === row.employee_id && a.attendance_date === row.attendance_date
              );
              const rec = this.normalizeAttendanceRowFromDb(row);
              if (idx >= 0) localAttendances[idx] = rec;
              else localAttendances.push(rec);
            }
          });
        }
      } catch (e: any) {
        console.warn('getAttendancesByDate fallback:', e?.message);
      }
    }
    return localAttendances.filter((a) => a.attendance_date === date);
  },

  async getAttendancesByMonth(yearMonth: string): Promise<AttendanceRecord[]> {
    const client = getSupabase();
    if (client && yearMonth) {
      try {
        const [yStr, mStr] = yearMonth.split('-');
        const y = parseInt(yStr, 10);
        const m = parseInt(mStr, 10);
        const lastDay = new Date(y, m, 0).getDate() || 28;
        const startDate = `${yearMonth}-01`;
        const endDate = `${yearMonth}-${String(lastDay).padStart(2, '0')}`;
        const { data, error } = await client
          .from('attendances')
          .select('*')
          .gte('attendance_date', startDate)
          .lte('attendance_date', endDate);
        if (!error && data) {
          data.forEach((row: any) => {
            const key = `${row.employee_id}-${row.attendance_date}`;
            if (deletedAttendanceKeys.has(key)) return;
            if (!editedAttendancesMap.has(key)) {
              const idx = localAttendances.findIndex(
                (a) => a.employee_id === row.employee_id && a.attendance_date === row.attendance_date
              );
              const rec = this.normalizeAttendanceRowFromDb(row);
              if (idx >= 0) localAttendances[idx] = rec;
              else localAttendances.push(rec);
            }
          });
        }
      } catch (e: any) {
        console.warn('getAttendancesByMonth fallback:', e?.message);
      }
    }
    return localAttendances.filter((a) => a.attendance_date.startsWith(yearMonth));
  },

  async getAllEmployeeAttendances(employeeId: string): Promise<AttendanceRecord[]> {
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client.from('attendances').select('*').eq('employee_id', employeeId);
        if (!error && data) {
          data.forEach((row: any) => {
            const key = `${row.employee_id}-${row.attendance_date}`;
            if (deletedAttendanceKeys.has(key)) return;
            if (!editedAttendancesMap.has(key)) {
              const idx = localAttendances.findIndex(
                (a) => a.employee_id === row.employee_id && a.attendance_date === row.attendance_date
              );
              const rec = this.normalizeAttendanceRowFromDb(row);
              if (idx >= 0) localAttendances[idx] = rec;
              else localAttendances.push(rec);
            }
          });
        }
      } catch (e: any) {
        console.warn('getAllEmployeeAttendances fallback:', e?.message);
      }
    }
    return localAttendances.filter((a) => a.employee_id === employeeId);
  },

  async getAllAttendances(): Promise<AttendanceRecord[]> {
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client
          .from('attendances')
          .select('*')
          .order('attendance_date', { ascending: false });
        if (!error && data) {
          data.forEach((row: any) => {
            const key = `${row.employee_id}-${row.attendance_date}`;
            if (deletedAttendanceKeys.has(key)) return;
            if (!editedAttendancesMap.has(key)) {
              const idx = localAttendances.findIndex(
                (a) => a.employee_id === row.employee_id && a.attendance_date === row.attendance_date
              );
              const rec = this.normalizeAttendanceRowFromDb(row);
              if (idx >= 0) localAttendances[idx] = rec;
              else localAttendances.push(rec);
            }
          });
        }
      } catch (e: any) {
        console.warn('getAllAttendances fallback:', e?.message);
      }
    }
    return [...localAttendances];
  },

  async batchUpsertAttendances(records: AttendanceRecord[]): Promise<void> {
    const upsertedItems: AttendanceRecord[] = [];
    records.forEach((rec) => {
      const idx = localAttendances.findIndex(
        (a) => a.employee_id === rec.employee_id && a.attendance_date === rec.attendance_date
      );
      const isLeave = isNonCheckInStatus(rec.status);
      const formatted: AttendanceRecord = {
        id: rec.id || (idx >= 0 ? localAttendances[idx].id : generateUuid()),
        employee_id: rec.employee_id,
        attendance_date: rec.attendance_date,
        check_in_time: isLeave ? '-' : rec.check_in_time || '08:50:00',
        check_out_time: isLeave ? '-' : rec.check_out_time || (rec.status === 'Overtime' ? '21:00:00' : '17:30:00'),
        status: rec.status,
        work_location_tag: rec.work_location_tag || 'Makassar HQ',
        notes: rec.notes || '',
      };
      if (idx >= 0) localAttendances[idx] = formatted;
      else localAttendances.push(formatted);

      const key = `${formatted.employee_id}-${formatted.attendance_date}`;
      editedAttendancesMap.set(key, formatted);
      deletedAttendanceKeys.delete(key);
      upsertedItems.push(formatted);
    });

    notifyRealtimeListeners('attendances', 'UPDATE');

    for (const item of upsertedItems) {
      await this.saveSingleAttendanceToDb(item);
    }
  },

  async submitEmployeeAttendance(record: AttendanceRecord): Promise<AttendanceRecord> {
    const isLeave = isNonCheckInStatus(record.status);
    const checkTime = isLeave
      ? '-'
      : record.check_in_time || new Date().toLocaleTimeString('id-ID', { hour12: false });
    const idx = localAttendances.findIndex(
      (a) => a.employee_id === record.employee_id && a.attendance_date === record.attendance_date
    );
    const item: AttendanceRecord = {
      id: record.id || (idx >= 0 ? localAttendances[idx].id : generateUuid()),
      ...record,
      check_in_time: checkTime,
      check_out_time: isLeave ? '-' : record.check_out_time || (record.status === 'Overtime' ? '21:00:00' : '17:30:00'),
    };

    if (idx >= 0) localAttendances[idx] = item;
    else localAttendances.push(item);

    const key = `${item.employee_id}-${item.attendance_date}`;
    editedAttendancesMap.set(key, item);
    deletedAttendanceKeys.delete(key);
    notifyRealtimeListeners('attendances', idx >= 0 ? 'UPDATE' : 'INSERT');

    await this.saveSingleAttendanceToDb(item);
    return item;
  },

  async deleteAttendanceRecord(employeeId: string, date: string): Promise<void> {
    const key = `${employeeId}-${date}`;
    deletedAttendanceKeys.add(key);
    editedAttendancesMap.delete(key);
    localAttendances = localAttendances.filter(
      (a) => !(a.employee_id === employeeId && a.attendance_date === date)
    );
    notifyRealtimeListeners('attendances', 'DELETE');

    const client = getSupabase();
    if (!client) return;
    try {
      await client.from('attendances').delete().eq('employee_id', employeeId).eq('attendance_date', date);
    } catch (e: any) {
      console.warn('deleteAttendanceRecord fallback:', e?.message);
    }
  },

  // 6. Activity & LMS Daily Logs (Jurnal Sprint Harian & LMS — Tersinkronisasi Penuh dengan Supabase)
  async saveSingleActivityLogToSupabase(
    log: ActivityLog,
    prevLog?: ActivityLog | null
  ): Promise<{ saved: boolean; dbRow?: any }> {
    const client = getSupabase();
    if (!client) return { saved: false };

    try {
      const { data: allRows, error: selErr } = await client.from('activity_logs').select('*');
      if (selErr) return { saved: false };

      const rows = Array.isArray(allRows) ? allRows : [];
      const existingRow = rows.find((r: any) => {
        if (r.id && log.id && r.id === log.id) return true;
        if (
          prevLog &&
          r.log_date === prevLog.log_date &&
          (r.project_deliverable_topic || '').trim().toLowerCase() ===
            (prevLog.project_deliverable_topic || '').trim().toLowerCase()
        ) {
          return true;
        }
        return false;
      });

      const baseFields: Record<string, any> = {
        log_date: log.log_date || todayIso,
        schedule_id: log.schedule_id || null,
        competency_id: log.competency_id || localCompetencies[0]?.id || 'c-cre-1',
        sprint_session_info: log.sprint_session_info || 'Morning Sprint (09:00 - 12:00)',
        project_deliverable_topic: log.project_deliverable_topic || 'Deliverable Sprint',
        execution_details: log.execution_details || '-',
        blocker_evaluator_notes: log.blocker_evaluator_notes || '',
        total_active_team: Number(log.total_active_team ?? 0),
        total_on_leave: Number(log.total_on_leave ?? 0),
      };

      if (existingRow && existingRow.id) {
        // Coba update dengan seluruh kolom
        const { data: u1, error: e1 } = await client
          .from('activity_logs')
          .update(baseFields)
          .eq('id', existingRow.id)
          .select('*')
          .maybeSingle();
        if (!e1) return { saved: true, dbRow: u1 || { ...existingRow, ...baseFields } };

        // Fallback jika kolom schedule_id / competency_id menuntut UUID
        const safeFkFields = {
          ...baseFields,
          schedule_id: isValidUuid(baseFields.schedule_id) ? baseFields.schedule_id : null,
          competency_id: isValidUuid(baseFields.competency_id) ? baseFields.competency_id : null,
        };
        const { data: u2, error: e2 } = await client
          .from('activity_logs')
          .update(safeFkFields)
          .eq('id', existingRow.id)
          .select('*')
          .maybeSingle();
        if (!e2) return { saved: true, dbRow: u2 || { ...existingRow, ...safeFkFields } };
      } else {
        // Baris baru: coba upsert dengan ID asli
        const targetId = log.id || generateUuid();
        const { data: i1, error: ie1 } = await client
          .from('activity_logs')
          .upsert({ id: targetId, ...baseFields }, { onConflict: 'id' })
          .select('*')
          .maybeSingle();
        if (!ie1) return { saved: true, dbRow: i1 || { id: targetId, ...baseFields } };

        // Fallback jika ID / FK menuntut UUID
        const safeUuid = isValidUuid(targetId) ? targetId : generateUuid();
        const safeFkFields = {
          id: safeUuid,
          ...baseFields,
          schedule_id: isValidUuid(baseFields.schedule_id) ? baseFields.schedule_id : null,
          competency_id: isValidUuid(baseFields.competency_id) ? baseFields.competency_id : null,
        };
        const { data: i2, error: ie2 } = await client
          .from('activity_logs')
          .upsert(safeFkFields, { onConflict: 'id' })
          .select('*')
          .maybeSingle();
        if (!ie2) return { saved: true, dbRow: i2 || safeFkFields };
      }
    } catch (e: any) {
      console.warn('Supabase saveSingleActivityLogToSupabase fallback:', e?.message);
    }
    return { saved: false };
  },

  async getActivityLogs(): Promise<ActivityLog[]> {
    const client = getSupabase();
    if (client) {
      try {
        // Gunakan .select('*') agar tidak gagal saat Foreign Key telah di-drop oleh migrasi TEXT
        const { data, error } = await client
          .from('activity_logs')
          .select('*')
          .order('log_date', { ascending: false });

        if (!error && data && data.length === 0 && localActivityLogs.length > 0 && editedLogsMap.size === 0) {
          // Seed otomatis jika tabel di Supabase masih kosong
          for (const seedLog of localActivityLogs) {
            await this.saveSingleActivityLogToSupabase(seedLog);
          }
        } else if (!error && data && data.length > 0) {
          const mergedMap = new Map<string, ActivityLog>();

          data.forEach((row: any) => {
            if (deletedLogIds.has(row.id)) return;
            const topicKey = `${row.log_date}::${(row.project_deliverable_topic || '').trim().toLowerCase()}`;
            if (deletedLogIds.has(topicKey)) return;

            const resolvedComp =
              localCompetencies.find(
                (c) => c.id === row.competency_id || c.competency_code === row.competency_id
              ) || localCompetencies[0];

            mergedMap.set(row.id, {
              id: row.id,
              log_date: row.log_date || todayIso,
              schedule_id: row.schedule_id || 's-1',
              competency_id: row.competency_id || resolvedComp?.id || 'c-cre-1',
              sprint_session_info: row.sprint_session_info || 'Morning Sprint (09:00 - 12:00)',
              project_deliverable_topic: row.project_deliverable_topic || '',
              execution_details: row.execution_details || '',
              blocker_evaluator_notes: row.blocker_evaluator_notes || '',
              total_active_team: Number(row.total_active_team ?? 0),
              total_on_leave: Number(row.total_on_leave ?? 0),
              competencies: resolvedComp,
            });
          });

          // Terapkan seluruh edit sesi aktif agar perubahan langsung tercermin & tidak tertimpa
          editedLogsMap.forEach((edited) => {
            const eid = edited.id || '';
            if (deletedLogIds.has(eid)) return;
            for (const [k, v] of mergedMap.entries()) {
              if (
                k === eid ||
                (v.log_date === edited.log_date &&
                  (v.sprint_session_info || '').toLowerCase() === (edited.sprint_session_info || '').toLowerCase() &&
                  (v.project_deliverable_topic || '').toLowerCase() ===
                    (edited.project_deliverable_topic || '').toLowerCase())
              ) {
                mergedMap.delete(k);
              }
            }
            mergedMap.set(eid, {
              ...edited,
              competencies:
                edited.competencies ||
                localCompetencies.find(
                  (c) => c.id === edited.competency_id || c.competency_code === edited.competency_id
                ) ||
                localCompetencies[0],
            });
          });

          localActivityLogs = Array.from(mergedMap.values()).sort((a, b) =>
            (b.log_date || '').localeCompare(a.log_date || '')
          );
        }
      } catch (e: any) {
        console.warn('Supabase getActivityLogs fallback:', e?.message);
      }
    }
    return localActivityLogs.map((l) => ({
      ...l,
      competencies:
        l.competencies ||
        localCompetencies.find((c) => c.id === l.competency_id || c.competency_code === l.competency_id) ||
        localCompetencies[0],
    }));
  },

  async createActivityLog(payload: Partial<ActivityLog>): Promise<ActivityLog> {
    return this.upsertActivityLog({ ...payload, id: payload.id || `log-${Date.now()}` });
  },

  async upsertActivityLog(payload: Partial<ActivityLog>): Promise<ActivityLog> {
    const targetId = payload.id || `log-${Date.now()}`;
    const idx = localActivityLogs.findIndex((l) => l.id === targetId);
    const prevLog = idx >= 0 ? { ...localActivityLogs[idx] } : null;
    const comp =
      localCompetencies.find(
        (c) => c.id === payload.competency_id || c.competency_code === payload.competency_id
      ) ||
      prevLog?.competencies ||
      localCompetencies[0];

    const updated: ActivityLog = {
      id: targetId,
      log_date: payload.log_date || prevLog?.log_date || todayIso,
      schedule_id: payload.schedule_id || prevLog?.schedule_id || 's-1',
      competency_id: payload.competency_id || prevLog?.competency_id || comp?.id || 'c-cre-1',
      sprint_session_info:
        (payload.sprint_session_info ?? prevLog?.sprint_session_info ?? 'Morning Sprint (09:00 - 12:00)').trim(),
      project_deliverable_topic:
        (payload.project_deliverable_topic ?? prevLog?.project_deliverable_topic ?? '').trim(),
      execution_details: (payload.execution_details ?? prevLog?.execution_details ?? '').trim(),
      blocker_evaluator_notes: (payload.blocker_evaluator_notes ?? prevLog?.blocker_evaluator_notes ?? '').trim(),
      total_active_team: Number(payload.total_active_team ?? prevLog?.total_active_team ?? 0),
      total_on_leave: Number(payload.total_on_leave ?? prevLog?.total_on_leave ?? 0),
      competencies: comp,
    };

    if (idx >= 0) localActivityLogs[idx] = updated;
    else localActivityLogs.unshift(updated);

    editedLogsMap.set(targetId, updated);
    deletedLogIds.delete(targetId);

    const res = await this.saveSingleActivityLogToSupabase(updated, prevLog);
    if (res.saved && res.dbRow?.id && res.dbRow.id !== targetId) {
      const dbId = res.dbRow.id;
      editedLogsMap.delete(targetId);
      updated.id = dbId;
      editedLogsMap.set(dbId, updated);
      const currentIdx = localActivityLogs.findIndex((l) => l.id === targetId);
      if (currentIdx >= 0) localActivityLogs[currentIdx] = updated;
    }

    notifyRealtimeListeners('activity_logs', idx >= 0 ? 'UPDATE' : 'INSERT');
    return updated;
  },

  async deleteActivityLog(id: string): Promise<void> {
    const target = localActivityLogs.find((l) => l.id === id);
    deletedLogIds.add(id);
    if (target) {
      const topicKey = `${target.log_date}::${(target.project_deliverable_topic || '').trim().toLowerCase()}`;
      deletedLogIds.add(topicKey);
    }
    editedLogsMap.delete(id);
    localActivityLogs = localActivityLogs.filter((l) => l.id !== id);
    notifyRealtimeListeners('activity_logs', 'DELETE');

    const client = getSupabase();
    if (!client) return;
    try {
      await client.from('activity_logs').delete().eq('id', id);
      if (target?.project_deliverable_topic) {
        await client
          .from('activity_logs')
          .delete()
          .eq('log_date', target.log_date)
          .eq('project_deliverable_topic', target.project_deliverable_topic);
      }
    } catch (e: any) {
      console.warn('Supabase deleteActivityLog fallback:', e?.message);
    }
  },

  // 7. KPI Evaluations & Workload Analysis
  async getKpiEvaluations(periodYear: string, periodTerm: string): Promise<KpiEvaluation[]> {
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client
          .from('kpi_evaluations')
          .select('*')
          .eq('period_year', periodYear)
          .eq('period_term', periodTerm);
        if (!error && data && data.length > 0) {
          data.forEach((row: any) => {
            const key = `${row.employee_id}-${row.competency_id}-${row.period_year}-${row.period_term}`;
            if (deletedKpiKeys.has(key)) return;
            if (!editedKpiMap.has(key)) {
              const qAvg =
                (Number(row.kpi_q1) + Number(row.kpi_q2) + Number(row.kpi_q3) + Number(row.kpi_q4)) / 4.0;
              const calcScore = Number(
                (qAvg * 0.5 + Number(row.mid_review_score) * 0.3 + Number(row.final_project_score) * 0.2).toFixed(2)
              );
              const item: KpiEvaluation = {
                id: row.id,
                employee_id: row.employee_id,
                competency_id: row.competency_id,
                period_year: row.period_year,
                period_term: row.period_term,
                kpi_q1: Number(row.kpi_q1 ?? 0),
                kpi_q2: Number(row.kpi_q2 ?? 0),
                kpi_q3: Number(row.kpi_q3 ?? 0),
                kpi_q4: Number(row.kpi_q4 ?? 0),
                mid_review_score: Number(row.mid_review_score ?? 0),
                final_project_score: Number(row.final_project_score ?? 0),
                final_kpi_score: Number(row.final_kpi_score ?? calcScore),
                current_skill_level: Number(row.current_skill_level ?? 3),
                workload_percentage: Number(row.workload_percentage ?? 85),
                performance_narrative: row.performance_narrative || '',
              };
              const idx = localKpiList.findIndex(
                (k) =>
                  k.employee_id === item.employee_id &&
                  k.competency_id === item.competency_id &&
                  k.period_year === item.period_year &&
                  k.period_term === item.period_term
              );
              if (idx >= 0) localKpiList[idx] = item;
              else localKpiList.push(item);
            }
          });
        }
      } catch (e: any) {
        console.warn('Supabase getKpiEvaluations fallback:', e?.message);
      }
    }
    return localKpiList.filter((k) => k.period_year === periodYear && k.period_term === periodTerm);
  },

  async deleteKpiEvaluation(
    employeeId: string,
    competencyId: string,
    periodYear: string,
    periodTerm: string
  ): Promise<void> {
    const key = `${employeeId}-${competencyId}-${periodYear}-${periodTerm}`;
    deletedKpiKeys.add(key);
    editedKpiMap.delete(key);
    localKpiList = localKpiList.filter(
      (k) =>
        !(
          k.employee_id === employeeId &&
          k.competency_id === competencyId &&
          k.period_year === periodYear &&
          k.period_term === periodTerm
        )
    );
    notifyRealtimeListeners('kpi_evaluations', 'DELETE');

    const client = getSupabase();
    if (!client) return;
    try {
      await client
        .from('kpi_evaluations')
        .delete()
        .eq('employee_id', employeeId)
        .eq('competency_id', competencyId)
        .eq('period_year', periodYear)
        .eq('period_term', periodTerm);
    } catch (e: any) {
      console.warn('Supabase deleteKpiEvaluation fallback:', e?.message);
    }
  },

  async upsertKpiEvaluation(payload: KpiEvaluation): Promise<KpiEvaluation> {
    const qAvg =
      (Number(payload.kpi_q1) + Number(payload.kpi_q2) + Number(payload.kpi_q3) + Number(payload.kpi_q4)) / 4.0;
    const calcScore = Number(
      (qAvg * 0.5 + Number(payload.mid_review_score) * 0.3 + Number(payload.final_project_score) * 0.2).toFixed(2)
    );

    const idx = localKpiList.findIndex(
      (k) =>
        k.employee_id === payload.employee_id &&
        k.competency_id === payload.competency_id &&
        k.period_year === payload.period_year &&
        k.period_term === payload.period_term
    );
    const fullPayload: KpiEvaluation = {
      ...payload,
      id: payload.id || (idx >= 0 ? localKpiList[idx].id : generateUuid()),
      final_kpi_score: calcScore,
    };

    if (idx >= 0) localKpiList[idx] = fullPayload;
    else localKpiList.push(fullPayload);

    const key = `${fullPayload.employee_id}-${fullPayload.competency_id}-${fullPayload.period_year}-${fullPayload.period_term}`;
    editedKpiMap.set(key, fullPayload);
    deletedKpiKeys.delete(key);
    notifyRealtimeListeners('kpi_evaluations', idx >= 0 ? 'UPDATE' : 'INSERT');

    const client = getSupabase();
    if (!client) return fullPayload;

    try {
      // Hapus final_kpi_score dari payload tulis agar kompatibel dengan kolom GENERATED ALWAYS maupun trigger
      const { final_kpi_score: _f, id, ...cleanPayload } = fullPayload;
      const dbPayload = {
        ...(id ? { id } : {}),
        ...cleanPayload,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await client
        .from('kpi_evaluations')
        .upsert(dbPayload, { onConflict: 'employee_id,competency_id,period_year,period_term' })
        .select()
        .single();
      if (!error && data) {
        return { ...fullPayload, ...data, final_kpi_score: data.final_kpi_score ?? calcScore };
      }
    } catch (e: any) {
      console.warn('Supabase upsertKpiEvaluation fallback:', e?.message);
    }
    return fullPayload;
  },

  // 8. Employee Report Cards, IDP & Talent Pipeline
  async getEmployeeReport(employeeId: string, periodYear: string, periodTerm: string): Promise<EmployeeReport | null> {
    const key = `${employeeId}-${periodYear}-${periodTerm}`;
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client
          .from('employee_reports')
          .select('*')
          .eq('employee_id', employeeId)
          .eq('period_year', periodYear)
          .order('report_date', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!error && data && !localReports[key]) {
          localReports[key] = data;
        }
      } catch (e: any) {
        console.warn('Supabase getEmployeeReport fallback:', e?.message);
      }
    }
    return localReports[key] || null;
  },

  async upsertEmployeeReport(payload: EmployeeReport): Promise<EmployeeReport> {
    const key = `${payload.employee_id}-${payload.period_year}-${payload.period_term}`;
    const item: EmployeeReport = {
      ...payload,
      id: payload.id || localReports[key]?.id || generateUuid(),
    };
    localReports[key] = item;
    // Simpan juga di kunci standar period_term jika user memilih sub-bulan
    notifyRealtimeListeners('employee_reports', 'UPDATE');

    const client = getSupabase();
    if (!client) return item;

    try {
      const { data, error } = await client
        .from('employee_reports')
        .upsert(item, { onConflict: 'employee_id,period_year,period_term' })
        .select()
        .single();
      if (!error && data) {
        localReports[key] = data;
        return data;
      }
    } catch (e: any) {
      console.warn('Supabase upsertEmployeeReport fallback:', e?.message);
    }
    return item;
  },

  // 10. Job Profiles (Deskripsi Jabatan HR — Tersinkronisasi Penuh dengan Supabase & Multi-Skema)
  async saveSingleJobProfileToSupabase(
    item: JobProfile,
    prevRoleTitle?: string
  ): Promise<{ saved: boolean; dbRow?: any }> {
    const client = getSupabase();
    if (!client) return { saved: false };

    try {
      const { data: allRows, error: selErr } = await client.from('job_profiles').select('*');
      if (selErr) return { saved: false };

      const rows = Array.isArray(allRows) ? allRows : [];
      const prevClean = (prevRoleTitle || '').trim().toLowerCase();
      const currClean = (item.role_title || '').trim().toLowerCase();

      const existingRow = rows.find((r: any) => {
        if (r.id && item.id && r.id === item.id) return true;
        if (prevClean && (r.role_title || '').trim().toLowerCase() === prevClean) return true;
        if (currClean && (r.role_title || '').trim().toLowerCase() === currClean) return true;
        return false;
      });

      const reqs =
        item.requirements && item.requirements.length > 0
          ? item.requirements
          : item.technical_competencies || [];
      const sup = item.reports_to || item.direct_supervisor || 'Managing Director';

      // Opsi A: Skema Lengkap (semua kolom aplikasi)
      const fullPayload: Record<string, any> = {
        role_title: item.role_title,
        department: item.department || 'Creative',
        summary: item.summary || '',
        key_responsibilities: item.key_responsibilities || [],
        technical_competencies: reqs,
        behavioral_traits: item.behavioral_traits || [],
        direct_supervisor: sup,
        reports_to: sup,
        requirements: reqs,
        core_kpis: item.core_kpis || [],
        updated_at: new Date().toISOString(),
      };

      // Opsi B: Skema SQL DDL (role_summary, directsupervisor, required_competencies, kpi_indicators)
      const sqlSchemaPayload: Record<string, any> = {
        role_title: item.role_title,
        department: item.department || 'Creative',
        directsupervisor: sup,
        role_summary: item.summary || '',
        key_responsibilities: item.key_responsibilities || [],
        required_competencies: reqs,
        kpi_indicators: item.core_kpis || [],
        updated_at: new Date().toISOString(),
      };

      // Opsi C: Kolom Inti Minimal
      const corePayload: Record<string, any> = {
        role_title: item.role_title,
        department: item.department || 'Creative',
        key_responsibilities: item.key_responsibilities || [],
      };

      if (existingRow && existingRow.id) {
        const { data: u1, error: e1 } = await client
          .from('job_profiles')
          .update(fullPayload)
          .eq('id', existingRow.id)
          .select('*')
          .maybeSingle();
        if (!e1) return { saved: true, dbRow: u1 || { ...existingRow, ...fullPayload } };

        const { data: u2, error: e2 } = await client
          .from('job_profiles')
          .update(sqlSchemaPayload)
          .eq('id', existingRow.id)
          .select('*')
          .maybeSingle();
        if (!e2) return { saved: true, dbRow: u2 || { ...existingRow, ...sqlSchemaPayload } };

        const { data: u3, error: e3 } = await client
          .from('job_profiles')
          .update(corePayload)
          .eq('id', existingRow.id)
          .select('*')
          .maybeSingle();
        if (!e3) return { saved: true, dbRow: u3 || { ...existingRow, ...corePayload } };
      } else {
        const targetId = item.id || generateUuid();
        const { data: i1, error: ie1 } = await client
          .from('job_profiles')
          .upsert({ id: targetId, ...fullPayload }, { onConflict: 'id' })
          .select('*')
          .maybeSingle();
        if (!ie1) return { saved: true, dbRow: i1 || { id: targetId, ...fullPayload } };

        const { data: i2, error: ie2 } = await client
          .from('job_profiles')
          .upsert({ id: targetId, ...sqlSchemaPayload }, { onConflict: 'id' })
          .select('*')
          .maybeSingle();
        if (!ie2) return { saved: true, dbRow: i2 || { id: targetId, ...sqlSchemaPayload } };

        const safeId = isValidUuid(targetId) ? targetId : generateUuid();
        const { data: i3, error: ie3 } = await client
          .from('job_profiles')
          .upsert({ id: safeId, ...sqlSchemaPayload }, { onConflict: 'id' })
          .select('*')
          .maybeSingle();
        if (!ie3) return { saved: true, dbRow: i3 || { id: safeId, ...sqlSchemaPayload } };

        const { data: i4, error: ie4 } = await client
          .from('job_profiles')
          .upsert({ id: safeId, ...corePayload }, { onConflict: 'id' })
          .select('*')
          .maybeSingle();
        if (!ie4) return { saved: true, dbRow: i4 || { id: safeId, ...corePayload } };
      }
    } catch (e: any) {
      console.warn('Supabase saveSingleJobProfileToSupabase fallback:', e?.message);
    }
    return { saved: false };
  },

  async getJobProfiles(): Promise<JobProfile[]> {
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client.from('job_profiles').select('*').order('role_title', { ascending: true });
        if (!error && data && data.length === 0 && localJobProfiles.length > 0 && editedJobProfilesMap.size === 0) {
          for (const jp of localJobProfiles) {
            await this.saveSingleJobProfileToSupabase(jp);
          }
        } else if (!error && data && data.length > 0) {
          const mergedMap = new Map<string, JobProfile>();
          data.forEach((row: any) => {
            const roleClean = (row.role_title || '').trim().toLowerCase();
            if (deletedJobProfileIds.has(row.id) || deletedJobProfileIds.has(roleClean)) return;

            const defaultMatch = DEFAULT_JOB_PROFILES.find(
              (d) => d.id === row.id || d.role_title.toLowerCase() === roleClean
            );

            const reqList =
              Array.isArray(row.requirements) && row.requirements.length > 0
                ? row.requirements
                : Array.isArray(row.required_competencies) && row.required_competencies.length > 0
                ? row.required_competencies
                : Array.isArray(row.technical_competencies) && row.technical_competencies.length > 0
                ? row.technical_competencies
                : defaultMatch?.requirements || defaultMatch?.technical_competencies || [];

            const kpiList =
              Array.isArray(row.core_kpis) && row.core_kpis.length > 0
                ? row.core_kpis
                : Array.isArray(row.kpi_indicators) && row.kpi_indicators.length > 0
                ? row.kpi_indicators
                : defaultMatch?.core_kpis || [];

            const respList =
              Array.isArray(row.key_responsibilities) && row.key_responsibilities.length > 0
                ? row.key_responsibilities
                : defaultMatch?.key_responsibilities || [];

            const traitsList =
              Array.isArray(row.behavioral_traits) && row.behavioral_traits.length > 0
                ? row.behavioral_traits
                : defaultMatch?.behavioral_traits || [];

            const sup =
              row.reports_to ||
              row.direct_supervisor ||
              row.directsupervisor ||
              row.DirectSupervisor ||
              defaultMatch?.reports_to ||
              defaultMatch?.direct_supervisor ||
              'Managing Director';

            mergedMap.set(row.id, {
              id: row.id,
              role_title: row.role_title,
              department: row.department || defaultMatch?.department || 'Creative',
              summary: row.summary || row.role_summary || defaultMatch?.summary || '',
              key_responsibilities: respList,
              technical_competencies: reqList,
              behavioral_traits: traitsList,
              direct_supervisor: sup,
              reports_to: sup,
              requirements: reqList,
              core_kpis: kpiList,
              job_checklists: Array.isArray(row.job_checklists) ? row.job_checklists : defaultMatch?.job_checklists,
              workflow_steps: Array.isArray(row.workflow_steps) ? row.workflow_steps : defaultMatch?.workflow_steps,
            });
          });

          // Pastikan semua perubahan sesi aktif (editedJobProfilesMap) menimpa dan tidak terduplikasi
          editedJobProfilesMap.forEach((edited) => {
            const roleClean = (edited.role_title || '').trim().toLowerCase();
            if (deletedJobProfileIds.has(edited.id) || deletedJobProfileIds.has(roleClean)) return;
            for (const [k, v] of mergedMap.entries()) {
              if (k === edited.id || (v.role_title || '').trim().toLowerCase() === roleClean) {
                mergedMap.delete(k);
              }
            }
            mergedMap.set(edited.id, edited);
          });

          localJobProfiles = Array.from(mergedMap.values());
        }
      } catch {
        // fallback to RAM if table not created yet
      }
    }
    return localJobProfiles.map((jp) => ({
      ...jp,
      job_checklists:
        jp.job_checklists && jp.job_checklists.length > 0
          ? jp.job_checklists
          : [
              {
                id: `chk-${jp.id}-1`,
                task: `Briefing & Sinkronisasi Target Harian (${jp.role_title})`,
                frequency: 'Harian',
                is_completed: true,
              },
              {
                id: `chk-${jp.id}-2`,
                task: `Eksekusi Deliverable Utama & Quality Control Standar Skena`,
                frequency: 'Harian',
                is_completed: true,
              },
              {
                id: `chk-${jp.id}-3`,
                task: `Update Progress Jurnal Sprint & Laporan Mingguan ke ${jp.reports_to || jp.direct_supervisor || 'Supervisor'}`,
                frequency: 'Mingguan',
                is_completed: false,
              },
              {
                id: `chk-${jp.id}-4`,
                task: `Evaluasi Capaian KPI, Arsip Aset & Retrospective Bulanan`,
                frequency: 'Bulanan',
                is_completed: false,
              },
            ],
      workflow_steps:
        jp.workflow_steps && jp.workflow_steps.length > 0
          ? jp.workflow_steps
          : [
              {
                step_number: 1,
                stage_title: 'Tahap 1: Inisiasi & Alignment Brief',
                description: `Menerima brief strategis/teknis untuk fungsi ${jp.role_title} dan menyepakati timeline kerja.`,
                pic_output: 'Dokumen Brief & Sprint Backlog Terkonfirmasi',
              },
              {
                step_number: 2,
                stage_title: 'Tahap 2: Eksekusi & Produksi Terukur',
                description: `Menjalankan tanggung jawab utama ${jp.department} sesuai SOP kualitas PT Skena Wahana Kreatif.`,
                pic_output: 'Draft Deliverable / Output Kerja Utama',
              },
              {
                step_number: 3,
                stage_title: 'Tahap 3: Review Supervisor & Quality Assurance',
                description: `Melakukan pengecekan kualitas bersama ${jp.reports_to || jp.direct_supervisor || 'Atasan Langsung'} sebelum rilis.`,
                pic_output: 'Approved Deliverable (Zero Major Error)',
              },
              {
                step_number: 4,
                stage_title: 'Tahap 4: Publikasi, Arsip & Evaluasi KPI',
                description: 'Mendokumentasikan hasil akhir ke penyimpanan terpusat dan mencatat metrik performa.',
                pic_output: 'Laporan KPI & Dokumentasi Arsip Lengkap',
              },
            ],
    }));
  },

  async upsertJobProfile(payload: Partial<JobProfile>): Promise<JobProfile> {
    const targetId = payload.id || `jp-${Date.now()}`;
    const idx = localJobProfiles.findIndex(
      (jp) =>
        jp.id === targetId ||
        (payload.id && jp.id === payload.id) ||
        (!payload.id &&
          payload.role_title &&
          jp.role_title.trim().toLowerCase() === payload.role_title.trim().toLowerCase())
    );
    const prev = idx >= 0 ? { ...localJobProfiles[idx] } : null;
    const effectiveId = prev?.id || targetId;

    const cleanResponsibilities = (payload.key_responsibilities ?? prev?.key_responsibilities ?? [])
      .map((s) => String(s).trim())
      .filter(Boolean);

    const rawReqs =
      payload.requirements !== undefined
        ? payload.requirements
        : payload.technical_competencies !== undefined
        ? payload.technical_competencies
        : prev?.requirements || prev?.technical_competencies || [];
    const cleanReqs = rawReqs.map((s) => String(s).trim()).filter(Boolean);

    const cleanKpis = (payload.core_kpis ?? prev?.core_kpis ?? [])
      .map((s) => String(s).trim())
      .filter(Boolean);

    const cleanTraits = (payload.behavioral_traits ?? prev?.behavioral_traits ?? [])
      .map((s) => String(s).trim())
      .filter(Boolean);

    const supervisor =
      (payload.reports_to ?? payload.direct_supervisor ?? prev?.reports_to ?? prev?.direct_supervisor ?? 'Managing Director').trim() ||
      'Managing Director';

    const item: JobProfile = {
      id: effectiveId,
      role_title: (payload.role_title || prev?.role_title || 'Role Baru').trim(),
      department: payload.department || prev?.department || 'Creative',
      summary: (payload.summary ?? prev?.summary ?? '').trim(),
      key_responsibilities: cleanResponsibilities,
      technical_competencies: cleanReqs,
      behavioral_traits: cleanTraits,
      direct_supervisor: supervisor,
      reports_to: supervisor,
      requirements: cleanReqs,
      core_kpis: cleanKpis,
      job_checklists: payload.job_checklists ?? prev?.job_checklists,
      workflow_steps: payload.workflow_steps ?? prev?.workflow_steps,
    };

    if (idx >= 0) localJobProfiles[idx] = item;
    else localJobProfiles.push(item);

    editedJobProfilesMap.set(item.id, item);
    deletedJobProfileIds.delete(item.id);
    deletedJobProfileIds.delete(item.role_title.toLowerCase());

    const res = await this.saveSingleJobProfileToSupabase(item, prev?.role_title);
    if (res.saved && res.dbRow?.id && res.dbRow.id !== item.id) {
      const dbId = res.dbRow.id;
      editedJobProfilesMap.delete(item.id);
      item.id = dbId;
      editedJobProfilesMap.set(dbId, item);
      const currIdx = localJobProfiles.findIndex((jp) => jp.role_title === item.role_title);
      if (currIdx >= 0) localJobProfiles[currIdx] = item;
    }

    notifyRealtimeListeners('job_profiles', idx >= 0 ? 'UPDATE' : 'INSERT');
    return item;
  },

  async deleteJobProfile(id: string): Promise<void> {
    const target = localJobProfiles.find((jp) => jp.id === id);
    deletedJobProfileIds.add(id);
    if (target?.role_title) {
      deletedJobProfileIds.add(target.role_title.trim().toLowerCase());
    }
    editedJobProfilesMap.delete(id);
    localJobProfiles = localJobProfiles.filter((jp) => jp.id !== id);
    notifyRealtimeListeners('job_profiles', 'DELETE');

    const client = getSupabase();
    if (client) {
      try {
        await client.from('job_profiles').delete().eq('id', id);
        if (target?.role_title) {
          await client.from('job_profiles').delete().eq('role_title', target.role_title);
        }
      } catch {
        // ignore
      }
    }
  },

  // 11. LMS Curriculum & Training Modules (Tersinkronisasi Penuh dengan Supabase & Multi-Skema)
  async saveSingleLmsToSupabase(
    item: LmsCurriculum,
    prevTitle?: string
  ): Promise<{ saved: boolean; dbRow?: any }> {
    const client = getSupabase();
    if (!client) return { saved: false };

    try {
      const { data: allRows, error: selErr } = await client.from('lms_curriculum').select('*');
      if (selErr) return { saved: false };

      const rows = Array.isArray(allRows) ? allRows : [];
      const prevClean = (prevTitle || '').trim().toLowerCase();
      const currClean = (item.title || '').trim().toLowerCase();

      const existingRow = rows.find((r: any) => {
        if (r.id && item.id && r.id === item.id) return true;
        if (prevClean && (r.title || '').trim().toLowerCase() === prevClean) return true;
        if (currClean && (r.title || '').trim().toLowerCase() === currClean) return true;
        return false;
      });

      const objs =
        item.learning_objectives && item.learning_objectives.length > 0
          ? item.learning_objectives
          : item.key_skills_learned || [];

      const modCode =
        existingRow?.module_code ||
        item.id.toUpperCase().replace(/[^A-Z0-9-]/g, '') ||
        `LMS-${Math.floor(Math.random() * 9000 + 1000)}`;

      // Opsi A: Skema Lengkap Aplikasi
      const fullPayload: Record<string, any> = {
        title: item.title,
        department: item.department || 'Creative',
        category: item.category || 'Creative & Production',
        duration_hours: Number(item.duration_hours ?? 8),
        level: item.level || 'Intermediate',
        description: item.description || '',
        key_skills_learned: objs,
        status: item.status || 'Aktif',
        target_roles: item.target_roles || ['Semua Tim Skena'],
        target_competency_codes: item.target_competency_codes || ['KPI-CRE-01'],
        learning_objectives: objs,
        updated_at: new Date().toISOString(),
      };

      // Opsi B: Skema SQL DDL (module_code, department_focus, syllabus_summary, learning_objectives, dll)
      const sqlSchemaPayload: Record<string, any> = {
        module_code: modCode,
        title: item.title,
        category: item.category || 'Creative & Production',
        department_focus: item.department || 'Creative',
        duration_hours: Number(item.duration_hours ?? 8),
        syllabus_summary: item.description || '',
        learning_objectives: objs,
        target_roles: item.target_roles || ['Semua Tim Skena'],
        target_competency_codes: item.target_competency_codes || ['KPI-CRE-01'],
        updated_at: new Date().toISOString(),
      };

      // Opsi C: Kolom Inti Minimal
      const corePayload: Record<string, any> = {
        title: item.title,
        category: item.category || 'Creative & Production',
        duration_hours: Number(item.duration_hours ?? 8),
        learning_objectives: objs,
        target_roles: item.target_roles || ['Semua Tim Skena'],
        target_competency_codes: item.target_competency_codes || ['KPI-CRE-01'],
      };

      if (existingRow && existingRow.id) {
        const { data: u1, error: e1 } = await client
          .from('lms_curriculum')
          .update(fullPayload)
          .eq('id', existingRow.id)
          .select('*')
          .maybeSingle();
        if (!e1) return { saved: true, dbRow: u1 || { ...existingRow, ...fullPayload } };

        const { data: u2, error: e2 } = await client
          .from('lms_curriculum')
          .update(sqlSchemaPayload)
          .eq('id', existingRow.id)
          .select('*')
          .maybeSingle();
        if (!e2) return { saved: true, dbRow: u2 || { ...existingRow, ...sqlSchemaPayload } };

        const { data: u3, error: e3 } = await client
          .from('lms_curriculum')
          .update(corePayload)
          .eq('id', existingRow.id)
          .select('*')
          .maybeSingle();
        if (!e3) return { saved: true, dbRow: u3 || { ...existingRow, ...corePayload } };
      } else {
        const targetId = item.id || generateUuid();
        const { data: i1, error: ie1 } = await client
          .from('lms_curriculum')
          .upsert({ id: targetId, ...fullPayload }, { onConflict: 'id' })
          .select('*')
          .maybeSingle();
        if (!ie1) return { saved: true, dbRow: i1 || { id: targetId, ...fullPayload } };

        const { data: i2, error: ie2 } = await client
          .from('lms_curriculum')
          .upsert({ id: targetId, ...sqlSchemaPayload }, { onConflict: 'id' })
          .select('*')
          .maybeSingle();
        if (!ie2) return { saved: true, dbRow: i2 || { id: targetId, ...sqlSchemaPayload } };

        const safeId = isValidUuid(targetId) ? targetId : generateUuid();
        const { data: i3, error: ie3 } = await client
          .from('lms_curriculum')
          .upsert({ id: safeId, ...sqlSchemaPayload }, { onConflict: 'id' })
          .select('*')
          .maybeSingle();
        if (!ie3) return { saved: true, dbRow: i3 || { id: safeId, ...sqlSchemaPayload } };

        const { data: i4, error: ie4 } = await client
          .from('lms_curriculum')
          .upsert({ id: safeId, ...corePayload }, { onConflict: 'id' })
          .select('*')
          .maybeSingle();
        if (!ie4) return { saved: true, dbRow: i4 || { id: safeId, ...corePayload } };
      }
    } catch (e: any) {
      console.warn('Supabase saveSingleLmsToSupabase fallback:', e?.message);
    }
    return { saved: false };
  },

  async getLmsCurriculum(): Promise<LmsCurriculum[]> {
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client.from('lms_curriculum').select('*').order('title', { ascending: true });
        if (!error && data && data.length === 0 && localCurriculum.length > 0 && editedCurriculumMap.size === 0) {
          for (const c of localCurriculum) {
            await this.saveSingleLmsToSupabase(c);
          }
        } else if (!error && data && data.length > 0) {
          const mergedMap = new Map<string, LmsCurriculum>();
          data.forEach((row: any) => {
            const titleClean = (row.title || '').trim().toLowerCase();
            if (deletedCurriculumIds.has(row.id) || deletedCurriculumIds.has(titleClean)) return;

            const defaultMatch = DEFAULT_LMS_CURRICULUM.find(
              (d) => d.id === row.id || d.title.toLowerCase() === titleClean
            );

            const objs =
              Array.isArray(row.learning_objectives) && row.learning_objectives.length > 0
                ? row.learning_objectives
                : Array.isArray(row.key_skills_learned) && row.key_skills_learned.length > 0
                ? row.key_skills_learned
                : defaultMatch?.learning_objectives || defaultMatch?.key_skills_learned || [];

            mergedMap.set(row.id, {
              id: row.id,
              title: row.title,
              department: row.department || row.department_focus || defaultMatch?.department || 'Creative',
              category: (row.category || defaultMatch?.category || 'Creative & Production') as any,
              duration_hours: Number(row.duration_hours ?? defaultMatch?.duration_hours ?? 10),
              level: (row.level || defaultMatch?.level || 'Intermediate') as any,
              description: row.description || row.syllabus_summary || defaultMatch?.description || '',
              key_skills_learned: objs,
              status: (row.status || defaultMatch?.status || 'Aktif') as any,
              target_roles:
                Array.isArray(row.target_roles) && row.target_roles.length > 0
                  ? row.target_roles
                  : defaultMatch?.target_roles || ['Semua Tim Skena'],
              target_competency_codes:
                Array.isArray(row.target_competency_codes) && row.target_competency_codes.length > 0
                  ? row.target_competency_codes
                  : defaultMatch?.target_competency_codes || ['KPI-CRE-01'],
              learning_objectives: objs,
            });
          });

          // Terapkan seluruh edit sesi aktif (editedCurriculumMap) agar tidak pernah hilang/tertimpa
          editedCurriculumMap.forEach((edited) => {
            const titleClean = (edited.title || '').trim().toLowerCase();
            if (deletedCurriculumIds.has(edited.id) || deletedCurriculumIds.has(titleClean)) return;
            for (const [k, v] of mergedMap.entries()) {
              if (k === edited.id || (v.title || '').trim().toLowerCase() === titleClean) {
                mergedMap.delete(k);
              }
            }
            mergedMap.set(edited.id, edited);
          });

          localCurriculum = Array.from(mergedMap.values());
        }
      } catch {
        // fallback
      }
    }
    return [...localCurriculum];
  },

  async upsertLmsCurriculum(payload: Partial<LmsCurriculum>): Promise<LmsCurriculum> {
    const targetId = payload.id || `lms-${Date.now()}`;
    const idx = localCurriculum.findIndex(
      (c) =>
        c.id === targetId ||
        (payload.id && c.id === payload.id) ||
        (!payload.id && payload.title && c.title.trim().toLowerCase() === payload.title.trim().toLowerCase())
    );
    const prev = idx >= 0 ? { ...localCurriculum[idx] } : null;
    const effectiveId = prev?.id || targetId;

    const rawObjs =
      payload.learning_objectives !== undefined
        ? payload.learning_objectives
        : payload.key_skills_learned !== undefined
        ? payload.key_skills_learned
        : prev?.learning_objectives || prev?.key_skills_learned || [];
    const cleanObjs = rawObjs.map((s) => String(s).trim()).filter(Boolean);

    const cleanRoles = (payload.target_roles ?? prev?.target_roles ?? ['Semua Tim Skena'])
      .map((s) => String(s).trim())
      .filter(Boolean);

    const cleanCodes = (payload.target_competency_codes ?? prev?.target_competency_codes ?? ['KPI-CRE-01'])
      .map((s) => String(s).trim())
      .filter(Boolean);

    const item: LmsCurriculum = {
      id: effectiveId,
      title: (payload.title || prev?.title || 'Modul Baru').trim(),
      department: payload.department || prev?.department || 'Creative',
      category: (payload.category || prev?.category || 'Creative & Production') as any,
      duration_hours: Number(payload.duration_hours ?? prev?.duration_hours ?? 10),
      level: (payload.level || prev?.level || 'Intermediate') as any,
      description: (payload.description ?? prev?.description ?? '').trim(),
      key_skills_learned: cleanObjs,
      status: (payload.status || prev?.status || 'Aktif') as any,
      target_roles: cleanRoles.length > 0 ? cleanRoles : ['Semua Tim Skena'],
      target_competency_codes: cleanCodes.length > 0 ? cleanCodes : ['KPI-CRE-01'],
      learning_objectives: cleanObjs,
    };

    if (idx >= 0) localCurriculum[idx] = item;
    else localCurriculum.push(item);

    editedCurriculumMap.set(item.id, item);
    deletedCurriculumIds.delete(item.id);
    deletedCurriculumIds.delete(item.title.toLowerCase());

    const res = await this.saveSingleLmsToSupabase(item, prev?.title);
    if (res.saved && res.dbRow?.id && res.dbRow.id !== item.id) {
      const dbId = res.dbRow.id;
      editedCurriculumMap.delete(item.id);
      item.id = dbId;
      editedCurriculumMap.set(dbId, item);
      const currIdx = localCurriculum.findIndex((c) => c.title === item.title);
      if (currIdx >= 0) localCurriculum[currIdx] = item;
    }

    notifyRealtimeListeners('lms_curriculum', idx >= 0 ? 'UPDATE' : 'INSERT');
    return item;
  },

  async deleteLmsCurriculum(id: string): Promise<void> {
    const target = localCurriculum.find((c) => c.id === id);
    deletedCurriculumIds.add(id);
    if (target?.title) {
      deletedCurriculumIds.add(target.title.trim().toLowerCase());
    }
    editedCurriculumMap.delete(id);
    localCurriculum = localCurriculum.filter((c) => c.id !== id);
    notifyRealtimeListeners('lms_curriculum', 'DELETE');

    const client = getSupabase();
    if (client) {
      try {
        await client.from('lms_curriculum').delete().eq('id', id);
        if (target?.title) {
          await client.from('lms_curriculum').delete().eq('title', target.title);
        }
      } catch {
        // ignore
      }
    }
  },

  // 12. User Account Database Management (Langsung ke Tabel `user_accounts` di Database Supabase)
  getUsers(): AppUser[] {
    return [...localUsers];
  },

  // Helper internal: simpan satu akun langsung ke tabel `user_accounts` di Supabase
  async saveSingleAccountToSupabaseTable(
    account: AppUser,
    previousUsername?: string
  ): Promise<{ savedToSupabase: boolean; dbRow?: any; errorMsg?: string }> {
    try {
      // 1. Cari apakah baris akun ini sudah ada di tabel `user_accounts` Supabase
      const { data: allRows, error: selectErr } = await supabase.from('user_accounts').select('*');

      if (selectErr) {
        return { savedToSupabase: false, errorMsg: selectErr.message };
      }

      const rows = Array.isArray(allRows) ? allRows : [];
      const prevUserClean = (previousUsername || '').trim().toLowerCase();
      const newUserClean = (account.username || '').trim().toLowerCase();
      const emailClean = (account.email || '').trim().toLowerCase();

      const existingRow = rows.find((r: any) => {
        if (r.id && r.id === account.id) return true;
        if (prevUserClean && (r.username || '').toLowerCase() === prevUserClean) return true;
        if (newUserClean && (r.username || '').toLowerCase() === newUserClean) return true;
        if (account.employeeNik && r.employee_nik && r.employee_nik === account.employeeNik && r.role === account.role) {
          return true;
        }
        if (account.employeeId && r.employee_id && r.employee_id === account.employeeId && r.role === account.role) {
          return true;
        }
        if (emailClean && (r.email || '').toLowerCase() === emailClean && r.role === account.role) {
          return true;
        }
        return false;
      });

      const fullPayload: Record<string, any> = {
        name: account.name,
        email: account.email || `${account.username}@skena.id`,
        username: account.username,
        password: account.password || 'password123',
        role: account.role,
        employee_id: account.employeeId || null,
        employee_nik: account.employeeNik || null,
        role_title: account.roleTitle || null,
        department: account.department || null,
        employment_status: account.employmentStatus || 'Full Time',
        updated_at: new Date().toISOString(),
      };

      // JIKA BARIS SUDAH ADA DI SUPABASE -> UPDATE BARIS TERSEBUT SECARA LANGSUNG
      if (existingRow && existingRow.id) {
        const { data: upd1, error: err1 } = await supabase
          .from('user_accounts')
          .update(fullPayload)
          .eq('id', existingRow.id)
          .select()
          .maybeSingle();

        if (!err1) {
          return { savedToSupabase: true, dbRow: upd1 || { ...existingRow, ...fullPayload } };
        }

        // Fallback jika kolom employee_id memiliki foreign key constraint
        const payloadNoEmpId = { ...fullPayload, employee_id: null };
        const { data: upd2, error: err2 } = await supabase
          .from('user_accounts')
          .update(payloadNoEmpId)
          .eq('id', existingRow.id)
          .select()
          .maybeSingle();

        if (!err2) {
          return { savedToSupabase: true, dbRow: upd2 || { ...existingRow, ...payloadNoEmpId } };
        }

        // Fallback kolom inti jika tabel dibuat dengan kolom minimal
        const corePayload = {
          name: account.name,
          email: account.email || `${account.username}@skena.id`,
          username: account.username,
          password: account.password || 'password123',
          role: account.role,
        };
        const { data: upd3, error: err3 } = await supabase
          .from('user_accounts')
          .update(corePayload)
          .eq('id', existingRow.id)
          .select()
          .maybeSingle();

        if (!err3) {
          return { savedToSupabase: true, dbRow: upd3 || { ...existingRow, ...corePayload } };
        }

        return { savedToSupabase: false, errorMsg: err3.message };
      }

      // JIKA BARIS BELUM ADA DI SUPABASE -> INSERT / UPSERT BARIS BARU
      const rowWithId = { id: account.id, ...fullPayload };
      const { data: ins1, error: insErr1 } = await supabase
        .from('user_accounts')
        .upsert(rowWithId, { onConflict: 'id' })
        .select()
        .maybeSingle();

      if (!insErr1) {
        return { savedToSupabase: true, dbRow: ins1 || rowWithId };
      }

      // Fallback jika kolom ID menuntut UUID atau employee_id terkendala FK
      const uuidId = isValidUuid(account.id) ? account.id : generateUuid();
      const rowSafeFk = {
        id: uuidId,
        ...fullPayload,
        employee_id: isValidUuid(account.employeeId) ? account.employeeId : null,
      };
      const { data: ins2, error: insErr2 } = await supabase
        .from('user_accounts')
        .upsert(rowSafeFk, { onConflict: 'username' })
        .select()
        .maybeSingle();

      if (!insErr2) {
        return { savedToSupabase: true, dbRow: ins2 || rowSafeFk };
      }

      // Fallback terakhir: insert kolom inti
      const coreInsert = {
        id: uuidId,
        name: account.name,
        email: account.email || `${account.username}@skena.id`,
        username: account.username,
        password: account.password || 'password123',
        role: account.role,
      };
      const { data: ins3, error: insErr3 } = await supabase
        .from('user_accounts')
        .insert(coreInsert)
        .select()
        .maybeSingle();

      if (!insErr3) {
        return { savedToSupabase: true, dbRow: ins3 || coreInsert };
      }

      return { savedToSupabase: false, errorMsg: insErr3.message };
    } catch (e: any) {
      return { savedToSupabase: false, errorMsg: e?.message || 'Unknown Supabase error' };
    }
  },

  async fetchUsersFromSupabase(): Promise<AppUser[]> {
    const { data, error } = await supabase.from('user_accounts').select('*').order('name', { ascending: true });
    if (error) {
      console.error('Supabase fetchUsersFromSupabase error:', error.message);
      return [...localUsers];
    }

    // Jika tabel `user_accounts` di Supabase masih kosong (0 baris), otomatis seed akun awal ke Supabase
    if (data && data.length === 0) {
      for (const u of DEFAULT_USERS) {
        await this.saveSingleAccountToSupabaseTable(u);
      }
      const { data: seededData } = await supabase
        .from('user_accounts')
        .select('*')
        .order('name', { ascending: true });
      if (seededData && seededData.length > 0) {
        localUsers = seededData.map((row: any) => ({
          id: row.id,
          name: row.name,
          email: row.email || `${row.username}@skena.id`,
          username: row.username,
          password: row.password || 'password123',
          role: row.role === 'admin' ? 'admin' : 'employee',
          employeeId: row.employee_id || undefined,
          employeeNik: row.employee_nik || undefined,
          roleTitle: row.role_title || undefined,
          department: row.department || undefined,
          employmentStatus: (row.employment_status as EmploymentStatus) || 'Full Time',
        }));
        return [...localUsers];
      }
    }

    if (data && data.length > 0) {
      localUsers = data.map((row: any) => ({
        id: row.id,
        name: row.name,
        email: row.email || `${row.username}@skena.id`,
        username: row.username,
        password: row.password || 'password123',
        role: row.role === 'admin' ? 'admin' : 'employee',
        employeeId: row.employee_id || undefined,
        employeeNik: row.employee_nik || undefined,
        roleTitle: row.role_title || undefined,
        department: row.department || undefined,
        employmentStatus: (row.employment_status as EmploymentStatus) || 'Full Time',
      }));
    }

    return [...localUsers];
  },

  /**
   * Verifikasi Login secara langsung terhadap tabel `user_accounts` di Database Supabase.
   * Tidak menggunakan fallback data bawaan di RAM.
   */
  async authenticateUserFromSupabase(
    identifier: string,
    passwordInput: string,
    role: 'admin' | 'employee'
  ): Promise<{
    success: boolean;
    user?: AppUser;
    errorMessage?: string;
  }> {
    const cleanInput = (identifier || '').trim().toLowerCase();
    if (!cleanInput || !passwordInput) {
      return {
        success: false,
        errorMessage: 'Username dan Password wajib diisi!',
      };
    }

    const { data, error } = await supabase.from('user_accounts').select('*');
    if (error) {
      return {
        success: false,
        errorMessage: `Gagal memverifikasi akun pada server database: ${error.message}`,
      };
    }

    let rows = Array.isArray(data) ? data : [];
    // Jika tabel masih kosong, seed akun awal terlebih dahulu
    if (rows.length === 0) {
      for (const u of DEFAULT_USERS) {
        await this.saveSingleAccountToSupabaseTable(u);
      }
      const { data: refetched } = await supabase.from('user_accounts').select('*');
      rows = Array.isArray(refetched) ? refetched : [];
    }

    const dbUsers: AppUser[] = rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email || `${row.username}@skena.id`,
      username: row.username,
      password: row.password || 'password123',
      role: row.role === 'admin' ? 'admin' : 'employee',
      employeeId: row.employee_id || undefined,
      employeeNik: row.employee_nik || undefined,
      roleTitle: row.role_title || undefined,
      department: row.department || undefined,
      employmentStatus: (row.employment_status as EmploymentStatus) || 'Full Time',
    }));

    localUsers = dbUsers;

    const roleUsers = dbUsers.filter((u) => u.role === role);
    const matchedUser = roleUsers.find(
      (u) =>
        (u.username || '').trim().toLowerCase() === cleanInput ||
        (u.email || '').trim().toLowerCase() === cleanInput ||
        (u.employeeNik || '').trim().toLowerCase() === cleanInput
    );

    if (!matchedUser) {
      return {
        success: false,
        errorMessage:
          role === 'admin'
            ? `Username Administrator "${identifier}" tidak ditemukan pada sistem database!`
            : `Akun Karyawan "${identifier}" tidak ditemukan pada sistem database!`,
      };
    }

    if (passwordInput !== matchedUser.password) {
      return {
        success: false,
        errorMessage: `Password tidak sesuai untuk akun @${matchedUser.username}!`,
      };
    }

    return {
      success: true,
      user: matchedUser,
    };
  },

  updateUserAccount(userId: string, updates: Partial<AppUser>, previousUsername?: string): AppUser {
    const idx = localUsers.findIndex((u) => u.id === userId);
    const oldUsername = idx >= 0 ? localUsers[idx].username : previousUsername;
    const targetUser: AppUser =
      idx >= 0
        ? { ...localUsers[idx], ...updates }
        : {
            id: userId || `u-acc-${Date.now()}`,
            name: updates.name || 'User Skena',
            email: updates.email || 'user@skena.id',
            username: updates.username || 'user',
            password: updates.password || 'password123',
            role: updates.role || 'employee',
            employeeId: updates.employeeId,
            employeeNik: updates.employeeNik,
            roleTitle: updates.roleTitle,
            department: updates.department,
            employmentStatus: updates.employmentStatus || 'Full Time',
          };

    if (idx >= 0) localUsers[idx] = targetUser;
    else localUsers.push(targetUser);

    this.saveSingleAccountToSupabaseTable(targetUser, oldUsername);
    notifyRealtimeListeners('user_accounts', idx >= 0 ? 'UPDATE' : 'INSERT');
    return targetUser;
  },

  async upsertUserAccountAsync(payload: Partial<AppUser>, previousUsername?: string): Promise<AppUser> {
    const userId = payload.id || `u-acc-${Date.now()}`;
    const existingAcc = localUsers.find((u) => u.id === userId);
    const oldUsername = previousUsername || existingAcc?.username;

    const candidate: AppUser = {
      id: userId,
      name: payload.name || existingAcc?.name || 'User Skena',
      email: payload.email || existingAcc?.email || `${payload.username || 'user'}@skena.id`,
      username: payload.username || existingAcc?.username || 'user',
      password: payload.password || existingAcc?.password || 'password123',
      role: payload.role || existingAcc?.role || 'employee',
      employeeId: payload.employeeId ?? existingAcc?.employeeId,
      employeeNik: payload.employeeNik ?? existingAcc?.employeeNik,
      roleTitle: payload.roleTitle ?? existingAcc?.roleTitle,
      department: payload.department ?? existingAcc?.department,
      employmentStatus: payload.employmentStatus || existingAcc?.employmentStatus || 'Full Time',
    };

    const result = await this.saveSingleAccountToSupabaseTable(candidate, oldUsername);
    if (!result.savedToSupabase) {
      throw new Error(result.errorMsg || 'Gagal menyimpan data akun ke server database');
    }

    if (result.dbRow?.id) {
      candidate.id = result.dbRow.id;
    }

    await this.fetchUsersFromSupabase();
    notifyRealtimeListeners('user_accounts', 'UPDATE');
    return candidate;
  },

  async deleteUserAccount(userId: string): Promise<void> {
    const targetAcc = localUsers.find((u) => u.id === userId);
    deletedUserIds.add(userId);
    editedUsersMap.delete(userId);
    localUsers = localUsers.filter((u) => u.id !== userId);

    await supabase.from('user_accounts').delete().eq('id', userId);
    if (targetAcc?.username) {
      await supabase.from('user_accounts').delete().eq('username', targetAcc.username);
    }
    notifyRealtimeListeners('user_accounts', 'DELETE');
  },

  // 13. Sinkronisasi / Seed Seluruh Data Awal & Akun ke Database Supabase (Khusus Administrator)
  async syncAllDataToSupabase(): Promise<{
    usersSynced: number;
    employeesSynced: number;
    competenciesSynced: number;
    schedulesSynced: number;
    kpiSynced: number;
    logsSynced: number;
    jobProfilesSynced: number;
    lmsSynced: number;
  }> {
    // 1. Sinkronkan Pengaturan Perusahaan
    await this.upsertSettings(localSettings);

    // 2. Sinkronkan Master Karyawan
    for (const emp of localEmployees) {
      await this.upsertEmployee(emp);
    }

    // 3. Sinkronkan Kamus Kompetensi / KPI
    for (const comp of localCompetencies) {
      await this.upsertCompetency(comp);
    }

    // 4. Sinkronkan Jadwal Kerja
    for (const sched of localSchedules) {
      await this.upsertSchedule(sched);
    }

    // 5. Sinkronkan Jurnal Sprint Harian & LMS (Activity Logs)
    for (const log of localActivityLogs) {
      await this.upsertActivityLog(log);
    }

    // 6. Sinkronkan Evaluasi KPI
    for (const kpi of localKpiList) {
      await this.upsertKpiEvaluation(kpi);
    }

    // 7. Sinkronkan Job Profiles & LMS Curriculum
    for (const jp of localJobProfiles) {
      await this.upsertJobProfile(jp);
    }
    for (const lms of localCurriculum) {
      await this.upsertLmsCurriculum(lms);
    }

    // 8. Sinkronkan Database Akun User (Username & Password)
    const allUsers = this.getUsers();
    for (const u of allUsers) {
      await this.upsertUserAccountAsync(u, u.username);
    }

    notifyRealtimeListeners('all_tables', 'SYNC');

    return {
      usersSynced: allUsers.length,
      employeesSynced: localEmployees.length,
      competenciesSynced: localCompetencies.length,
      schedulesSynced: localSchedules.length,
      kpiSynced: localKpiList.length,
      logsSynced: localActivityLogs.length,
      jobProfilesSynced: localJobProfiles.length,
      lmsSynced: localCurriculum.length,
    };
  },

  // 14. Proporsi Penilaian KPI (Bisa Diatur oleh Administrator)
  getKpiWeights(): KpiWeightConfig {
    return { ...localKpiWeights };
  },

  async saveKpiWeights(weights: KpiWeightConfig): Promise<KpiWeightConfig> {
    localKpiWeights = {
      sprint_weight_pct: Number(weights.sprint_weight_pct ?? 50),
      skill_weight_pct: Number(weights.skill_weight_pct ?? 30),
      project_weight_pct: Number(weights.project_weight_pct ?? 20),
    };
    const wSprint = localKpiWeights.sprint_weight_pct / 100;
    const wSkill = localKpiWeights.skill_weight_pct / 100;
    const wProj = localKpiWeights.project_weight_pct / 100;

    // Recalculate all local KPI evaluations with the new weights
    localKpiList = localKpiList.map((k) => {
      const qAvg = (Number(k.kpi_q1) + Number(k.kpi_q2) + Number(k.kpi_q3) + Number(k.kpi_q4)) / 4.0;
      const newFinal = Number(
        (qAvg * wSprint + Number(k.mid_review_score) * wSkill + Number(k.final_project_score) * wProj).toFixed(2)
      );
      return { ...k, final_kpi_score: newFinal };
    });

    notifyRealtimeListeners('kpi_evaluations', 'UPDATE');
    return { ...localKpiWeights };
  },

  async saveKpiWeightConfig(weights: KpiWeightConfig): Promise<KpiWeightConfig> {
    return this.saveKpiWeights(weights);
  },

  // 15. Senin Di Skena (Setiap Senin) & Bincang Kenyang (Setiap Jumat)
  async getSharingSessions(): Promise<SharingSessionItem[]> {
    return [...localSharingSessions].sort((a, b) => (b.session_date || '').localeCompare(a.session_date || ''));
  },

  async upsertSharingSession(payload: Partial<SharingSessionItem>): Promise<SharingSessionItem> {
    const targetId = payload.id || `ss-${Date.now()}`;
    const idx = localSharingSessions.findIndex((s) => s.id === targetId);
    const prev = idx >= 0 ? localSharingSessions[idx] : null;
    const progType = payload.program_type || prev?.program_type || 'Senin Di Skena';
    const deptOrRole = payload.speaker_department || payload.speaker_role || prev?.speaker_department || prev?.speaker_role || 'Creative';

    const item: SharingSessionItem = {
      id: targetId,
      program_type: progType,
      session_date: payload.session_date || prev?.session_date || todayIso,
      day_label:
        payload.day_label ||
        prev?.day_label ||
        (progType === 'Senin Di Skena' ? 'Senin Pagi (09:15 - 10:15 WITA)' : 'Jumat Siang (12:30 - 14:00 WITA)'),
      speaker_employee_id: payload.speaker_employee_id ?? prev?.speaker_employee_id,
      speaker_name: (payload.speaker_name || prev?.speaker_name || 'Tim Skena').trim(),
      speaker_department: deptOrRole,
      speaker_role: deptOrRole,
      topic_title: (payload.topic_title || prev?.topic_title || 'Materi Sharing Tim').trim(),
      material_summary: (payload.material_summary ?? prev?.material_summary ?? '').trim(),
      documentation_link: payload.documentation_link ?? prev?.documentation_link ?? '',
      remarks: (payload.remarks ?? prev?.remarks ?? '').trim(),
      status: payload.status || prev?.status || 'Terjadwal',
    };

    if (idx >= 0) localSharingSessions[idx] = item;
    else localSharingSessions.unshift(item);

    notifyRealtimeListeners('sharing_sessions', idx >= 0 ? 'UPDATE' : 'INSERT');
    return item;
  },

  async deleteSharingSession(id: string): Promise<void> {
    localSharingSessions = localSharingSessions.filter((s) => s.id !== id);
    notifyRealtimeListeners('sharing_sessions', 'DELETE');
  },

  // 16. One Year Plan (Annual Roadmap & Checklist)
  async getOneYearPlans(): Promise<OneYearPlanItem[]> {
    return [...localOneYearPlans];
  },

  async upsertOneYearPlan(payload: Partial<OneYearPlanItem>): Promise<OneYearPlanItem> {
    const targetId = payload.id || `oyp-${Date.now()}`;
    const idx = localOneYearPlans.findIndex((p) => p.id === targetId);
    const prev = idx >= 0 ? localOneYearPlans[idx] : null;
    const isDone = payload.is_completed ?? prev?.is_completed ?? false;
    const rawPct = Number(payload.progress_pct ?? prev?.progress_pct ?? (isDone ? 100 : 0));
    const resolvedMonth = (payload.target_month || payload.month_label || prev?.target_month || prev?.month_label || '2026').trim();
    const resolvedDept = payload.department || payload.category || prev?.department || prev?.category || 'Creative';
    const resolvedTitle = (payload.objective_title || payload.title || prev?.objective_title || prev?.title || 'Target Tahunan Baru').trim();
    const resolvedKpi = (payload.key_result_kpi ?? payload.target_metric ?? prev?.key_result_kpi ?? prev?.target_metric ?? '').trim();

    const item: OneYearPlanItem = {
      id: targetId,
      quarter: payload.quarter || prev?.quarter || 'Q1',
      target_month: resolvedMonth,
      month_label: resolvedMonth,
      department: resolvedDept,
      category: resolvedDept,
      objective_title: resolvedTitle,
      title: resolvedTitle,
      key_result_kpi: resolvedKpi,
      target_metric: resolvedKpi,
      pic_name: (payload.pic_name ?? prev?.pic_name ?? 'Tim Skena').trim(),
      budget_estimate: (payload.budget_estimate ?? prev?.budget_estimate ?? '-').trim(),
      progress_pct: isDone ? 100 : Math.min(100, Math.max(0, rawPct)),
      is_completed: isDone,
      status: isDone ? 'Completed' : (payload.status || prev?.status || 'On Track'),
      notes: (payload.notes ?? prev?.notes ?? '').trim(),
    };

    if (idx >= 0) localOneYearPlans[idx] = item;
    else localOneYearPlans.push(item);

    notifyRealtimeListeners('one_year_plans', idx >= 0 ? 'UPDATE' : 'INSERT');
    return item;
  },

  async toggleOneYearPlan(id: string): Promise<OneYearPlanItem | null> {
    const idx = localOneYearPlans.findIndex((p) => p.id === id);
    if (idx < 0) return null;
    const current = localOneYearPlans[idx];
    const nextDone = !current.is_completed;
    const updated: OneYearPlanItem = {
      ...current,
      is_completed: nextDone,
      progress_pct: nextDone ? 100 : current.progress_pct === 100 ? 75 : current.progress_pct,
    };
    localOneYearPlans[idx] = updated;
    notifyRealtimeListeners('one_year_plans', 'UPDATE');
    return updated;
  },

  async deleteOneYearPlan(id: string): Promise<void> {
    localOneYearPlans = localOneYearPlans.filter((p) => p.id !== id);
    notifyRealtimeListeners('one_year_plans', 'DELETE');
  },

  // 17. Executive Reminders & Dashboard Agenda (CSR Bulanan, Penggajian, Pengajuan Budget Rabu, Kontrak H-2 Bulan, Resign)
  async getExecutiveReminders(): Promise<ExecutiveReminderItem[]> {
    return [...localExecutiveReminders];
  },

  async upsertExecutiveReminder(payload: Partial<ExecutiveReminderItem>): Promise<ExecutiveReminderItem> {
    const targetId = payload.id || `rem-${Date.now()}`;
    const idx = localExecutiveReminders.findIndex((r) => r.id === targetId);
    const prev = idx >= 0 ? localExecutiveReminders[idx] : null;
    const resolvedSchedule = (payload.recurrence_label ?? payload.schedule_info ?? prev?.recurrence_label ?? prev?.schedule_info ?? 'Sesuai Jadwal').trim();
    const resolvedPic = (payload.assigned_to ?? payload.pic_name ?? prev?.assigned_to ?? prev?.pic_name ?? 'Administrator').trim();

    const item: ExecutiveReminderItem = {
      id: targetId,
      category: payload.category || prev?.category || 'Pengajuan Budget Rabu',
      title: (payload.title || prev?.title || 'Pengingat Kegiatan Baru').trim(),
      schedule_info: resolvedSchedule,
      recurrence_label: resolvedSchedule,
      due_date: payload.due_date || prev?.due_date || todayIso,
      pic_name: resolvedPic,
      assigned_to: resolvedPic,
      priority: payload.priority || prev?.priority || 'High',
      is_completed: payload.is_completed ?? prev?.is_completed ?? false,
      notes: (payload.notes ?? prev?.notes ?? '').trim(),
    };

    if (idx >= 0) localExecutiveReminders[idx] = item;
    else localExecutiveReminders.unshift(item);

    notifyRealtimeListeners('executive_reminders', idx >= 0 ? 'UPDATE' : 'INSERT');
    return item;
  },

  async saveExecutiveReminder(payload: Partial<ExecutiveReminderItem>): Promise<ExecutiveReminderItem[]> {
    await this.upsertExecutiveReminder(payload);
    return [...localExecutiveReminders];
  },

  async toggleExecutiveReminder(id: string): Promise<ExecutiveReminderItem | null> {
    const idx = localExecutiveReminders.findIndex((r) => r.id === id);
    if (idx < 0) return null;
    localExecutiveReminders[idx] = {
      ...localExecutiveReminders[idx],
      is_completed: !localExecutiveReminders[idx].is_completed,
    };
    notifyRealtimeListeners('executive_reminders', 'UPDATE');
    return localExecutiveReminders[idx];
  },

  async deleteExecutiveReminder(id: string): Promise<ExecutiveReminderItem[]> {
    localExecutiveReminders = localExecutiveReminders.filter((r) => r.id !== id);
    notifyRealtimeListeners('executive_reminders', 'DELETE');
    return [...localExecutiveReminders];
  },

  // 18. Ambil Seluruh Rapor & IDP Karyawan untuk Output Grafik Keseluruhan & Individu
  async getAllEmployeeReports(periodYear: string, periodTerm: string): Promise<Record<string, EmployeeReport>> {
    const result: Record<string, EmployeeReport> = {};
    const activeEmps = localEmployees.filter((e) => e.is_active);
    for (const emp of activeEmps) {
      const key = `${emp.id}-${periodYear}-${periodTerm}`;
      if (localReports[key]) {
        result[emp.id] = localReports[key];
      } else {
        // Generate default IDP/LMS report so overall team analytics is always complete
        const defaultModules: IdpLmsItem[] =
          emp.department === 'Creative'
            ? [
                {
                  module_name: 'Creative Direction & Visual Storytelling Skena',
                  category: 'LMS Course',
                  target_date: `${periodYear}-09-30`,
                  status: 'Completed',
                  score: '91',
                  mentor_notes: 'Sangat menguasai eksekusi visual hook & moodboard kampanye.',
                },
                {
                  module_name: 'Agile Content Sprint & Zero-Revision Workflow',
                  category: 'Mentoring',
                  target_date: `${periodYear}-11-15`,
                  status: 'In Progress',
                  score: '86',
                  mentor_notes: 'Perlu terus menjaga kecepatan koordinasi revisi minor.',
                },
                {
                  module_name: 'Flagship Multi-Brand Campaign Execution',
                  category: 'Project Assignment',
                  target_date: `${periodYear}-12-20`,
                  status: 'Planned',
                  score: '85',
                  mentor_notes: 'Target project akhir tahun lintas divisi.',
                },
              ]
            : emp.department === 'Sales & Marketing'
            ? [
                {
                  module_name: 'B2B Agency Pitching & High-Ticket Retainer Closing',
                  category: 'LMS Course',
                  target_date: `${periodYear}-09-30`,
                  status: 'Completed',
                  score: '89',
                  mentor_notes: 'Teknik presentasi klien korporat sangat persuasif.',
                },
                {
                  module_name: 'CRM Pipeline Optimization & Lead Nurturing',
                  category: 'Mentoring',
                  target_date: `${periodYear}-11-10`,
                  status: 'In Progress',
                  score: '85',
                  mentor_notes: 'Follow-up MQL ke SQL semakin konsisten.',
                },
                {
                  module_name: 'Ekspansi Klien Retainer Kuartal IV',
                  category: 'Project Assignment',
                  target_date: `${periodYear}-12-15`,
                  status: 'Planned',
                  score: '84',
                  mentor_notes: 'Fokus penutupan target tahunan.',
                },
              ]
            : [
                {
                  module_name: 'Operational Excellence, Finance & HR Compliance',
                  category: 'LMS Course',
                  target_date: `${periodYear}-09-25`,
                  status: 'Completed',
                  score: '92',
                  mentor_notes: 'Kepatuhan SOP dan ketepatan laporan sangat baik.',
                },
                {
                  module_name: 'Cross-Division SLA & Resource Optimization',
                  category: 'Mentoring',
                  target_date: `${periodYear}-11-12`,
                  status: 'Completed',
                  score: '88',
                  mentor_notes: 'Respons layanan internal sangat sigap.',
                },
                {
                  module_name: 'Audit Tahunan & Perencanaan Anggaran 2027',
                  category: 'Project Assignment',
                  target_date: `${periodYear}-12-22`,
                  status: 'In Progress',
                  score: '87',
                  mentor_notes: 'Persiapan tutup buku & evaluasi kontrak tahunan.',
                },
              ];

        const seededReport: EmployeeReport = {
          id: `rep-auto-${emp.id}`,
          employee_id: emp.id,
          period_year: periodYear,
          period_term: periodTerm,
          idp_lms_modules: defaultModules,
          behavioral_culture_notes: `${emp.full_name} menunjukkan dedikasi tinggi, kolaboratif dalam sprint lintas divisi, dan adaptif terhadap kurikulum pembelajaran PT Skena Wahana Kreatif.`,
          hr_director_notes: 'Direkomendasikan untuk terus melanjutkan akselerasi kompetensi sesuai roadmap IDP.',
          talent_pipeline_box: 'Box 8 - High Performer & High Potential',
          career_decision: 'Pertahankan & Kembangkan Tanggung Jawab Strategis',
          next_role_assignment: `Senior / Lead ${emp.role_title}`,
          report_date: todayIso,
        };
        localReports[key] = seededReport;
        result[emp.id] = seededReport;
      }
    }
    return result;
  },
};

