import React, { useState } from "react";
import { UserButton } from "@clerk/clerk-react";
import {
  FiMessageSquare,
  FiEdit3,
  FiCode,
  FiCpu,
  FiUpload,
  FiSettings,
  FiDatabase,
  FiClock,
  FiMail,
  FiPhone,
  FiGitBranch,
  FiSliders,
  FiList,
  FiGrid,
  FiPlay,
  FiPause,
  FiRepeat,
  FiZap,
  FiAlertCircle,
  FiCalendar,
  FiImage,
  FiMusic,
  FiVideo,
  FiFilter,
} from "react-icons/fi";

const onDragStart = (
  event: React.DragEvent<HTMLDivElement>,
  nodeType: string,
) => {
  event.dataTransfer.setData("application/reactflow", nodeType);
  event.dataTransfer.effectAllowed = "move";
};

// Modern sidebar container
const sidebarStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "64px",
  height: "100vh",
  background: "#1a1a1a",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  zIndex: 1000,
  borderRight: "1px solid #333",
};

const topSectionStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "4px",
  padding: "16px 0",
  flex: 1,
};

const bottomSectionStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "4px",
  padding: "16px 0",
};

const menuContainerStyle: React.CSSProperties = {
  position: "fixed",
  top: "50%",
  left: "84px", // Adjusted to account for the main sidebar
  transform: "translateY(-50%)",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  zIndex: 999,
  background: "rgba(255, 255, 255, 0.95)",
  backdropFilter: "blur(10px)",
  padding: "16px",
  borderRadius: "16px",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
};

const iconStyle: React.CSSProperties = {
  width: "40px",
  height: "40px",
  background: "#333",
  border: "none",
  borderRadius: "8px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  cursor: "pointer",
  transition: "all 0.2s ease",
  color: "#888",
  fontSize: "18px",
  margin: "4px 0",
};

const disabledIconStyle: React.CSSProperties = {
  ...iconStyle,
  cursor: "not-allowed",
  opacity: 0.5,
  color: "#555",
};

const menuStyle: React.CSSProperties = {
  position: "absolute",
  top: "0px",
  left: "70px",
  background: "rgba(255, 255, 255, 0.98)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255, 255, 255, 0.3)",
  borderRadius: "12px",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
  padding: "12px",
  zIndex: 1001,
  minWidth: "200px",
  animation: "slideIn 0.2s ease-out",
};

const menuItemStyle: React.CSSProperties = {
  padding: "12px 16px",
  cursor: "pointer",
  borderRadius: "8px",
  transition: "all 0.2s ease",
  fontSize: "14px",
  fontWeight: "500",
  color: "#333",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const comingSoonStyle: React.CSSProperties = {
  ...menuItemStyle,
  cursor: "not-allowed",
  opacity: 0.5,
  color: "#888",
  position: "relative",
};

const comingSoonBadgeStyle: React.CSSProperties = {
  fontSize: "10px",
  background: "#f0f0f0",
  color: "#666",
  padding: "2px 6px",
  borderRadius: "4px",
  marginLeft: "auto",
  fontWeight: "600",
};

const MiniSideBar: React.FC = () => {
  return (
    <div style={sidebarStyle}>
      <div style={topSectionStyle}>
        {/* User Button area */}
        <div
          style={{
            marginBottom: "16px",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <UserButton
            appearance={{
              elements: {
                avatarBox: "width: 40px; height: 40px;",
                userButtonPopoverCard:
                  "backdrop-filter: blur(10px); background: rgba(255, 255, 255, 0.95);",
              },
            }}
          />
        </div>
      </div>

      <div style={bottomSectionStyle}>
        {/* Publish Option - Grayed out */}
        <div style={disabledIconStyle} title="Publish (Coming Soon)">
          <FiUpload />
        </div>

        {/* Settings Option - Grayed out */}
        <div style={disabledIconStyle} title="Settings (Coming Soon)">
          <FiSettings />
        </div>
      </div>
    </div>
  );
};

const SidebarMenu: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const toggleMenu = (menu: string) => {
    setActiveMenu((prev) => (prev === menu ? null : menu));
  };

  const getIconStyle = (isActive: boolean) => ({
    ...iconStyle,
    background: isActive ? "#4F46E5" : "#333",
    color: isActive ? "#ffffff" : "#888",
    transform: isActive ? "scale(1.05)" : "scale(1)",
  });

  const getMenuStyle = (index: number) => ({
    ...menuStyle,
    top: `${index * 60}px`,
  });

  return (
    <div style={menuContainerStyle}>
      <div
        style={getIconStyle(activeMenu === "output")}
        onClick={() => toggleMenu("output")}
        title="Output Blocks"
      >
        <FiMessageSquare />
      </div>
      {activeMenu === "output" && (
        <div style={getMenuStyle(0)}>
          <div
            style={menuItemStyle}
            onDragStart={(e) => onDragStart(e, "display_message")}
            draggable
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(79, 70, 229, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <FiMessageSquare />
            Display Message
          </div>

          {/* Coming Soon Items */}
          <div style={comingSoonStyle}>
            <FiMail />
            Send Email
            <span style={comingSoonBadgeStyle}>SOON</span>
          </div>

          <div style={comingSoonStyle}>
            <FiPhone />
            Phone Call
            <span style={comingSoonBadgeStyle}>SOON</span>
          </div>

          <div style={comingSoonStyle}>
            <FiImage />
            Show Image
            <span style={comingSoonBadgeStyle}>SOON</span>
          </div>

          <div style={comingSoonStyle}>
            <FiMusic />
            Play Audio
            <span style={comingSoonBadgeStyle}>SOON</span>
          </div>
        </div>
      )}

      <div
        style={getIconStyle(activeMenu === "input")}
        onClick={() => toggleMenu("input")}
        title="Input Blocks"
      >
        <FiEdit3 />
      </div>
      {activeMenu === "input" && (
        <div style={getMenuStyle(1)}>
          <div
            style={menuItemStyle}
            onDragStart={(e) => onDragStart(e, "input_parameter")}
            draggable
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(79, 70, 229, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <FiEdit3 />
            Input Parameter
          </div>

          {/* Coming Soon Items */}
          <div style={comingSoonStyle}>
            <FiCalendar />
            Date Picker
            <span style={comingSoonBadgeStyle}>SOON</span>
          </div>

          <div style={comingSoonStyle}>
            <FiSliders />
            Slider Input
            <span style={comingSoonBadgeStyle}>SOON</span>
          </div>

          <div style={comingSoonStyle}>
            <FiList />
            Multiple Choice
            <span style={comingSoonBadgeStyle}>SOON</span>
          </div>

          <div style={comingSoonStyle}>
            <FiImage />
            File Upload
            <span style={comingSoonBadgeStyle}>SOON</span>
          </div>
        </div>
      )}

      <div
        style={getIconStyle(activeMenu === "logic")}
        onClick={() => toggleMenu("logic")}
        title="Logic Blocks"
      >
        <FiCode />
      </div>
      {activeMenu === "logic" && (
        <div style={getMenuStyle(2)}>
          <div
            style={menuItemStyle}
            onDragStart={(e) => onDragStart(e, "condition")}
            draggable
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(79, 70, 229, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <FiCode />
            Condition
          </div>

          {/* Coming Soon Items */}
          <div style={comingSoonStyle}>
            <FiGitBranch />
            Switch Case
            <span style={comingSoonBadgeStyle}>SOON</span>
          </div>

          <div style={comingSoonStyle}>
            <FiRepeat />
            Loop
            <span style={comingSoonBadgeStyle}>SOON</span>
          </div>

          <div style={comingSoonStyle}>
            <FiFilter />
            Filter Data
            <span style={comingSoonBadgeStyle}>SOON</span>
          </div>

          <div style={comingSoonStyle}>
            <FiAlertCircle />
            Try/Catch
            <span style={comingSoonBadgeStyle}>SOON</span>
          </div>
        </div>
      )}

      <div
        style={getIconStyle(activeMenu === "ai")}
        onClick={() => toggleMenu("ai")}
        title="AI & API Tools"
      >
        <FiCpu />
      </div>
      {activeMenu === "ai" && (
        <div style={getMenuStyle(3)}>
          <div
            style={menuItemStyle}
            onDragStart={(e) => onDragStart(e, "api_call")}
            draggable
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(79, 70, 229, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <FiCpu />
            API Call
          </div>
          <div
            style={menuItemStyle}
            onDragStart={(e) => onDragStart(e, "llm_node")}
            draggable
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(79, 70, 229, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <FiCpu />
            LLM Node
          </div>

          {/* Coming Soon Items */}
          <div style={comingSoonStyle}>
            <FiZap />
            Webhook
            <span style={comingSoonBadgeStyle}>SOON</span>
          </div>

          <div style={comingSoonStyle}>
            <FiDatabase />
            Database Query
            <span style={comingSoonBadgeStyle}>SOON</span>
          </div>

          <div style={comingSoonStyle}>
            <FiVideo />
            Vision AI
            <span style={comingSoonBadgeStyle}>SOON</span>
          </div>

          <div style={comingSoonStyle}>
            <FiMusic />
            Speech to Text
            <span style={comingSoonBadgeStyle}>SOON</span>
          </div>
        </div>
      )}

      <div
        style={getIconStyle(activeMenu === "flow")}
        onClick={() => toggleMenu("flow")}
        title="Flow Control"
      >
        <FiPlay />
      </div>
      {activeMenu === "flow" && (
        <div style={getMenuStyle(4)}>
          {/* Coming Soon Items */}
          <div style={comingSoonStyle}>
            <FiPlay />
            Start Block
            <span style={comingSoonBadgeStyle}>SOON</span>
          </div>

          <div style={comingSoonStyle}>
            <FiPause />
            Wait/Delay
            <span style={comingSoonBadgeStyle}>SOON</span>
          </div>

          <div style={comingSoonStyle}>
            <FiClock />
            Schedule
            <span style={comingSoonBadgeStyle}>SOON</span>
          </div>

          <div style={comingSoonStyle}>
            <FiGrid />
            Parallel Tasks
            <span style={comingSoonBadgeStyle}>SOON</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function Sidebar() {
  return (
    <>
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
      <MiniSideBar />
      <SidebarMenu />
    </>
  );
}
