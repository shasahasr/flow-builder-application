import { useState, useEffect } from "react";
import { Handle, Position, type NodeProps, useReactFlow } from "@xyflow/react";
import { nodeStyles, getNodeContainerStyle } from "../nodeStyles";
import ToolingModal from "./ToolingModal";

interface ApiTool {
  id: string;
  name: string;
  url: string;
  method: string;
  headers: string;
  payload: string;
  description: string;
}

/**
 * LLM Node with Tool Integration
 *
 * This node allows users to attach tools (like API calls) to an LLM.
 *
 * How it works:
 * 1. User adds tools via the "Add Tool" button
 * 2. Each tool includes a description of when the LLM should use it
 * 3. When processing a query, the LLM receives:
 *    - The user's original question
 *    - Context about available tools and when to use them
 *    - Technical details for making API calls
 * 4. The LLM can then:
 *    - Decide if a tool is needed based on the question
 *    - Make API calls using the tool configurations
 *    - Process the API response to answer the user's question
 *
 * Example: If you add a "Sales Data API" tool and ask "What were our sales last month?",
 * the LLM will recognize this needs sales data, call the API, and provide an answer
 * based on the actual data returned.
 */

const LLMNode = ({ data, isConnectable, id }: NodeProps) => {
  const [apiKey, setApiKey] = useState<string>(
    typeof data.apiKey === "string" ? data.apiKey : ""
  );
  const [model, setModel] = useState<string>(
    typeof data.model === "string" ? data.model : ""
  );
  const [instructions, setInstructions] = useState<string>(
    typeof data.instructions === "string" ? data.instructions : ""
  );
  const [ai, setAi] = useState<string>(
    typeof data.ai === "string" ? data.ai : "chatgpt"
  );
  const [tools, setTools] = useState<ApiTool[]>(
    Array.isArray(data.tools) ? data.tools : []
  );
  const [isToolingModalOpen, setIsToolingModalOpen] = useState(false);

  const { setNodes } = useReactFlow();

  // Initialize state from data when component mounts or data changes
  useEffect(() => {
    if (data && typeof data === "object") {
      if ("ai" in data && data.ai) setAi(data.ai as string);
      if ("apiKey" in data && data.apiKey) setApiKey(data.apiKey as string);
      if ("model" in data && data.model) setModel(data.model as string);
      if ("instructions" in data && data.instructions)
        setInstructions(data.instructions as string);
      if ("tools" in data && Array.isArray(data.tools)) setTools(data.tools);
    }
  }, [data]);

  const updateNodeData = (key: string, value: string | ApiTool[]) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, [key]: value },
          };
        }
        return node;
      })
    );
  };

  const handleAddTool = (tool: ApiTool) => {
    const updatedTools = [...tools, tool];
    setTools(updatedTools);
    updateNodeData("tools", updatedTools);
  };

  const handleRemoveTool = (toolId: string) => {
    const updatedTools = tools.filter((tool) => tool.id !== toolId);
    setTools(updatedTools);
    updateNodeData("tools", updatedTools);
  };

  const modelOptions = ["gpt-3.5-turbo", "gpt-4", "text-davinci-003", "gpt-4o"];

  return (
    <div style={getNodeContainerStyle("llm")}>
      <Handle
        type="target"
        position={Position.Top}
        style={{
          ...nodeStyles.handle,
          ...nodeStyles.handleInput,
          pointerEvents: "auto" as const,
        }}
        isConnectable={isConnectable}
      />

      <div style={nodeStyles.fieldGroup}>
        <label style={nodeStyles.label}>LLM Node</label>
      </div>

      <div style={nodeStyles.fieldGroup}>
        <label style={nodeStyles.label}>
          AI:
          <select
            value={ai}
            onChange={(e) => {
              setAi(e.target.value);
              updateNodeData("ai", e.target.value);
            }}
            style={nodeStyles.input}
          >
            <option value="chatgpt">ChatGPT</option>
          </select>
        </label>
      </div>

      <div style={nodeStyles.fieldGroup}>
        <label style={nodeStyles.label}>
          API Key:
          <input
            type="text"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              updateNodeData("apiKey", e.target.value);
            }}
            style={nodeStyles.input}
            placeholder="Enter your API key"
          />
        </label>
      </div>

      <div style={nodeStyles.fieldGroup}>
        <label style={nodeStyles.label}>
          Model:
          <select
            value={model}
            onChange={(e) => {
              setModel(e.target.value);
              updateNodeData("model", e.target.value);
            }}
            style={nodeStyles.input}
          >
            {modelOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={nodeStyles.fieldGroup}>
        <label style={nodeStyles.label}>
          Agent Instructions:
          <textarea
            value={instructions}
            onChange={(e) => {
              setInstructions(e.target.value);
              updateNodeData("instructions", e.target.value);
            }}
            style={nodeStyles.textarea}
            placeholder="Define what this AI agent should do. E.g., 'You are a sales assistant that helps customers with product inquiries and can access our inventory system.'"
          />
        </label>
      </div>

      {/* Tools Section */}
      <div style={nodeStyles.fieldGroup}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
          }}
        >
          <label style={nodeStyles.label}>Tools ({tools.length})</label>
          <button
            onClick={() => setIsToolingModalOpen(true)}
            style={{
              ...nodeStyles.button,
              background: "#a855f7",
              color: "white",
              border: "1px solid #a855f7",
              fontSize: "11px",
              padding: "6px 10px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#9333ea";
              e.currentTarget.style.borderColor = "#9333ea";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#a855f7";
              e.currentTarget.style.borderColor = "#a855f7";
            }}
          >
            + Add Tool
          </button>
        </div>

        {tools.length > 0 && (
          <div
            style={{
              maxHeight: "120px",
              overflowY: "auto",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              background: "#f9fafb",
            }}
          >
            {tools.map((tool) => (
              <div
                key={tool.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 12px",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#111827",
                    }}
                  >
                    {tool.name}
                  </div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#6b7280",
                      marginTop: "2px",
                    }}
                  >
                    {tool.method} •{" "}
                    {tool.url.length > 30
                      ? tool.url.substring(0, 30) + "..."
                      : tool.url}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveTool(tool.id)}
                  style={{
                    background: "#ef4444",
                    border: "none",
                    color: "white",
                    padding: "2px 6px",
                    borderRadius: "3px",
                    fontSize: "10px",
                    cursor: "pointer",
                    marginLeft: "8px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#dc2626";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#ef4444";
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tooling Modal */}
      <ToolingModal
        isOpen={isToolingModalOpen}
        onClose={() => setIsToolingModalOpen(false)}
        onAddTool={handleAddTool}
        existingTools={tools}
      />

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          ...nodeStyles.handle,
          ...nodeStyles.handleOutput,
          pointerEvents: "auto" as const,
        }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default LLMNode;
