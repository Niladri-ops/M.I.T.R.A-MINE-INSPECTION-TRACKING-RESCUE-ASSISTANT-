import {
  TriangleAlert,
  MapPin,
  Clock3,
  ShieldCheck,
} from "lucide-react";

export default function AlertList({
  alerts = [],
}) {

  return (
    <div className="panel alerts-panel">

      <div className="panel-heading">

        <div className="heading-with-icon">

          <div className="panel-icon warning-icon">
            <TriangleAlert size={19} />
          </div>

          <div>

            <span className="section-kicker">
              SAFETY EVENTS
            </span>

            <h3>
              Active Alerts
            </h3>

            <p>
              Latest hazard events from M.I.T.R.A
            </p>

          </div>

        </div>

      </div>


      <div className="alerts-list">

        {alerts.length === 0 ? (

          <div className="empty-alert-state">

            <ShieldCheck size={30} />

            <strong>
              No active alerts
            </strong>

            <span>
              Monitored systems are within current thresholds.
            </span>

          </div>

        ) : (

          alerts.map((alert) => (

            <div
              className="alert-row"
              key={alert.id}
            >

              <div
                className={`alert-severity ${
                  alert.level || "warning"
                }`}
              />

              <div className="alert-copy">

                <strong>
                  {alert.title}
                </strong>

                <div>

                  <span>
                    <MapPin size={12} />
                    {alert.zone}
                  </span>

                  <span>
                    <Clock3 size={12} />
                    {alert.time
                      ? new Date(
                          alert.time
                        ).toLocaleTimeString()
                      : "Now"}
                  </span>

                </div>

              </div>

              <span
                className={`alert-level ${
                  alert.level
                }`}
              >
                {alert.level || "warning"}
              </span>

            </div>

          ))

        )}

      </div>

    </div>
  );
}