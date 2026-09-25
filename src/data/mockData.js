export const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export const alerts = [
  {
    id: 1,
    title: "High Methane Level Detected",
    zone: "Zone 4B",
    time: "10:38 AM",
    level: "danger",
    type: "gas",
  },
  {
    id: 2,
    title: "Temperature Anomaly",
    zone: "Zone 2A",
    time: "10:31 AM",
    level: "warning",
    type: "temperature",
  },
  {
    id: 3,
    title: "Vibration Increase Detected",
    zone: "Zone 1C",
    time: "10:25 AM",
    level: "warning",
    type: "vibration",
  },
  {
    id: 4,
    title: "All Systems Normal",
    zone: "All Zones",
    time: "10:20 AM",
    level: "success",
    type: "system",
  },
];

export async function fetchDashboard() {
  const response = await fetch(`${API_BASE_URL}/dashboard`);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}