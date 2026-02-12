// src/types/investigation.ts
export type LabType = "laboratory" | "imaging" | null;

export interface LabRequest {
  id: number;
  encounter_id?: number;
  test_id?: number | null;
  test_name?: string | null;
  department?: string | null;
  type?: LabType;
  status?: string;
  request_notes?: string | null;
  requested_by?: number | null;
  date_requested?: string | null;
  createdAt?: string;
  updatedAt?: string;
  test?: InvestigationTest | null;
  results?: LabResult[] | null;
  custom_name?: string | null;
}

export interface LabResult {
  id?: number;
  request_id: number;
  parameter?: string | null;
  value?: string | null;
  unit?: string | null;
  reference_range?: string | null;
  flag?: string | null;
  notes?: string | null;
  entered_by?: number | null;
  date_entered?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvestigationTest {
  id: number;
  name: string;
  department: string;
  type: "laboratory" | "imaging";
  parameters: string | null;
}
