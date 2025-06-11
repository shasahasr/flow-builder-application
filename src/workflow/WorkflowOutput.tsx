import React from 'react'
import { useWorkflow } from './WorkflowContext'

const WorkflowOutput: React.FC = () => {
  const { workflowOutput, isExecuting, clearOutput } = useWorkflow()

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        zIndex: 10,
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 8,
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        padding: 15,
        maxHeight: 200,
        overflowY: 'auto',
        display: workflowOutput.length > 0 ? 'block' : 'none'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10
        }}
      >
        <h3 style={{ margin: 0 }}>
          Workflow Execution {isExecuting && '(Running...)'}
        </h3>
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
          Clear Output
        </button>
      </div>
      <div style={{ borderTop: '1px solid #eee', paddingTop: 10 }}>
        {workflowOutput.map((msg, idx) => (
          <div
            key={idx}
            style={{
              padding: '5px 0',
              borderBottom:
                idx < workflowOutput.length - 1 ? '1px solid #f0f0f0' : 'none'
            }}
          >
            {msg}
          </div>
        ))}
      </div>
    </div>
  )
}

export default WorkflowOutput
