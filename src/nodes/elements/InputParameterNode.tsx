import { NodeProps, Handle, Position, useReactFlow } from "@xyflow/react";
import { useState, useEffect } from "react";
import { getNodeContainerStyle, nodeStyles } from "../nodeStyles";
import { WorkflowUtils } from "../../workflow/WorkflowUtils";
import type { AppNode } from "../types";

// Define the input parameter node data structure
export type InputParameterNodeData = {
  label?: string;
  name?: string;
  question?: string;
  paramName?: string;
  saveAsVariable?: boolean; // Whether to save the user input as a named variable
  variableName?: string; // Optional custom variable name (defaults to paramName if not provided)
};

// Input Parameter node component
function InputParameterNode({ data, isConnectable, id }: NodeProps) {
  const [question, setQuestion] = useState("");
  const [name, setName] = useState("Input Block");
  const [parameterName, setParameterName] = useState("");
  const [saveAsVariable, setSaveAsVariable] = useState(false);
  const [variableName, setVariableName] = useState("");
  const [existingVariables, setExistingVariables] = useState<string[]>([]);
  const { setNodes, getNodes, getEdges } = useReactFlow();

  // Initialize state from data when component mounts or data changes
  useEffect(() => {
    if (data && typeof data === "object") {
      if ("name" in data && data.name) setName(data.name as string);
      if ("question" in data && data.question)
        setQuestion(data.question as string);
      if ("paramName" in data && data.paramName)
        setParameterName(data.paramName as string);
      if ("saveAsVariable" in data && data.saveAsVariable !== undefined)
        setSaveAsVariable(data.saveAsVariable as boolean);
      if ("variableName" in data && data.variableName)
        setVariableName(data.variableName as string);
    }
  }, [data]);

  // Update existing variables in current workflow when nodes change
  useEffect(() => {
    const currentNodes = getNodes() as AppNode[];
    const currentEdges = getEdges();
    console.log(
      `🔧 InputParameter ${id}: Checking for conflicts with ${currentNodes.length} nodes and ${currentEdges.length} edges`
    );
    // Get only variables that would exist before this input parameter node executes
    const existing = WorkflowUtils.getVariablesBeforeNode(
      currentNodes,
      currentEdges,
      id
    );
    setExistingVariables(existing);
    console.log(`🔧 InputParameter ${id}: Found existing variables:`, existing);
  }, [id, getNodes, getEdges, data]); // Re-run when nodes, edges, or node data changes

  const handleQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setQuestion(newValue);

    // Update node data in the flow
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, question: newValue },
          };
        }
        return node;
      })
    );
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setName(newValue);

    // Update node data in the flow
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, name: newValue },
          };
        }
        return node;
      })
    );
  };

  const handleParameterNameChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = e.target.value;
    setParameterName(newValue);

    // Update node data in the flow
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, paramName: newValue },
          };
        }
        return node;
      })
    );
  };

  const handleSaveAsVariableChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const checked = e.target.checked;
    setSaveAsVariable(checked);

    // Update node data in the flow
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, saveAsVariable: checked },
          };
        }
        return node;
      })
    );
  };

  const handleVariableNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setVariableName(newValue);

    // Update node data in the flow
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, variableName: newValue },
          };
        }
        return node;
      })
    );
  };

  return (
    <div style={getNodeContainerStyle("input")}>
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ ...nodeStyles.handle, ...nodeStyles.handleInput }}
        isConnectable={isConnectable}
      />

      <div style={nodeStyles.fieldGroup}>
        <label style={nodeStyles.label}>Block Name:</label>
        <input
          type="text"
          value={name}
          onChange={handleNameChange}
          style={nodeStyles.input}
        />
      </div>

      <div style={nodeStyles.fieldGroup}>
        <label style={nodeStyles.label}>Question:</label>
        <textarea
          value={question}
          onChange={handleQuestionChange}
          rows={4}
          style={nodeStyles.textarea}
          placeholder="Enter question to ask user..."
        />
      </div>

      <div style={nodeStyles.fieldGroup}>
        <label style={nodeStyles.label}>Parameter Name:</label>
        <input
          type="text"
          value={parameterName}
          onChange={handleParameterNameChange}
          style={nodeStyles.input}
          placeholder="e.g. location, user_name, etc."
        />
      </div>

      <div
        style={{
          marginTop: "12px",
          marginBottom: "12px",
          padding: "12px",
          background: "#f8fafc",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            fontWeight: "500",
            fontSize: "12px",
            color: "#374151",
          }}
        >
          <input
            type="checkbox"
            checked={saveAsVariable}
            onChange={handleSaveAsVariableChange}
            style={{ marginRight: "8px" }}
          />
          Save as custom variable
        </label>
      </div>

      {saveAsVariable && (
        <div style={nodeStyles.fieldGroup}>
          <label style={nodeStyles.label}>
            Custom Variable Name:
            {(() => {
              const finalVariableName = variableName || parameterName;
              const hasConflict = existingVariables.includes(finalVariableName);
              console.log(
                `🔧 InputParameter ${id}: Checking conflict for "${finalVariableName}" against existing:`,
                existingVariables,
                "hasConflict:",
                hasConflict
              );
              return hasConflict ? (
                <span
                  style={{
                    color: "#DC2626",
                    fontSize: "10px",
                    marginLeft: "4px",
                  }}
                >
                  ⚠ Name exists
                </span>
              ) : null;
            })()}
          </label>
          <input
            type="text"
            value={variableName}
            onChange={handleVariableNameChange}
            style={{
              ...nodeStyles.input,
              borderColor: (() => {
                const finalVariableName = variableName || parameterName;
                const hasConflict =
                  existingVariables.includes(finalVariableName);
                return hasConflict ? "#DC2626" : "#E5E7EB";
              })(),
            }}
            placeholder={parameterName || "customVarName"}
          />
          {(() => {
            const finalVariableName = variableName || parameterName;
            const hasConflict = existingVariables.includes(finalVariableName);
            return hasConflict ? (
              <div
                style={{
                  fontSize: "10px",
                  color: "#DC2626",
                  marginTop: "2px",
                }}
              >
                Variable name already exists in this workflow
              </div>
            ) : (
              <div style={nodeStyles.helpText}>
                Access with: $&#123;{finalVariableName}&#125;
              </div>
            );
          })()}
        </div>
      )}

      {/* Single Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ ...nodeStyles.handle, ...nodeStyles.handleOutput }}
        isConnectable={isConnectable}
      />
    </div>
  );
}

export default InputParameterNode;
