const API_URL = "http://localhost:5000/api/sensor-data";

function randomAround(base, variation) {
  return base + (Math.random() * 2 - 1) * variation;
}

async function sendSensorData(device_id, sensor_type, value, unit) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        device_id,
        sensor_type,
        value: Number(value.toFixed(2)),
        unit,
        zone_id: 1,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`❌ ${sensor_type} failed:`, data);
      return;
    }

    console.log(
      `✅ ${sensor_type.padEnd(10)} → ${Number(value).toFixed(2)} ${unit}`
    );
  } catch (error) {
    console.error(`❌ Cannot connect to backend: ${error.message}`);
  }
}

async function sendAllSensors() {
  const temperature = randomAround(31.5, 1.0);
  const humidity = randomAround(62.5, 2.0);
  const co = randomAround(12.5, 2.0);
  const methane = randomAround(0.25, 0.05);
  const vibration = randomAround(3.2, 0.5);

  await sendSensorData(
    "ESP32-TEMP-01",
    "temperature",
    temperature,
    "C"
  );

  await sendSensorData(
    "ESP32-HUM-01",
    "humidity",
    humidity,
    "%"
  );

  await sendSensorData(
    "ESP32-MQ7-01",
    "co",
    co,
    "ppm"
  );

  await sendSensorData(
    "ESP32-MQ4-01",
    "methane",
    methane,
    "%"
  );

  await sendSensorData(
    "ESP32-VIB-01",
    "vibration",
    vibration,
    "mm/s"
  );
}

console.log("🚀 MineGuard Sensor Simulator Started");
console.log("📡 Sending sensor data every 1 second...");
console.log("Press Ctrl + C to stop.\n");

sendAllSensors();

setInterval(sendAllSensors, 1000);