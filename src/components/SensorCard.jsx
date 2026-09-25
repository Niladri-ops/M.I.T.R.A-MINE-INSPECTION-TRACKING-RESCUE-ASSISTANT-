import {
  Thermometer,
  Droplets,
  Gauge,
  Flame,
  Wind,
  Activity,
  Radio,
} from "lucide-react";

function getIcon(type = "") {

  const value =
    String(type).toLowerCase();

  if (value.includes("temp"))
    return Thermometer;

  if (value.includes("humid"))
    return Droplets;

  if (value.includes("pressure"))
    return Gauge;

  if (
    value.includes("methane") ||
    value.includes("ch4")
  )
    return Flame;

  if (
    value === "co" ||
    value.includes("carbon")
  )
    return Wind;

  if (value.includes("vibration"))
    return Activity;

  return Radio;
}

function SensorCard({
  label,
  value,
  unit,
  type,
  status = "online",
}) {

  const Icon = getIcon(
    type || label
  );

  return (
    <div className="sensor-card">

      <div className="sensor-card-top">

        <div className="sensor-icon">

          <Icon size={18} />

        </div>

        <span
          className={`sensor-online ${
            status === "online"
              ? "active"
              : ""
          }`}
        />

      </div>


      <span className="sensor-name">
        {label}
      </span>


      <div className="sensor-reading">

        <strong>
          {value}
        </strong>

        <small>
          {unit}
        </small>

      </div>


      <div className="sensor-footer">

        <span />

        LIVE SENSOR

      </div>

    </div>
  );
}

export default SensorCard;