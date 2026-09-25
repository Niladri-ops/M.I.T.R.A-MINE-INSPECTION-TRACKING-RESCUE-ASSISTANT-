import { Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

import Dashboard from "./pages/Dashboard";
import Placeholder from "./pages/Placeholder";
import Rover from "./pages/Rover";
import MineMap from "./pages/MineMap";

function App() {
  return (
    <div className="app-shell">
      <Sidebar />

      <div className="main-area">
        <Topbar />

        <main className="page-content">
          <Routes>
            <Route
              path="/"
              element={<Dashboard />}
            />

            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            <Route
              path="/mine-map"
              element={<MineMap />}
            />

            <Route
              path="/mines"
              element={
                <Placeholder
                  title="Mines"
                  text="Mine monitoring and comparison will appear here."
                />
              }
            />

            <Route
              path="/ai-analysis"
              element={
                <Placeholder
                  title="AI Analysis"
                  text="Computer vision, sensor fusion and hazard prediction will appear here."
                />
              }
            />

            <Route
              path="/rover"
              element={<Rover />}
            />

            <Route
              path="/alerts"
              element={
                <Placeholder
                  title="Alerts"
                  text="Active and historical safety alerts will appear here."
                />
              }
            />

            <Route
              path="/analytics"
              element={
                <Placeholder
                  title="Analytics"
                  text="Historical sensor trends and mine-risk analytics will appear here."
                />
              }
            />

            <Route
              path="/reports"
              element={
                <Placeholder
                  title="Reports"
                  text="Safety reports and historical summaries will appear here."
                />
              }
            />

            <Route
              path="/settings"
              element={
                <Placeholder
                  title="Settings"
                  text="System settings will appear here."
                />
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;