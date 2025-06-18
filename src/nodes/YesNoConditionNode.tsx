import { useState, useEffect } from 'react'
import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react'

// Define the specific data structure for this node
export type YesNoConditionNodeData = {
  label?: string
  name?: string
  condition?: string // The condition to evaluate
  conditionType?: 'yes-no' | 'expression' // Type of condition
  yesLabel?: string // Label for the "yes" path
  noLabel?: string // Label for the "no" path
}

// YesNoConditionNode component
function YesNoConditionNode ({ data, id, isConnectable }: NodeProps) {
  const [name, setName] = useState('Condition')
  const [condition, setCondition] = useState('')
  const [conditionType, setConditionType] = useState<'yes-no' | 'expression'>(
    'yes-no'
  )
  const [yesLabel, setYesLabel] = useState('Yes')
  const [noLabel, setNoLabel] = useState('No')
  const { setNodes } = useReactFlow()

  // Initialize state from data when component mounts or data changes
  useEffect(() => {
    if (data && typeof data === 'object') {
      if ('name' in data && data.name) setName(data.name as string)
      if ('condition' in data && data.condition)
        setCondition(data.condition as string)
      if ('conditionType' in data && data.conditionType)
        setConditionType(data.conditionType as 'yes-no' | 'expression')
      if ('yesLabel' in data && data.yesLabel)
        setYesLabel(data.yesLabel as string)
      if ('noLabel' in data && data.noLabel) setNoLabel(data.noLabel as string)
    }
  }, [data])

  // Handle name change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setName(newValue)
    updateNodeData({ name: newValue })
  }

  // Handle condition change
  const handleConditionChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const newValue = e.target.value
    setCondition(newValue)
    updateNodeData({ condition: newValue })
  }

  // Handle condition type change
  const handleConditionTypeChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newValue = e.target.value as 'yes-no' | 'expression'
    setConditionType(newValue)
    updateNodeData({ conditionType: newValue })
  }

  // Handle "yes" label change
  const handleYesLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setYesLabel(newValue)
    updateNodeData({ yesLabel: newValue })
  }

  // Handle "no" label change
  const handleNoLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setNoLabel(newValue)
    updateNodeData({ noLabel: newValue })
  }

  // Helper function to update node data in the flow
  const updateNodeData = (newData: Record<string, unknown>) => {
    setNodes(nds =>
      nds.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, ...newData }
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
        background: '#fff9c4', // Light yellow for condition nodes
        width: 280,
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

      <div style={{ marginBottom: '10px' }}>
        <label
          style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}
        >
          Condition Type:
        </label>
        <select
          value={conditionType}
          onChange={handleConditionTypeChange}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            boxSizing: 'border-box',
            backgroundColor: 'white'
          }}
        >
          <option value='yes-no'>Yes/No Question</option>
          <option value='expression'>Expression</option>
        </select>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label
          style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}
        >
          {conditionType === 'yes-no'
            ? 'Question to Ask:'
            : 'Condition Expression:'}
        </label>
        {conditionType === 'yes-no' ? (
          <input
            type='text'
            value={condition}
            onChange={handleConditionChange}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              boxSizing: 'border-box'
            }}
            placeholder='Did you enjoy the weather today?'
          />
        ) : (
          <textarea
            value={condition}
            onChange={handleConditionChange}
            rows={3}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontFamily: 'monospace',
              boxSizing: 'border-box',
              resize: 'none'
            }}
            placeholder='${temperature} > 70'
          />
        )}
        {conditionType === 'expression' && (
          <div style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
            Use ${'{variableName}'} to reference variables from other nodes
          </div>
        )}
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label
          style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}
        >
          "Yes" Path Label:
        </label>
        <input
          type='text'
          value={yesLabel}
          onChange={handleYesLabelChange}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            boxSizing: 'border-box'
          }}
          placeholder='Yes'
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label
          style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}
        >
          "No" Path Label:
        </label>
        <input
          type='text'
          value={noLabel}
          onChange={handleNoLabelChange}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            boxSizing: 'border-box'
          }}
          placeholder='No'
        />
      </div>

      <div
        style={{
          backgroundColor: '#ffecb3',
          padding: '8px',
          borderRadius: '4px',
          marginBottom: '10px',
          fontSize: '11px'
        }}
      >
        <strong>Tip:</strong>{' '}
        {conditionType === 'yes-no'
          ? 'This block will ask a yes/no question and branch based on the answer.'
          : 'Use expressions like ${temperature} > 70 to create dynamic conditions.'}
      </div>

      {/* Yes output handle */}
      <div
        style={{
          position: 'absolute',
          bottom: '-15px',
          left: '30%',
          transform: 'translateX(-50%)',
          fontSize: '10px',
          textAlign: 'center',
          width: '40px'
        }}
      >
        {yesLabel}
      </div>
      <Handle
        type='source'
        id='handle-yes'
        position={Position.Bottom}
        style={{ left: '30%', background: '#4CAF50' }}
        isConnectable={isConnectable}
      />

      {/* Additional Yes handle (right side) */}
      <Handle
        type='source'
        id='handle-yes-side'
        position={Position.Right}
        style={{ top: '30%', background: '#4CAF50' }}
        isConnectable={isConnectable}
      />

      {/* No output handle */}
      <div
        style={{
          position: 'absolute',
          bottom: '-15px',
          right: '30%',
          transform: 'translateX(50%)',
          fontSize: '10px',
          textAlign: 'center',
          width: '40px'
        }}
      >
        {noLabel}
      </div>
      <Handle
        type='source'
        id='handle-no'
        position={Position.Bottom}
        style={{ left: '70%', background: '#f44336' }}
        isConnectable={isConnectable}
      />

      {/* Additional No handle (left side) */}
      <Handle
        type='source'
        id='handle-no-side'
        position={Position.Left}
        style={{ top: '70%', background: '#f44336' }}
        isConnectable={isConnectable}
      />
    </div>
  )
}

export default YesNoConditionNode
