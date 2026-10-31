import { useState } from "react";
import Sidebar from "./Sidebar";
import NotesTab from "./tabs/NotesTab";
import EquationsTab from "./tabs/EquationsTab";
import SpeedFeedTab from "./tabs/SpeedFeedTab";
import GCodesTab from "./tabs/GCodesTab";
import MCodesTab from "./tabs/MCodesTab";

const TAB_COMPONENTS = {
  notes: NotesTab,
  equations: EquationsTab,
  speedfeed: SpeedFeedTab,
  gcodes: GCodesTab,
  mcodes: MCodesTab,
};

export default function App() {
  const [activeTab, setActiveTab] = useState("notes");
  const ActiveComponent = TAB_COMPONENTS[activeTab];

  return (
    <div style={{ display: "flex", flex: 1, minHeight: 0, textAlign: "left", fontFamily: "sans-serif" }}>
      <Sidebar active={activeTab} onSelect={setActiveTab} />
      <div style={{ flex: 1, padding: 24, overflowY: "auto", boxSizing: "border-box" }}>
        <ActiveComponent />
      </div>
    </div>
  );
}
