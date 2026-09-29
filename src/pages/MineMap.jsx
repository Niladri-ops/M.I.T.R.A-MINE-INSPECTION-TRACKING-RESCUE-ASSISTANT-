import {

  useEffect,

  useMemo,

  useRef,

  useState,

} from "react";



import {

  Activity,

  AlertTriangle,

  Box,

  Compass,

  Cpu,

  Flag,

  Gauge,

  Map,

  Navigation,

  Radio,

  RotateCw,

  Ruler,

  ShieldCheck,

  Thermometer,

  Wifi,

  Waves,

} from "lucide-react";



import useImuStream from "../hooks/useImuStream";

import useMineMapStream from "../hooks/useMineMapStream";



const MAP_WIDTH = 900;

const MAP_HEIGHT = 560;



const EMPTY_ROVER = {

  deviceId: "MITRA-ROVER-01",

  connected: false,

  x: 0,

  y: 0,

  distance: 0,

  speed: 0,

  heading: 0,

  leftPulses: 0,

  rightPulses: 0,

  updatedAt: null,

  fresh: false,

};



function MineMap() {

  // ============================================================

  // LIVE MINE MAP / ROVER STREAM

  // ============================================================



  const {

    mineMap,

    streamConnected: mapStreamConnected,

    streamError: mapStreamError,

  } = useMineMapStream();



  const rover = mineMap?.rover || EMPTY_ROVER;

  const track = Array.isArray(mineMap?.track) ? mineMap.track : [];

  const hazards = Array.isArray(mineMap?.hazards)

    ? mineMap.hazards

    : [];



  // ============================================================

  // LIVE MPU6050 STREAM

  // ============================================================



  const {

    imu,

    streamConnected: imuStreamConnected,

    streamError,

  } = useImuStream();



  // ============================================================

  // ROVER DATA

  // ============================================================



  const roverConnected = Boolean(

    rover.connected && rover.fresh

  );



  const x = Number(rover.x) || 0;

  const y = Number(rover.y) || 0;

  const distance = Number(rover.distance) || 0;

  const speed = Number(rover.speed) || 0;

  const odometryHeading = Number(rover.heading) || 0;

  const leftPulses = Number(rover.leftPulses) || 0;

  const rightPulses = Number(rover.rightPulses) || 0;



  // ============================================================

  // IMU DATA

  // ============================================================



  const imuConnected = Boolean(

    imuStreamConnected &&

      imu?.connected &&

      imu?.fresh

  );



  const roll = Number(imu?.roll) || 0;

  const pitch = Number(imu?.pitch) || 0;

  const yaw = Number(imu?.yaw) || 0;

  const rawYaw = Number(imu?.rawYaw) || 0;

  const heading = Number(imu?.heading) || 0;



  const ax = Number(imu?.ax) || 0;

  const ay = Number(imu?.ay) || 0;

  const az = Number(imu?.az) || 0;



  const gx = Number(imu?.gx) || 0;

  const gy = Number(imu?.gy) || 0;

  const gz = Number(imu?.gz) || 0;



  const gyroBiasZ = Number(imu?.gyroBiasZ) || 0;

  const correctedYawRate =

    Number(imu?.correctedYawRate) || 0;

  const imuTemperature = Number(imu?.temperatureC);

  const sampleHz = Number(imu?.sampleHz) || 0;

  const stationary = Boolean(imu?.stationary);

  const yawLocked = Boolean(imu?.yawLocked);



  // ============================================================

  // SMOOTH CONTINUOUS HEADING

  // ============================================================



  const previousHeadingRef = useRef(null);



  const [visualHeading, setVisualHeading] =

    useState(0);



  useEffect(() => {

    const sourceHeading = imuConnected

      ? heading

      : odometryHeading;



    if (

      !imuConnected &&

      !roverConnected

    ) {

      previousHeadingRef.current = null;

      return;

    }



    const currentHeading =

      Number(sourceHeading) || 0;



    if (

      previousHeadingRef.current === null

    ) {

      previousHeadingRef.current =

        currentHeading;



      setVisualHeading(currentHeading);

      return;

    }



    const previous =

      previousHeadingRef.current;



    let delta =

      currentHeading - previous;



    if (delta > 180) {

      delta -= 360;

    }



    if (delta < -180) {

      delta += 360;

    }



    setVisualHeading(

      (previousVisual) =>

        previousVisual + delta

    );



    previousHeadingRef.current =

      currentHeading;

  }, [

    heading,

    odometryHeading,

    imuConnected,

    roverConnected,

  ]);



  // ============================================================

  // SENSOR MAGNITUDES

  // ============================================================



  const accelMagnitude = useMemo(

    () =>

      Math.sqrt(

        ax * ax + ay * ay + az * az

      ),

    [ax, ay, az]

  );



  const gyroMagnitude = useMemo(

    () =>

      Math.sqrt(

        gx * gx + gy * gy + gz * gz

      ),

    [gx, gy, gz]

  );



  // ============================================================

  // DISPLAY HEADING

  // ============================================================



  const displayHeading = imuConnected

    ? heading

    : odometryHeading;



  // ============================================================

  // HAZARD SUMMARY

  // ============================================================



  const hazardSummary = useMemo(() => {

    const summary = {

      critical: 0,

      warning: 0,

      low: 0,

      total: 0,

    };



    hazards.forEach((hazard) => {

      const severity = String(

        hazard?.severity ||

          hazard?.level ||

          hazard?.risk ||

          ""

      ).toLowerCase();



      summary.total += 1;



      if (severity === "critical") {

        summary.critical += 1;

      } else if (

        severity === "warning" ||

        severity === "moderate"

      ) {

        summary.warning += 1;

      } else {

        summary.low += 1;

      }

    });



    return summary;

  }, [hazards]);



  // ============================================================

  // LIVE MAP PROJECTION

  // ============================================================



  const mapModel = useMemo(() => {

    const validTrack = track.filter(

      (point) =>

        Number.isFinite(Number(point?.x)) &&

        Number.isFinite(Number(point?.y))

    );



    const validHazards = hazards.filter(

      (hazard) =>

        Number.isFinite(Number(hazard?.x)) &&

        Number.isFinite(Number(hazard?.y))

    );



    const basePoints = [

      ...validTrack.map((point) => ({

        x: Number(point.x),

        y: Number(point.y),

      })),

      ...validHazards.map((hazard) => ({

        x: Number(hazard.x),

        y: Number(hazard.y),

      })),

      {

        x,

        y,

      },

    ];



    let minX = -2;

    let maxX = 2;

    let minY = -2;

    let maxY = 2;



    if (basePoints.length > 0) {

      minX = Math.min(

        ...basePoints.map((point) => point.x)

      );

      maxX = Math.max(

        ...basePoints.map((point) => point.x)

      );

      minY = Math.min(

        ...basePoints.map((point) => point.y)

      );

      maxY = Math.max(

        ...basePoints.map((point) => point.y)

      );

    }



    const rawSpanX = maxX - minX;

    const rawSpanY = maxY - minY;



    const safeSpanX =

      rawSpanX < 2 ? 2 : rawSpanX;

    const safeSpanY =

      rawSpanY < 2 ? 2 : rawSpanY;



    const padX = Math.max(

      0.75,

      safeSpanX * 0.15

    );



    const padY = Math.max(

      0.75,

      safeSpanY * 0.15

    );



    minX -= padX;

    maxX += padX;

    minY -= padY;

    maxY += padY;



    const spanX = maxX - minX;

    const spanY = maxY - minY;



    const project = (mx, my) => {

      const normalizedX =

        (mx - minX) / spanX;



      const normalizedY =

        1 - (my - minY) / spanY;



      return {

        sx: normalizedX * MAP_WIDTH,

        sy: normalizedY * MAP_HEIGHT,

      };

    };



    const trailPoints = validTrack.map(

      (point) =>

        project(

          Number(point.x),

          Number(point.y)

        )

    );



    const trailPolyline =

      trailPoints.length > 0

        ? trailPoints

            .map(

              (point) =>

                `${point.sx},${point.sy}`

            )

            .join(" ")

        : "";



    const roverPoint = project(x, y);



    const projectedHazards =

      validHazards.map((hazard) => {

        const severity = String(

          hazard?.severity ||

            hazard?.level ||

            hazard?.risk ||

            "low"

        ).toLowerCase();



        let color = "#22c55e";



        if (severity === "critical") {

          color = "#ef4444";

        } else if (

          severity === "warning" ||

          severity === "moderate"

        ) {

          color = "#facc15";

        }



        return {

          ...hazard,

          severity,

          color,

          ...project(

            Number(hazard.x),

            Number(hazard.y)

          ),

        };

      });



    return {

      bounds: {

        minX,

        maxX,

        minY,

        maxY,

      },

      roverPoint,

      trailPolyline,

      trailPoints,

      projectedHazards,

    };

  }, [track, hazards, x, y]);



  // ============================================================

  // HELPERS

  // ============================================================



  const formatValue = (

    value,

    decimals = 2

  ) => {

    const number = Number(value);



    if (!Number.isFinite(number)) {

      return "--";

    }



    return number.toFixed(decimals);

  };



  const getUpdatedTime = () => {

    const timestamp =

      mineMap?.updatedAt ||

      imu?.updatedAt ||

      rover?.updatedAt;



    if (!timestamp) {

      return "--";

    }



    return new Date(

      timestamp

    ).toLocaleTimeString();

  };



  const roverRotationRad =

    (visualHeading * Math.PI) / 180;



  const arrowLength = 28;



  const roverArrowX =

    mapModel.roverPoint.sx +

    Math.sin(roverRotationRad) *

      arrowLength;



  const roverArrowY =

    mapModel.roverPoint.sy -

    Math.cos(roverRotationRad) *

      arrowLength;



  const degToRad = (degrees) =>
    (degrees * Math.PI) / 180;

  const rotatePointX = (point, degrees) => {
    const r = degToRad(degrees);
    const c = Math.cos(r);
    const si = Math.sin(r);

    return {
      x: point.x,
      y: point.y * c - point.z * si,
      z: point.y * si + point.z * c,
    };
  };

  const rotatePointY = (point, degrees) => {
    const r = degToRad(degrees);
    const c = Math.cos(r);
    const si = Math.sin(r);

    return {
      x: point.x * c + point.z * si,
      y: point.y,
      z: -point.x * si + point.z * c,
    };
  };

  const rotatePointZ = (point, degrees) => {
    const r = degToRad(degrees);
    const c = Math.cos(r);
    const si = Math.sin(r);

    return {
      x: point.x * c - point.y * si,
      y: point.x * si + point.y * c,
      z: point.z,
    };
  };

  const applyLiveAttitude = (point) => {
    let p = { ...point };

    // Rover attitude: yaw -> pitch -> roll.
    p = rotatePointZ(p, visualHeading || 0);
    p = rotatePointY(p, pitch || 0);
    p = rotatePointX(p, roll || 0);

    // Fixed camera pose. This changes only how the scene is viewed,
    // not the IMU attitude itself.
    p = rotatePointX(p, -26);
    p = rotatePointZ(p, -38);

    return p;
  };

  const projectAttitudePoint = (point) => {
    const p = applyLiveAttitude(point);
    const camera = 520;
    const perspective = camera / (camera - p.z);

    return {
      x: 250 + p.x * perspective,
      y: 188 - p.y * perspective,
      depth: p.z,
    };
  };

  const polygonPoints = (points) =>
    points
      .map((point) => {
        const p = projectAttitudePoint(point);
        return `${p.x},${p.y}`;
      })
      .join(" ");

  const makeArrow = (end, shaftWidth = 7, headLength = 20, headWidth = 18) => {
    const start = projectAttitudePoint({ x: 0, y: 0, z: 0 });
    const tip = projectAttitudePoint(end);

    const dx = tip.x - start.x;
    const dy = tip.y - start.y;
    const length = Math.hypot(dx, dy) || 1;
    const ux = dx / length;
    const uy = dy / length;
    const px = -uy;
    const py = ux;

    const headBaseX = tip.x - ux * headLength;
    const headBaseY = tip.y - uy * headLength;

    return {
      start,
      tip,
      shaftX2: headBaseX,
      shaftY2: headBaseY,
      head: `${tip.x},${tip.y} ${headBaseX + px * headWidth / 2},${headBaseY + py * headWidth / 2} ${headBaseX - px * headWidth / 2},${headBaseY - py * headWidth / 2}`,
      shaftWidth,
    };
  };

  // ------------------------------------------------------------
  // COMPACT 3D IMU MODEL
  // ------------------------------------------------------------

  // Thin triangular rover/IMU body, deliberately similar to the
  // simple teapot-style demo shown in the reference image.
  const attitudeBodyTop = [
    { x: 92, y: 0, z: 10 },
    { x: -52, y: 58, z: 10 },
    { x: -34, y: 0, z: 24 },
    { x: -52, y: -58, z: 10 },
  ];

  const attitudeBodyBottom = [
    { x: 92, y: 0, z: -6 },
    { x: -52, y: 58, z: -6 },
    { x: -34, y: 0, z: 8 },
    { x: -52, y: -58, z: -6 },
  ];

  const attitudeTopPolygon = polygonPoints(attitudeBodyTop);
  const attitudeBottomPolygon = polygonPoints(attitudeBodyBottom);

  const sideA = polygonPoints([
    attitudeBodyTop[0],
    attitudeBodyTop[1],
    attitudeBodyBottom[1],
    attitudeBodyBottom[0],
  ]);

  const sideB = polygonPoints([
    attitudeBodyTop[0],
    attitudeBodyTop[3],
    attitudeBodyBottom[3],
    attitudeBodyBottom[0],
  ]);

  const sideC = polygonPoints([
    attitudeBodyTop[1],
    attitudeBodyTop[2],
    attitudeBodyBottom[2],
    attitudeBodyBottom[1],
  ]);

  const rollArrow = makeArrow({ x: 150, y: 0, z: 0 }, 7, 22, 18);
  const pitchArrow = makeArrow({ x: 0, y: 130, z: 0 }, 7, 22, 18);
  const yawArrow = makeArrow({ x: 0, y: 0, z: 145 }, 7, 22, 18);

  const attitudeCenter = projectAttitudePoint({ x: 0, y: 0, z: 0 });
  // ============================================================

  // PAGE

  // ============================================================



  return (

    <div className="mine-map-page">

      {/* HEADER */}



      <section className="mine-map-header">

        <div>

          <p className="eyebrow">

            M.I.T.R.A. NAVIGATION SYSTEM

          </p>



          <h1>Mine Map</h1>



          <p>

            Real-time underground

            hall-odometry tracking,

            inertial heading and

            live hazard-aware

            navigation canvas.

          </p>

        </div>



        <div className="mine-map-header-statuses">

          <div

            className={`mine-map-connection ${

              roverConnected

                ? "online"

                : "offline"

            }`}

          >

            <span />

            {roverConnected

              ? "ODOMETRY ONLINE"

              : "ODOMETRY OFFLINE"}

          </div>



          <div

            className={`mine-map-connection ${

              imuConnected

                ? "online"

                : "offline"

            }`}

          >

            <span />

            {imuConnected

              ? "IMU LIVE"

              : "IMU OFFLINE"}

          </div>



          <div

            className={`mine-map-connection ${

              mapStreamConnected

                ? "online"

                : "offline"

            }`}

          >

            <span />

            {mapStreamConnected

              ? "MAP STREAM LIVE"

              : "MAP STREAM OFFLINE"}

          </div>

        </div>

      </section>



      {/* MAIN MAP SECTION */}



      <section className="mine-map-layout">

        <div className="panel mine-map-panel">

          <div className="panel-heading">

            <div className="heading-with-icon">

              <Map size={20} />



              <div>

                <h3>

                  Dynamic Underground Mine Map

                </h3>



                <p>

                  Self-growing local map from

                  Hall-wheel odometry and

                  IMU heading

                </p>

              </div>

            </div>



            <div className="mine-map-live">

              <span />

              LIVE

            </div>

          </div>



          <div className="mine-map-canvas live-mine-map-canvas">

            <div className="mine-grid" />



            <div className="live-map-overlay-chip top-left">

              LIVE TRACK

            </div>



            <div className="live-map-overlay-chip top-right">

              TRACK POINTS: {track.length}

            </div>



            <div className="live-map-overlay-chip bottom-left">

              X: {formatValue(x, 2)} m · Y:{" "}

              {formatValue(y, 2)} m

            </div>



            <div className="live-map-overlay-chip bottom-right">

              HAZARDS: {hazardSummary.total}

            </div>



            <svg

              className="live-mine-map-svg"

              viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}

              width="100%"

              height="100%"

              preserveAspectRatio="none"

            >

              <defs>

                <filter id="trackGlow">

                  <feGaussianBlur

                    stdDeviation="3"

                    result="coloredBlur"

                  />

                  <feMerge>

                    <feMergeNode in="coloredBlur" />

                    <feMergeNode in="SourceGraphic" />

                  </feMerge>

                </filter>

              </defs>



              {/* Crosshair origin projection */}

              <g opacity="0.2">

                <line

                  x1={0}

                  y1={MAP_HEIGHT / 2}

                  x2={MAP_WIDTH}

                  y2={MAP_HEIGHT / 2}

                  stroke="#64748b"

                  strokeWidth="1"

                  strokeDasharray="6 6"

                />

                <line

                  x1={MAP_WIDTH / 2}

                  y1={0}

                  x2={MAP_WIDTH / 2}

                  y2={MAP_HEIGHT}

                  stroke="#64748b"

                  strokeWidth="1"

                  strokeDasharray="6 6"

                />

              </g>



              {/* Path trail */}

              {mapModel.trailPolyline && (

                <polyline

                  points={mapModel.trailPolyline}

                  fill="none"

                  stroke="#22d3ee"

                  strokeWidth="4"

                  strokeLinecap="round"

                  strokeLinejoin="round"

                  opacity="0.95"

                  filter="url(#trackGlow)"

                />

              )}



              {/* Small track dots */}

              {mapModel.trailPoints.map(

                (point, index) => (

                  <circle

                    key={`track-${index}`}

                    cx={point.sx}

                    cy={point.sy}

                    r="2.5"

                    fill="#67e8f9"

                    opacity="0.9"

                  />

                )

              )}



              {/* Hazard markers */}

              {mapModel.projectedHazards.map(

                (hazard, index) => (

                  <g

                    key={`hazard-${index}`}

                    transform={`translate(${hazard.sx}, ${hazard.sy})`}

                  >

                    <circle

                      r="12"

                      fill={hazard.color}

                      opacity="0.25"

                    />



                    <circle

                      r="7"

                      fill={hazard.color}

                    />



                    <path

                      d="M 10 -16 L 24 -16 L 18 -6 L 10 -6 Z"

                      fill={hazard.color}

                      opacity="0.95"

                    />



                    <line

                      x1="10"

                      y1="-18"

                      x2="10"

                      y2="16"

                      stroke={hazard.color}

                      strokeWidth="2"

                    />

                  </g>

                )

              )}



              {/* Rover heading line */}

              <line

                x1={mapModel.roverPoint.sx}

                y1={mapModel.roverPoint.sy}

                x2={roverArrowX}

                y2={roverArrowY}

                stroke="#f97316"

                strokeWidth="4"

                strokeLinecap="round"

              />



              {/* Arrow tip */}

              <polygon

                points={`${roverArrowX},${roverArrowY} ${

                  roverArrowX - 7

                },${roverArrowY + 12} ${

                  roverArrowX + 7

                },${roverArrowY + 12}`}

                fill="#f97316"

                transform={`rotate(${visualHeading} ${roverArrowX} ${roverArrowY})`}

              />



              {/* Rover marker */}

              <circle

                cx={mapModel.roverPoint.sx}

                cy={mapModel.roverPoint.sy}

                r="16"

                fill="#0f172a"

                stroke="#38bdf8"

                strokeWidth="3"

              />



              <circle

                cx={mapModel.roverPoint.sx}

                cy={mapModel.roverPoint.sy}

                r="7"

                fill="#38bdf8"

              />

            </svg>



            <div className="live-map-info-panel">

              <div>

                <span>MAP RANGE X</span>

                <strong>

                  {formatValue(

                    mapModel.bounds.minX,

                    2

                  )}{" "}

                  to{" "}

                  {formatValue(

                    mapModel.bounds.maxX,

                    2

                  )}{" "}

                  m

                </strong>

              </div>



              <div>

                <span>MAP RANGE Y</span>

                <strong>

                  {formatValue(

                    mapModel.bounds.minY,

                    2

                  )}{" "}

                  to{" "}

                  {formatValue(

                    mapModel.bounds.maxY,

                    2

                  )}{" "}

                  m

                </strong>

              </div>



              <div>

                <span>TRACK LENGTH</span>

                <strong>

                  {track.length}

                </strong>

              </div>

            </div>



            {!roverConnected && (

              <div className="map-offline-overlay">

                <Radio size={28} />



                <strong>

                  Waiting for live rover

                  odometry

                </strong>



                <span>

                  Live Underground Path
                </span>

              </div>

            )}

          </div>



          <div className="mine-map-legend">

            <div>

              <span

                className="legend-rover"

                style={{

                  background:

                    "#38bdf8",

                }}

              />

              Rover

            </div>



            <div>

              <span

                className="legend-tunnel"

                style={{

                  background:

                    "#22d3ee",

                }}

              />

              Travel Trail

            </div>



            <div>

              <span

                className="legend-zone"

                style={{

                  background:

                    "#ef4444",

                }}

              />

              Hazard Flag

            </div>

          </div>

        </div>



        {/* SIDE PANEL */}



        <div className="mine-map-side">

          <div className="panel rover-position-panel">

            <div className="panel-heading">

              <div className="heading-with-icon">

                <Navigation size={20} />



                <div>

                  <h3>Rover Position</h3>

                  <p>

                    Live hall-odometry

                    coordinates

                  </p>

                </div>

              </div>

            </div>



            <div className="position-grid">

              <div className="position-value-card">

                <span>X POSITION</span>

                <strong>

                  {formatValue(x)}

                  <small>m</small>

                </strong>

              </div>



              <div className="position-value-card">

                <span>Y POSITION</span>

                <strong>

                  {formatValue(y)}

                  <small>m</small>

                </strong>

              </div>



              <div className="position-value-card wide">

                <span>TOTAL DISTANCE</span>

                <strong>

                  {formatValue(distance)}

                  <small>m</small>

                </strong>

              </div>

            </div>

          </div>



          <div className="panel rover-motion-panel">

            <div className="panel-heading">

              <div className="heading-with-icon">

                <Gauge size={20} />



                <div>

                  <h3>Motion</h3>

                  <p>

                    Movement and heading

                  </p>

                </div>

              </div>

            </div>



            <div className="motion-list">

              <div className="motion-row">

                <span>

                  <Gauge size={17} />

                  Speed

                </span>



                <strong>

                  {formatValue(speed)}

                  <small> m/s</small>

                </strong>

              </div>



              <div className="motion-row">

                <span>

                  <Compass size={17} />

                  Heading

                </span>



                <strong>

                  {formatValue(

                    displayHeading,

                    1

                  )}

                  <small>°</small>

                </strong>

              </div>



              <div className="motion-row">

                <span>

                  <Ruler size={17} />

                  Distance

                </span>



                <strong>

                  {formatValue(distance)}

                  <small> m</small>

                </strong>

              </div>

            </div>

          </div>



          <div className="panel rover-status-panel">

            <div className="panel-heading">

              <div className="heading-with-icon">

                <Wifi size={20} />



                <div>

                  <h3>Telemetry</h3>

                  <p>

                    Rover

                    communication

                  </p>

                </div>

              </div>

            </div>



            <div className="telemetry-status">

              <div

                className={`telemetry-indicator ${

                  roverConnected

                    ? "online"

                    : "offline"

                }`}

              >

                <span />

                {roverConnected

                  ? "ROVER STREAM ONLINE"

                  : "ROVER STREAM OFFLINE"}

              </div>



              <div className="telemetry-detail">

                <span>Left pulses</span>

                <strong>

                  {leftPulses}

                </strong>

              </div>



              <div className="telemetry-detail">

                <span>Right pulses</span>

                <strong>

                  {rightPulses}

                </strong>

              </div>



              <div className="telemetry-detail">

                <span>Track points</span>

                <strong>

                  {track.length}

                </strong>

              </div>



              <div className="telemetry-updated">

                <RotateCw size={13} />

                Updated {getUpdatedTime()}

              </div>



              {mapStreamError && (

                <div className="telemetry-error">

                  {mapStreamError}

                </div>

              )}

            </div>

          </div>



          <div className="panel rover-status-panel">

            <div className="panel-heading">

              <div className="heading-with-icon">

                <Flag size={20} />



                <div>

                  <h3>Hazard Mapping</h3>

                  <p>

                    Live zone marking

                  </p>

                </div>

              </div>

            </div>



            <div className="telemetry-status">

              <div className="telemetry-detail">

                <span>Critical</span>

                <strong>

                  {hazardSummary.critical}

                </strong>

              </div>



              <div className="telemetry-detail">

                <span>Moderate</span>

                <strong>

                  {hazardSummary.warning}

                </strong>

              </div>



              <div className="telemetry-detail">

                <span>Low risk</span>

                <strong>

                  {hazardSummary.low}

                </strong>

              </div>



              <div className="telemetry-detail">

                <span>Total markers</span>

                <strong>

                  {hazardSummary.total}

                </strong>

              </div>

            </div>

          </div>

        </div>

      </section>



      {/* IMU SECTION */}



      <section className="imu-console-section">

        <div className="imu-console-header">

          <div>

            <p className="eyebrow">

              INERTIAL ATTITUDE

            </p>



            <h2>

              Live MPU6050 Navigation

              Simulator

            </h2>



            <p>

              Real-time rover orientation,

              acceleration, angular

              velocity and yaw-drift

              suppression telemetry.

            </p>

          </div>



          <div

            className={`imu-live-chip ${

              imuConnected

                ? "online"

                : "offline"

            }`}

          >

            <span />



            {imuConnected

              ? "LIVE SENSOR DATA"

              : "WAITING FOR IMU"}

          </div>

        </div>



        <div className="imu-main-grid">

          <div className="panel imu-attitude-panel">

            <div className="panel-heading">

              <div className="heading-with-icon">

                <Box size={20} />



                <div>

                  <h3>3D Attitude</h3>

                  <p>

                    Rover body reference

                    frame

                  </p>

                </div>

              </div>



              <div

                className={`imu-motion-badge ${

                  stationary

                    ? "stationary"

                    : "moving"

                }`}

              >

                {stationary

                  ? "STATIONARY"

                  : "MOVING"}

              </div>

            </div>



            <div
              style={{
                padding: "18px",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  minHeight: "420px",
                  borderRadius: "18px",
                  overflow: "hidden",
                  border: "1px solid rgba(56, 229, 141, 0.10)",
                  background:
                    "radial-gradient(circle at 50% 48%, rgba(8, 19, 26, 0.96) 0%, rgba(2, 7, 10, 0.99) 60%, #010304 100%)",
                  boxShadow:
                    "inset 0 0 34px rgba(0, 0, 0, 0.48)",
                }}
              >
                <svg
                  viewBox="0 0 500 380"
                  style={{
                    width: "100%",
                    height: "420px",
                    display: "block",
                  }}
                >
                  <defs>
                    <filter
                      id="attitudeBodyGlow"
                      x="-50%"
                      y="-50%"
                      width="200%"
                      height="200%"
                    >
                      <feGaussianBlur
                        stdDeviation="4"
                        result="blur"
                      />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Three compact attitude vectors */}
                  <line
                    x1={rollArrow.start.x}
                    y1={rollArrow.start.y}
                    x2={rollArrow.shaftX2}
                    y2={rollArrow.shaftY2}
                    stroke="#ef3f45"
                    strokeWidth={rollArrow.shaftWidth}
                    strokeLinecap="round"
                  />
                  <polygon
                    points={rollArrow.head}
                    fill="#ef3f45"
                  />

                  <line
                    x1={pitchArrow.start.x}
                    y1={pitchArrow.start.y}
                    x2={pitchArrow.shaftX2}
                    y2={pitchArrow.shaftY2}
                    stroke="#2f6fea"
                    strokeWidth={pitchArrow.shaftWidth}
                    strokeLinecap="round"
                  />
                  <polygon
                    points={pitchArrow.head}
                    fill="#2f6fea"
                  />

                  <line
                    x1={yawArrow.start.x}
                    y1={yawArrow.start.y}
                    x2={yawArrow.shaftX2}
                    y2={yawArrow.shaftY2}
                    stroke="#f3df18"
                    strokeWidth={yawArrow.shaftWidth}
                    strokeLinecap="round"
                  />
                  <polygon
                    points={yawArrow.head}
                    fill="#f3df18"
                  />

                  {/* Compact 3D green body */}
                  <g filter="url(#attitudeBodyGlow)">
                    <polygon
                      points={attitudeBottomPolygon}
                      fill="#126f2e"
                      stroke="#42cb65"
                      strokeWidth="1.4"
                    />

                    <polygon
                      points={sideA}
                      fill="#19933c"
                      stroke="#55e876"
                      strokeWidth="1.2"
                    />

                    <polygon
                      points={sideB}
                      fill="#11742f"
                      stroke="#42d468"
                      strokeWidth="1.2"
                    />

                    <polygon
                      points={sideC}
                      fill="#20a546"
                      stroke="#5cef7b"
                      strokeWidth="1.2"
                    />

                    <polygon
                      points={attitudeTopPolygon}
                      fill="#31c953"
                      stroke="#76ff91"
                      strokeWidth="2.2"
                    />
                  </g>

                  <circle
                    cx={attitudeCenter.x}
                    cy={attitudeCenter.y}
                    r="4"
                    fill="#111827"
                  />
                </svg>

              </div>
            </div>

            <div className="attitude-values">

              <div>

                <span>ROLL</span>

                <strong>

                  {formatValue(

                    roll,

                    2

                  )}

                  °

                </strong>

              </div>



              <div>

                <span>PITCH</span>

                <strong>

                  {formatValue(

                    pitch,

                    2

                  )}

                  °

                </strong>

              </div>



              <div>

                <span>YAW</span>

                <strong>

                  {formatValue(

                    yaw,

                    2

                  )}

                  °

                </strong>

              </div>



              <div>

                <span>

                  RELATIVE HEADING

                </span>

                <strong>

                  {formatValue(

                    heading,

                    2

                  )}

                  °

                </strong>

              </div>

            </div>

          </div>



          <div className="panel imu-heading-panel">

            <div className="panel-heading">

              <div className="heading-with-icon">

                <Compass size={20} />



                <div>

                  <h3>

                    Relative Heading

                  </h3>

                  <p>

                    0° = rover start

                    orientation

                  </p>

                </div>

              </div>

            </div>



            <div className="imu-compass">

              <span className="compass-n">

                0°

              </span>

              <span className="compass-e">

                90°

              </span>

              <span className="compass-s">

                180°

              </span>

              <span className="compass-w">

                270°

              </span>



              <div

                className="imu-compass-needle"

                style={{

                  transform: `rotate(${visualHeading}deg)`,

                }}

              >

                <Navigation size={28} />

              </div>



              <div className="imu-compass-center">

                <strong>

                  {formatValue(

                    heading,

                    1

                  )}

                  °

                </strong>

                <span>RELATIVE</span>

              </div>

            </div>



            <div className="imu-orientation-status">

              <div>

                <span>

                  Heading mode

                </span>

                <strong>

                  RELATIVE

                </strong>

              </div>



              <div>

                <span>

                  Magnetometer

                </span>

                <strong className="warning-text">

                  NOT AVAILABLE

                </strong>

              </div>



              <div>

                <span>

                  Rover state

                </span>

                <strong

                  className={

                    stationary

                      ? "success-text"

                      : ""

                  }

                >

                  {stationary

                    ? "STATIONARY"

                    : "MOVING"}

                </strong>

              </div>

            </div>

          </div>

        </div>



        <div className="imu-telemetry-grid">

          <div className="panel imu-data-panel">

            <div className="imu-data-title">

              <Activity size={20} />



              <div>

                <h3>

                  Accelerometer

                </h3>

                <p>

                  Linear acceleration +

                  gravity

                </p>

              </div>

            </div>



            <div className="imu-axis-list">

              <div className="imu-axis-row x-axis-value">

                <span>X</span>

                <strong>

                  {formatValue(

                    ax,

                    4

                  )}{" "}

                  g

                </strong>

              </div>



              <div className="imu-axis-row y-axis-value">

                <span>Y</span>

                <strong>

                  {formatValue(

                    ay,

                    4

                  )}{" "}

                  g

                </strong>

              </div>



              <div className="imu-axis-row z-axis-value">

                <span>Z</span>

                <strong>

                  {formatValue(

                    az,

                    4

                  )}{" "}

                  g

                </strong>

              </div>

            </div>



            <div className="imu-magnitude">

              <span>

                Vector magnitude

              </span>

              <strong>

                {formatValue(

                  accelMagnitude,

                  4

                )}{" "}

                g

              </strong>

            </div>

          </div>



          <div className="panel imu-data-panel">

            <div className="imu-data-title">

              <Waves size={20} />



              <div>

                <h3>Gyroscope</h3>

                <p>

                  Angular velocity

                </p>

              </div>

            </div>



            <div className="imu-axis-list">

              <div className="imu-axis-row x-axis-value">

                <span>X</span>

                <strong>

                  {formatValue(

                    gx,

                    4

                  )}{" "}

                  °/s

                </strong>

              </div>



              <div className="imu-axis-row y-axis-value">

                <span>Y</span>

                <strong>

                  {formatValue(

                    gy,

                    4

                  )}{" "}

                  °/s

                </strong>

              </div>



              <div className="imu-axis-row z-axis-value">

                <span>Z</span>

                <strong>

                  {formatValue(

                    gz,

                    4

                  )}{" "}

                  °/s

                </strong>

              </div>

            </div>



            <div className="imu-magnitude">

              <span>

                Angular magnitude

              </span>

              <strong>

                {formatValue(

                  gyroMagnitude,

                  4

                )}{" "}

                °/s

              </strong>

            </div>

          </div>



          <div className="panel imu-data-panel drift-panel">

            <div className="imu-data-title">

              <ShieldCheck size={20} />



              <div>

                <h3>

                  Drift Suppression

                </h3>

                <p>

                  Relative yaw

                  stabilisation

                </p>

              </div>

            </div>



            <div className="drift-status-row">

              <span>

                Yaw stabilizer

              </span>

              <strong

                className={

                  yawLocked

                    ? "success-text"

                    : "warning-text"

                }

              >

                {yawLocked

                  ? "LOCKED"

                  : "TRACKING"}

              </strong>

            </div>



            <div className="drift-status-row">

              <span>Raw yaw</span>

              <strong>

                {formatValue(

                  rawYaw,

                  2

                )}

                °

              </strong>

            </div>



            <div className="drift-status-row">

              <span>

                Corrected yaw

              </span>

              <strong>

                {formatValue(

                  yaw,

                  2

                )}

                °

              </strong>

            </div>



            <div className="drift-status-row">

              <span>

                Z gyro bias

              </span>

              <strong>

                {formatValue(

                  gyroBiasZ,

                  5

                )}{" "}

                °/s

              </strong>

            </div>



            <div className="drift-status-row">

              <span>

                Corrected rate

              </span>

              <strong>

                {formatValue(

                  correctedYawRate,

                  4

                )}{" "}

                °/s

              </strong>

            </div>

          </div>



          <div className="panel imu-data-panel">

            <div className="imu-data-title">

              <Cpu size={20} />



              <div>

                <h3>IMU System</h3>

                <p>

                  Sensor health and

                  stream state

                </p>

              </div>

            </div>



            <div className="imu-system-list">

              <div>

                <span>Device</span>

                <strong>

                  MPU6050

                </strong>

              </div>



              <div>

                <span>

                  I²C address

                </span>

                <strong>0x68</strong>

              </div>



              <div>

                <span>

                  Sample rate

                </span>

                <strong>

                  {sampleHz} Hz

                </strong>

              </div>



              <div>

                <span>

                  API stream

                </span>

                <strong

                  className={

                    imuStreamConnected

                      ? "success-text"

                      : "danger-text"

                  }

                >

                  {imuStreamConnected

                    ? "CONNECTED"

                    : "OFFLINE"}

                </strong>

              </div>



              <div>

                <span>

                  IMU status

                </span>

                <strong

                  className={

                    imuConnected

                      ? "success-text"

                      : "danger-text"

                  }

                >

                  {imuConnected

                    ? "ONLINE"

                    : "OFFLINE"}

                </strong>

              </div>

            </div>

          </div>



          <div className="panel imu-data-panel">

            <div className="imu-data-title">

              <Thermometer size={20} />



              <div>

                <h3>

                  IMU Diagnostics

                </h3>

                <p>

                  Internal IMU

                  telemetry

                </p>

              </div>

            </div>



            <div className="imu-temperature-display">

              <Thermometer size={31} />



              <strong>

                {Number.isFinite(

                  imuTemperature

                )

                  ? formatValue(

                      imuTemperature,

                      1

                    )

                  : "--"}

                <small>°C</small>

              </strong>

            </div>



            <p className="imu-temperature-note">

              IMU internal chip

              temperature — not the mine

              ambient temperature.

            </p>

          </div>

        </div>



        <div className="panel navigation-engine-panel">

          <div className="navigation-engine-icon">

            <Navigation size={25} />

          </div>



          <div className="navigation-engine-copy">

            <span>

              NAVIGATION ENGINE

            </span>



            <h3>

              Hall odometry + IMU

              heading are now driving

              the live mine map

            </h3>



            <p>

              X/Y trail is now drawn from

              wheel Hall-effect odometry,

              while orientation continues

              to use MPU6050 relative

              heading. Hazard flags will

              automatically appear on this

              same map when geotagged

              alerts are added in the

              backend.

            </p>

          </div>



          <div className="navigation-engine-flow">

            <div>MPU6050</div>

            <span>→</span>

            <div>Heading</div>

            <span>→</span>

            <div>Hall Odometry</div>

            <span>→</span>

            <div>X / Y Track</div>

          </div>

        </div>

      </section>



      <p className="prototype-note">

        M.I.T.R.A. live navigation

        prototype: the underground map

        now grows dynamically from

        Hall-wheel odometry while the

        rover pointer orientation uses

        IMU relative heading.

         The map detects hazard by geotagging gas risk events
      </p>

    </div>

  );

}



export default MineMap;