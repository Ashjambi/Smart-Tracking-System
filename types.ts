
export enum MessageSender {
  USER = 'user',
  BOT = 'bot',
}

export interface Message {
  id: number;
  text: string;
  sender: MessageSender;
  imageUrl?: string;
}

export interface BaggageEvent {
  timestamp: string;
  status: string;
  location: string;
  details: string;
}

export interface BaggageInfo {
  status: string;
  currentLocation: string;
  nextStep: string;
  estimatedArrival: string;
  history: BaggageEvent[];
  baggagePhotoUrl?: string; // Photo taken by staff (Front)
  baggagePhotoUrl_2?: string; // Photo taken by staff (Back)
  passengerPhotoUrl?: string; // Photo uploaded by passenger
  isConfirmedByPassenger: boolean;
  pir: string;
}

export type View = 'passenger' | 'staff' | 'management';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'urgent';
  timestamp: Date;
}

export interface BaggageReport {
  id: string;
  passengerName: string;
  flight: string;
  status: 'Urgent' | 'In Progress' | 'Resolved' | 'Needs Staff Review' | 'Out for Delivery' | 'Delivered' | 'Found - Awaiting Claim';
  lastUpdate: Date;
  pir: string;
}

export interface AiFeatures {
  brand?: string;
  color?: string;
  size?: 'Small' | 'Medium' | 'Large' | 'Extra Large';
  type?: string; 
  distinctiveMarks?: string; 
}

export interface BaggageRecord {
    PIR: string;
    PassengerName: string;
    Flight: string;
    Status: string;
    LastUpdate: string; 
    CurrentLocation: string;
    NextStep: string;
    EstimatedArrival: string;
    Origin?: string;
    Destination?: string;
    History_1_Timestamp: string;
    History_1_Status: string;
    History_1_Location: string;
    History_1_Details: string;
    History_2_Timestamp: string;
    History_2_Status: string;
    History_2_Location: string;
    History_2_Details: string;
    History_3_Timestamp: string;
    History_3_Status: string;
    History_3_Location: string;
    History_3_Details: string;
    BaggagePhotoUrl?: string;
    BaggagePhotoUrl_2?: string; // New field for double verification
    PassengerPhotoUrl?: string;
    IsConfirmedByPassenger: 'TRUE' | 'FALSE' | boolean;
    AiFeatures?: AiFeatures;
}

export type DataSourceMode = 'excel' | 'worldtracer';

export interface User {
  id: string; 
  name: string;
  employeeId: string;
  role: 'Staff' | 'Admin' | 'Manager';
  status: 'Active' | 'Inactive'; 
}

export interface WorldTracerConfig {
  baseUrl: string; // Real API Endpoint
  agentId: string;
  stationCode: string;
  airlineCode: string;
  apiKey: string;
  isConnected: boolean;
}

export type AuditCategory = 'Security' | 'Data' | 'System' | 'Operation';

export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  category: AuditCategory;
  details: string;
  status: 'Success' | 'Failed' | 'Info';
  ip: string;
}
