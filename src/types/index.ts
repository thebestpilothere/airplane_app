export interface Airline {
  id: string;
  user_id?: string;
  name: string;
  country: string;
  headquarters?: string;
  founded_year?: number;
  iata_code?: string;
  icao_code?: string;
  callsign?: string;
  alliance?: string;
  fleet_size?: number;
  status: 'active' | 'retired' | 'defunct';
  logo_url?: string;
  description?: string;
  history?: string;
  created_at?: string;
}

export interface Aircraft {
  id: string;
  user_id?: string;
  airline_id?: string;
  name: string;
  manufacturer: string;
  family?: string;
  generation?: string;
  role: 'passenger' | 'cargo';
  status: 'active' | 'retired';
  collected: boolean;
  sightings?: number;
  image_url?: string;
  description?: string;
  created_at?: string;
}

export interface CollectionStats {
  airlines: number;
  aircraftTotal: number;
  aircraftCollected: number;
  types: number;
  families: number;
  completion: number;
}

export interface ChatThread {
  id: string;
  user_id?: string;
  title: string;
  updated_at: string;
  created_at?: string;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export const MANUFACTURERS = [
  'Airbus',
  'Boeing',
  'Embraer',
  'ATR',
  'Bombardier',
  'McDonnell Douglas',
  'Lockheed',
  'Other',
] as const;
