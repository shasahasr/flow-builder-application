import { useState, useEffect } from "react";
import { Handle, Position, type NodeProps, useReactFlow } from "@xyflow/react";
import { nodeStyles, getNodeContainerStyle } from "../nodeStyles";
import { useWorkflowManager } from "../../hooks/useWorkflowManager";


interface InputMapping {
  [parameterName: string]: string; // maps to input variable names
}

interface OutputMapping {
  [parameterName: string]: string; // maps to output variable names
}

/**
 * Sub Workflow Node
 *
 * This node allows you to execute other saved workflows as reusable components.
 *
 * How it works:
 * 1. Select a saved workflow from the dropdown
 * 2. Map input parameters from the current workflow to the sub-workflow
 * 3. When executed, it runs the selected workflow with the provided inputs
 * 4. Returns the sub-workflow outputs back to the main workflow
 *
 * Example: You can create a "Weather Checker" sub-workflow that takes a city name
 * and returns weather data, then reuse it in multiple larger workflows.
 */

const WorkflowNode = ({ data, isConnectable, id }: NodeProps) => {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(
    typeof data.selectedWorkflowId === "string" ? data.selectedWorkflowId : ""
  );
  const [inputMappings, setInputMappings] = useState<InputMapping>(
    typeof data.inputMappings === "object" && data.inputMappings
      ? (data.inputMappings as InputMapping)
      : {}
  );
  const [outputMappings, setOutputMappings] = useState<OutputMapping>(
    typeof data.outputMappings === "object" && data.outputMappings
      ? (data.outputMappings as OutputMapping)
      : {}
  );

  const { setNodes } = useReactFlow();
  const { workflows, loading } = useWorkflowManager();

  // Convert Firebase workflows to WorkflowOption format
  const availableWorkflows = workflows.map((w) => ({
    id: w.id,
    name: w.name,
    description: w.description,
    inputParameters: w.inputParameters,
    outputParameters: w.outputParameters,
  }));

  const selectedWorkflow = availableWorkflows.find(
    (w) => w.id === selectedWorkflowId
  );

  // Initialize state from data when component mounts or data changes
  useEffect(() => {
    if (data && typeof data === "object") {
      if ("selectedWorkflowId" in data && data.selectedWorkflowId)
        setSelectedWorkflowId(data.selectedWorkflowId as string);
      if ("inputMappings" in data && data.inputMappings)
        setInputMappings(data.inputMappings as InputMapping);
      if ("outputMappings" in data && data.outputMappings)
        setOutputMappings(data.outputMappings as OutputMapping);
    }
  }, [data]);

  const updateNodeData = (key: string, value: any) => {
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

  const handleWorkflowChange = (workflowId: string) => {
    setSelectedWorkflowId(workflowId);
    updateNodeData("selectedWorkflowId", workflowId);

    // Reset mappings when workflow changes
    setInputMappings({});
    setOutputMappings({});
    updateNodeData("inputMappings", {});
    updateNodeData("outputMappings", {});
  };

  const handleInputMappingChange = (
    parameterName: string,
    mappedValue: string
  ) => {
    const newMappings = { ...inputMappings, [parameterName]: mappedValue };
    setInputMappings(newMappings);
    updateNodeData("inputMappings", newMappings);
  };

  const handleOutputMappingChange = (
    parameterName: string,
    mappedValue: string
  ) => {
    const newMappings = { ...outputMappings, [parameterName]: mappedValue };
    setOutputMappings(newMappings);
    updateNodeData("outputMappings", newMappings);
  };

  return (
    <div style={getNodeContainerStyle("default")}>
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
        <label style={nodeStyles.label}>📄 Sub Workflow</label>
      </div>

      <div style={nodeStyles.fieldGroup}>
        <label style={nodeStyles.label}>
          Select Workflow:
          <select
            value={selectedWorkflowId}
            onChange={(e) => handleWorkflowChange(e.target.value)}
            style={{ ...nodeStyles.input, fontSize: "13px" }}
            disabled={loading}
          >
            <option value="">
              {loading ? "Loading workflows..." : "-- Choose a workflow --"}
            </option>
            {availableWorkflows.map((workflow) => (
              <option key={workflow.id} value={workflow.id}>
                {workflow.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedWorkflow && (
        <>
          <div
            style={{
              ...nodeStyles.fieldGroup,
              fontSize: "12px",
              color: "#666",
              fontStyle: "italic",
              marginTop: "8px",
            }}
          >
            {selectedWorkflow.description}
          </div>

          {/* Input Parameter Mappings */}
          {selectedWorkflow.inputParameters.length > 0 && (
            <div style={nodeStyles.fieldGroup}>
              <label
                style={{
                  ...nodeStyles.label,
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                Input Mappings:
              </label>
              {selectedWorkflow.inputParameters.map((param) => (
                <div key={param} style={{ marginBottom: "8px" }}>
                  <label style={{ ...nodeStyles.label, fontSize: "12px" }}>
                    {param}:
                    <input
                      type="text"
                      value={inputMappings[param] || ""}
                      onChange={(e) =>
                        handleInputMappingChange(param, e.target.value)
                      }
                      style={{ ...nodeStyles.input, fontSize: "12px" }}
                      placeholder={`Map ${param} to...`}
                    />
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* Output Parameter Mappings */}
          {selectedWorkflow.outputParameters.length > 0 && (
            <div style={nodeStyles.fieldGroup}>
              <label
                style={{
                  ...nodeStyles.label,
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                Output Mappings:
              </label>
              {selectedWorkflow.outputParameters.map((param) => (
                <div key={param} style={{ marginBottom: "8px" }}>
                  <label style={{ ...nodeStyles.label, fontSize: "12px" }}>
                    {param}:
                    <input
                      type="text"
                      value={outputMappings[param] || ""}
                      onChange={(e) =>
                        handleOutputMappingChange(param, e.target.value)
                      }
                      style={{ ...nodeStyles.input, fontSize: "12px" }}
                      placeholder={`Store ${param} as...`}
                    />
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* Status indicator */}
          <div
            style={{
              ...nodeStyles.fieldGroup,
              fontSize: "11px",
              color: selectedWorkflowId ? "#059669" : "#DC2626",
              textAlign: "center",
              padding: "4px 8px",
              background: selectedWorkflowId ? "#ECFDF5" : "#FEF2F2",
              borderRadius: "4px",
              border: `1px solid ${selectedWorkflowId ? "#D1FAE5" : "#FECACA"}`,
            }}
          >
            {selectedWorkflowId
              ? "✓ Workflow Selected"
              : "⚠ No Workflow Selected"}
          </div>
        </>
      )}

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

export default WorkflowNode;
