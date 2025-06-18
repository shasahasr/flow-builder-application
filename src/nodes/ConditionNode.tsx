import { NodeProps, Handle, Position, useReactFlow } from '@xyflow/react'
import { useState, useEffect } from 'react'

// Define the condition node data structure
export type ConditionNodeData = {
  label?: string
  name?: string
  condition?: string
}

// Condition node component
function ConditionNode ({ data, isConnectable, id }: NodeProps) {
  const [condition, setCondition] = useState('')
  const [name, setName] = useState('Condition Block')
  const { setNodes } = useReactFlow()

  // Initialize state from data when component mounts or data changes
  useEffect(() => {
    if (data && typeof data === 'object') {
      if ('name' in data && data.name) setName(data.name as string)
      if ('condition' in data && data.condition)
        setCondition(data.condition as string)
    }
  }, [data])

  const handleConditionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setCondition(newValue)

    // Update node data in the flow
    setNodes(nds =>
      nds.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, condition: newValue }
          }
        }
        return node
      })
    )
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setName(newValue)

    // Update node data in the flow
    setNodes(nds =>
      nds.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, name: newValue }
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
        background: '#fff4e6',
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
          Condition:
        </label>
        <textarea
          value={condition}
          onChange={handleConditionChange}
          rows={4}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            boxSizing: 'border-box',
            resize: 'none'
          }}
          placeholder='Enter condition (e.g. temperature > 25)'
        />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '15px',
          position: 'relative'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <span>True</span>
          {/* True output handles - bottom and right */}
          <Handle
            type='source'
            position={Position.Bottom}
            id='true'
            isConnectable={isConnectable}
            style={{
              left: '25%',
              background: 'green'
            }}
          />
          <Handle
            type='source'
            position={Position.Right}
            id='true-side'
            isConnectable={isConnectable}
            style={{
              top: '30%',
              background: 'green'
            }}
          />
        </div>
        <div style={{ textAlign: 'center' }}>
          <span>False</span>
          {/* False output handles - bottom and left */}
          <Handle
            type='source'
            position={Position.Bottom}
            id='false'
            isConnectable={isConnectable}
            style={{
              left: '75%',
              background: 'red'
            }}
          />
          <Handle
            type='source'
            position={Position.Left}
            id='false-side'
            isConnectable={isConnectable}
            style={{
              top: '70%',
              background: 'red'
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default ConditionNode
