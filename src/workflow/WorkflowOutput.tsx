import React, { useState } from 'react'
import { useWorkflow } from './WorkflowContext'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const WorkflowOutput: React.FC = () => {
  const {
    workflowOutput,
    isExecuting,
    clearOutput,
    submitUserInput,
    waitingForUserInput
  } = useWorkflow()
  const [userInput, setUserInput] = useState('')

  // Function to parse workflowOutput into chat format
  const formatAsChatMessages = (messages: string[]): ChatMessage[] => {
    // Convert simple strings to chat messages
    // We assume alternating user and assistant messages, starting with user
    return messages.map((msg, idx) => {
      if (typeof msg === 'string') {
        // Try to parse it to see if it has a specific structure
        try {
          const parsed = JSON.parse(msg)
          if (parsed.role && parsed.content) {
            return {
              role: parsed.role,
              content: parsed.content
            }
          }
          // If it has a type field, use that to determine role
          if (parsed.type === 'user_input' || parsed.source === 'user') {
            return {
              role: 'user',
              content: parsed.message || parsed.text || JSON.stringify(parsed)
            }
          }
          return {
            role: idx % 2 === 0 ? 'user' : 'assistant', // Alternate by default
            content:
              typeof parsed === 'object' ? JSON.stringify(parsed) : parsed
          }
        } catch (e) {
          // Not JSON, treat as plain text
          return {
            role: idx % 2 === 0 ? 'user' : 'assistant', // Alternate by default
            content: msg
          }
        }
      }
      return {
        role: idx % 2 === 0 ? 'user' : 'assistant',
        content: String(msg)
      }
    })
  }

  const chatMessages = formatAsChatMessages(workflowOutput)

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!userInput.trim()) return

    // Send the message to the workflow execution engine
    submitUserInput(userInput)

    // Clear the input
    setUserInput('')
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#ffffff',
        borderRadius: '8px',
        margin: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
      }}
    >
      {/* Chat header */}
      <div
        style={{
          padding: '15px 20px',
          borderBottom: '1px solid #ddd',
          background: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontWeight: 600, fontSize: '18px' }}>
            AI Agent Preview
          </h2>
          {isExecuting && (
            <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
              Workflow running...
            </div>
          )}
          {waitingForUserInput && (
            <div
              style={{ color: '#ff4081', fontSize: '12px', marginTop: '4px' }}
            >
              Waiting for your input...
            </div>
          )}
        </div>
        <button
          onClick={clearOutput}
          style={{
            padding: '6px 12px',
            backgroundColor: '#f0f0f0',
            color: '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          Clear Chat
        </button>
      </div>

      {/* Chat messages - scrollable container with fixed height */}
      <div
        style={{
          flexGrow: 1,
          padding: '20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          maxHeight: '500px' /* Fixed height to ensure scrolling */,
          height: '500px'
        }}
      >
        {chatMessages.length > 0 ? (
          chatMessages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%'
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '18px',
                  background: msg.role === 'user' ? '#1a73e8' : 'white',
                  color: msg.role === 'user' ? 'white' : '#333',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  border:
                    msg.role === 'assistant' ? '1px solid #e0e0e0' : 'none'
                }}
              >
                {msg.content}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#666',
                  marginTop: '4px',
                  marginLeft: '12px',
                  marginRight: '12px'
                }}
              >
                {msg.role === 'user' ? 'You' : 'AI Agent'} • just now
              </div>
            </div>
          ))
        ) : (
          <div
            style={{
              margin: 'auto',
              color: '#666',
              textAlign: 'center',
              maxWidth: '80%'
            }}
          >
            <img
              src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5QTlBOUEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1tZXNzYWdlLWNpcmNsZSI+PHBhdGggZD0iTTIxIDExLjVhOC4zOCA4LjM4IDAgMCAxLS45IDMuOCA4LjUgOC41IDAgMCAxLTcuNiA0LjcgOC4zOCA4LjM4IDAgMCAxLTMuOC0uOUwzIDIxbDEuOS01LjdhOC4zOCA4LjM4IDAgMCAxLS45LTMuOCA4LjUgOC41IDAgMCAxIDQuNy03LjYgOC4zOCA4LjM4IDAgMCAxIDMuOC0uOWguNWE4LjQ4IDguNDggMCAwIDEgOCA4di41WiIvPjwvc3ZnPg=='
              alt='Chat icon'
              style={{
                width: '64px',
                height: '64px',
                opacity: 0.5,
                marginBottom: '16px'
              }}
            />
            <p style={{ fontSize: '16px', fontWeight: 500 }}>
              Run your workflow to see the conversation here
            </p>
            <p style={{ fontSize: '14px' }}>
              The AI Agent will respond based on how you've configured your
              workflow
            </p>
          </div>
        )}
      </div>

      {/* Message input */}
      <form
        onSubmit={handleSendMessage}
        style={{
          borderTop: '1px solid #ddd',
          padding: '15px 20px',
          background: 'white',
          display: 'flex',
          gap: '10px',
          alignItems: 'center'
        }}
      >
        <input
          type='text'
          value={userInput}
          onChange={e => setUserInput(e.target.value)}
          placeholder={
            waitingForUserInput
              ? 'AI agent is waiting for your response...'
              : 'Type a message to the AI agent...'
          }
          style={{
            flexGrow: 1,
            padding: '10px 15px',
            borderRadius: '20px',
            border: waitingForUserInput
              ? '1px solid #1a73e8'
              : '1px solid #ddd',
            fontSize: '14px',
            outline: 'none',
            boxSizing: 'border-box',
            boxShadow: waitingForUserInput
              ? '0 0 0 2px rgba(26, 115, 232, 0.2)'
              : 'none'
          }}
          autoFocus={waitingForUserInput}
        />
        <button
          type='submit'
          disabled={!userInput.trim()}
          style={{
            padding: '10px 15px',
            background: waitingForUserInput ? '#ff4081' : '#1a73e8',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            cursor: userInput.trim() ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: userInput.trim() ? 1 : 0.7
          }}
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='18'
            height='18'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <line x1='22' y1='2' x2='11' y2='13'></line>
            <polygon points='22 2 15 22 11 13 2 9 22 2'></polygon>
          </svg>
        </button>
      </form>
    </div>
  )
}

export default WorkflowOutput
