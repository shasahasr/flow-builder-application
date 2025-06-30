import { NodeProps, Handle, Position, useReactFlow } from '@xyflow/react'
import { useState, useEffect } from 'react'

// Define the condition node data structure
export type ConditionNodeData = {
  label?: string
  name?: string
  condition?: string
  lastEvaluationResult?: boolean
  lastEvaluationContext?: Record<string, unknown>
}

// Helper functions for condition evaluation
export const evaluateCondition = (
  conditionText: string, 
  context: Record<string, unknown>
): { result: boolean; debug: string } => {
  try {
    // Process variables in condition text
    const processedCondition = conditionText.replace(/\${([^}]+)}/g, (match, varName) => {
      return context[varName] !== undefined ? String(context[varName]) : match
    })

    // Check for comparison patterns
    const comparison = processedCondition.match(/(.*?)(==|!=|>|<|>=|<=)(.*)/)
    
    if (comparison) {
      const [, left, operator, right] = comparison
      const leftValue = left.trim()
      const rightValue = right.trim()

      // Get actual values, handling string literals and numbers
      const getComparisonValue = (val: string) => {
        if (val.startsWith('"') && val.endsWith('"')) {
          return val.slice(1, -1) // Remove quotes
        }
        if (val.startsWith("'") && val.endsWith("'")) {
          return val.slice(1, -1) // Remove quotes
        }
        if (!isNaN(Number(val))) {
          return Number(val) // Convert to number
        }
        // Try to find in context
        return context[val] !== undefined ? context[val] : val
      }

      const leftEval = getComparisonValue(leftValue)
      const rightEval = getComparisonValue(rightValue)

      let result = false
      switch (operator) {
        case '==':
          result = leftEval == rightEval
          break
        case '!=':
          result = leftEval != rightEval
          break
        case '>':
          result = Number(leftEval) > Number(rightEval)
          break
        case '<':
          result = Number(leftEval) < Number(rightEval)
          break
        case '>=':
          result = Number(leftEval) >= Number(rightEval)
          break
        case '<=':
          result = Number(leftEval) <= Number(rightEval)
          break
      }

      return {
        result,
        debug: `${leftEval} ${operator} ${rightEval} = ${result}`
      }
    }

    // Try to evaluate as boolean expression
    if (processedCondition in context) {
      const result = Boolean(context[processedCondition])
      return {
        result,
        debug: `Variable '${processedCondition}' is ${result ? 'truthy' : 'falsy'}`
      }
    }

    // Simple boolean conversion
    const result = Boolean(processedCondition && processedCondition !== 'false')
    return {
      result,
      debug: `'${processedCondition}' evaluated as ${result}`
    }
  } catch (error) {
    return {
      result: false,
      debug: `Error: ${error}`
    }
  }
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
          <span style={{ 
            color: 'green', 
            fontWeight: 'bold', 
            fontSize: '11px' 
          }}>
            True
          </span>
          {/* True output handles - bottom and right */}
          <Handle
            type='source'
            position={Position.Bottom}
            id='true'
            isConnectable={isConnectable}
            style={{
              left: '25%',
              background: '#22c55e',
              border: '2px solid #16a34a',
              width: '12px',
              height: '12px'
            }}
          />
          <Handle
            type='source'
            position={Position.Right}
            id='true-side'
            isConnectable={isConnectable}
            style={{
              top: '30%',
              background: '#22c55e',
              border: '2px solid #16a34a',
              width: '12px',
              height: '12px'
            }}
          />
        </div>
        <div style={{ textAlign: 'center' }}>
          <span style={{ 
            color: 'red', 
            fontWeight: 'bold', 
            fontSize: '11px' 
          }}>
            False
          </span>
          {/* False output handles - bottom and left */}
          <Handle
            type='source'
            position={Position.Bottom}
            id='false'
            isConnectable={isConnectable}
            style={{
              left: '75%',
              background: '#ef4444',
              border: '2px solid #dc2626',
              width: '12px',
              height: '12px'
            }}
          />
          <Handle
            type='source'
            position={Position.Left}
            id='false-side'
            isConnectable={isConnectable}
            style={{
              top: '70%',
              background: '#ef4444',
              border: '2px solid #dc2626',
              width: '12px',
              height: '12px'
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default ConditionNode
