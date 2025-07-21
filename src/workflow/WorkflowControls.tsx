import React, { useState, useEffect } from "react";
import { useReactFlow } from "@xyflow/react";
import { useWorkflow } from "./WorkflowContext";
import { AppNode } from "../nodes/types";
import { useWorkflowManager } from "../hooks/useWorkflowManager";
import {
  AlertModal,
  ConfirmModal,
  PromptModal,
} from "../components/CustomModals";
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

  // Modal states
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
  });
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    destructive?: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    destructive: false,
  });
  const [promptModal, setPromptModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    defaultValue: string;
    onConfirm: (value: string) => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    defaultValue: "",
    onConfirm: () => {},
  });
  const { getNodes, getEdges, setNodes, setEdges } = useReactFlow();
  const { executeWorkflow, stopWorkflow, isExecuting } = useWorkflow();

  // Firebase workflow manager - this handles all workflow CRUD operations
  const { workflows, saveWorkflow, loadWorkflowById, deleteWorkflow } =
    useWorkflowManager();

  // Load the saved workflow list on mount
  useEffect(() => {
    // If there are workflows and the canvas is empty, suggest loading one
    if (workflows.length > 0 && getNodes().length === 0) {
      setSelectedWorkflow(workflows[0].name);
    }
  }, [workflows, getNodes]);

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

  // Helper functions for showing modals
  const showAlert = (title: string, message: string) => {
    setAlertModal({ isOpen: true, title, message });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    destructive = false
  ) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm, destructive });
  };

  const showPrompt = (
    title: string,
    message: string,
    defaultValue: string,
    onConfirm: (value: string) => void
  ) => {
    setPromptModal({ isOpen: true, title, message, defaultValue, onConfirm });
  };

  // Handle execute workflow button click
  const handleExecute = () => {
    const nodes = getNodes() as unknown as AppNode[];
    const edges = getEdges();
    executeWorkflow(nodes, edges, onOpenPreview);
  };

  // Handle save workflow button click
  const handleSave = async () => {
    if (!workflowName.trim()) {
      showAlert("Missing Workflow Name", "Please enter a workflow name");
      return;
    }

    const nodes = getNodes() as unknown as AppNode[];
    const edges = getEdges();

    if (nodes.length === 0) {
      showAlert("Empty Workflow", "Cannot save empty workflow");
      return;
    }

    try {
      await saveWorkflow(workflowName, "Quick save workflow", nodes, edges, []);
      setWorkflowName("");
      showAlert("Success", `Workflow "${workflowName}" saved successfully!`);
    } catch (error) {
      console.error("Error saving workflow:", error);
      showAlert("Error", "Failed to save workflow. Please try again.");
    }
  };

  // Handle load workflow button click
  const handleLoad = async () => {
    if (!selectedWorkflow) {
      showAlert("No Selection", "Please select a workflow to load");
      return;
    }

    // Check if we're currently in edit mode
    if (isEditMode) {
      showConfirm(
        "Discard Changes",
        "You are currently editing a workflow. Loading a new workflow will discard your changes. Continue?",
        async () => {
          setIsEditMode(false);
          await loadSelectedWorkflow();
        }
      );
      return;
    }

    await loadSelectedWorkflow();
  };

  const loadSelectedWorkflow = async () => {
    try {
      // Find the selected workflow
      const selectedWorkflowObj = workflows.find(
        (w) => w.name === selectedWorkflow
      );
      if (selectedWorkflowObj) {
        const workflow = await loadWorkflowById(selectedWorkflowObj.id);
        if (workflow) {
          setNodes(workflow.nodes);
          setEdges(workflow.edges);
        }
      }
    } catch (error) {
      console.error("Error loading workflow:", error);
      showAlert("Error", "Failed to load workflow. Please try again.");
    }
  };

  // Handle workflow rename - Note: Firebase doesn't support direct rename, so we'll need to save with new name and delete old
  const handleRename = async () => {
    if (!selectedWorkflow) {
      showAlert("No Selection", "Please select a workflow to rename");
      return;
    }

    // Prompt for a new name
    showPrompt(
      "Rename Workflow",
      "Enter a new name for this workflow:",
      selectedWorkflow,
      async (newName: string) => {
        if (newName !== selectedWorkflow) {
          try {
            // Find the original workflow
            const selectedWorkflowObj = workflows.find(
              (w) => w.name === selectedWorkflow
            );
            if (selectedWorkflowObj) {
              const workflow = await loadWorkflowById(selectedWorkflowObj.id);
              if (workflow) {
                // Save with new name
                await saveWorkflow(
                  newName,
                  workflow.description,
                  workflow.nodes,
                  workflow.edges,
                  workflow.tags || []
                );
                // Delete the old workflow
                await deleteWorkflow(selectedWorkflowObj.id);
                setSelectedWorkflow(newName);
                showAlert(
                  "Success",
                  `Workflow renamed to "${newName}" successfully!`
                );
              }
            }
          } catch (error) {
            console.error("Error renaming workflow:", error);
            showAlert("Error", "Failed to rename workflow. Please try again.");
          }
        }
      }
    );
  };

  // Handle edit workflow
  const handleEdit = async () => {
    if (!selectedWorkflow) {
      showAlert("No Selection", "Please select a workflow to edit");
      return;
    }

    try {
      // Find the selected workflow
      const selectedWorkflowObj = workflows.find(
        (w) => w.name === selectedWorkflow
      );
      if (selectedWorkflowObj) {
        const workflow = await loadWorkflowById(selectedWorkflowObj.id);
        if (workflow) {
          setNodes(workflow.nodes);
          setEdges(workflow.edges);
          setIsEditMode(true);

          // Show a notification
          showAlert(
            "Edit Mode",
            `Editing workflow: "${selectedWorkflow}". Make your changes and click "Save Changes" when done.`
          );
        }
      }
    } catch (error) {
      console.error("Error loading workflow for editing:", error);
      showAlert(
        "Error",
        "Failed to load workflow for editing. Please try again."
      );
    }
  };

  // Handle save changes to workflow
  const handleSaveChanges = async () => {
    if (!selectedWorkflow || !isEditMode) {
      showAlert("Error", "No workflow is currently being edited");
      return;
    }

    try {
      // Get the current nodes and edges
      const nodes = getNodes() as unknown as AppNode[];
      const edges = getEdges();

      // Find the original workflow to get its description and tags
      const selectedWorkflowObj = workflows.find(
        (w) => w.name === selectedWorkflow
      );
      if (selectedWorkflowObj) {
        // Update the workflow with same ID (this will overwrite it)
        await saveWorkflow(
          selectedWorkflow,
          selectedWorkflowObj.description,
          nodes,
          edges,
          selectedWorkflowObj.tags || []
        );
        setIsEditMode(false);
        showAlert(
          "Success",
          `Changes to "${selectedWorkflow}" have been saved.`
        );
      }
    } catch (error) {
      console.error("Error saving workflow changes:", error);
      showAlert("Error", "Failed to save changes. Please try again.");
    }
  };

  // Handle workflow deletion
  const handleDelete = async () => {
    if (!selectedWorkflow) {
      showAlert("No Selection", "Please select a workflow to delete");
      return;
    }

    showConfirm(
      "Delete Workflow",
      `Are you sure you want to delete the workflow "${selectedWorkflow}"? This action cannot be undone.`,
      async () => {
        try {
          // Find the workflow to get its ID
          const selectedWorkflowObj = workflows.find(
            (w) => w.name === selectedWorkflow
          );
          if (selectedWorkflowObj) {
            await deleteWorkflow(selectedWorkflowObj.id);
            setSelectedWorkflow("");
            showAlert(
              "Success",
              `Workflow "${selectedWorkflow}" deleted successfully!`
            );
          }
        } catch (error) {
          console.error("Error deleting workflow:", error);
          showAlert("Error", "Failed to delete workflow. Please try again.");
        }
      },
      true // destructive action
    );
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
              showConfirm(
                "Cancel Editing",
                "Cancel editing? Your changes will be lost.",
                async () => {
                  // Reload the original workflow to discard changes
                  try {
                    const selectedWorkflowObj = workflows.find(
                      (w) => w.name === selectedWorkflow
                    );
                    if (selectedWorkflowObj) {
                      const workflow = await loadWorkflowById(
                        selectedWorkflowObj.id
                      );
                      if (workflow) {
                        setNodes(workflow.nodes);
                        setEdges(workflow.edges);
                      }
                    }
                  } catch (error) {
                    console.error("Error reloading original workflow:", error);
                  }
                  setIsEditMode(false);
                }
              );
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
              Save to Firebase
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
              {workflows.map((workflow) => (
                <option key={workflow.id} value={workflow.name}>
                  {workflow.name}
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

      {/* Custom Modals */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        destructive={confirmModal.destructive}
      />

      <PromptModal
        isOpen={promptModal.isOpen}
        onClose={() => setPromptModal({ ...promptModal, isOpen: false })}
        onConfirm={promptModal.onConfirm}
        title={promptModal.title}
        message={promptModal.message}
        defaultValue={promptModal.defaultValue}
      />
    </div>
  );
};

export default WorkflowControls;
