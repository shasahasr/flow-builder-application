import { useState, useEffect } from "react";
import { Handle, Position, type NodeProps, useReactFlow } from "@xyflow/react";
import { nodeStyles, getNodeContainerStyle } from "../nodeStyles";
import { useWorkflowManager } from "../../hooks/useWorkflowManager";
import { WorkflowUtils } from "../../workflow/WorkflowUtils";
import type { AppNode } from "../types";

/**
 * Sub Workflow Node
 *
 * This node allows you to execute other saved workflows as reusable components.
 *
 * How it works:
 * 1. Select a saved workflow from the dropdown
 * 2. Import variables from the sub-workflow into the current workflow
 * 3. When executed, it runs the selected workflow
 * 4. Variables from the sub-workflow are available for use in the main workflow
 *
 * Example: You can create a "User Data Collector" sub-workflow that gathers user information
 * and saves variables like 'email' and 'name', then import those variables for use in the main workflow.
 */

const WorkflowNode = ({ data, isConnectable, id }: NodeProps) => {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(
    typeof data.selectedWorkflowId === "string" ? data.selectedWorkflowId : ""
  );
  const [selectedVariables, setSelectedVariables] = useState<
    Record<string, string>
  >(
    typeof data.selectedVariables === "object" && data.selectedVariables
      ? (data.selectedVariables as Record<string, string>)
      : {}
  );
  const [subWorkflowVariables, setSubWorkflowVariables] = useState<string[]>(
    []
  );
  const [existingVariables, setExistingVariables] = useState<string[]>([]);
  const [loadedWorkflowId, setLoadedWorkflowId] = useState<string>(""); // Cache to prevent duplicate loads

  const { setNodes, getNodes, getEdges } = useReactFlow();
  const { workflows, loading, loadWorkflowById } = useWorkflowManager();

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
      if ("selectedVariables" in data && data.selectedVariables)
        setSelectedVariables(data.selectedVariables as Record<string, string>);
    }
  }, [data]);

  // Update existing variables in current workflow when nodes change
  useEffect(() => {
    const currentNodes = getNodes() as AppNode[];
    const currentEdges = getEdges();
    // Get only variables that would exist before this workflow node executes
    const existing = WorkflowUtils.getVariablesBeforeNode(
      currentNodes,
      currentEdges,
      id
    );
    setExistingVariables(existing);
  }, [id, getNodes, getEdges]); // Re-run when nodes or edges change

  // Load sub-workflow variables when workflow selection changes
  useEffect(() => {
    // Only load if workflow changed and we haven't loaded this workflow yet
    if (selectedWorkflowId && selectedWorkflowId !== loadedWorkflowId) {
      setLoadedWorkflowId(selectedWorkflowId); // Mark as loading
      loadWorkflowById(selectedWorkflowId)
        .then((workflow) => {
          if (workflow) {
            // Get variables from the sub-workflow's nodes
            const subWorkflowVariables = WorkflowUtils.getExistingVariables(
              workflow.nodes as AppNode[]
            );
            setSubWorkflowVariables(subWorkflowVariables);
          }
        })
        .catch((error) => {
          console.error("Error loading sub-workflow:", error);
          setLoadedWorkflowId(""); // Reset on error
        });
    } else if (!selectedWorkflowId) {
      setSubWorkflowVariables([]);
      setLoadedWorkflowId("");
    }
  }, [selectedWorkflowId, loadedWorkflowId, loadWorkflowById]);

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

    // Reset variables when workflow changes
    setSelectedVariables({});
    updateNodeData("selectedVariables", {});

    // Reset cache to allow loading new workflow
    if (workflowId !== loadedWorkflowId) {
      setLoadedWorkflowId("");
    }
  };

  const handleVariableSelectionChange = (
    subWorkflowVariable: string,
    localVariableName: string
  ) => {
    const newSelectedVariables = { ...selectedVariables };
    if (localVariableName) {
      newSelectedVariables[subWorkflowVariable] = localVariableName;
    } else {
      delete newSelectedVariables[subWorkflowVariable];
    }
    setSelectedVariables(newSelectedVariables);
    updateNodeData("selectedVariables", newSelectedVariables);
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

          {/* Variable Import Section */}
          {subWorkflowVariables.length > 0 && (
            <div style={nodeStyles.fieldGroup}>
              <label
                style={{
                  ...nodeStyles.label,
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                Import Variables:
              </label>
              <div
                style={{ fontSize: "11px", color: "#666", marginBottom: "8px" }}
              >
                Select variables from the sub-workflow to import into this
                workflow
              </div>
              {subWorkflowVariables.map((variable) => {
                const hasConflict = existingVariables.includes(variable);
                const selectedName = selectedVariables[variable] || "";

                return (
                  <div key={variable} style={{ marginBottom: "8px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={!!selectedVariables[variable]}
                        onChange={(e) => {
                          if (e.target.checked) {
                            // Auto-suggest a name: use original if no conflict, or add suffix
                            const suggestedName = hasConflict
                              ? `${variable}_imported`
                              : variable;
                            handleVariableSelectionChange(
                              variable,
                              suggestedName
                            );
                          } else {
                            handleVariableSelectionChange(variable, "");
                          }
                        }}
                        style={{ cursor: "pointer" }}
                      />
                      <label
                        style={{
                          ...nodeStyles.label,
                          fontSize: "12px",
                          flex: 1,
                        }}
                      >
                        {variable}
                        {hasConflict && (
                          <span
                            style={{
                              color: "#DC2626",
                              fontSize: "10px",
                              marginLeft: "4px",
                            }}
                          >
                            ⚠ Name exists
                          </span>
                        )}
                      </label>
                    </div>

                    {selectedVariables[variable] && (
                      <div style={{ marginLeft: "24px", marginTop: "4px" }}>
                        <input
                          type="text"
                          value={selectedName}
                          onChange={(e) =>
                            handleVariableSelectionChange(
                              variable,
                              e.target.value
                            )
                          }
                          style={{
                            ...nodeStyles.input,
                            fontSize: "12px",
                            borderColor:
                              hasConflict && selectedName === variable
                                ? "#DC2626"
                                : "#E5E7EB",
                          }}
                          placeholder="Variable name in this workflow"
                        />
                        {hasConflict && selectedName === variable && (
                          <div
                            style={{
                              fontSize: "10px",
                              color: "#DC2626",
                              marginTop: "2px",
                            }}
                          >
                            Variable name already exists in this workflow
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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
