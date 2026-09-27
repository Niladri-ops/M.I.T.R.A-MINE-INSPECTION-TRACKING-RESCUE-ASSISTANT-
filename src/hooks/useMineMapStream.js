import {
  useEffect,
  useState,
} from "react";

const EMPTY_MINE_MAP = {
  rover: {
    deviceId:
      "MITRA-ROVER-01",

    connected:
      false,

    x:
      0,

    y:
      0,

    distance:
      0,

    speed:
      0,

    heading:
      0,

    leftPulses:
      0,

    rightPulses:
      0,

    updatedAt:
      null,

    fresh:
      false,
  },

  track: [],

  hazards: [],

  updatedAt:
    null,
};


function normalizeMineMapData(
  data
) {
  return {
    rover: {
      ...EMPTY_MINE_MAP.rover,
      ...(data?.rover || {}),
    },

    track:
      Array.isArray(
        data?.track
      )
        ? data.track
        : [],

    hazards:
      Array.isArray(
        data?.hazards
      )
        ? data.hazards
        : [],

    updatedAt:
      data?.updatedAt ||
      null,
  };
}


export default function useMineMapStream() {
  const [
    mineMap,
    setMineMap,
  ] = useState(
    EMPTY_MINE_MAP
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
    ""
  );


  useEffect(() => {
    let mounted =
      true;

    let eventSource =
      null;


    const startSession =
      async () => {
        try {
          // ====================================================
          // CLEAR PREVIOUS MAP SESSION
          // ====================================================

          const resetResponse =
            await fetch(
              "/api/mine-map/reset",
              {
                method:
                  "POST",
              }
            );


          if (
            !resetResponse.ok
          ) {
            throw new Error(
              `Mine map reset failed: ${resetResponse.status}`
            );
          }


          if (!mounted) {
            return;
          }


          setMineMap(
            EMPTY_MINE_MAP
          );


          // ====================================================
          // LOAD NEW SNAPSHOT
          // ====================================================

          const snapshotResponse =
            await fetch(
              "/api/mine-map"
            );


          if (
            !snapshotResponse.ok
          ) {
            throw new Error(
              `Mine map snapshot failed: ${snapshotResponse.status}`
            );
          }


          const snapshot =
            await snapshotResponse.json();


          if (!mounted) {
            return;
          }


          setMineMap(
            normalizeMineMapData(
              snapshot
            )
          );


          // ====================================================
          // START SSE
          // ====================================================

          eventSource =
            new EventSource(
              "/api/mine-map-stream"
            );


          eventSource.onopen =
            () => {
              if (!mounted) {
                return;
              }

              setStreamConnected(
                true
              );

              setStreamError(
                ""
              );
            };


          eventSource.onerror =
            () => {
              if (!mounted) {
                return;
              }

              setStreamConnected(
                false
              );

              setStreamError(
                "Mine map live stream reconnecting..."
              );
            };


          // ====================================================
          // SNAPSHOT EVENT
          // ====================================================

          const handleSnapshot =
            (
              event
            ) => {
              try {
                const data =
                  JSON.parse(
                    event.data
                  );


                if (
                  !mounted
                ) {
                  return;
                }


                setMineMap(
                  normalizeMineMapData(
                    data
                  )
                );
              } catch (
                error
              ) {
                console.error(
                  "Mine map snapshot parse error:",
                  error
                );
              }
            };


          // ====================================================
          // ROVER EVENT
          // ====================================================

          const handleRover =
            (
              event
            ) => {
              try {
                const rover =
                  JSON.parse(
                    event.data
                  );


                if (
                  !mounted
                ) {
                  return;
                }


                setMineMap(
                  (
                    previous
                  ) => ({
                    ...previous,

                    rover: {
                      ...previous.rover,
                      ...rover,
                    },

                    updatedAt:
                      new Date()
                        .toISOString(),
                  })
                );
              } catch (
                error
              ) {
                console.error(
                  "Mine map rover parse error:",
                  error
                );
              }
            };


          // ====================================================
          // TRACK POINT EVENT
          // ====================================================

          const handleTrackPoint =
            (
              event
            ) => {
              try {
                const point =
                  JSON.parse(
                    event.data
                  );


                if (
                  !mounted
                ) {
                  return;
                }


                setMineMap(
                  (
                    previous
                  ) => ({
                    ...previous,

                    track: [
                      ...previous.track,
                      point,
                    ],

                    updatedAt:
                      new Date()
                        .toISOString(),
                  })
                );
              } catch (
                error
              ) {
                console.error(
                  "Mine map track point parse error:",
                  error
                );
              }
            };


          // ====================================================
          // RESET EVENT
          // ====================================================

          const handleReset =
            (
              event
            ) => {
              try {
                const data =
                  JSON.parse(
                    event.data
                  );


                if (
                  !mounted
                ) {
                  return;
                }


                setMineMap(
                  normalizeMineMapData(
                    data
                  )
                );
              } catch (
                error
              ) {
                console.error(
                  "Mine map reset parse error:",
                  error
                );
              }
            };


          eventSource.addEventListener(
            "snapshot",
            handleSnapshot
          );

          eventSource.addEventListener(
            "rover",
            handleRover
          );

          eventSource.addEventListener(
            "track-point",
            handleTrackPoint
          );

          eventSource.addEventListener(
            "reset",
            handleReset
          );
        } catch (
          error
        ) {
          console.error(
            "Mine map startup error:",
            error
          );


          if (!mounted) {
            return;
          }


          setStreamConnected(
            false
          );

          setStreamError(
            "Unable to start mine map session."
          );
        }
      };


    startSession();


    return () => {
      mounted =
        false;


      if (
        eventSource
      ) {
        eventSource.close();
      }
    };
  }, []);


  return {
    mineMap,
    streamConnected,
    streamError,
  };
}