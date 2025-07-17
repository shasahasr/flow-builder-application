import React, { useState, useEffect } from "react";
import { useReactFlow } from "@xyflow/react";
import { useWorkflow } from "./WorkflowContext";
import { AppNode } from "../nodes/types";
import {
  FiPlay,
  FiSquare,
  FiSave,
  FiFolder,
  FiEdit3,
  FiTrash2,
  FiType,
  FiX,
  FiCheck,
} from "react-icons/fi";

interface WorkflowControlsProps {
  onOpenPreview?: () => void;
}

const WorkflowControls: React.FC<WorkflowControlsProps> = ({
  onOpenPreview,
}) => {
  const [workflowName, setWorkflowName] = useState("");
  const [selectedWorkflow, setSelectedWorkflow] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const { getNodes, getEdges, setNodes, setEdges } = useReactFlow();
  const {
    executeWorkflow,
    stopWorkflow,
    saveWorkflow,
    loadWorkflow,
    deleteWorkflow,
    updateWorkflowName,
    savedWorkflows,
    isExecuting,
  } = useWorkflow();

  // Load the saved workflow list on mount
  useEffect(() => {
    // If there are saved workflows and the canvas is empty, suggest loading one
    if (savedWorkflows.length > 0 && getNodes().length === 0) {
      setSelectedWorkflow(savedWorkflows[0]);
    }
  }, [savedWorkflows, getNodes]);

  // Add CSS for animations
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Handle execute workflow button click
  const handleExecute = () => {
    const nodes = getNodes() as unknown as AppNode[];
    const edges = getEdges();
    executeWorkflow(nodes, edges, onOpenPreview);
  };

  // Handle save workflow button click
  const handleSave = () => {
    if (!workflowName.trim()) {
      alert("Please enter a workflow name");
      return;
    }

    const nodes = getNodes() as unknown as AppNode[];
    const edges = getEdges();
    saveWorkflow(workflowName, nodes, edges);
    setWorkflowName("");
  };

  // Handle load workflow button click
  const handleLoad = () => {
    if (!selectedWorkflow) {
      alert("Please select a workflow to load");
      return;
    }

    // Check if we're currently in edit mode
    if (isEditMode) {
      const confirmExit = window.confirm(
        "You are currently editing a workflow. Loading a new workflow will discard your changes. Continue?"
      );
      if (!confirmExit) {
        return;
      }
      // Exit edit mode if confirmed
      setIsEditMode(false);
    }

    const workflow = loadWorkflow(selectedWorkflow);
    if (workflow) {
      setNodes(workflow.nodes);
      setEdges(workflow.edges);
    }
  };

  // Handle workflow rename
  const handleRename = () => {
    if (!selectedWorkflow) {
      alert("Please select a workflow to rename");
      return;
    }

    // Prompt for a new name
    const newName = prompt(
      "Enter a new name for this workflow:",
      selectedWorkflow
    );

    if (newName && newName.trim() !== "" && newName !== selectedWorkflow) {
      const success = updateWorkflowName(selectedWorkflow, newName);
      if (success) {
        setSelectedWorkflow(newName);
      } else {
        alert(
          "Failed to rename workflow. A workflow with this name may already exist."
        );
      }
    }
  };

  // Handle edit workflow
  const handleEdit = () => {
    if (!selectedWorkflow) {
      alert("Please select a workflow to edit");
      return;
    }

    // Load the workflow into the editor
    const workflow = loadWorkflow(selectedWorkflow);
    if (workflow) {
      setNodes(workflow.nodes);
      setEdges(workflow.edges);
      setIsEditMode(true);

      // Show a notification
      alert(
        `Editing workflow: "${selectedWorkflow}". Make your changes and click "Save Changes" when done.`
      );
    }
  };

  // Handle save changes to workflow
  const handleSaveChanges = () => {
    if (!selectedWorkflow || !isEditMode) {
      alert("No workflow is currently being edited");
      return;
    }

    // Get the current nodes and edges
    const nodes = getNodes() as unknown as AppNode[];
    const edges = getEdges();

    // Save the updated workflow
    saveWorkflow(selectedWorkflow, nodes, edges);
    setIsEditMode(false);
    alert(`Changes to "${selectedWorkflow}" have been saved.`);
  };

  // Handle workflow deletion
  const handleDelete = () => {
    if (!selectedWorkflow) {
      alert("Please select a workflow to delete");
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to delete the workflow "${selectedWorkflow}"?`
      )
    ) {
      const success = deleteWorkflow(selectedWorkflow);
      if (success) {
        setSelectedWorkflow("");
      } else {
        alert("Failed to delete workflow");
      }
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "20px",
        right: "20px",
        zIndex: 10,
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
        borderRadius: "16px",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        padding: "16px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        minWidth: "300px",
      }}
    >
      {isEditMode && (
        <div
          style={{
            background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)",
            color: "white",
            padding: "6px 12px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <FiEdit3 />
          Editing: {selectedWorkflow}
        </div>
      )}

      {/* Execute/Stop workflow button */}
      {!isExecuting ? (
        <button
          onClick={handleExecute}
          style={{
            padding: "10px 16px",
            background: "linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            transition: "all 0.2s ease",
          }}
        >
          <FiPlay />
          Run Workflow
        </button>
      ) : (
        <button
          onClick={stopWorkflow}
          style={{
            padding: "10px 16px",
            background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            transition: "all 0.2s ease",
          }}
        >
          <FiSquare />
          Stop Workflow
        </button>
      )}

      {/* Save Changes button - visible only when editing */}
      {isEditMode && (
        <>
          <button
            onClick={handleSaveChanges}
            style={{
              padding: "10px 16px",
              background: "linear-gradient(135deg, #f39c12 0%, #e67e22 100%)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              transition: "all 0.2s ease",
            }}
          >
            <FiCheck />
            Save Changes
          </button>
          <button
            onClick={() => {
              if (
                window.confirm("Cancel editing? Your changes will be lost.")
              ) {
                // Reload the original workflow to discard changes
                const workflow = loadWorkflow(selectedWorkflow);
                if (workflow) {
                  setNodes(workflow.nodes);
                  setEdges(workflow.edges);
                }
                setIsEditMode(false);
              }
            }}
            style={{
              padding: "10px 16px",
              background: "linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              transition: "all 0.2s ease",
            }}
          >
            <FiX />
            Cancel
          </button>
        </>
      )}

      {/* Save/Load workflow dropdown */}
      <details
        style={{
          position: "relative",
          display: "inline-block",
        }}
      >
        <summary
          style={{
            padding: "10px 16px",
            background: "linear-gradient(135deg, #3498db 0%, #2980b9 100%)",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px",
            listStyle: "none",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            transition: "all 0.2s ease",
          }}
        >
          <FiFolder />
          Workflow Actions
        </summary>
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: "0",
            marginTop: "8px",
            background: "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(10px)",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            padding: "16px",
            zIndex: 20,
            width: "280px",
            animation: "slideIn 0.2s ease-out",
          }}
        >
          <div style={{ marginBottom: "16px" }}>
            <input
              type="text"
              placeholder="Enter workflow name"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                marginBottom: "12px",
                borderRadius: "8px",
                border: "1px solid rgba(0, 0, 0, 0.1)",
                boxSizing: "border-box",
                fontSize: "14px",
                background: "rgba(255, 255, 255, 0.8)",
                backdropFilter: "blur(5px)",
              }}
            />
            <button
              onClick={handleSave}
              style={{
                padding: "10px 12px",
                background: "linear-gradient(135deg, #3498db 0%, #2980b9 100%)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                width: "100%",
                marginBottom: "16px",
                fontSize: "14px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                transition: "all 0.2s ease",
              }}
            >
              <FiSave />
              Save Workflow
            </button>
          </div>

          <div>
            <select
              value={selectedWorkflow}
              onChange={(e) => setSelectedWorkflow(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                marginBottom: "12px",
                borderRadius: "8px",
                border: "1px solid rgba(0, 0, 0, 0.1)",
                boxSizing: "border-box",
                fontSize: "14px",
                background: "rgba(255, 255, 255, 0.8)",
                backdropFilter: "blur(5px)",
              }}
            >
              <option value="">Select a workflow</option>
              {savedWorkflows.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <div style={{ marginBottom: "12px" }}>
              <button
                onClick={handleLoad}
                disabled={!selectedWorkflow}
                style={{
                  padding: "10px 12px",
                  background: !selectedWorkflow
                    ? "linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)"
                    : "linear-gradient(135deg, #f39c12 0%, #e67e22 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: !selectedWorkflow ? "not-allowed" : "pointer",
                  width: "100%",
                  fontSize: "14px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                  transition: "all 0.2s ease",
                }}
              >
                <FiFolder />
                Load Workflow
              </button>
            </div>

            {/* Edit and Delete buttons */}
            {selectedWorkflow && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "8px",
                  marginTop: "12px",
                }}
              >
                <button
                  onClick={handleEdit}
                  style={{
                    padding: "8px 10px",
                    background:
                      "linear-gradient(135deg, #3498db 0%, #2980b9 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <FiEdit3 />
                  Edit
                </button>
                <button
                  onClick={handleRename}
                  style={{
                    padding: "8px 10px",
                    background:
                      "linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <FiType />
                  Rename
                </button>
                <button
                  onClick={handleDelete}
                  style={{
                    padding: "8px 10px",
                    background:
                      "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <FiTrash2 />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </details>
    </div>
  );
};

export default WorkflowControls;
