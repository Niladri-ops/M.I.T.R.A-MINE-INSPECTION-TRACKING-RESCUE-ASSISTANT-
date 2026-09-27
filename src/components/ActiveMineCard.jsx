import {
  ArrowRight,
  MapPin,
  RadioTower,
} from "lucide-react";

export default function ActiveMineCard({
  mine = {
    name: "MineGuard Deployment",
    location: "West Bengal, India",
  },
}) {

  return (
    <div className="panel active-mine">

      <div className="mine-image-wrap">

        <img
  src={`${import.meta.env.BASE_URL}mine-background.png`}
  alt="M.I.T.R.A monitored mine"
/>

        <div className="mine-image-overlay" />

        <div className="mine-live-badge">

          <span />

          LIVE SITE

        </div>

      </div>


      <div className="mine-info">

        <div>

          <span className="section-kicker">
            PRIMARY DEPLOYMENT
          </span>

          <h3>
            {mine?.name ||
              "MineGuard Deployment"}
          </h3>

          <span className="mine-location">

            <MapPin size={13} />

            {mine?.location ||
              "West Bengal, India"}

          </span>

        </div>

        <button>

          <RadioTower size={15} />

          Monitor

          <ArrowRight size={14} />

        </button>

      </div>

    </div>
  );
}