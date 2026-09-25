import {
  Bell,
  Clock3,
  Search,
  Radio,
  UserCircle,
} from "lucide-react";

function Topbar() {

  const now = new Date();

  return (
    <header className="topbar">

      <div>

        <span className="topbar-label">
          M.I.T.R.A&nbsp; CONTROL NETWORK
        </span>

        <p className="breadcrumb">
          Command Center / Live Operations
        </p>

      </div>


      <div className="topbar-actions">

        <button
          className="topbar-tool"
          title="Search"
        >
          <Search size={17} />
        </button>


        <div className="network-chip">

          <Radio size={14} />

          <span>
            LIVE NETWORK
          </span>

        </div>


        <div className="time-chip">

          <Clock3 size={15} />

          <span>
            {now.toLocaleDateString()} •{" "}
            {now.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>

        </div>


        <button className="icon-button notification">

          <Bell size={18} />

          <span>!</span>

        </button>


        <div className="operator-profile">

          <UserCircle size={31} />

          <div>
            <strong>Operator</strong>
            <span>Command Access</span>
          </div>

        </div>

      </div>

    </header>
  );
}

export default Topbar;