import { useState } from "react";
import Sidebar from "./Sidebar";
import HomeTab from "./tabs/HomeTab";
import EquationsTab from "./tabs/EquationsTab";
import SpeedFeedTab from "./tabs/SpeedFeedTab";
import GCodesTab from "./tabs/GCodesTab";
import MCodesTab from "./tabs/MCodesTab";
import TappingTab from "./tabs/TappingTab";
import WadsworthTab from "./tabs/WadsworthTab";

const TAB_COMPONENTS = {
  wadsworth: WadsworthTab,
  home: HomeTab,
  equations: EquationsTab,
  speedfeed: SpeedFeedTab,
  gcodes: GCodesTab,
  mcodes: MCodesTab,
  tapping: TappingTab,
};

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const ActiveComponent = TAB_COMPONENTS[activeTab];

  function selectTab(id) {
    setActiveTab(id);
    setSidebarOpen(false);
  }

  return (
    <div style={{ position: "relative", flex: 1, minHeight: 0, textAlign: "left", fontFamily: "sans-serif", overflow: "hidden" }}>
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        aria-label="Toggle menu"
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          zIndex: 20,
          width: 36,
          height: 36,
          borderRadius: 6,
          border: "1px solid #ccc",
          background: "white",
          cursor: "pointer",
          fontSize: 16,
        }}
      >
        ☰
      </button>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.2)", zIndex: 10 }}
        />
      )}

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: "100%",
          zIndex: 15,
          transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.2s ease",
          boxShadow: sidebarOpen ? "2px 0 8px rgba(0,0,0,0.15)" : "none",
        }}
      >
        <Sidebar active={activeTab} onSelect={selectTab} />
      </div>

      <div style={{ padding: "24px 24px 24px 64px", overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
        <ActiveComponent />
      </div>
    </div>
  );
}
