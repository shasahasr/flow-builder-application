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
          padding: '16px 20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderBottom: '1px solid #e5e5e5',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#ffffff'
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
            🤖 AI Agent Preview
          </h2>
          <p style={{ margin: '2px 0 0 0', fontSize: '12px', opacity: 0.9 }}>
            Test your workflow conversation
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={clearOutput}
            style={{
              padding: '8px 14px',
              background: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
            }}
          >
            🗑️ Clear
          </button>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                padding: '8px 14px',
                background: 'rgba(255, 75, 87, 0.9)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#ff4757'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255, 75, 87, 0.9)'
              }}
            >
              ✕ Close
            </button>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div
        style={{
          flex: '1 1 0%',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '15px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          minHeight: 0
        }}
      >
        {workflowOutput.length > 0 ? (
          workflowOutput.map((messageStr, index) => {
            // Parse the JSON message
            let parsedMessage
            try {
              parsedMessage = JSON.parse(messageStr)
            } catch {
              // If it's not JSON, treat it as a plain string (assistant message)
              parsedMessage = {
                role: 'assistant',
                content: messageStr,
                timestamp: new Date().toISOString()
              }
            }

            const isUser = parsedMessage.role === 'user'

            return (
              <div
                key={index}
                style={{
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  padding: '12px 16px',
                  borderRadius: isUser
                    ? '18px 18px 4px 18px'
                    : '18px 18px 18px 4px',
                  background: isUser ? '#007aff' : '#f1f1f1',
                  color: isUser ? '#ffffff' : '#000000',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                  wordWrap: 'break-word',
                  fontSize: '14px',
                  lineHeight: '1.4'
                }}
              >
                <div>{parsedMessage.content}</div>
                {parsedMessage.timestamp && (
                  <div
                    style={{
                      fontSize: '11px',
                      opacity: 0.7,
                      marginTop: '4px',
                      textAlign: isUser ? 'right' : 'left'
                    }}
                  >
                    {new Date(parsedMessage.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div
            style={{
              textAlign: 'center',
              color: '#888',
              padding: '40px 20px',
              fontSize: '16px'
            }}
          >
            💬 No messages yet
            <br />
            <span style={{ fontSize: '14px', opacity: 0.8 }}>
              Run your workflow to see the conversation here
            </span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <form
        onSubmit={handleSendMessage}
        style={{
          padding: '15px',
          background: '#ffffff',
          borderTop: '1px solid #e5e5e5',
          display: 'flex',
          gap: '12px',
          flexShrink: 0,
          alignItems: 'flex-end'
        }}
      >
        <input
          type='text'
          value={userInput}
          onChange={e => setUserInput(e.target.value)}
          placeholder='Type a message...'
          style={{
            flex: '1 1 0%',
            padding: '12px 16px',
            borderRadius: '24px',
            border: '1px solid #d1d1d1',
            outline: 'none',
            fontSize: '14px',
            minWidth: 0,
            fontFamily: 'inherit',
            backgroundColor: '#f8f8f8',
            transition: 'all 0.2s ease'
          }}
          onFocus={e => {
            e.target.style.backgroundColor = '#ffffff'
            e.target.style.borderColor = '#007aff'
          }}
          onBlur={e => {
            e.target.style.backgroundColor = '#f8f8f8'
            e.target.style.borderColor = '#d1d1d1'
          }}
        />
        <button
          type='submit'
          disabled={!userInput.trim()}
          style={{
            padding: '12px 20px',
            background: userInput.trim() ? '#007aff' : '#cccccc',
            color: '#ffffff',
            border: 'none',
            borderRadius: '24px',
            cursor: userInput.trim() ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            flexShrink: 0,
            fontWeight: '600',
            transition: 'all 0.2s ease'
          }}
        >
          Send
        </button>
      </form>
    </div>
  )
}

export default WorkflowOutput
