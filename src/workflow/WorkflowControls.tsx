import React, { useState, useEffect } from 'react'
import { useReactFlow } from '@xyflow/react'
import { useWorkflow } from './WorkflowContext'
import { AppNode } from '../nodes/types'

const WorkflowControls: React.FC = () => {
  const [workflowName, setWorkflowName] = useState('')
  const [selectedWorkflow, setSelectedWorkflow] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editingName, setEditingName] = useState('')
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const { getNodes, getEdges, setNodes, setEdges } = useReactFlow()
  const {
    executeWorkflow,
    saveWorkflow,
    loadWorkflow,
    deleteWorkflow,
    updateWorkflowName,
    savedWorkflows,
    isExecuting
  } = useWorkflow()

  // Load the saved workflow list on mount
  useEffect(() => {
    // If there are saved workflows and the canvas is empty, suggest loading one
    if (savedWorkflows.length > 0 && getNodes().length === 0) {
      setSelectedWorkflow(savedWorkflows[0])
    }
  }, [savedWorkflows, getNodes])

  // Handle execute workflow button click
  const handleExecute = () => {
    const nodes = getNodes() as unknown as AppNode[]
    const edges = getEdges()
    executeWorkflow(nodes, edges)
  }

  // Handle save workflow button click
  const handleSave = () => {
    if (!workflowName.trim()) {
      alert('Please enter a workflow name')
      return
    }

    const nodes = getNodes() as unknown as AppNode[]
    const edges = getEdges()
    saveWorkflow(workflowName, nodes, edges)
    setWorkflowName('')
  }

  // Handle load workflow button click
  const handleLoad = () => {
    if (!selectedWorkflow) {
      alert('Please select a workflow to load')
      return
    }

    // Check if we're currently in edit mode
    if (isEditMode) {
      const confirmExit = window.confirm(
        'You are currently editing a workflow. Loading a new workflow will discard your changes. Continue?'
      )
      if (!confirmExit) {
        return
      }
      // Exit edit mode if confirmed
      setIsEditMode(false)
    }

    const workflow = loadWorkflow(selectedWorkflow)
    if (workflow) {
      setNodes(workflow.nodes)
      setEdges(workflow.edges)
    }
  }

  // Handle workflow rename
  const handleRename = () => {
    if (!selectedWorkflow) {
      alert('Please select a workflow to rename')
      return
    }

    // Prompt for a new name
    const newName = prompt(
      'Enter a new name for this workflow:',
      selectedWorkflow
    )

    if (newName && newName.trim() !== '' && newName !== selectedWorkflow) {
      const success = updateWorkflowName(selectedWorkflow, newName)
      if (success) {
        setSelectedWorkflow(newName)
      } else {
        alert(
          'Failed to rename workflow. A workflow with this name may already exist.'
        )
      }
    }
  }

  // Handle edit workflow
  const handleEdit = () => {
    if (!selectedWorkflow) {
      alert('Please select a workflow to edit')
      return
    }

    // Load the workflow into the editor
    const workflow = loadWorkflow(selectedWorkflow)
    if (workflow) {
      setNodes(workflow.nodes)
      setEdges(workflow.edges)
      setIsEditMode(true)

      // Show a notification
      alert(
        `Editing workflow: "${selectedWorkflow}". Make your changes and click "Save Changes" when done.`
      )
    }
  }

  // Handle save changes to workflow
  const handleSaveChanges = () => {
    if (!selectedWorkflow || !isEditMode) {
      alert('No workflow is currently being edited')
      return
    }

    // Get the current nodes and edges
    const nodes = getNodes() as unknown as AppNode[]
    const edges = getEdges()

    // Save the updated workflow
    saveWorkflow(selectedWorkflow, nodes, edges)
    setIsEditMode(false)
    alert(`Changes to "${selectedWorkflow}" have been saved.`)
  }

  // Handle workflow deletion
  const handleDelete = () => {
    if (!selectedWorkflow) {
      alert('Please select a workflow to delete')
      return
    }

    if (
      window.confirm(
        `Are you sure you want to delete the workflow "${selectedWorkflow}"?`
      )
    ) {
      const success = deleteWorkflow(selectedWorkflow)
      if (success) {
        setSelectedWorkflow('')
      } else {
        alert('Failed to delete workflow')
      }
    }
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 10,
        background: isEditMode ? '#fff8e1' : 'white', // Yellow background when editing
        borderRadius: 8,
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        border: isEditMode ? '2px solid #FF9800' : 'none' // Orange border when editing
      }}
    >
      {isEditMode && (
        <div
          style={{
            backgroundColor: '#FF9800',
            color: 'white',
            padding: '4px 8px',
            borderRadius: 4,
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          Editing: {selectedWorkflow}
        </div>
      )}
      {/* Execute workflow button */}
      <button
        onClick={handleExecute}
        disabled={isExecuting}
        style={{
          padding: '8px 12px',
          backgroundColor: isExecuting ? '#ccc' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          cursor: isExecuting ? 'not-allowed' : 'pointer',
          fontWeight: 'bold'
        }}
      >
        {isExecuting ? 'Running...' : 'Run Workflow'}
      </button>

      {/* Save Changes button - visible only when editing */}
      {isEditMode && (
        <>
          <button
            onClick={handleSaveChanges}
            style={{
              padding: '8px 12px',
              backgroundColor: '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Save Changes
          </button>
          <button
            onClick={() => {
              if (
                window.confirm('Cancel editing? Your changes will be lost.')
              ) {
                // Reload the original workflow to discard changes
                const workflow = loadWorkflow(selectedWorkflow)
                if (workflow) {
                  setNodes(workflow.nodes)
                  setEdges(workflow.edges)
                }
                setIsEditMode(false)
              }
            }}
            style={{
              padding: '8px 12px',
              backgroundColor: '#9E9E9E',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Cancel
          </button>
        </>
      )}

      {/* Save/Load workflow dropdown */}
      <details
        style={{
          position: 'relative',
          display: 'inline-block'
        }}
      >
        <summary
          style={{
            padding: '8px 12px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontWeight: 'bold',
            listStyle: 'none'
          }}
        >
          Workflow Actions
        </summary>
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '5px',
            background: 'white',
            borderRadius: 4,
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            padding: '8px',
            zIndex: 20,
            width: '250px'
          }}
        >
          <div style={{ marginBottom: '10px' }}>
            <input
              type='text'
              placeholder='Enter workflow name'
              value={workflowName}
              onChange={e => setWorkflowName(e.target.value)}
              style={{
                width: '100%',
                padding: '6px',
                marginBottom: '8px',
                borderRadius: 4,
                border: '1px solid #ddd',
                boxSizing: 'border-box'
              }}
            />
            <button
              onClick={handleSave}
              style={{
                padding: '6px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                width: '100%',
                marginBottom: '10px',
                fontSize: '13px'
              }}
            >
              Save Workflow
            </button>
          </div>

          <div>
            <select
              value={selectedWorkflow}
              onChange={e => setSelectedWorkflow(e.target.value)}
              style={{
                width: '100%',
                padding: '6px',
                marginBottom: '8px',
                borderRadius: 4,
                border: '1px solid #ddd',
                boxSizing: 'border-box'
              }}
            >
              <option value=''>Select a workflow</option>
              {savedWorkflows.map(name => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <div style={{ marginBottom: '8px' }}>
              <button
                onClick={handleLoad}
                disabled={!selectedWorkflow}
                style={{
                  padding: '6px',
                  backgroundColor: '#FF9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: !selectedWorkflow ? 'not-allowed' : 'pointer',
                  opacity: !selectedWorkflow ? 0.7 : 1,
                  width: '100%',
                  fontSize: '13px'
                }}
              >
                Load Workflow
              </button>
            </div>

            {/* Edit and Delete buttons */}
            {selectedWorkflow && (
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '8px',
                  flexWrap: 'wrap'
                }}
              >
                <button
                  onClick={handleEdit}
                  style={{
                    padding: '6px',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    flex: 1,
                    fontSize: '13px'
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={handleRename}
                  style={{
                    padding: '6px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    flex: 1,
                    fontSize: '13px'
                  }}
                >
                  Rename
                </button>
                <button
                  onClick={handleDelete}
                  style={{
                    padding: '6px',
                    backgroundColor: '#F44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    flex: 1,
                    fontSize: '13px'
                  }}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </details>
    </div>
  )
}

export default WorkflowControls
