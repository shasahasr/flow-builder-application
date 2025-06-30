import React, { useState } from 'react'
import { useWorkflow } from './WorkflowContext'

const WorkflowOutput: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { workflowOutput, clearOutput, submitUserInput } = useWorkflow()
  const [userInput, setUserInput] = useState('')

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!userInput.trim()) return

    submitUserInput(userInput)
    setUserInput('')
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#f9f9f9',
        borderLeft: '1px solid #ddd',
        overflow: 'hidden',
        minHeight: 0 // Ensures flex child can shrink
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 15px',
          background: '#ffffff',
          borderBottom: '1px solid #ddd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
          AI Agent Preview
        </h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={clearOutput}
            style={{
              padding: '6px 12px',
              background: '#e0e0e0',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Clear Chat
          </button>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                padding: '6px 12px',
                background: '#ff4757',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div
        style={{
          flex: '1 1 0%', // Use flex shorthand for better cross-browser support
          overflowY: 'auto',
          overflowX: 'hidden', // Prevent horizontal scroll
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          minHeight: 0 // Allow shrinking below content size
        }}
      >
        {workflowOutput.length > 0 ? (
          workflowOutput.map((message, index) => (
            <div
              key={index}
              style={{
                alignSelf: index % 2 === 0 ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                padding: '10px',
                borderRadius: '10px',
                background: index % 2 === 0 ? '#1a73e8' : '#ffffff',
                color: index % 2 === 0 ? '#ffffff' : '#333',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
            >
              {message}
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', color: '#666' }}>
            No messages yet. Run your workflow to see the conversation here.
          </div>
        )}
      </div>

      {/* Input Box */}
      <form
        onSubmit={handleSendMessage}
        style={{
          padding: '10px',
          background: '#ffffff',
          borderTop: '1px solid #ddd',
          display: 'flex',
          gap: '10px',
          flexShrink: 0 // Prevent input from shrinking
        }}
      >
        <input
          type='text'
          value={userInput}
          onChange={e => setUserInput(e.target.value)}
          placeholder='Type a message...'
          style={{
            flex: '1 1 0%', // Use flex instead of flexGrow for better control
            padding: '10px',
            borderRadius: '20px',
            border: '1px solid #ddd',
            outline: 'none',
            fontSize: '14px',
            minWidth: 0 // Allow input to shrink below default size
          }}
        />
        <button
          type='submit'
          style={{
            padding: '10px 15px',
            background: '#1a73e8',
            color: '#ffffff',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '14px',
            flexShrink: 0 // Prevent button from shrinking
          }}
        >
          Send
        </button>
      </form>
    </div>
  )
}

export default WorkflowOutput
