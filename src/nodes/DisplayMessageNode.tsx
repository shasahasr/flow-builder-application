import { Handle, Position, type NodeProps, useReactFlow } from '@xyflow/react'
import { useState, useEffect } from 'react'

// Define the data type for this node
export type DisplayMessageNodeData = {
  label?: string
  name?: string
  message?: string
}

// Display Message node component
function DisplayMessageNode ({ data, isConnectable, id }: NodeProps) {
  const [name, setName] = useState('Message Block')
  const [message, setMessage] = useState('')
  const { setNodes } = useReactFlow()

  // Initialize state from data when component mounts or data changes
  useEffect(() => {
    if (data && typeof data === 'object') {
      if ('name' in data && data.name) setName(data.name as string)
      if ('message' in data && data.message) setMessage(data.message as string)
    }
  }, [data])

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    setName(newName)

    // Update node data in the flow
    setNodes(nds =>
      nds.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, name: newName }
          }
        }
        return node
      })
    )
  }

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value
    setMessage(newMessage)

    // Update node data in the flow
    setNodes(nds =>
      nds.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, message: newMessage }
          }
        }
        return node
      })
    )
  }

  return (
    <div
      style={{
        padding: '15px',
        borderRadius: '5px',
        border: '1px solid #ddd',
        background: '#f8f8f8',
        width: 320,
        fontSize: '12px',
        boxSizing: 'border-box'
      }}
    >
      {/* Input handle */}
      <Handle
        type='target'
        position={Position.Top}
        style={{ background: '#555' }}
        isConnectable={isConnectable}
      />

      <div style={{ marginBottom: '10px' }}>
        <label
          style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}
        >
          Block Name:
        </label>
        <input
          type='text'
          value={name}
          onChange={handleNameChange}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div>
        <label
          style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}
        >
          Message:
        </label>
        <textarea
          value={message}
          onChange={handleMessageChange}
          rows={4}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            boxSizing: 'border-box',
            resize: 'none'
          }}
          placeholder='Enter message to display to user...'
        />
        <div style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
          Use ${'variableName'} to include variables. Example: Hello ${'name'}!
        </div>
      </div>

      {/* Multiple Output handles */}
      {/* Bottom output handle */}
      <Handle
        type='source'
        id='handle-bottom'
        position={Position.Bottom}
        style={{ background: '#555' }}
        isConnectable={isConnectable}
      />

      {/* Right output handle */}
      <Handle
        type='source'
        id='handle-right'
        position={Position.Right}
        style={{ background: '#555' }}
        isConnectable={isConnectable}
      />

      {/* Left output handle */}
      <Handle
        type='source'
        id='handle-left'
        position={Position.Left}
        style={{ top: '70%', background: '#555' }}
        isConnectable={isConnectable}
      />
    </div>
  )
}

export default DisplayMessageNode
