import { useState } from "react";
import Sidebar from "./Sidebar";
import NameBadge from "./NameBadge";
import { getActiveName } from "./identity";
import HomeTab from "./tabs/HomeTab";
import EquationsTab from "./tabs/EquationsTab";
import SpeedFeedTab from "./tabs/SpeedFeedTab";
import GCodesTab from "./tabs/GCodesTab";
import MCodesTab from "./tabs/MCodesTab";
import TappingTab from "./tabs/TappingTab";
import WadsworthTab from "./tabs/WadsworthTab";
import MastercamTab from "./tabs/MastercamTab";
import ShopNotesTab from "./tabs/ShopNotesTab";
import TricksOfTheTradeTab from "./tabs/TricksOfTheTradeTab";

const TAB_COMPONENTS = {
  wadsworth: WadsworthTab,
  home: HomeTab,
  equations: EquationsTab,
  speedfeed: SpeedFeedTab,
  gcodes: GCodesTab,
  mcodes: MCodesTab,
  tapping: TappingTab,
  mastercam: MastercamTab,
  shopnotes: ShopNotesTab,
  tricks: TricksOfTheTradeTab,
};

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [name, setName] = useState(getActiveName());
  const isOwner = (name || "").trim().toLowerCase() === "isaac";
  const effectiveTab = activeTab === "tricks" && !isOwner ? "home" : activeTab;
  const ActiveComponent = TAB_COMPONENTS[effectiveTab];

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
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 6,
          border: "1px solid #ccc",
          background: "white",
          cursor: "pointer",
        }}
      >
        <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
          <rect width="18" height="2" rx="1" fill="#D4AF37" />
          <rect y="6" width="18" height="2" rx="1" fill="#D4AF37" />
          <rect y="12" width="18" height="2" rx="1" fill="#D4AF37" />
        </svg>
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
        <Sidebar active={effectiveTab} onSelect={selectTab} name={name} />
      </div>

      <NameBadge name={name} onChange={setName} />

      <div style={{ padding: "64px 24px 24px 24px", overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
        {name ? <ActiveComponent name={name} /> : null}
      </div>
    </div>
  );
}
