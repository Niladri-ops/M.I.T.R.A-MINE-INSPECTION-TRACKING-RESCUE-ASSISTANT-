function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  trend,
  type = "normal",
}) {
  return (
    <div className={`stat-card stat-${type}`}>

      <div className="stat-top">

        <div className={`stat-icon ${type}`}>
          <Icon size={21} />
        </div>

        <span className="stat-status-dot" />

      </div>

      <div className="stat-content">

        <span>
          {title}
        </span>

        <strong>
          {value}
        </strong>

        <small>
          {subtitle}
        </small>

      </div>

      <div className={`stat-trend ${type}`}>

        {trend}

      </div>

    </div>
  );
}

export default StatCard;