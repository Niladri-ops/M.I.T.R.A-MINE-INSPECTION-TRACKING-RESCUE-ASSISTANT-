import {
  ArrowLeft,
  Construction,
} from "lucide-react";

import { Link } from "react-router-dom";

function Placeholder({
  title,
  text,
}) {
  return (
    <div className="placeholder-page">

      <div className="placeholder-icon">
        <Construction size={28} />
      </div>

      <span className="section-kicker">
        MINEGUARD AI MODULE
      </span>

      <h1>{title}</h1>

      <p>{text}</p>

      <div className="module-status">
        MODULE INTERFACE UNDER DEVELOPMENT
      </div>

      <Link to="/dashboard">

        <ArrowLeft size={16} />

        Return to Command Center

      </Link>

    </div>
  );
}

export default Placeholder;