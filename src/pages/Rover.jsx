import {
  Camera,
  Wifi,
  Video,
  Volume2,
  VolumeX,
  Radio,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

function Rover() {
  // ----------------------------------------------------------
  // DROIDCAM VIDEO
  // ----------------------------------------------------------

  const cameraUrl = "/droidcam/video";

  // ----------------------------------------------------------
  // AUDIOSHARE
  // ----------------------------------------------------------

  const audioShareUrl =
    "http://10.132.121.26:8080";

  const [
    roverAudioEnabled,
    setRoverAudioEnabled,
  ] = useState(false);

  // ----------------------------------------------------------
  // Stop AudioShare automatically when leaving Rover page
  // ----------------------------------------------------------

  useEffect(() => {
    return () => {
      setRoverAudioEnabled(false);
    };
  }, []);

  const toggleRoverAudio = () => {
    setRoverAudioEnabled(
      (current) => !current
    );
  };

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100%",
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "1.5px",
              opacity: 0.65,
            }}
          >
            ROVER MONITORING
          </p>

          <h1
            style={{
              margin: "6px 0 4px",
              fontSize: "30px",
            }}
          >
            Live Rover Surveillance
          </h1>

          <p
            style={{
              margin: 0,
              opacity: 0.65,
            }}
          >
            Real-time visual and audio
            monitoring for M.I.T.R.A
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "9px 14px",
            borderRadius: "999px",
            background:
              "rgba(34, 197, 94, 0.12)",
            color: "#22c55e",
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#22c55e",
              display: "inline-block",
            }}
          />

          ROVER LINK ACTIVE
        </div>
      </div>

      {/* =====================================================
          MAIN GRID
      ====================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 2fr) minmax(280px, 1fr)",
          gap: "20px",
        }}
      >
        {/* ===================================================
            CAMERA PANEL
        ==================================================== */}

        <div
          style={{
            background:
              "rgba(255, 255, 255, 0.04)",
            border:
              "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "16px",
            overflow: "hidden",
          }}
        >
          {/* CAMERA HEADER */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent:
                "space-between",
              padding: "16px 18px",
              borderBottom:
                "1px solid rgba(255, 255, 255, 0.08)",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Camera size={20} />

              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "16px",
                  }}
                >
                  Live Rover Camera
                </h3>

                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "12px",
                    opacity: 0.6,
                  }}
                >
                  DroidCam mobile camera
                </p>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              {/* AUDIO BUTTON */}

              <button
                type="button"
                className={`rover-audio-btn ${
                  roverAudioEnabled
                    ? "active"
                    : ""
                }`}
                onClick={
                  toggleRoverAudio
                }
              >
                {roverAudioEnabled ? (
                  <>
                    <Volume2
                      size={17}
                    />

                    Rover Audio Live
                  </>
                ) : (
                  <>
                    <VolumeX
                      size={17}
                    />

                    Enable Rover Audio
                  </>
                )}
              </button>

              {/* VIDEO STATUS */}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                <Video size={15} />

                LIVE
              </div>
            </div>
          </div>

          {/* =================================================
              DROIDCAM VIDEO
          ================================================== */}

          <div
            style={{
              width: "100%",
              aspectRatio: "16 / 9",
              background: "#050505",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={cameraUrl}
              alt="MineGuard live rover camera"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>

          {/* =================================================
              AUDIOSHARE LISTENER
          ================================================== */}

          {roverAudioEnabled && (
            <div
              style={{
                padding: "16px",
                borderTop:
                  "1px solid rgba(56, 229, 141, 0.12)",
                background:
                  "rgba(56, 229, 141, 0.025)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "12px",
                }}
              >
                <Radio
                  size={18}
                  color="#38e58d"
                />

                <div>
                  <strong
                    style={{
                      display: "block",
                      fontSize: "13px",
                      color: "#38e58d",
                    }}
                  >
                    Rover Audio Channel
                  </strong>

                  <span
                    style={{
                      display: "block",
                      marginTop: "3px",
                      fontSize: "10px",
                      opacity: 0.55,
                    }}
                  >
                    AudioShare microphone
                    stream
                  </span>
                </div>
              </div>

              {/* =============================================
                  AUDIOSHARE WEB LISTENER
              ============================================== */}

              <iframe
                src={audioShareUrl}
                title="MineGuard Rover Audio"
                allow="autoplay"
                style={{
                  width: "100%",
                  height: "180px",

                  display: "block",

                  background:
                    "#070b0d",

                  border:
                    "1px solid rgba(56, 229, 141, 0.12)",

                  borderRadius:
                    "10px",
                }}
              />
            </div>
          )}
        </div>

        {/* ===================================================
            RIGHT SIDE
        ==================================================== */}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* =================================================
              CAMERA STATUS
          ================================================== */}

          <div
            style={{
              background:
                "rgba(255, 255, 255, 0.04)",
              border:
                "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
              padding: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "20px",
              }}
            >
              <Wifi size={20} />

              <h3
                style={{
                  margin: 0,
                  fontSize: "16px",
                }}
              >
                Rover Link
              </h3>
            </div>

            {/* CONNECTION */}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                padding: "12px 0",
                borderBottom:
                  "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <span
                style={{
                  opacity: 0.7,
                }}
              >
                Connection
              </span>

              <strong
                style={{
                  color: "#38e58d",
                }}
              >
                ONLINE
              </strong>
            </div>

            {/* VIDEO SOURCE */}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                padding: "12px 0",
                borderBottom:
                  "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <span
                style={{
                  opacity: 0.7,
                }}
              >
                Video Source
              </span>

              <strong>
                DroidCam
              </strong>
            </div>

            {/* VIDEO STREAM */}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                padding: "12px 0",
                borderBottom:
                  "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <span
                style={{
                  opacity: 0.7,
                }}
              >
                Video Stream
              </span>

              <strong>
                MJPEG
              </strong>
            </div>

            {/* AUDIO SOURCE */}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                padding: "12px 0",
                borderBottom:
                  "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <span
                style={{
                  opacity: 0.7,
                }}
              >
                Audio Source
              </span>

              <strong>
                AudioShare
              </strong>
            </div>

            {/* AUDIO STATUS */}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                padding: "12px 0",
              }}
            >
              <span
                style={{
                  opacity: 0.7,
                }}
              >
                Rover Audio
              </span>

              <strong
                style={{
                  color:
                    roverAudioEnabled
                      ? "#38e58d"
                      : "#7e898f",
                }}
              >
                {roverAudioEnabled
                  ? "LIVE"
                  : "OFF"}
              </strong>
            </div>
          </div>

          {/* =================================================
              AUDIO STATUS CARD
          ================================================== */}

          <div
            style={{
              background:
                roverAudioEnabled
                  ? "rgba(56, 229, 141, 0.045)"
                  : "rgba(255, 255, 255, 0.04)",

              border:
                roverAudioEnabled
                  ? "1px solid rgba(56, 229, 141, 0.14)"
                  : "1px solid rgba(255, 255, 255, 0.08)",

              borderRadius:
                "16px",

              padding: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              {roverAudioEnabled ? (
                <Volume2
                  size={20}
                  color="#38e58d"
                />
              ) : (
                <VolumeX
                  size={20}
                  color="#7e898f"
                />
              )}

              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "16px",
                  }}
                >
                  Rover Audio
                </h3>

                <p
                  style={{
                    margin: "5px 0 0",
                    fontSize: "12px",
                    opacity: 0.6,
                  }}
                >
                  {roverAudioEnabled
                    ? "AudioShare listener active"
                    : "Audio monitoring disabled"}
                </p>
              </div>
            </div>

            <div
              style={{
                marginTop: "16px",
                paddingTop: "14px",

                display: "flex",

                justifyContent:
                  "space-between",

                borderTop:
                  "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  opacity: 0.65,
                }}
              >
                Status
              </span>

              <strong
                style={{
                  color:
                    roverAudioEnabled
                      ? "#38e58d"
                      : "#7e898f",

                  fontSize: "12px",
                }}
              >
                {roverAudioEnabled
                  ? "MONITORING"
                  : "STANDBY"}
              </strong>
            </div>
          </div>

          {/* =================================================
              INTEGRATION INFO
          ================================================== */}

          <div
            style={{
              background:
                "rgba(255, 255, 255, 0.04)",

              border:
                "1px solid rgba(255, 255, 255, 0.08)",

              borderRadius:
                "16px",

              padding:
                "20px",
            }}
          >
            <h3
              style={{
                margin:
                  "0 0 10px",

                fontSize:
                  "16px",
              }}
            >
              M.I.T.R.A Integration
            </h3>

            <p
              style={{
                margin: 0,

                lineHeight:
                  1.6,

                fontSize:
                  "13px",

                opacity:
                  0.7,
              }}
            >
              DroidCam provides the
              rover video stream while
              AudioShare provides the
              rover microphone stream.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Rover;