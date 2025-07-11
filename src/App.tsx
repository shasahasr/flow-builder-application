import { useCallback, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type OnConnect,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import { FaRobot } from "react-icons/fa"; // Import robot icon
import { Resizable } from "re-resizable";

import "@xyflow/react/dist/style.css";

import { initialNodes, nodeTypes } from "./nodes";
import { initialEdges, edgeTypes } from "./edges";
import type { AppNode } from "./nodes/types";
import Sidebar from "./Sidebar";
import { WorkflowProvider } from "./workflow/WorkflowContext";
import WorkflowControls from "./workflow/WorkflowControls";
import WorkflowOutput from "./workflow/WorkflowOutput";

let id = 0;
const getId = () => `dndnode_${id++}`;

export function FlowApp() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { screenToFlowPosition } = useReactFlow();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false); // Set initial state to false to keep AI Agent Preview closed on startup

  const togglePreview = () => {
    setIsPreviewOpen(!isPreviewOpen);
  };

  const onConnect: OnConnect = useCallback(
    (connection) => {
      // First add the edge
      setEdges((eds) => addEdge(connection, eds));

      // For AI agent workflow nodes, just add the connection
      // Data flow will be managed at runtime when executing the workflow
    },
    [setEdges],
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      if (!reactFlowWrapper.current) {
        return;
      }

      const type = event.dataTransfer.getData("application/reactflow");

      if (typeof type === "undefined" || !type) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      let newNodeData: Record<string, unknown> = { label: `${type} node` };

      // AI agent workflow node types
      if (type === "display_message") {
        newNodeData = {
          label: "Display Message",
        };
      } else if (type === "input_parameter") {
        newNodeData = {
          label: "Input Parameter",
        };
      } else if (type === "api_call") {
        newNodeData = {
          label: "API Call",
        };
      } else if (type === "condition") {
        newNodeData = {
          label: "Condition",
        };
      } else if (type === "llm_node") {
        newNodeData = {
          label: "LLM Node",
        };
      }

      const newNode: AppNode = {
        id: getId(),
        type,
        position,
        data: newNodeData,
      } as AppNode;

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes],
  );

  return (
    <WorkflowProvider>
      <Sidebar />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          width: "100vw",
          background: "#f5f5f5", // Add explicit background color to entire app
        }}
      >
        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexGrow: 1,
            flexDirection: "row",
            background: "#ffffff",
            minHeight: 0,
            marginLeft: "64px",
          }}
        >
          {/* Left side - Flow Builder */}
          <div
            style={{
              width: isPreviewOpen ? "60%" : "100%",
              height: "100%",
              display: "flex",
              flexDirection: "row",
              background: "#fafafa",
              minWidth: 0, // Allow shrinking
              transition: "width 0.3s ease", // Smooth transition when toggling
              flex: isPreviewOpen ? "1 1 60%" : "1 1 100%", // Use flex for better responsiveness
            }}
          >
            {/* The sidebar is now positioned fixed, so we don't include it here */}
            <div
              style={{
                flexGrow: 1,
                height: "100%",
                position: "relative",
                background: "#f5f5f5",
              }}
              ref={reactFlowWrapper}
            >
              <ReactFlow
                nodes={nodes}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                edges={edges}
                edgeTypes={edgeTypes}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onDrop={onDrop}
                onDragOver={onDragOver}
                fitView
              >
                <Background color="#aaa" gap={16} size={1} />
                <MiniMap />
                <Controls />
                <WorkflowControls />
              </ReactFlow>
            </div>
          </div>

          {/* Right side - Chatbot Output */}
          {isPreviewOpen && (
            <Resizable
              defaultSize={{ width: "25%", height: "100%" }}
              minWidth={320} // Increased minimum width for better usability
              maxWidth="70%" // Allow more flexibility
              enable={{ left: true }} // Allow resizing from the left side
              style={{
                borderLeft: "1px solid #ddd",
                display: "flex",
                flexDirection: "column",
                background: "#ffffff",
                overflow: "hidden", // Prevent overflow issues
                position: "relative", // Ensure proper positioning
              }}
              handleStyles={{
                left: {
                  width: "6px",
                  background: "transparent",
                  cursor: "col-resize",
                },
              }}
            >
              <WorkflowOutput onClose={togglePreview} />
            </Resizable>
          )}
        </div>

        {/* Button to reopen AI Agent Preview */}
        {!isPreviewOpen && (
          <button
            onClick={togglePreview}
            style={{
              position: "absolute",
              bottom: "20px",
              right: "220px", // Move further away from the minimap
              padding: "10px",
              background: "#1a73e8",
              color: "white",
              border: "none",
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              zIndex: 10, // Ensure it doesn't overlap with the minimap
            }}
          >
            <FaRobot /> {/* Robot icon */}
          </button>
        )}
      </div>
    </WorkflowProvider>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <FlowApp />
    </ReactFlowProvider>
  );
}
