export const dashboard = {
  stats: {
    activeMines: 12,
    criticalAlerts: 3,
    riskIndex: 62,
    systemHealth: 98
  },
  mine: {
    name: "Eastern Coal Mine",
    location: "West Bengal, India",
    status: "Operational"
  }
};

export const sensors = [
  { id: "ch4", label: "CH₄ (Methane)", value: 0.42, unit: "%", status: "Normal" },
  { id: "co2", label: "CO₂", value: 0.08, unit: "%", status: "Normal" },
  { id: "temperature", label: "Temperature", value: 31.4, unit: "°C", status: "Normal" },
  { id: "humidity", label: "Humidity", value: 68, unit: "%", status: "Normal" },
  { id: "pressure", label: "Pressure", value: 101.2, unit: "kPa", status: "Normal" },
  { id: "vibration", label: "Vibration", value: 2.1, unit: "mm/s", status: "Normal" }
];

export const alerts = [
  { id: 1, title: "High Methane Level Detected", zone: "Zone 4B", time: "10:38 AM", level: "danger", type: "gas" },
  { id: 2, title: "Temperature Anomaly", zone: "Zone 2A", time: "10:31 AM", level: "warning", type: "temperature" },
  { id: 3, title: "Vibration Increase Detected", zone: "Zone 1C", time: "10:25 AM", level: "warning", type: "vibration" },
  { id: 4, title: "All Systems Normal", zone: "All Zones", time: "10:20 AM", level: "success", type: "system" }
];
