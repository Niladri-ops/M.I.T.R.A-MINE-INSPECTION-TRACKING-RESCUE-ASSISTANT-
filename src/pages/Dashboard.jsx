import { useEffect, useState } from "react";

import {
  Pickaxe,
  TriangleAlert,
  TrendingUp,
  ShieldCheck,
  Activity,
  RadioTower,
  Wifi,
  Cpu,
  Radar,
} from "lucide-react";

import StatCard from "../components/StatCard";
import SensorCard from "../components/SensorCard";
import RiskGauge from "../components/RiskGauge";
import AlertList from "../components/AlertList";
import ActiveMineCard from "../components/ActiveMineCard";
import { fetchDashboard } from "../data/mockData";

const fallback = {
  stats: {
    activeMines: 1,
    criticalAlerts: 0,
    riskIndex: 0,
    systemHealth: 100,
  },

  sensors: [
    {
      id: "temperature",
      label: "Temperature",
      value: "--",
      unit: "°C",
      sensor_type: "temperature",
    },
    {
      id: "humidity",
      label: "Humidity",
      value: "--",
      unit: "%",
      sensor_type: "humidity",
    },
    {
      id: "pressure",
      label: "Pressure",
      value: "--",
      unit: "hPa",
      sensor_type: "pressure",
    },
    {
      id: "methane",
      label: "CH₄ Methane",
      value: "--",
      unit: "ppm",
      sensor_type: "methane",
    },
    {
      id: "co",
      label: "Carbon Monoxide",
      value: "--",
      unit: "ppm",
      sensor_type: "co",
    },
  ],

  alerts: [],

  radar: {
    connected: false,
    possibleHuman: false,
    distanceCm: null,
    uartPresence: false,
    ot2Presence: false,
    updatedAt: null,
  },

  mine: {
    name: "MineGuard Deployment",
    location: "West Bengal, India",
  },
};

function Dashboard() {
  const [data, setData] = useState(fallback);
  const [apiOnline, setApiOnline] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  /*
    ============================================================
    MAIN DASHBOARD POLLING
    Environmental data, alerts, stats, mine status
    ============================================================
  */

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        const result = await fetchDashboard();

        if (!mounted) return;

        setData((previous) => ({
          ...fallback,
          ...previous,
          ...result,

          stats: {
            ...fallback.stats,
            ...previous.stats,
            ...(result.stats || {}),
          },

          radar: {
            ...fallback.radar,
            ...previous.radar,
            ...(result.radar || {}),
          },

          sensors:
            result.sensors &&
            result.sensors.length > 0
              ? result.sensors
              : previous.sensors || fallback.sensors,

          alerts:
            result.alerts ||
            previous.alerts ||
            fallback.alerts,

          mine: {
            ...fallback.mine,
            ...previous.mine,
            ...(result.mine || {}),
          },
        }));

        setApiOnline(true);
        setLastUpdate(new Date());
      } catch (error) {
        console.warn(
          "MineGuard backend unavailable. Showing fallback dashboard.",
          error
        );

        if (mounted) {
          setApiOnline(false);
        }
      }
    };

    loadDashboard();

    const timer = setInterval(
      loadDashboard,
      10000
    );

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  /*
    ============================================================
    LIVE RADAR POLLING
    Radar updates every 1 second independently of dashboard
    ============================================================
  */

  useEffect(() => {
    let mounted = true;

    const loadRadar = async () => {
      try {
        const response = await fetch(
          "/api/radar",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Radar API returned HTTP ${response.status}`
          );
        }

        const result = await response.json();

        if (!mounted) return;

        const liveRadar =
          result?.radar || {};

        setData((previous) => ({
          ...previous,

          radar: {
            ...fallback.radar,
            ...previous.radar,

            connected:
              Boolean(
                liveRadar.connected
              ),

            possibleHuman:
              Boolean(
                liveRadar.possibleHuman
              ),

            distanceCm:
              liveRadar.distanceCm !== null &&
              liveRadar.distanceCm !== undefined &&
              Number.isFinite(
                Number(
                  liveRadar.distanceCm
                )
              )
                ? Number(
                    liveRadar.distanceCm
                  )
                : null,

            uartPresence:
              Boolean(
                liveRadar.uartPresence
              ),

            ot2Presence:
              Boolean(
                liveRadar.ot2Presence
              ),

            updatedAt:
              liveRadar.updatedAt ||
              null,
          },
        }));
      } catch (error) {
        console.warn(
          "Radar polling failed:",
          error
        );
      }
    };

    loadRadar();

    const radarTimer =
      setInterval(
        loadRadar,
        1000
      );

    return () => {
      mounted = false;
      clearInterval(
        radarTimer
      );
    };
  }, []);

  const stats =
    data.stats ||
    fallback.stats;

  const sensors =
    data.sensors &&
    data.sensors.length > 0
      ? data.sensors
      : fallback.sensors;

  const radar =
    data.radar ||
    fallback.radar;

  /*
    ============================================================
    RADAR DISTANCE
    ============================================================
  */

  const radarDistanceCm =
    radar.distanceCm !== null &&
    radar.distanceCm !== undefined &&
    Number.isFinite(
      Number(
        radar.distanceCm
      )
    )
      ? Number(
          radar.distanceCm
        )
      : null;

  const radarDistance =
    radarDistanceCm !== null
      ? `${(
          radarDistanceCm /
          100
        ).toFixed(2)} m`
      : "---";

  /*
    ============================================================
    HUMAN TARGET POSITION

    HLK-LD2420 gives range.
    It does not give reliable left/right bearing here.

    Therefore we move the target along ONE fixed line
    through the radar field.

    25 cm  -> close to rover
    800 cm -> far end of radar field
    ============================================================
  */

  const RADAR_MIN_CM = 25;
  const RADAR_MAX_CM = 800;

  const radarClampedCm =
    radarDistanceCm !== null
      ? Math.min(
          RADAR_MAX_CM,
          Math.max(
            RADAR_MIN_CM,
            radarDistanceCm
          )
        )
      : RADAR_MIN_CM;

  const radarProgress =
    (radarClampedCm -
      RADAR_MIN_CM) /
    (RADAR_MAX_CM -
      RADAR_MIN_CM);

  /*
    detection-field is a triangular field.

    Near:
      left ≈ 14%
      bottom ≈ 8%

    Far:
      left ≈ 82%
      bottom ≈ 72%
  */

  const radarTargetLeft =
    14 +
    radarProgress * 68;

  const radarTargetBottom =
    8 +
    radarProgress * 64;

  /*
    Slight size perspective.

    Near human:
      slightly larger

    Far human:
      slightly smaller
  */

  const radarTargetScale =
    1.08 -
    radarProgress * 0.18;

  return (
    <div className="dashboard">

      {/* ======================================================
          HERO
      ====================================================== */}

      <section className="command-hero">

        <div className="hero-copy">

          <div className="hero-label">
            <span className="pulse-dot" />
            LIVE MINE INTELLIGENCE
          </div>

          <h1>
            M.I.T.R.A <span></span>
          </h1>

          <p>
            Real-time underground safety monitoring,
            environmental intelligence and rescue-rover awareness.
          </p>

          <div className="hero-status-row">

            <div
              className={`hero-status ${
                apiOnline
                  ? "online"
                  : "offline"
              }`}
            >
              <Wifi size={15} />

              {apiOnline
                ? "Backend Connected"
                : "Backend Offline"}
            </div>

            <div
              className={`hero-status ${
                radar.connected
                  ? "online"
                  : "offline"
              }`}
            >
              <Radar size={15} />

              {radar.connected
                ? "Radar Online"
                : "Radar Offline"}
            </div>

            <div className="hero-status neutral">
              <Cpu size={15} />
              AI Monitoring Active
            </div>

          </div>

        </div>

        <div className="hero-side">

          <span>
            COMMAND STATUS
          </span>

          <strong>
            {apiOnline
              ? "OPERATIONAL"
              : "DEGRADED"}
          </strong>

          <small>
            {lastUpdate
              ? `Last telemetry ${lastUpdate.toLocaleTimeString()}`
              : "Waiting for telemetry"}
          </small>

        </div>

      </section>


      {/* ======================================================
          STAT CARDS
      ====================================================== */}

      <section className="stats-grid">

        <StatCard
          icon={Pickaxe}
          title="Active Mines"
          value={String(
            stats.activeMines
          )}
          subtitle="Connected mine sites"
          trend="Mine monitoring network"
        />

        <StatCard
          icon={TriangleAlert}
          title="Critical Alerts"
          value={String(
            stats.criticalAlerts
          )}
          subtitle="Active safety alerts"
          trend={
            stats.criticalAlerts > 0
              ? "Immediate attention required"
              : "No active critical events"
          }
          type={
            stats.criticalAlerts > 0
              ? "danger"
              : "success"
          }
        />

        <StatCard
          icon={TrendingUp}
          title="Risk Index"
          value={`${stats.riskIndex}%`}
          subtitle="Environmental risk"
          trend="AI safety assessment"
          type={
            stats.riskIndex >= 70
              ? "danger"
              : stats.riskIndex >= 35
                ? "warning"
                : "success"
          }
        />

        <StatCard
          icon={ShieldCheck}
          title="System Health"
          value={`${stats.systemHealth}%`}
          subtitle="Sensor availability"
          trend="Telemetry health"
          type="success"
        />

      </section>


      {/* ======================================================
          SENSOR + RISK
      ====================================================== */}

      <section className="main-grid">

        <div className="panel telemetry-panel">

          <div className="panel-heading">

            <div className="heading-with-icon">

              <div className="panel-icon">
                <Activity size={20} />
              </div>

              <div>

                <span className="section-kicker">
                  LIVE TELEMETRY
                </span>

                <h3>
                  Environmental Sensor Matrix
                </h3>

                <p>
                  Latest readings received from M.I.T.R.A's sensor nodes
                </p>

              </div>

            </div>

            <div className="live-indicator">
              <span />
              10 SEC REFRESH
            </div>

          </div>

          <div className="sensor-grid">

            {sensors.map(
              (sensor) => (
                <SensorCard
                  key={
                    sensor.id ||
                    sensor.device_id ||
                    sensor.label
                  }
                  label={
                    sensor.label ||
                    sensor.sensor_type
                  }
                  value={
                    sensor.value !== null &&
                    sensor.value !== undefined
                      ? String(
                          sensor.value
                        )
                      : "--"
                  }
                  unit={
                    sensor.unit ||
                    ""
                  }
                  type={
                    sensor.sensor_type
                  }
                  status={
                    sensor.status
                  }
                />
              )
            )}

          </div>

        </div>


        <div className="panel risk-panel">

          <div className="panel-heading">

            <div>

              <span className="section-kicker">
                AI ANALYSIS
              </span>

              <h3>
                Mine Risk Intelligence
              </h3>

              <p>
                Combined environmental hazard index
              </p>

            </div>

          </div>

          <RiskGauge
            value={Number(
              stats.riskIndex ||
              0
            )}
          />

        </div>

      </section>


      {/* ======================================================
          RADAR
      ====================================================== */}

      <section className="radar-section panel">

        <div className="panel-heading">

          <div className="heading-with-icon">

            <div className="panel-icon radar-icon">
              <RadioTower size={20} />
            </div>

            <div>

              <span className="section-kicker">
                RESCUE ROVER
              </span>

              <h3>
                Human Presence Sensor
              </h3>

              <p>
                Fixed-field mmWave presence monitoring
              </p>

            </div>

          </div>

          <div
            className={`radar-connection ${
              radar.connected
                ? "connected"
                : ""
            }`}
          >
            <span />

            {radar.connected
              ? "CONNECTED"
              : "NO SIGNAL"}
          </div>

        </div>


        <div className="presence-monitor">

          {/* ====================================================
              RADAR VISUAL
          ==================================================== */}

          <div className="presence-visual">

            <div className="sensor-housing">

              <div className="sensor-led" />

              <div className="sensor-face">
                HLK
              </div>

              <span>
                mmWave
              </span>

            </div>


            <div className="detection-field">

              <div className="field-grid" />

              <div className="field-arc arc-1" />
              <div className="field-arc arc-2" />
              <div className="field-arc arc-3" />
              <div className="field-arc arc-4" />

              <div className="field-center-line" />


              {/* ================================================
                  MOVING HUMAN TARGET

                  This is the actual target visible on Dashboard.
                  Existing fixed CSS right/bottom values are
                  overridden inline.
              ================================================ */}

              {radar.connected &&
                radar.possibleHuman &&
                radarDistanceCm !== null && (

                  <div
                    className="presence-target active"
                    style={{
                      left:
                        `${radarTargetLeft}%`,

                      right:
                        "auto",

                      bottom:
                        `${radarTargetBottom}%`,

                      opacity:
                        1,

                      transform:
                        `translate(-50%, 50%) scale(${radarTargetScale})`,

                      transformOrigin:
                        "center bottom",

                      transition:
                        "left 0.65s ease, bottom 0.65s ease, transform 0.65s ease",
                    }}
                  >

                    <div className="target-pulse target-pulse-1" />

                    <div className="target-pulse target-pulse-2" />


                    <div className="target-body">

                      <div className="target-head" />

                      <div className="target-torso" />

                      <div className="target-legs">

                        <span />
                        <span />

                      </div>

                    </div>


                    {/* LIVE RANGE LABEL */}

                    <div
                      style={{
                        position:
                          "absolute",

                        top:
                          "78px",

                        left:
                          "50%",

                        transform:
                          "translateX(-50%)",

                        padding:
                          "3px 7px",

                        borderRadius:
                          "5px",

                        background:
                          "rgba(20, 5, 5, 0.92)",

                        border:
                          "1px solid rgba(255, 80, 80, 0.35)",

                        color:
                          "#ffaaaa",

                        fontSize:
                          "8px",

                        fontWeight:
                          800,

                        whiteSpace:
                          "nowrap",

                        boxShadow:
                          "0 4px 15px rgba(0,0,0,0.35)",
                      }}
                    >
                      {(
                        radarDistanceCm /
                        100
                      ).toFixed(2)}{" "}
                      m
                    </div>

                  </div>
                )}


              <div className="distance-axis">

                <span>
                  0 m
                </span>

                <span>
                  2 m
                </span>

                <span>
                  4 m
                </span>

                <span>
                  6 m
                </span>

                <span>
                  8 m
                </span>

              </div>

            </div>

          </div>


          {/* ====================================================
              RADAR READOUT
          ==================================================== */}

          <div className="presence-readout">

            <div
              className={`presence-status-card ${
                radar.possibleHuman
                  ? "detected"
                  : "clear"
              }`}
            >

              <span className="presence-label">
                LIVE SENSOR STATE
              </span>

              <strong>
                {radar.possibleHuman
                  ? "POSSIBLE HUMAN PRESENCE"
                  : radar.connected
                    ? "AREA CLEAR"
                    : "SENSOR OFFLINE"}
              </strong>


              <div className="presence-distance">

                <small>
                  TARGET DISTANCE
                </small>

                <span>
                  {radarDistance}
                </span>

              </div>

            </div>


            {/* ==================================================
                RADAR METRICS
            ================================================== */}

            <div className="presence-metrics">

              <div className="presence-metric">

                <span>
                  UART DATA
                </span>

                <strong
                  className={
                    radar.uartPresence
                      ? "good"
                      : ""
                  }
                >
                  {radar.uartPresence
                    ? "ACTIVE"
                    : "IDLE"}
                </strong>

              </div>


              <div className="presence-metric">

                <span>
                  OT2 PRESENCE
                </span>

                <strong
                  className={
                    radar.ot2Presence
                      ? "good"
                      : ""
                  }
                >
                  {radar.ot2Presence
                    ? "DETECTED"
                    : "CLEAR"}
                </strong>

              </div>


              <div className="presence-metric">

                <span>
                  SENSOR LINK
                </span>

                <strong
                  className={
                    radar.connected
                      ? "good"
                      : "bad"
                  }
                >
                  {radar.connected
                    ? "ONLINE"
                    : "OFFLINE"}
                </strong>

              </div>

            </div>


            <div className="presence-footer">

              <div>

                <span className="footer-indicator" />

                FIXED SENSOR FIELD

              </div>

              <small>
                Presence classification is based on mmWave detection,
                not visual identification.
              </small>

            </div>

          </div>

        </div>

      </section>


      {/* ======================================================
          ALERT + MINE
      ====================================================== */}

      <section className="bottom-grid">

        <AlertList
          alerts={
            data.alerts ||
            []
          }
        />

        <ActiveMineCard
          mine={
            data.mine ||
            fallback.mine
          }
        />

      </section>


      <p className="prototype-note">
        MineGuard AI prototype monitoring interface.
        Safety-critical decisions must follow certified mine
        safety procedures and calibrated instrumentation.
      </p>

    </div>
  );
}

export default Dashboard;