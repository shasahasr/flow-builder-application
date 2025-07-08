import { Handle, Position, type NodeProps, useReactFlow } from '@xyflow/react'
import { useState, useEffect } from 'react'
import { getNodeContainerStyle, nodeStyles } from '../nodeStyles'

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
    <div style={getNodeContainerStyle('message')}>
      {/* Input handle */}
      <Handle
        type='target'
        position={Position.Top}
        style={{ ...nodeStyles.handle, ...nodeStyles.handleInput }}
        isConnectable={isConnectable}
      />

      <div style={nodeStyles.fieldGroup}>
        <label style={nodeStyles.label}>Block Name:</label>
        <input
          type='text'
          value={name}
          onChange={handleNameChange}
          style={nodeStyles.input}
        />
      </div>

      <div style={nodeStyles.fieldGroup}>
        <label style={nodeStyles.label}>Message:</label>
        <textarea
          value={message}
          onChange={handleMessageChange}
          rows={4}
          style={nodeStyles.textarea}
          placeholder='Enter message to display to user...'
        />
        <div style={nodeStyles.helpText}>
          Use ${'${variableName}'} to include variables. Example: Hello $
          {'${name}'}!
        </div>
      </div>

      {/* Single Output handle */}
      <Handle
        type='source'
        position={Position.Bottom}
        style={{ ...nodeStyles.handle, ...nodeStyles.handleOutput }}
        isConnectable={isConnectable}
      />
    </div>
  )
}

export default DisplayMessageNode
