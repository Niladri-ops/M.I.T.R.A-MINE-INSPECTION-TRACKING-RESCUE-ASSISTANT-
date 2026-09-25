import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  Pickaxe,
  BrainCircuit,
  RadioTower,
  Bell,
  ChartNoAxesCombined,
  Map,
  FileText,
  Settings,
  ShieldCheck,
  Activity,
} from "lucide-react";

const links = [
  ["Dashboard", "/dashboard", LayoutDashboard],
  ["Mines", "/mines", Pickaxe],
  ["AI Analysis", "/ai-analysis", BrainCircuit],
  ["Rover", "/rover", RadioTower],
  ["Alerts", "/alerts", Bell],
  ["Analytics", "/analytics", ChartNoAxesCombined],
  ["Mine Map", "/mine-map", Map],
  ["Reports", "/reports", FileText],
  ["Settings", "/settings", Settings],
];

function Sidebar() {
  return (
    <aside className="sidebar">

      <div className="brand">

        <div className="brand-mark">
          <ShieldCheck size={25} />
        </div>

        <div className="brand-copy">
          <h2>
            <span>M.I.T.R.A</span>
          </h2>

          <p>
            Mine Safety Intelligence Platform
          </p>
        </div>  

      </div>


      <div className="sidebar-label">
        COMMAND CENTER
      </div>


      <nav className="sidebar-nav">

        {links.map(([name, path, Icon]) => (

          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `nav-link ${
                isActive ? "active" : ""
              }`
            }
          >

            <Icon size={18} />

            <span>{name}</span>

          </NavLink>

        ))}

      </nav>


      <div className="sidebar-system">

        <div className="system-top">

          <div className="system-pulse">
            <Activity size={15} />
          </div>

          <div>
            <small>SYSTEM NETWORK</small>
            <strong>OPERATIONAL</strong>
          </div>

        </div>

        <div className="system-line">

          <span />

          <p>
            M.I.T.R.A telemetry online
          </p>

        </div>

      </div>

    </aside>
  );
}

export default Sidebar;