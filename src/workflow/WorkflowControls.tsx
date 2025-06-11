import React, { useState, useEffect } from 'react'
import { useReactFlow } from '@xyflow/react'
import { useWorkflow } from './WorkflowContext'

const WorkflowControls: React.FC = () => {
  const [workflowName, setWorkflowName] = useState('')
  const [selectedWorkflow, setSelectedWorkflow] = useState('')
  const { getNodes, getEdges, setNodes, setEdges } = useReactFlow()
  const {
    executeWorkflow,
    saveWorkflow,
    loadWorkflow,
    savedWorkflows,
    workflowOutput,
    isExecuting,
    clearOutput
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
    const nodes = getNodes()
    const edges = getEdges()
    executeWorkflow(nodes, edges)
  }

  // Handle save workflow button click
  const handleSave = () => {
    if (!workflowName.trim()) {
      alert('Please enter a workflow name')
      return
    }

    const nodes = getNodes()
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

    const workflow = loadWorkflow(selectedWorkflow)
    if (workflow) {
      setNodes(workflow.nodes)
      setEdges(workflow.edges)
    }
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 10,
        background: 'white',
        borderRadius: 8,
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        padding: 15,
        width: 300
      }}
    >
      <h3 style={{ margin: '0 0 15px 0' }}>Workflow Controls</h3>

      {/* Execute workflow section */}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={handleExecute}
          disabled={isExecuting}
          style={{
            padding: '8px 12px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: isExecuting ? 'not-allowed' : 'pointer',
            opacity: isExecuting ? 0.7 : 1,
            width: '100%'
          }}
        >
          {isExecuting ? 'Executing...' : 'Execute Workflow'}
        </button>
      </div>

      {/* Save workflow section */}
      <div style={{ marginBottom: 20 }}>
        <input
          type='text'
          placeholder='Enter workflow name'
          value={workflowName}
          onChange={e => setWorkflowName(e.target.value)}
          style={{
            width: '100%',
            padding: 8,
            marginBottom: 10,
            borderRadius: 4,
            border: '1px solid #ddd'
          }}
        />
        <button
          onClick={handleSave}
          style={{
            padding: '8px 12px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            width: '100%'
          }}
        >
          Save Workflow
        </button>
      </div>

      {/* Load workflow section */}
      <div style={{ marginBottom: 20 }}>
        <select
          value={selectedWorkflow}
          onChange={e => setSelectedWorkflow(e.target.value)}
          style={{
            width: '100%',
            padding: 8,
            marginBottom: 10,
            borderRadius: 4,
            border: '1px solid #ddd'
          }}
        >
          <option value=''>Select a workflow</option>
          {savedWorkflows.map(name => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <button
          onClick={handleLoad}
          disabled={!selectedWorkflow}
          style={{
            padding: '8px 12px',
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: !selectedWorkflow ? 'not-allowed' : 'pointer',
            opacity: !selectedWorkflow ? 0.7 : 1,
            width: '100%'
          }}
        >
          Load Workflow
        </button>
      </div>

      {/* Execution output section */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10
          }}
        >
          <h4 style={{ margin: 0 }}>Execution Output</h4>
          <button
            onClick={clearOutput}
            style={{
              padding: '4px 8px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 12
            }}
          >
            Clear
          </button>
        </div>
        <div
          style={{
            border: '1px solid #ddd',
            borderRadius: 4,
            padding: 10,
            maxHeight: 200,
            overflowY: 'auto',
            backgroundColor: '#f9f9f9',
            fontSize: 12
          }}
        >
          {workflowOutput.length > 0 ? (
            workflowOutput.map((output, index) => (
              <div key={index} style={{ marginBottom: 5 }}>
                {output}
              </div>
            ))
          ) : (
            <div style={{ color: '#888' }}>No output yet</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WorkflowControls
