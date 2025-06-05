import { useCallback } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'

// Define the specific properties for our node's data
export interface CityInputNodeSpecificData {
  // Added export
  label: string
  value?: string
  onValueChange?: (value: string) => void
}

// Intersect with Record<string, unknown> to satisfy React Flow's constraints
// while keeping our specific properties strongly typed.
type CityInputNodeData = CityInputNodeSpecificData & Record<string, unknown>

// Define the full Node type for this custom node.
// 'input' should match the type string used when registering this node type.
type CustomCityNode = Node<CityInputNodeData, 'input'>

// Use NodeProps with our full custom node type for strong typing
function CityInputNode ({ data, id, isConnectable }: NodeProps<CustomCityNode>) {
  const onChange = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      // Accessing our specific properties is still type-safe
      const specificData = data as CityInputNodeSpecificData
      if (specificData.onValueChange) {
        specificData.onValueChange(evt.target.value)
      } else {
        console.warn(
          `CityInputNode (id: ${id}): onValueChange callback is not defined in data prop. Input changes will be local only.`
        )
      }
    },
    [id, data] // data is now a stable dependency
  )

  // Accessing our specific properties for rendering
  const { label, value } = data as CityInputNodeSpecificData

  return (
    <div
      style={{
        border: '1px solid #ddd',
        padding: '15px',
        borderRadius: '8px',
        background: 'white',
        width: 250,
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
      }}
    >
      <Handle
        type='target'
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ background: '#555' }}
      />
      <div style={{ marginBottom: '10px' }}>
        <label
          htmlFor={`city-input-${id}`}
          style={{
            display: 'block',
            fontWeight: 'bold',
            marginBottom: '5px',
            color: '#333',
            textAlign: 'center' // Added to center the label text
          }}
        >
          {label || 'City Input'}:
        </label>
        <input
          id={`city-input-${id}`}
          name='city-input'
          value={value || ''}
          onChange={onChange}
          className='nodrag'
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxSizing: 'border-box',
            fontSize: '14px',
            textAlign: 'center' // Added to center the input/placeholder text
          }}
          placeholder='E.g., London, New York'
        />
      </div>
      <Handle
        type='source'
        position={Position.Bottom}
        isConnectable={isConnectable}
        style={{ background: '#555' }}
      />
    </div>
  )
}

export default CityInputNode
