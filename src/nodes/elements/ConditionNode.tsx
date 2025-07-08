import { NodeProps, Handle, Position, useReactFlow } from '@xyflow/react'
import { useState, useEffect } from 'react'
import { validateCondition, getConditionExamples } from '../conditionUtils'
import { getNodeContainerStyle, nodeStyles } from '../nodeStyles'

// Define the condition node data structure
export type ConditionNodeData = {
  label?: string
  name?: string
  condition?: string
  lastEvaluationResult?: boolean
  lastEvaluationContext?: Record<string, unknown>
}

// Condition node component
function ConditionNode ({ data, isConnectable, id }: NodeProps) {
  const [condition, setCondition] = useState('')
  const [name, setName] = useState('Condition Block')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [showExamples, setShowExamples] = useState(false)
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

    // Validate the condition
    const validation = validateCondition(newValue)
    setValidationError(
      validation.isValid ? null : validation.error || 'Invalid condition'
    )

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

  const insertExample = (example: string) => {
    setCondition(example)
    setValidationError(null)
    setShowExamples(false)

    // Update node data
    setNodes(nds =>
      nds.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, condition: example }
          }
        }
        return node
      })
    )
  }

  return (
    <div style={getNodeContainerStyle('condition', !!validationError)}>
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px'
          }}
        >
          <label style={nodeStyles.label}>Condition:</label>
          <button
            type='button'
            onClick={() => setShowExamples(!showExamples)}
            style={nodeStyles.button}
            onMouseEnter={e => {
              Object.assign(e.currentTarget.style, nodeStyles.buttonHover)
            }}
            onMouseLeave={e => {
              Object.assign(e.currentTarget.style, nodeStyles.button)
            }}
          >
            Examples
          </button>
        </div>

        <textarea
          value={condition}
          onChange={handleConditionChange}
          rows={3}
          style={{
            ...nodeStyles.textarea,
            borderColor: validationError
              ? '#ef4444'
              : nodeStyles.textarea.border
          }}
          placeholder='Enter condition (e.g., temperature > 25)'
        />

        {validationError && (
          <div style={nodeStyles.errorText}>⚠️ {validationError}</div>
        )}

        {showExamples && (
          <div
            style={{
              marginTop: '12px',
              padding: '12px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#374151'
              }}
            >
              Click to use:
            </div>
            {getConditionExamples().map((example, index) => (
              <button
                key={index}
                onClick={() => insertExample(example)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  padding: '6px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontFamily: 'ui-monospace, monospace',
                  borderRadius: '4px',
                  marginBottom: '2px',
                  color: '#4b5563',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#e2e8f0'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'none'
                }}
              >
                {example}
              </button>
            ))}
          </div>
        )}

        <div style={nodeStyles.helpText}>
          Use variables like: temperature, userAge, city
          <br />
          Operators: &gt;, &lt;, ==, !=, &gt;=, &lt;=
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '20px',
          position: 'relative'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <span
            style={{
              color: '#22c55e',
              fontWeight: '600',
              fontSize: '12px'
            }}
          >
            True
          </span>
          {/* True output handle */}
          <Handle
            type='source'
            position={Position.Bottom}
            id='true'
            isConnectable={isConnectable}
            style={{
              left: '25%',
              ...nodeStyles.handle,
              ...nodeStyles.handleTrue
            }}
          />
        </div>
        <div style={{ textAlign: 'center' }}>
          <span
            style={{
              color: '#ef4444',
              fontWeight: '600',
              fontSize: '12px'
            }}
          >
            False
          </span>
          {/* False output handle */}
          <Handle
            type='source'
            position={Position.Bottom}
            id='false'
            isConnectable={isConnectable}
            style={{
              left: '75%',
              ...nodeStyles.handle,
              ...nodeStyles.handleFalse
            }}
          />
        </div>
      </div>

      {/* Debug info for last evaluation */}
      {data &&
        'lastEvaluationResult' in data &&
        data.lastEvaluationResult !== undefined && (
          <div
            style={{
              marginTop: '12px',
              padding: '8px',
              background: data.lastEvaluationResult ? '#f0fdf4' : '#fef2f2',
              borderRadius: '6px',
              fontSize: '11px',
              border: `1px solid ${
                data.lastEvaluationResult ? '#bbf7d0' : '#fecaca'
              }`
            }}
          >
            <strong>Last result:</strong>{' '}
            {data.lastEvaluationResult ? '✅ True' : '❌ False'}
          </div>
        )}
    </div>
  )
}

export default ConditionNode
