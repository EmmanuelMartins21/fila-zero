export type Pharmacy = {
  id: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  distance?: number;  // Distância calculada da localização atual
};

export type Medication = {
  id: string;
  name: string;
  description?: string;
  dosage?: string;
  pharmacy_id: string;
};

export type SelectedMedication = {
  medication: Medication;
  quantity: number;
};

export type CheckIn = {
  id: string;
  user_id: string;
  pharmacy_id: string;
  queue_number: number;
  status: 'waiting' | 'served' | 'cancelled';
  created_at: string;
  medications?: SelectedMedication[];
};
