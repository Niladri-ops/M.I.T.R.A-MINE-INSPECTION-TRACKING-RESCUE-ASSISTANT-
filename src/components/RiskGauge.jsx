function getRiskLabel(value) {

  if (value >= 75)
    return "CRITICAL";

  if (value >= 50)
    return "HIGH";

  if (value >= 25)
    return "MODERATE";

  return "LOW";
}

function RiskGauge({
  value = 0,
}) {

  const safeValue =
    Math.min(
      Math.max(Number(value) || 0, 0),
      100
    );

  const label =
    getRiskLabel(safeValue);

  return (
    <div className="risk-gauge-wrap">

      <div
        className="risk-gauge"
        style={{
          "--risk":
            `${safeValue * 3.6}deg`,
        }}
      >

        <div className="risk-gauge-orbit">

          <div className="risk-gauge-inner">

            <span>
              CURRENT RISK
            </span>

            <strong>
              {safeValue}%
            </strong>

            <em>
              {label}
            </em>

          </div>

        </div>

      </div>


      <div className="risk-scale">

        <span className="low" />

        <span className="medium" />

        <span className="high" />

        <span className="critical" />

      </div>


      <div className="risk-scale-labels">

        <span>LOW</span>

        <span>MOD</span>

        <span>HIGH</span>

        <span>CRITICAL</span>

      </div>

    </div>
  );
}

export default RiskGauge;