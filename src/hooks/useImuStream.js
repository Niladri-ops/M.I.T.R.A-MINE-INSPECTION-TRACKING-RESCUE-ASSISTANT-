import {
  useEffect,
  useState,
} from "react";


// ============================================================
// DEFAULT IMU STATE
// ============================================================

const EMPTY_IMU = {
  deviceId:
    "MITRA-ROVER-01",

  connected:
    false,

  fresh:
    false,

  sequence:
    0,

  ax:
    0,

  ay:
    0,

  az:
    0,

  gx:
    0,

  gy:
    0,

  gz:
    0,

  roll:
    0,

  pitch:
    0,

  rawYaw:
    0,

  yaw:
    0,

  heading:
    0,

  headingType:
    "relative",

  stationary:
    true,

  yawLocked:
    true,

  gyroBiasZ:
    0,

  correctedYawRate:
    0,

  temperatureC:
    null,

  sampleHz:
    50,

  uptimeMs:
    0,

  updatedAt:
    null,
};


// ============================================================
// IMU STREAM HOOK
// ============================================================

export default function useImuStream() {

  const [
    imu,
    setImu,
  ] = useState(
    EMPTY_IMU
  );


  const [
    streamConnected,
    setStreamConnected,
  ] = useState(
    false
  );


  const [
    streamError,
    setStreamError,
  ] = useState(
    null
  );


  useEffect(
    () => {

      // ------------------------------------------------------
      // CONNECT TO BACKEND SSE STREAM
      // ------------------------------------------------------

      const source =
        new EventSource(
          "/api/imu-stream"
        );


      // ------------------------------------------------------
      // IMU EVENT
      // ------------------------------------------------------

      const onImu =
        (event) => {

          try {

            const next =
              JSON.parse(
                event.data
              );


            setImu(
              next
            );


            setStreamConnected(
              true
            );


            setStreamError(
              null
            );

          } catch (error) {

            console.error(
              "Invalid IMU SSE payload:",
              error
            );

          }

        };


      source.addEventListener(
        "imu",
        onImu
      );


      // ------------------------------------------------------
      // STREAM OPEN
      // ------------------------------------------------------

      source.onopen =
        () => {

          setStreamConnected(
            true
          );


          setStreamError(
            null
          );

        };


      // ------------------------------------------------------
      // STREAM ERROR
      // ------------------------------------------------------

      source.onerror =
        () => {

          setStreamConnected(
            false
          );


          setStreamError(
            "IMU live stream reconnecting..."
          );

        };


      // ------------------------------------------------------
      // CLEANUP
      // ------------------------------------------------------

      return () => {

        source
          .removeEventListener(
            "imu",
            onImu
          );


        source.close();

      };

    },

    []
  );


  // ==========================================================
  // RETURN DATA
  // ==========================================================

  return {

    imu,

    streamConnected,

    streamError,

  };
}