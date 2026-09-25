import "dotenv/config";
import express from "express";
import cors from "cors";
import pool from "./db.js";

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: CLIENT_ORIGIN === "*" ? true : CLIENT_ORIGIN }));
app.use(express.json());

// ============================================================
// LIVE RADAR STATE
// ============================================================

let radarState = {
  connected: false,
  possibleHuman: false,
  distanceCm: null,
  uartPresence: false,
  ot2Presence: false,
  updatedAt: null,
};

// ============================================================
// LIVE MPU6050 / IMU STATE
// ============================================================

let imuState = {
  deviceId: "MITRA-ROVER-01",
  connected: false,
  sequence: 0,

  ax: 0,
  ay: 0,
  az: 0,

  gx: 0,
  gy: 0,
  gz: 0,

  roll: 0,
  pitch: 0,

  rawYaw: 0,
  yaw: 0,
  heading: 0,

  headingType: "relative",

  stationary: true,
  yawLocked: true,

  gyroBiasZ: 0,
  correctedYawRate: 0,

  temperatureC: null,

  sampleHz: 50,
  uptimeMs: 0,

  updatedAt: null,
};

// ============================================================
// SSE CLIENTS
// ============================================================

const imuStreamClients = new Set();

function getPublicImuState() {
  const fresh =
    imuState.updatedAt &&
    Date.now() - new Date(imuState.updatedAt).getTime() <= 1500;

  return {
    ...imuState,

    connected: Boolean(
      imuState.connected &&
      fresh
    ),

    fresh: Boolean(fresh),
  };
}

function broadcastImuState() {
  if (imuStreamClients.size === 0) {
    return;
  }

  const payload =
    `event: imu\n` +
    `data: ${JSON.stringify(getPublicImuState())}\n\n`;

  for (const client of imuStreamClients) {
    try {
      client.write(payload);
    } catch (_error) {
      imuStreamClients.delete(client);
    }
  }
}

// ============================================================
// HEALTH
// ============================================================

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "mitra-api",
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// DATABASE TEST
// ============================================================

app.get("/api/db-test", async (_req, res) => {
  try {
    const result =
      await pool.query(
        "SELECT NOW() AS time"
      );

    res.json({
      status: "success",
      database: "connected",
      time: result.rows[0].time,
    });
  } catch (error) {
    console.error(
      "Database test error:",
      error
    );

    res.status(500).json({
      status: "error",
      database: "not connected",
    });
  }
});

// ============================================================
// RADAR INGESTION
// ============================================================

app.post(
  "/api/radar-data",
  (req, res) => {
    try {
      const {
        device_id,
        connected,
        possibleHuman,
        distanceCm,
        uartPresence,
        ot2Presence,
      } = req.body;

      if (!device_id) {
        return res
          .status(400)
          .json({
            error:
              "device_id is required",
          });
      }

      if (
        typeof connected !== "boolean" ||
        typeof possibleHuman !== "boolean" ||
        typeof uartPresence !== "boolean" ||
        typeof ot2Presence !== "boolean"
      ) {
        return res
          .status(400)
          .json({
            error:
              "Radar boolean fields must be true or false",
          });
      }

      let parsedDistance = null;

      if (
        distanceCm !== null &&
        distanceCm !== undefined
      ) {
        parsedDistance =
          Number(distanceCm);

        if (
          !Number.isFinite(
            parsedDistance
          )
        ) {
          return res
            .status(400)
            .json({
              error:
                "distanceCm must be a valid number or null",
            });
        }
      }

      radarState = {
        connected,
        possibleHuman,
        distanceCm: parsedDistance,
        uartPresence,
        ot2Presence,
        updatedAt:
          new Date().toISOString(),
      };

      console.log(
        `[RADAR] ${device_id} | connected=${connected} | human=${possibleHuman} | distance=${parsedDistance}`
      );

      res.status(200).json({
        status: "success",
        message:
          "Radar data received",
        radar: radarState,
      });
    } catch (error) {
      console.error(
        "Radar data error:",
        error
      );

      res.status(500).json({
        error:
          "Failed to process radar data",
      });
    }
  }
);

// ============================================================
// IMU INGESTION
// ============================================================

app.post(
  "/api/imu-data",
  (req, res) => {
    try {
      const {
        device_id,
        connected,

        sequence,

        ax,
        ay,
        az,

        gx,
        gy,
        gz,

        roll,
        pitch,

        rawYaw,
        yaw,
        heading,

        headingType,

        stationary,
        yawLocked,

        gyroBiasZ,
        correctedYawRate,

        temperatureC,

        sampleHz,
        uptimeMs,
      } = req.body;

      if (!device_id) {
        return res
          .status(400)
          .json({
            error:
              "device_id is required",
          });
      }

      if (
        typeof connected !==
          "boolean" ||
        typeof stationary !==
          "boolean" ||
        typeof yawLocked !==
          "boolean"
      ) {
        return res
          .status(400)
          .json({
            error:
              "connected, stationary and yawLocked must be booleans",
          });
      }

      const numericFields = {
        sequence,

        ax,
        ay,
        az,

        gx,
        gy,
        gz,

        roll,
        pitch,

        rawYaw,
        yaw,
        heading,

        gyroBiasZ,
        correctedYawRate,

        temperatureC,

        sampleHz,
        uptimeMs,
      };

      for (
        const [name, value]
        of Object.entries(
          numericFields
        )
      ) {
        if (
          !Number.isFinite(
            Number(value)
          )
        ) {
          return res
            .status(400)
            .json({
              error:
                `${name} must be a finite number`,
            });
        }
      }

      imuState = {
        deviceId:
          String(device_id),

        connected,

        sequence:
          Number(sequence),

        ax:
          Number(ax),

        ay:
          Number(ay),

        az:
          Number(az),

        gx:
          Number(gx),

        gy:
          Number(gy),

        gz:
          Number(gz),

        roll:
          Number(roll),

        pitch:
          Number(pitch),

        rawYaw:
          Number(rawYaw),

        yaw:
          Number(yaw),

        heading:
          Number(heading),

        headingType:
          headingType === "true"
            ? "true"
            : "relative",

        stationary,

        yawLocked,

        gyroBiasZ:
          Number(gyroBiasZ),

        correctedYawRate:
          Number(
            correctedYawRate
          ),

        temperatureC:
          Number(temperatureC),

        sampleHz:
          Number(sampleHz),

        uptimeMs:
          Number(uptimeMs),

        updatedAt:
          new Date().toISOString(),
      };

      broadcastImuState();

      res.status(200).json({
        status: "success",
        message:
          "IMU telemetry received",

        imu:
          getPublicImuState(),
      });
    } catch (error) {
      console.error(
        "IMU data error:",
        error
      );

      res.status(500).json({
        error:
          "Failed to process IMU telemetry",
      });
    }
  }
);

// ============================================================
// IMU SNAPSHOT
// ============================================================

app.get(
  "/api/imu",
  (_req, res) => {
    res.json({
      imu:
        getPublicImuState(),
    });
  }
);

// ============================================================
// IMU LIVE SSE STREAM
// ============================================================

app.get(
  "/api/imu-stream",
  (req, res) => {
    res.setHeader(
      "Content-Type",
      "text/event-stream"
    );

    res.setHeader(
      "Cache-Control",
      "no-cache, no-transform"
    );

    res.setHeader(
      "Connection",
      "keep-alive"
    );

    res.setHeader(
      "X-Accel-Buffering",
      "no"
    );

    res.flushHeaders?.();

    // Browser reconnect delay
    res.write(
      "retry: 1000\n\n"
    );

    // Immediately send current IMU state
    res.write(
      `event: imu\n` +
      `data: ${JSON.stringify(
        getPublicImuState()
      )}\n\n`
    );

    imuStreamClients.add(res);

    const heartbeat =
      setInterval(() => {
        try {
          res.write(
            `event: imu\n` +
            `data: ${JSON.stringify(
              getPublicImuState()
            )}\n\n`
          );
        } catch (_error) {
          clearInterval(
            heartbeat
          );

          imuStreamClients.delete(
            res
          );
        }
      }, 1000);

    req.on(
      "close",
      () => {
        clearInterval(
          heartbeat
        );

        imuStreamClients.delete(
          res
        );
      }
    );
  }
);

// ============================================================
// ENVIRONMENTAL SENSOR INGESTION
// ============================================================

app.post(
  "/api/sensor-data",
  async (req, res) => {
    let client;

    try {
      client =
        await pool.connect();

      const {
        device_id,
        sensor_type,
        value,
        unit,
        zone_id = 1,
      } = req.body;

      if (
        !device_id ||
        value === undefined ||
        value === null
      ) {
        return res
          .status(400)
          .json({
            error:
              "device_id and value are required",
          });
      }

      const numericValue =
        Number(value);

      if (
        !Number.isFinite(
          numericValue
        )
      ) {
        return res
          .status(400)
          .json({
            error:
              "value must be a valid number",
          });
      }

      await client.query(
        "BEGIN"
      );

      let sensorResult =
        await client.query(
          `
          SELECT
            id,
            zone_id,
            sensor_type,
            status
          FROM sensors
          WHERE device_id = $1
          `,
          [device_id]
        );

      if (
        sensorResult.rows
          .length === 0
      ) {
        const inserted =
          await client.query(
            `
            INSERT INTO sensors
            (
              zone_id,
              device_id,
              sensor_type,
              status
            )
            VALUES
            (
              $1,
              $2,
              $3,
              'online'
            )
            RETURNING *
            `,
            [
              zone_id,
              device_id,
              sensor_type ||
                "unknown",
            ]
          );

        sensorResult = {
          rows: [
            inserted.rows[0],
          ],
        };
      } else {
        await client.query(
          `
          UPDATE sensors
          SET status = 'online'
          WHERE id = $1
          `,
          [
            sensorResult
              .rows[0]
              .id,
          ]
        );
      }

      const sensor =
        sensorResult.rows[0];

      const readingResult =
        await client.query(
          `
          INSERT INTO sensor_readings
          (
            sensor_id,
            value,
            unit
          )
          VALUES
          (
            $1,
            $2,
            $3
          )
          RETURNING *
          `,
          [
            sensor.id,
            numericValue,
            unit || null,
          ]
        );

      const alert =
        calculateAlert(
          sensor.sensor_type,
          numericValue
        );

      let alertRecord = null;

      if (alert) {
        const existing =
          await client.query(
            `
            SELECT *
            FROM alerts
            WHERE
              sensor_id = $1
              AND zone_id = $2
              AND status = 'active'
            ORDER BY
              created_at DESC
            LIMIT 1
            `,
            [
              sensor.id,
              sensor.zone_id,
            ]
          );

        if (
          existing.rows
            .length === 0
        ) {
          const created =
            await client.query(
              `
              INSERT INTO alerts
              (
                sensor_id,
                zone_id,
                alert_type,
                severity,
                message,
                status
              )
              VALUES
              (
                $1,
                $2,
                $3,
                $4,
                $5,
                'active'
              )
              RETURNING *
              `,
              [
                sensor.id,
                sensor.zone_id,
                alert.type,
                alert.severity,
                alert.message,
              ]
            );

          alertRecord =
            created.rows[0];
        } else {
          alertRecord =
            existing.rows[0];
        }
      }

      await client.query(
        "COMMIT"
      );

      res.status(201).json({
        status: "success",

        sensor: {
          id: sensor.id,
          device_id,
          sensor_type:
            sensor.sensor_type,
        },

        reading:
          readingResult.rows[0],

        alert:
          alertRecord,
      });
    } catch (error) {
      if (client) {
        try {
          await client.query(
            "ROLLBACK"
          );
        } catch (
          rollbackError
        ) {
          console.error(
            "Rollback error:",
            rollbackError
          );
        }
      }

      console.error(
        "Sensor data error:",
        error
      );

      res.status(500).json({
        status: "error",
        error:
          "Failed to store sensor data",
        details:
          error.message,
        code:
          error.code,
      });
    } finally {
      if (client) {
        client.release();
      }
    }
  }
);

// ============================================================
// GET SENSORS
// ============================================================

app.get(
  "/api/sensors",
  async (_req, res) => {
    try {
      const result =
        await pool.query(
          `
          SELECT
            s.id,
            s.device_id,
            s.sensor_type,
            s.status,
            z.name AS zone_name,
            r.value,
            r.unit,
            r.recorded_at
          FROM sensors s

          LEFT JOIN zones z
            ON z.id = s.zone_id

          LEFT JOIN LATERAL
          (
            SELECT
              value,
              unit,
              recorded_at
            FROM sensor_readings
            WHERE sensor_id = s.id
            ORDER BY
              recorded_at DESC
            LIMIT 1
          ) r
            ON true

          ORDER BY
            s.id;
          `
        );

      res.json({
        sensors:
          result.rows,

        updatedAt:
          new Date()
            .toISOString(),
      });
    } catch (error) {
      console.error(
        "Sensor query error:",
        error
      );

      res.status(500).json({
        error:
          "Failed to fetch sensors",
      });
    }
  }
);

// ============================================================
// ALERTS
// ============================================================

app.get(
  "/api/alerts",
  async (_req, res) => {
    try {
      const result =
        await pool.query(
          `
          SELECT
            a.id,
            a.alert_type,
            a.severity,
            a.message,
            a.status,
            a.created_at,
            s.device_id,
            s.sensor_type,
            z.name AS zone
          FROM alerts a

          LEFT JOIN sensors s
            ON s.id =
               a.sensor_id

          LEFT JOIN zones z
            ON z.id =
               a.zone_id

          ORDER BY
            a.created_at DESC

          LIMIT 50;
          `
        );

      res.json({
        alerts:
          result.rows,
      });
    } catch (error) {
      console.error(
        "Alert query error:",
        error
      );

      res.status(500).json({
        error:
          "Failed to fetch alerts",
      });
    }
  }
);

// ============================================================
// MINES
// ============================================================

app.get(
  "/api/mines",
  async (_req, res) => {
    try {
      const result =
        await pool.query(
          `
          SELECT
            id,
            name,
            location,
            status,
            created_at
          FROM mines
          ORDER BY id;
          `
        );

      res.json({
        mines:
          result.rows,
      });
    } catch (error) {
      console.error(
        "Mine query error:",
        error
      );

      res.status(500).json({
        error:
          "Failed to fetch mines",
        details:
          error.message,
      });
    }
  }
);

// ============================================================
// ZONES
// ============================================================

app.get(
  "/api/zones",
  async (req, res) => {
    try {
      const mineId =
        req.query.mine_id;

      const result =
        mineId
          ? await pool.query(
              `
              SELECT
                id,
                mine_id,
                name,
                status,
                created_at
              FROM zones
              WHERE mine_id = $1
              ORDER BY id;
              `,
              [mineId]
            )
          : await pool.query(
              `
              SELECT
                id,
                mine_id,
                name,
                status,
                created_at
              FROM zones
              ORDER BY id;
              `
            );

      res.json({
        zones:
          result.rows,
      });
    } catch (error) {
      console.error(
        "Zone query error:",
        error
      );

      res.status(500).json({
        error:
          "Failed to fetch zones",
      });
    }
  }
);

// ============================================================
// DASHBOARD
// ============================================================

app.get(
  "/api/dashboard",
  async (_req, res) => {
    try {
      const mineResult =
        await pool.query(
          `
          SELECT
            id,
            name,
            location,
            status
          FROM mines
          ORDER BY id
          LIMIT 1;
          `
        );

      const sensorResult =
        await pool.query(
          `
          SELECT
            s.id,
            s.device_id,
            s.sensor_type,
            s.status,
            z.name AS zone,
            r.value,
            r.unit,
            r.recorded_at
          FROM sensors s

          LEFT JOIN zones z
            ON z.id =
               s.zone_id

          LEFT JOIN LATERAL
          (
            SELECT
              value,
              unit,
              recorded_at
            FROM sensor_readings
            WHERE sensor_id = s.id
            ORDER BY
              recorded_at DESC
            LIMIT 1
          ) r
            ON true

          WHERE
            s.status = 'online'

          ORDER BY
            s.id;
          `
        );

      const alertResult =
        await pool.query(
          `
          SELECT
            a.id,
            a.alert_type,
            a.severity,
            a.message,
            a.status,
            a.created_at,
            s.device_id,
            z.name AS zone
          FROM alerts a

          LEFT JOIN sensors s
            ON s.id =
               a.sensor_id

          LEFT JOIN zones z
            ON z.id =
               a.zone_id

          WHERE
            a.status =
              'active'

          ORDER BY
            a.created_at DESC

          LIMIT 10;
          `
        );

      const mineCountResult =
        await pool.query(
          `
          SELECT
            COUNT(*)::int
              AS count
          FROM mines
          WHERE
            status = 'active';
          `
        );

      const alertCountResult =
        await pool.query(
          `
          SELECT
            COUNT(*)::int
              AS count
          FROM alerts
          WHERE
            status = 'active';
          `
        );

      const sensors =
        sensorResult.rows.map(
          (sensor) => ({
            id:
              sensor.id,

            device_id:
              sensor.device_id,

            label:
              formatSensorLabel(
                sensor.sensor_type
              ),

            sensor_type:
              sensor.sensor_type,

            value:
              sensor.value,

            unit:
              sensor.unit,

            status:
              sensor.status,

            zone:
              sensor.zone,

            recorded_at:
              sensor.recorded_at,
          })
        );

      const alerts =
        alertResult.rows.map(
          (alert) => ({
            id:
              alert.id,

            title:
              alert.message,

            zone:
              alert.zone ||
              "Unknown Zone",

            time:
              alert.created_at,

            level:
              alert.severity,

            type:
              alert.alert_type,

            status:
              alert.status,
          })
        );

      const riskIndex =
        calculateRiskIndex(
          sensorResult.rows
        );

      let systemHealth = 100;

      if (
        sensorResult.rows.length >
        0
      ) {
        const online =
          sensorResult.rows.filter(
            (sensor) =>
              sensor.status ===
              "online"
          ).length;

        systemHealth =
          Math.round(
            (
              online /
              sensorResult.rows
                .length
            )
            *
            100
          );
      }

      const radarIsFresh =
        radarState.updatedAt &&
        Date.now() -
          new Date(
            radarState.updatedAt
          ).getTime()
          <=
          5000;

      const dashboardRadar = {
        ...radarState,

        connected:
          Boolean(
            radarState.connected &&
            radarIsFresh
          ),
      };

      res.json({
        stats: {
          activeMines:
            mineCountResult
              .rows[0]
              .count,

          criticalAlerts:
            alertCountResult
              .rows[0]
              .count,

          riskIndex,

          systemHealth,
        },

        mine:
          mineResult.rows[0] ||
          null,

        sensors,

        alerts,

        radar:
          dashboardRadar,

        imu:
          getPublicImuState(),

        updatedAt:
          new Date()
            .toISOString(),
      });
    } catch (error) {
      console.error(
        "Dashboard error:",
        error
      );

      res.status(500).json({
        error:
          "Failed to build dashboard data",
      });
    }
  }
);

// ============================================================
// RESOLVE ALERT
// ============================================================

app.patch(
  "/api/alerts/:id/resolve",
  async (req, res) => {
    try {
      const result =
        await pool.query(
          `
          UPDATE alerts
          SET status = 'resolved'
          WHERE id = $1
          RETURNING *;
          `,
          [
            req.params.id,
          ]
        );

      if (
        result.rows.length ===
        0
      ) {
        return res
          .status(404)
          .json({
            error:
              "Alert not found",
          });
      }

      res.json({
        status:
          "success",

        alert:
          result.rows[0],
      });
    } catch (error) {
      console.error(
        "Alert resolution error:",
        error
      );

      res.status(500).json({
        error:
          "Failed to resolve alert",
      });
    }
  }
);

// ============================================================
// HELPERS
// ============================================================

function calculateAlert(
  sensorType,
  value
) {
  const type =
    String(
      sensorType || ""
    ).toLowerCase();

  if (
    (
      type === "temperature" ||
      type === "temp"
    )
    &&
    value >= 45
  ) {
    return {
      type:
        "temperature",

      severity:
        "critical",

      message:
        `High temperature detected: ${value}`,
    };
  }

  if (
    (
      type === "humidity" ||
      type ===
        "humidity_percent"
    )
    &&
    value >= 90
  ) {
    return {
      type:
        "humidity",

      severity:
        "warning",

      message:
        `High humidity detected: ${value}`,
    };
  }

  if (
    (
      type === "co" ||
      type ===
        "carbon_monoxide"
    )
    &&
    value >= 50
  ) {
    return {
      type:
        "gas",

      severity:
        "critical",

      message:
        `Elevated carbon monoxide detected: ${value}`,
    };
  }

  if (
    (
      type === "methane" ||
      type === "ch4"
    )
    &&
    value >= 1
  ) {
    return {
      type:
        "gas",

      severity:
        "critical",

      message:
        `Elevated methane detected: ${value}`,
    };
  }

  if (
    (
      type === "vibration" ||
      type ===
        "vibration_mm_s"
    )
    &&
    value >= 8
  ) {
    return {
      type:
        "vibration",

      severity:
        "warning",

      message:
        `High vibration detected: ${value}`,
    };
  }

  return null;
}

function calculateRiskIndex(
  readings
) {
  let risk = 0;

  for (
    const reading
    of readings
  ) {
    if (
      reading.value ===
      null
    ) {
      continue;
    }

    const type =
      String(
        reading.sensor_type ||
        ""
      ).toLowerCase();

    const value =
      Number(
        reading.value
      );

    if (
      (
        type === "methane" ||
        type === "ch4"
      )
      &&
      value >= 1
    ) {
      risk += 40;
    } else if (
      (
        type === "methane" ||
        type === "ch4"
      )
      &&
      value >= 0.5
    ) {
      risk += 20;
    }

    if (
      (
        type === "co" ||
        type ===
          "carbon_monoxide"
      )
      &&
      value >= 50
    ) {
      risk += 35;
    } else if (
      (
        type === "co" ||
        type ===
          "carbon_monoxide"
      )
      &&
      value >= 25
    ) {
      risk += 15;
    }

    if (
      (
        type === "temperature" ||
        type === "temp"
      )
      &&
      value >= 45
    ) {
      risk += 20;
    }

    if (
      (
        type === "vibration" ||
        type ===
          "vibration_mm_s"
      )
      &&
      value >= 8
    ) {
      risk += 15;
    }
  }

  return Math.min(
    risk,
    100
  );
}

function formatSensorLabel(
  type
) {
  const labels = {
    temperature:
      "Temperature",

    humidity:
      "Humidity",

    pressure:
      "Pressure",

    methane:
      "CH₄ (Methane)",

    ch4:
      "CH₄ (Methane)",

    co:
      "CO",

    carbon_monoxide:
      "CO",

    vibration:
      "Vibration",

    distance:
      "Distance",

    lidar:
      "LiDAR Distance",

    ultrasonic:
      "Ultrasonic Distance",
  };

  return (
    labels[type] ||
    type ||
    "Unknown Sensor"
  );
}

// ============================================================
// 404
// ============================================================

app.use(
  (_req, res) => {
    res
      .status(404)
      .json({
        error:
          "Route not found",
      });
  }
);

// ============================================================
// START SERVER
// ============================================================

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `M.I.T.R.A. API running on port ${PORT}`
    );

    console.log(
      `Radar endpoint: http://0.0.0.0:${PORT}/api/radar-data`
    );

    console.log(
      `IMU ingest: http://0.0.0.0:${PORT}/api/imu-data`
    );

    console.log(
      `IMU snapshot: http://0.0.0.0:${PORT}/api/imu`
    );

    console.log(
      `IMU live stream: http://0.0.0.0:${PORT}/api/imu-stream`
    );
  }
);