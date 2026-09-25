import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Activity,
  Box,
  Compass,
  Cpu,
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

const ROVER_API_URL = "/api/rover";

const EMPTY_ROVER = {
  connected: false,
  x: 0,
  y: 0,
  distance: 0,
  speed: 0,
  heading: 0,
  leftPulses: 0,
  rightPulses: 0,
  updatedAt: null,
};

function MineMap() {
  // ============================================================
  // ROVER POSITION / ODOMETRY STATE
  // ============================================================

  const [rover, setRover] =
    useState(EMPTY_ROVER);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ============================================================
  // LIVE MPU6050 STREAM
  // ============================================================

  const {
    imu,
    streamConnected,
    streamError,
  } = useImuStream();

  // ============================================================
  // FETCH ROVER / ODOMETRY
  // ============================================================

  const fetchRover =
    async () => {
      try {
        const response =
          await fetch(
            ROVER_API_URL
          );

        if (!response.ok) {
          throw new Error(
            `API request failed: ${response.status}`
          );
        }

        const data =
          await response.json();

        setRover(
          data.rover ||
            EMPTY_ROVER
        );

        setError("");

        setLoading(false);
      } catch (err) {
        console.error(
          "Rover API error:",
          err
        );

        setError(
          "Rover position telemetry is unavailable."
        );

        setLoading(false);
      }
    };

  useEffect(() => {
    fetchRover();

    const timer =
      setInterval(
        fetchRover,
        1000
      );

    return () =>
      clearInterval(
        timer
      );
  }, []);

  // ============================================================
  // ROVER DATA
  // ============================================================

  const roverConnected =
    Boolean(
      rover.connected
    );

  const x =
    Number(
      rover.x
    ) || 0;

  const y =
    Number(
      rover.y
    ) || 0;

  const distance =
    Number(
      rover.distance
    ) || 0;

  const speed =
    Number(
      rover.speed
    ) || 0;

  // ============================================================
  // IMU DATA
  // ============================================================

  const imuConnected =
    Boolean(
      streamConnected &&
      imu?.connected &&
      imu?.fresh
    );

  const roll =
    Number(
      imu?.roll
    ) || 0;

  const pitch =
    Number(
      imu?.pitch
    ) || 0;

  const yaw =
    Number(
      imu?.yaw
    ) || 0;

  const rawYaw =
    Number(
      imu?.rawYaw
    ) || 0;

  const heading =
    Number(
      imu?.heading
    ) || 0;

  const ax =
    Number(
      imu?.ax
    ) || 0;

  const ay =
    Number(
      imu?.ay
    ) || 0;

  const az =
    Number(
      imu?.az
    ) || 0;

  const gx =
    Number(
      imu?.gx
    ) || 0;

  const gy =
    Number(
      imu?.gy
    ) || 0;

  const gz =
    Number(
      imu?.gz
    ) || 0;

  const gyroBiasZ =
    Number(
      imu?.gyroBiasZ
    ) || 0;

  const correctedYawRate =
    Number(
      imu?.correctedYawRate
    ) || 0;

  const imuTemperature =
    Number(
      imu?.temperatureC
    );

  const sampleHz =
    Number(
      imu?.sampleHz
    ) || 0;

  const stationary =
    Boolean(
      imu?.stationary
    );

  const yawLocked =
    Boolean(
      imu?.yawLocked
    );

  // ============================================================
  // SMOOTH CONTINUOUS HEADING
  // ============================================================
  //
  // Prevents:
  // 359° -> 0°
  //
  // from visually rotating backwards through 359 degrees.
  //

  const previousHeadingRef =
    useRef(null);

  const [
    visualHeading,
    setVisualHeading,
  ] = useState(0);

  useEffect(() => {
    if (!imuConnected) {
      previousHeadingRef.current =
        null;

      return;
    }

    const currentHeading =
      Number(
        heading
      ) || 0;

    if (
      previousHeadingRef.current ===
      null
    ) {
      previousHeadingRef.current =
        currentHeading;

      setVisualHeading(
        currentHeading
      );

      return;
    }

    const previous =
      previousHeadingRef.current;

    let delta =
      currentHeading -
      previous;

    if (
      delta >
      180
    ) {
      delta -=
        360;
    }

    if (
      delta <
      -180
    ) {
      delta +=
        360;
    }

    setVisualHeading(
      (
        previousVisual
      ) =>
        previousVisual +
        delta
    );

    previousHeadingRef.current =
      currentHeading;
  }, [
    heading,
    imuConnected,
  ]);

  // ============================================================
  // SENSOR MAGNITUDES
  // ============================================================

  const accelMagnitude =
    useMemo(
      () =>
        Math.sqrt(
          ax * ax +
            ay * ay +
            az * az
        ),
      [
        ax,
        ay,
        az,
      ]
    );

  const gyroMagnitude =
    useMemo(
      () =>
        Math.sqrt(
          gx * gx +
            gy * gy +
            gz * gz
        ),
      [
        gx,
        gy,
        gz,
      ]
    );

  // ============================================================
  // MAP POSITION
  // ============================================================

  const mapWidth =
    800;

  const mapHeight =
    500;

  const scale =
    12;

  const roverMapX =
    Math.max(
      35,
      Math.min(
        mapWidth - 35,
        mapWidth / 2 +
          x * scale
      )
    );

  const roverMapY =
    Math.max(
      35,
      Math.min(
        mapHeight - 35,
        mapHeight / 2 -
          y * scale
      )
    );

  /*
   * For orientation we prefer the MPU6050 relative heading.
   * Position itself still comes only from rover odometry.
   */

  const displayHeading =
    imuConnected
      ? heading
      : Number(
          rover.heading
        ) || 0;

  // ============================================================
  // HELPERS
  // ============================================================

  const formatValue = (
    value,
    decimals = 2
  ) => {
    const number =
      Number(
        value
      );

    if (
      !Number.isFinite(
        number
      )
    ) {
      return "--";
    }

    return number.toFixed(
      decimals
    );
  };

  const getUpdatedTime =
    () => {
      const timestamp =
        imu?.updatedAt ||
        rover?.updatedAt;

      if (!timestamp) {
        return "--";
      }

      return new Date(
        timestamp
      ).toLocaleTimeString();
    };

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="mine-map-page">

      {/* ==================================================== */}
      {/* HEADER */}
      {/* ==================================================== */}

      <section className="mine-map-header">

        <div>
          <p className="eyebrow">
            M.I.T.R.A. NAVIGATION SYSTEM
          </p>

          <h1>
            Mine Map
          </h1>

          <p>
            Underground rover localisation,
            inertial attitude monitoring and
            rescue navigation telemetry.
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

        </div>

      </section>

      {/* ==================================================== */}
      {/* MAIN MAP */}
      {/* ==================================================== */}

      <section className="mine-map-layout">

        {/* ================================================== */}
        {/* MAP */}
        {/* ================================================== */}

        <div className="panel mine-map-panel">

          <div className="panel-heading">

            <div className="heading-with-icon">

              <Map size={20} />

              <div>
                <h3>
                  Underground Mine Map
                </h3>

                <p>
                  Local mine coordinate frame
                  · origin at rover start
                </p>
              </div>

            </div>

            <div className="mine-map-live">
              <span />
              LIVE
            </div>

          </div>

          <div className="mine-map-canvas">

            {/* Grid */}

            <div className="mine-grid" />

            {/* Tunnel structure */}

            <div className="mine-tunnel tunnel-main" />

            <div className="mine-tunnel tunnel-left" />

            <div className="mine-tunnel tunnel-right" />

            <div className="mine-tunnel tunnel-bottom" />

            {/* Zones */}

            <div className="mine-node node-origin">
              START
            </div>

            <div className="mine-node node-left">
              ZONE A
            </div>

            <div className="mine-node node-right">
              ZONE B
            </div>

            <div className="mine-node node-bottom">
              ZONE C
            </div>

            {/* ================================================= */}
            {/* ROVER */}
            {/* ================================================= */}

            <div
              className={`rover-marker ${
                roverConnected
                  ? "active"
                  : "inactive"
              }`}
              style={{
                left:
                  `${
                    (
                      roverMapX /
                      mapWidth
                    ) *
                    100
                  }%`,

                top:
                  `${
                    (
                      roverMapY /
                      mapHeight
                    ) *
                    100
                  }%`,
              }}
            >

              <div
                className="map-rover-heading"
                style={{
                  transform:
                    `rotate(${displayHeading}deg)`,
                }}
              >
                <div className="map-rover-heading-line" />
              </div>

              <div className="rover-dot">
                <Navigation
                  size={17}
                />
              </div>

              <span className="rover-label">
                ROVER
              </span>

            </div>

            {/* Coordinates */}

            <div className="map-coordinate coordinate-top-left">
              +Y
            </div>

            <div className="map-coordinate coordinate-bottom-right">
              +X
            </div>

            <div className="map-origin">
              0, 0
            </div>

            {/* ================================================= */}
            {/* ODOMETRY PLACEHOLDER */}
            {/* ================================================= */}

            {!roverConnected && (
              <div className="map-offline-overlay">

                <Radio
                  size={28}
                />

                <strong>
                  Position engine awaiting
                  wheel odometry
                </strong>

                <span>
                  MPU6050 attitude is available,
                  but X/Y movement will be enabled
                  when Hall-wheel odometry is
                  integrated.
                </span>

              </div>
            )}

          </div>

          <div className="mine-map-legend">

            <div>
              <span className="legend-rover" />
              Rover
            </div>

            <div>
              <span className="legend-tunnel" />
              Tunnel
            </div>

            <div>
              <span className="legend-zone" />
              Mine Zone
            </div>

          </div>

        </div>

        {/* ================================================== */}
        {/* MAP SIDE PANEL */}
        {/* ================================================== */}

        <div className="mine-map-side">

          {/* POSITION */}

          <div className="panel rover-position-panel">

            <div className="panel-heading">

              <div className="heading-with-icon">

                <Navigation
                  size={20}
                />

                <div>
                  <h3>
                    Rover Position
                  </h3>

                  <p>
                    Dead-reckoning coordinates
                  </p>
                </div>

              </div>

            </div>

            <div className="position-grid">

              <div className="position-value-card">
                <span>
                  X POSITION
                </span>

                <strong>
                  {formatValue(
                    x
                  )}

                  <small>
                    m
                  </small>
                </strong>
              </div>

              <div className="position-value-card">
                <span>
                  Y POSITION
                </span>

                <strong>
                  {formatValue(
                    y
                  )}

                  <small>
                    m
                  </small>
                </strong>
              </div>

              <div className="position-value-card wide">
                <span>
                  TOTAL DISTANCE
                </span>

                <strong>
                  {formatValue(
                    distance
                  )}

                  <small>
                    m
                  </small>
                </strong>
              </div>

            </div>

          </div>

          {/* MOTION */}

          <div className="panel rover-motion-panel">

            <div className="panel-heading">

              <div className="heading-with-icon">

                <Gauge
                  size={20}
                />

                <div>
                  <h3>
                    Motion
                  </h3>

                  <p>
                    Rover movement state
                  </p>
                </div>

              </div>

            </div>

            <div className="motion-list">

              <div className="motion-row">

                <span>
                  <Gauge
                    size={17}
                  />

                  Speed
                </span>

                <strong>
                  {formatValue(
                    speed
                  )}

                  <small>
                    {" "}m/s
                  </small>
                </strong>

              </div>

              <div className="motion-row">

                <span>
                  <Compass
                    size={17}
                  />

                  Heading
                </span>

                <strong>
                  {formatValue(
                    displayHeading,
                    1
                  )}

                  <small>
                    °
                  </small>
                </strong>

              </div>

              <div className="motion-row">

                <span>
                  <Ruler
                    size={17}
                  />

                  Distance
                </span>

                <strong>
                  {formatValue(
                    distance
                  )}

                  <small>
                    {" "}m
                  </small>
                </strong>

              </div>

            </div>

          </div>

          {/* CONNECTION */}

          <div className="panel rover-status-panel">

            <div className="panel-heading">

              <div className="heading-with-icon">

                <Wifi
                  size={20}
                />

                <div>
                  <h3>
                    Telemetry
                  </h3>

                  <p>
                    ESP32 communication
                  </p>
                </div>

              </div>

            </div>

            <div className="telemetry-status">

              <div
                className={`telemetry-indicator ${
                  imuConnected
                    ? "online"
                    : "offline"
                }`}
              >
                <span />

                {imuConnected
                  ? "IMU STREAM ONLINE"
                  : "IMU STREAM OFFLINE"}
              </div>

              <div className="telemetry-detail">
                <span>
                  MPU Address
                </span>

                <strong>
                  0x68
                </strong>
              </div>

              <div className="telemetry-detail">
                <span>
                  Sample rate
                </span>

                <strong>
                  {sampleHz} Hz
                </strong>
              </div>

              <div className="telemetry-detail">
                <span>
                  Heading source
                </span>

                <strong>
                  RELATIVE
                </strong>
              </div>

              <div className="telemetry-updated">

                <RotateCw
                  size={13}
                />

                Updated{" "}
                {getUpdatedTime()}

              </div>

              {streamError && (
                <div className="telemetry-error">
                  {streamError}
                </div>
              )}

            </div>

          </div>

        </div>

      </section>

      {/* ==================================================== */}
      {/* INERTIAL NAVIGATION CONSOLE */}
      {/* ==================================================== */}

      <section className="imu-console-section">

        {/* HEADER */}

        <div className="imu-console-header">

          <div>

            <p className="eyebrow">
              INERTIAL ATTITUDE
            </p>

            <h2>
              Live MPU6050 Navigation Simulator
            </h2>

            <p>
              Real-time rover orientation,
              acceleration, angular velocity and
              yaw-drift suppression telemetry.
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

        {/* ================================================== */}
        {/* TOP IMU GRID */}
        {/* ================================================== */}

        <div className="imu-main-grid">

          {/* ================================================= */}
          {/* ATTITUDE SIMULATOR */}
          {/* ================================================= */}

          <div className="panel imu-attitude-panel">

            <div className="panel-heading">

              <div className="heading-with-icon">

                <Box
                  size={20}
                />

                <div>
                  <h3>
                    3D Attitude
                  </h3>

                  <p>
                    Rover body reference frame
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

            {/* ================================================= */}
            {/* VPYTHON-STYLE ATTITUDE VISUALIZER */}
            {/* ================================================= */}

            <div className="vpython-attitude-viewport">

              {/* Background engineering grid */}

              <div className="vpy-grid" />

              {/* ================================================= */}
              {/* CAMERA / WORLD */}
              {/* ================================================= */}

              <div className="vpy-world">

                {/* =============================================== */}
                {/* YAW / HEADING PLANE */}
                {/* =============================================== */}

                <div className="vpy-yaw-plane">

                  <div className="vpy-yaw-plane-fill" />

                  <div className="vpy-yaw-plane-label">
                    YAW / HEADING PLANE
                  </div>

                </div>

                {/* =============================================== */}
                {/* ROLL PLANE */}
                {/* =============================================== */}

                <div className="vpy-roll-plane">

                  <div className="vpy-roll-plane-label">
                    ROLL PLANE
                  </div>

                </div>

                {/* =============================================== */}
                {/* PITCH PLANE */}
                {/* =============================================== */}

                <div className="vpy-pitch-plane">

                  <div className="vpy-pitch-plane-label">
                    PITCH PLANE
                  </div>

                </div>

                {/* =============================================== */}
                {/* OUTER COMPASS RING */}
                {/* =============================================== */}

                <div className="vpy-compass-ring">

                  <span className="vpy-compass-label vpy-zero">
                    0° / START
                  </span>

                  <span className="vpy-compass-label vpy-90">
                    90°
                  </span>

                  <span className="vpy-compass-label vpy-180">
                    180°
                  </span>

                  <span className="vpy-compass-label vpy-270">
                    270°
                  </span>

                </div>

                {/* =============================================== */}
                {/* ORANGE LIVE HEADING RING */}
                {/* =============================================== */}

                <div
                  className="vpy-heading-ring"
                  style={{
                    transform:
                      `translate(-50%, -50%) rotateZ(${visualHeading}deg)`,
                  }}
                >
                  <div className="vpy-heading-pointer" />
                </div>

                {/* =============================================== */}
                {/* X AXIS */}
                {/* =============================================== */}

                <div className="vpy-axis vpy-axis-x">

                  <div className="vpy-axis-arrow x-arrow" />

                  <span>
                    X
                  </span>

                </div>

                {/* =============================================== */}
                {/* Y AXIS */}
                {/* =============================================== */}

                <div className="vpy-axis vpy-axis-y">

                  <div className="vpy-axis-arrow y-arrow" />

                  <span>
                    Y
                  </span>

                </div>

                {/* =============================================== */}
                {/* Z AXIS */}
                {/* =============================================== */}

                <div className="vpy-axis-z">

                  <div className="vpy-z-line" />

                  <div className="vpy-z-arrow" />

                  <span>
                    Z / UP
                  </span>

                </div>

                {/* =============================================== */}
                {/* LIVE ROVER BODY */}
                {/* =============================================== */}

                <div
                  className="vpy-rover-orientation"
                  style={{
                    transform:
                      `
                      translate(-50%, -50%)
                      rotateZ(${visualHeading}deg)
                      rotateX(${-pitch}deg)
                      rotateY(${roll}deg)
                      `,
                  }}
                >

                  <div className="vpy-rover-body">

                    <div className="vpy-rover-top" />

                    <div className="vpy-rover-side" />

                    <div className="vpy-rover-front-face" />

                  </div>

                  {/* ROVER FRONT VECTOR */}

                  <div className="vpy-front-vector">

                    <div className="vpy-front-line" />

                    <div className="vpy-front-arrow" />

                    <span>
                      ROVER FRONT
                    </span>

                  </div>

                </div>

              </div>

              {/* ================================================= */}
              {/* LIVE VALUE OVERLAY */}
              {/* ================================================= */}

              <div className="vpy-live-values">

                <div>
                  <span>
                    ROLL
                  </span>

                  <strong>
                    {formatValue(
                      roll,
                      1
                    )}°
                  </strong>
                </div>

                <div>
                  <span>
                    PITCH
                  </span>

                  <strong>
                    {formatValue(
                      pitch,
                      1
                    )}°
                  </strong>
                </div>

                <div>
                  <span>
                    HEADING
                  </span>

                  <strong>
                    {formatValue(
                      heading,
                      1
                    )}°
                  </strong>
                </div>

              </div>

              {/* SENSOR STATUS */}

              <div
                className={`vpy-sensor-indicator ${
                  imuConnected
                    ? "online"
                    : "offline"
                }`}
              >
                <span />

                {imuConnected
                  ? "MPU6050 LIVE"
                  : "WAITING FOR MPU6050"}
              </div>

            </div>

            {/* ANGLES */}

            <div className="attitude-values">

              <div>
                <span>
                  ROLL
                </span>

                <strong>
                  {formatValue(
                    roll,
                    2
                  )}°
                </strong>
              </div>

              <div>
                <span>
                  PITCH
                </span>

                <strong>
                  {formatValue(
                    pitch,
                    2
                  )}°
                </strong>
              </div>

              <div>
                <span>
                  YAW
                </span>

                <strong>
                  {formatValue(
                    yaw,
                    2
                  )}°
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
                  )}°
                </strong>
              </div>

            </div>

          </div>

          {/* ================================================= */}
          {/* COMPASS / ORIENTATION */}
          {/* ================================================= */}

          <div className="panel imu-heading-panel">

            <div className="panel-heading">

              <div className="heading-with-icon">

                <Compass
                  size={20}
                />

                <div>
                  <h3>
                    Relative Heading
                  </h3>

                  <p>
                    0° = rover start orientation
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
                  transform:
                    `rotate(${visualHeading}deg)`,
                }}
              >
                <Navigation
                  size={28}
                />
              </div>

              <div className="imu-compass-center">

                <strong>
                  {formatValue(
                    heading,
                    1
                  )}°
                </strong>

                <span>
                  RELATIVE
                </span>

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

        {/* ================================================== */}
        {/* SENSOR CARDS */}
        {/* ================================================== */}

        <div className="imu-telemetry-grid">

          {/* ACCELEROMETER */}

          <div className="panel imu-data-panel">

            <div className="imu-data-title">

              <Activity
                size={20}
              />

              <div>
                <h3>
                  Accelerometer
                </h3>

                <p>
                  Linear acceleration + gravity
                </p>
              </div>

            </div>

            <div className="imu-axis-list">

              <div className="imu-axis-row x-axis-value">

                <span>
                  X
                </span>

                <strong>
                  {formatValue(
                    ax,
                    4
                  )} g
                </strong>

              </div>

              <div className="imu-axis-row y-axis-value">

                <span>
                  Y
                </span>

                <strong>
                  {formatValue(
                    ay,
                    4
                  )} g
                </strong>

              </div>

              <div className="imu-axis-row z-axis-value">

                <span>
                  Z
                </span>

                <strong>
                  {formatValue(
                    az,
                    4
                  )} g
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
                )} g
              </strong>

            </div>

          </div>

          {/* GYROSCOPE */}

          <div className="panel imu-data-panel">

            <div className="imu-data-title">

              <Waves
                size={20}
              />

              <div>
                <h3>
                  Gyroscope
                </h3>

                <p>
                  Angular velocity
                </p>
              </div>

            </div>

            <div className="imu-axis-list">

              <div className="imu-axis-row x-axis-value">

                <span>
                  X
                </span>

                <strong>
                  {formatValue(
                    gx,
                    4
                  )} °/s
                </strong>

              </div>

              <div className="imu-axis-row y-axis-value">

                <span>
                  Y
                </span>

                <strong>
                  {formatValue(
                    gy,
                    4
                  )} °/s
                </strong>

              </div>

              <div className="imu-axis-row z-axis-value">

                <span>
                  Z
                </span>

                <strong>
                  {formatValue(
                    gz,
                    4
                  )} °/s
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
                )} °/s
              </strong>

            </div>

          </div>

          {/* DRIFT SUPPRESSION */}

          <div className="panel imu-data-panel drift-panel">

            <div className="imu-data-title">

              <ShieldCheck
                size={20}
              />

              <div>
                <h3>
                  Drift Suppression
                </h3>

                <p>
                  Relative yaw stabilisation
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

              <span>
                Raw yaw
              </span>

              <strong>
                {formatValue(
                  rawYaw,
                  2
                )}°
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
                )}°
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
                )} °/s
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
                )} °/s
              </strong>

            </div>

          </div>

          {/* SYSTEM */}

          <div className="panel imu-data-panel">

            <div className="imu-data-title">

              <Cpu
                size={20}
              />

              <div>
                <h3>
                  IMU System
                </h3>

                <p>
                  Sensor health and stream state
                </p>
              </div>

            </div>

            <div className="imu-system-list">

              <div>
                <span>
                  Device
                </span>

                <strong>
                  MPU6050
                </strong>
              </div>

              <div>
                <span>
                  I²C address
                </span>

                <strong>
                  0x68
                </strong>
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
                    streamConnected
                      ? "success-text"
                      : "danger-text"
                  }
                >
                  {streamConnected
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

          {/* IMU TEMPERATURE */}

          <div className="panel imu-data-panel">

            <div className="imu-data-title">

              <Thermometer
                size={20}
              />

              <div>
                <h3>
                  IMU Diagnostics
                </h3>

                <p>
                  Internal MPU6050 telemetry
                </p>
              </div>

            </div>

            <div className="imu-temperature-display">

              <Thermometer
                size={31}
              />

              <strong>

                {Number.isFinite(
                  imuTemperature
                )
                  ? formatValue(
                      imuTemperature,
                      1
                    )
                  : "--"}

                <small>
                  °C
                </small>

              </strong>

            </div>

            <p className="imu-temperature-note">
              MPU6050 internal chip
              temperature — not the mine
              ambient temperature.
            </p>

          </div>

        </div>

        {/* ================================================== */}
        {/* NAVIGATION ENGINE STATUS */}
        {/* ================================================== */}

        <div className="panel navigation-engine-panel">

          <div className="navigation-engine-icon">

            <Navigation
              size={25}
            />

          </div>

          <div className="navigation-engine-copy">

            <span>
              NAVIGATION ENGINE
            </span>

            <h3>
              IMU attitude active ·
              position engine awaiting
              wheel odometry
            </h3>

            <p>
              The MPU6050 currently provides
              rover orientation and relative
              heading. X/Y mine position will
              be propagated once Hall-wheel
              distance measurements are
              integrated.
            </p>

          </div>

          <div className="navigation-engine-flow">

            <div>
              MPU6050
            </div>

            <span>
              →
            </span>

            <div>
              Heading
            </div>

            <span>
              →
            </span>

            <div className="pending">
              Hall Odometry
            </div>

            <span>
              →
            </span>

            <div className="pending">
              X / Y Track
            </div>

          </div>

        </div>

      </section>

      {/* ==================================================== */}
      {/* FOOTNOTE */}
      {/* ==================================================== */}

      <p className="prototype-note">
        M.I.T.R.A. prototype navigation:
        MPU6050 relative attitude is live.
        Mine-position propagation will use
        wheel odometry combined with inertial
        heading rather than MPU6050
        acceleration-only position estimation.
      </p>

    </div>
  );
}

export default MineMap; 