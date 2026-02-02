// src/services/triageService.ts
export interface TriageData {
  patientId: string;
  encounterId: string;
  temperature?: number;
  heartRate?: number;
  bloodPressure?: string;
  respiratoryRate?: number;
  bloodOxygenation?: number;
  weight?: number;
  height?: number;
  muac?: number;
  lmp?: string;
  comments?: string;
  patientStatus?: string;
}

export const saveTriageData = async (data: TriageData): Promise<void> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Saving triage data:', data);
      // Here you would make an actual API call to your backend
      resolve();
    }, 1000);
  });
};

export const getTriageHistory = async (patientId: string): Promise<TriageData[]> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          patientId,
          encounterId: 'enc-001',
          temperature: 38.2,
          heartRate: 84,
          bloodPressure: '124/86',
          respiratoryRate: 16,
          bloodOxygenation: 98,
          weight: 56,
          height: 145,
          patientStatus: 'stable'
        }
      ]);
    }, 1000);
  });
};