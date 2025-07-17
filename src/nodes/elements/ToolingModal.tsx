import React, { useState, useEffect } from "react";
import "./ToolingModal.css";

interface ApiTool {
  id: string;
  name: string;
  url: string;
  method: string;
  headers: string;
  payload: string;
  description: string;
}

interface ToolingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTool: (tool: ApiTool) => void;
  onUpdateTool?: (tool: ApiTool) => void;
  existingTools: ApiTool[];
  editingTool?: ApiTool | null;
}

const ToolingModal: React.FC<ToolingModalProps> = ({
  isOpen,
  onClose,
  onAddTool,
  onUpdateTool,
  existingTools: _, // Mark as unused for now, could be used for validation later
  editingTool,
}) => {
  const [selectedToolType, setSelectedToolType] = useState<string>("");
  const [toolName, setToolName] = useState("");
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [headers, setHeaders] = useState(
    '{\n  "Content-Type": "application/json"\n}'
  );
  const [payload, setPayload] = useState('{\n  "key": "value"\n}');
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Populate form when editing a tool
  useEffect(() => {
    if (editingTool) {
      setSelectedToolType("api");
      setToolName(editingTool.name);
      setUrl(editingTool.url);
      setMethod(editingTool.method);
      setHeaders(editingTool.headers);
      setPayload(editingTool.payload);
      setDescription(editingTool.description);
    }
  }, [editingTool]);

  const validateJSON = (jsonString: string): boolean => {
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!toolName.trim()) {
      newErrors.toolName = "Tool name is required";
    }

    if (!url.trim()) {
      newErrors.url = "URL is required";
    }

    if (!description.trim()) {
      newErrors.description = "Description is required";
    }

    if (headers && !validateJSON(headers)) {
      newErrors.headers = "Invalid JSON format";
    }

    if (payload && method !== "GET" && !validateJSON(payload)) {
      newErrors.payload = "Invalid JSON format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddTool = () => {
    if (!validateForm()) {
      return;
    }

    const toolData: ApiTool = {
      id: editingTool ? editingTool.id : `tool_${Date.now()}`,
      name: toolName,
      url,
      method,
      headers,
      payload: method === "GET" ? "" : payload,
      description,
    };

    if (editingTool && onUpdateTool) {
      onUpdateTool(toolData);
    } else {
      onAddTool(toolData);
    }

    resetForm();
    onClose();
  };

  const resetForm = () => {
    setSelectedToolType("");
    setToolName("");
    setUrl("");
    setMethod("GET");
    setHeaders('{\n  "Content-Type": "application/json"\n}');
    setPayload('{\n  "key": "value"\n}');
    setDescription("");
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="tooling-modal-overlay" onClick={handleClose}>
      <div className="tooling-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tooling-modal-header">
          <h3>{editingTool ? "Edit Tool" : "Add Tool to LLM"}</h3>
          <button className="close-button" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="tooling-modal-content">
          {!selectedToolType ? (
            <div className="tool-selection">
              <h4>Select Tool Type</h4>
              <div className="tool-options">
                <div
                  className="tool-option"
                  onClick={() => setSelectedToolType("api")}
                >
                  <div className="tool-option-icon">🔗</div>
                  <div className="tool-option-content">
                    <h5>API Call</h5>
                    <p>
                      Connect to external APIs to fetch data or perform actions
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="tool-configuration">
              <button
                className="back-button"
                onClick={() => setSelectedToolType("")}
              >
                ← Back
              </button>

              <h4>Configure API Call Tool</h4>

              <div className="form-group">
                <label>Tool Name*</label>
                <input
                  type="text"
                  value={toolName}
                  onChange={(e) => setToolName(e.target.value)}
                  placeholder="e.g., Sales Data API"
                  className={errors.toolName ? "error" : ""}
                />
                {errors.toolName && (
                  <span className="error-text">{errors.toolName}</span>
                )}
              </div>

              <div className="form-group">
                <label>Description*</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this tool does and when the LLM should use it"
                  className={errors.description ? "error" : ""}
                />
                {errors.description && (
                  <span className="error-text">{errors.description}</span>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>URL*</label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://api.example.com/data"
                    className={errors.url ? "error" : ""}
                  />
                  {errors.url && (
                    <span className="error-text">{errors.url}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Method</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Headers</label>
                <textarea
                  value={headers}
                  onChange={(e) => setHeaders(e.target.value)}
                  placeholder='{"Content-Type": "application/json"}'
                  className={`code-textarea ${errors.headers ? "error" : ""}`}
                />
                {errors.headers && (
                  <span className="error-text">{errors.headers}</span>
                )}
              </div>

              {method !== "GET" && (
                <div className="form-group">
                  <label>Request Body</label>
                  <textarea
                    value={payload}
                    onChange={(e) => setPayload(e.target.value)}
                    placeholder='{"key": "value"}'
                    className={`code-textarea ${errors.payload ? "error" : ""}`}
                  />
                  {errors.payload && (
                    <span className="error-text">{errors.payload}</span>
                  )}
                </div>
              )}

              <div className="form-actions">
                <button className="cancel-button" onClick={handleClose}>
                  Cancel
                </button>
                <button className="add-button" onClick={handleAddTool}>
                  {editingTool ? "Update Tool" : "Add Tool"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToolingModal;
