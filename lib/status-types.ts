export type ServiceState = "operational" | "degraded" | "down";

export interface ServiceHistoryDay {
  date: string;
  status: ServiceState | null;
}

export interface ServiceStatus {
  name: string;
  status: ServiceState;
  uptimePercent: number;
  history: ServiceHistoryDay[];
}

export interface IncidentInfo {
  id: number;
  title: string;
  message: string;
  severity: "degraded" | "down";
  service: string | null;
  created_by: string;
  created_at: number;
  resolved_at: number | null;
}

export interface StatusResponse {
  services: ServiceStatus[];
  rangeStart: string;
  rangeEnd: string;
  overall: ServiceState;
  incidents: {
    open: IncidentInfo[];
    recent: IncidentInfo[];
  };
}
