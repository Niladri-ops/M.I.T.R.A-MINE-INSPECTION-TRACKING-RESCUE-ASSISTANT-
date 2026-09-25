import { useEffect, useState } from "react";
import {
  Activity,
  Radio,
  UserRound,
  WifiOff,
  Ruler,
} from "lucide-react";

function HumanDetectionCard({
  detected: initialDetected = false,
  distance: initialDistance = null,
  connected: initialConnected = false,
}) {
  const [radar, setRadar] = useState({
    connected: initialConnected,
    possibleHuman: initialDetected,
    distanceCm: initialDistance,
    uartPresence: false,
    ot2Presence: false,
    updatedAt: null,
  });

  const [apiReachable, setApiReachable] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchRadar = async () => {
      try {
        const response = await fetch("/api/radar", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            `Radar API returned HTTP ${response.status}`
          );
        }

        const data = await response.json();

        if (!mounted) return;

        const liveRadar = data?.radar || {};

        setRadar({
          connected: Boolean(liveRadar.connected),

          possibleHuman: Boolean(
            liveRadar.possibleHuman
          ),

          distanceCm:
            liveRadar.distanceCm !== null &&
            liveRadar.distanceCm !== undefined &&
            Number.isFinite(
              Number(liveRadar.distanceCm)
            )
              ? Number(liveRadar.distanceCm)
              : null,

          uartPresence: Boolean(
            liveRadar.uartPresence
          ),

          ot2Presence: Boolean(
            liveRadar.ot2Presence
          ),

          updatedAt:
            liveRadar.updatedAt || null,
        });

        setApiReachable(true);
      } catch (error) {
        console.error(
          "Radar polling error:",
          error
        );

        if (!mounted) return;

        setRadar((previous) => ({
          ...previous,
          connected: false,
          possibleHuman: false,
          distanceCm: null,
        }));

        setApiReachable(false);
      }
    };

    fetchRadar();

    const interval = setInterval(
      fetchRadar,
      1000
    );

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const connected =
    apiReachable &&
    Boolean(radar.connected);

  const detected =
    connected &&
    Boolean(radar.possibleHuman);

  const numericDistance =
    radar.distanceCm !== null &&
    radar.distanceCm !== undefined &&
    Number.isFinite(
      Number(radar.distanceCm)
    )
      ? Number(radar.distanceCm)
      : null;

  const distanceMeters =
    numericDistance !== null
      ? numericDistance / 100
      : null;

  /*
    Radar range used for visualization:

    25 cm  -> closest
    800 cm -> farthest
  */

  const MIN_DISTANCE_CM = 25;
  const MAX_DISTANCE_CM = 800;

  const clampedDistance =
    numericDistance !== null
      ? Math.min(
          MAX_DISTANCE_CM,
          Math.max(
            MIN_DISTANCE_CM,
            numericDistance
          )
        )
      : MIN_DISTANCE_CM;

  const distanceProgress =
    (clampedDistance -
      MIN_DISTANCE_CM) /
    (MAX_DISTANCE_CM -
      MIN_DISTANCE_CM);

  /*
    radar-scene height = 385 px

    Near target:
      y ≈ 305px

    Far target:
      y ≈ 60px
  */

  const TARGET_NEAR_Y = 305;
  const TARGET_FAR_Y = 60;

  const targetY =
    TARGET_NEAR_Y -
    distanceProgress *
      (TARGET_NEAR_Y - TARGET_FAR_Y);

  const targetScale =
    1.12 -
    distanceProgress * 0.22;

  const statusText =
    !apiReachable
      ? "RADAR API OFFLINE"
      : !connected
        ? "RADAR OFFLINE"
        : detected
          ? "POSSIBLE HUMAN DETECTED"
          : "AREA CLEAR";

  return (
    <div
      className={`human-radar-card ${
        !connected
          ? "radar-offline"
          : detected
            ? "radar-danger"
            : "radar-clear"
      }`}
    >
      <div className="human-radar-header">
        <div className="human-radar-title">
          <div className="human-radar-icon">
            <Radio size={21} />
          </div>

          <div>
            <span className="human-radar-eyebrow">
              LIVE RADAR
            </span>

            <h3>
              Human Presence Radar
            </h3>

            <p>
              HLK-LD2420 real-time presence monitoring
            </p>
          </div>
        </div>

        <div
          className={`human-radar-status ${
            !connected
              ? "offline"
              : detected
                ? "danger"
                : "clear"
          }`}
        >
          <span className="status-dot" />
          {statusText}
        </div>
      </div>

      <div className="human-radar-content">

        <div className="radar-visual-panel">

          <div className="radar-scene">

            <div className="radar-grid-line radar-grid-1" />
            <div className="radar-grid-line radar-grid-2" />
            <div className="radar-grid-line radar-grid-3" />
            <div className="radar-grid-line radar-grid-4" />

            <div className="radar-range-label range-8">
              8 m
            </div>

            <div className="radar-range-label range-6">
              6 m
            </div>

            <div className="radar-range-label range-4">
              4 m
            </div>

            <div className="radar-range-label range-2">
              2 m
            </div>

            <div className="radar-cone">
              <div className="radar-cone-fill" />

              <div className="radar-center-line" />

              {connected && (
                <div className="radar-sweep" />
              )}

              <div className="radar-rover-origin">
                <div className="rover-origin-glow" />
                <div className="rover-origin-dot" />
              </div>
            </div>

            {/* ==========================================
                ACTUAL MOVING TARGET

                No class is used for positioning.
                Everything is controlled inline.
            ========================================== */}

            {connected &&
              detected &&
              distanceMeters !== null && (
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "0px",
                    zIndex: 100,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    pointerEvents: "none",

                    transform:
                      `translate3d(-50%, ${targetY}px, 0) scale(${targetScale})`,

                    transformOrigin:
                      "center center",

                    transition:
                      "transform 0.65s ease",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "27px",
                      width: "74px",
                      height: "74px",

                      transform:
                        "translate(-50%, -50%)",

                      border:
                        "1px solid rgba(255,70,70,0.35)",

                      borderRadius: "50%",
                    }}
                  />

                  <div
                    style={{
                      position: "relative",

                      width: "54px",
                      height: "54px",

                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",

                      borderRadius: "50%",

                      color: "#ffffff",

                      background:
                        "radial-gradient(circle, rgba(255,95,95,1), rgba(190,20,20,0.95))",

                      border:
                        "1px solid rgba(255,170,170,0.65)",

                      boxShadow:
                        "0 0 14px rgba(255,60,60,0.9), 0 0 38px rgba(255,35,35,0.45)",

                      zIndex: 3,
                    }}
                  >
                    <UserRound
                      size={30}
                      strokeWidth={2.5}
                    />
                  </div>

                  <div
                    style={{
                      marginTop: "7px",
                      padding: "4px 9px",

                      borderRadius: "7px",

                      color: "#ffaaaa",

                      background:
                        "rgba(20,5,5,0.94)",

                      border:
                        "1px solid rgba(255,90,90,0.32)",

                      fontSize: "10px",
                      fontWeight: 800,

                      whiteSpace: "nowrap",
                    }}
                  >
                    {distanceMeters.toFixed(2)} m
                  </div>
                </div>
              )}

            {!connected && (
              <div className="radar-disconnected-overlay">
                <WifiOff size={31} />

                <strong>
                  {!apiReachable
                    ? "Radar API Offline"
                    : "Radar Offline"}
                </strong>

                <span>
                  {!apiReachable
                    ? "Cannot reach MineGuard radar API"
                    : "Waiting for HLK-LD2420 telemetry"}
                </span>
              </div>
            )}

          </div>

          <div className="radar-axis">
            <span>0 m</span>
            <span>2 m</span>
            <span>4 m</span>
            <span>6 m</span>
            <span>8 m</span>
          </div>

          <div className="radar-origin-label">
            ROVER
          </div>

        </div>

        <div className="human-radar-info">

          <div
            className={`human-detection-banner ${
              !connected
                ? "offline"
                : detected
                  ? "danger"
                  : "clear"
            }`}
          >
            <div className="detection-banner-icon">
              {connected ? (
                <Activity size={28} />
              ) : (
                <WifiOff size={28} />
              )}
            </div>

            <div>
              <span>
                DETECTION STATUS
              </span>

              <strong>
                {!apiReachable
                  ? "API Offline"
                  : !connected
                    ? "Radar Offline"
                    : detected
                      ? "Possible Human"
                      : "Area Clear"}
              </strong>

              <p>
                {!apiReachable
                  ? "MineGuard radar API cannot currently be reached."
                  : !connected
                    ? "No live radar telemetry received."
                    : detected
                      ? "Presence confirmed by rover radar."
                      : "No human presence currently detected."}
              </p>
            </div>
          </div>

          <div className="radar-data-grid">

            <div className="radar-data-card">
              <div className="radar-data-icon">
                <Ruler size={19} />
              </div>

              <span>
                ESTIMATED RANGE
              </span>

              <strong>
                {connected &&
                detected &&
                distanceMeters !== null
                  ? distanceMeters.toFixed(2)
                  : "--"}

                <small>
                  {connected &&
                  detected &&
                  distanceMeters !== null
                    ? " m"
                    : ""}
                </small>
              </strong>
            </div>

            <div className="radar-data-card">
              <div className="radar-data-icon">
                <Radio size={19} />
              </div>

              <span>
                RADAR LINK
              </span>

              <strong
                className={
                  connected
                    ? "radar-link-online"
                    : "radar-link-offline"
                }
              >
                {connected
                  ? "ONLINE"
                  : "OFFLINE"}
              </strong>
            </div>

          </div>

          <div className="radar-note">
            <Activity size={15} />

            <span>
              Range is obtained from the rover radar.
              Horizontal bearing is intentionally not estimated.
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}

export default HumanDetectionCard;