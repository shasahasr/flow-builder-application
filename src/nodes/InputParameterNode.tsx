import { NodeProps, Handle, Position, useReactFlow } from '@xyflow/react'
import { useState, useEffect } from 'react'

// Define the input parameter node data structure
export type InputParameterNodeData = {
  label?: string
  name?: string
  question?: string
  paramName?: string
  saveAsVariable?: boolean // Whether to save the user input as a named variable
  variableName?: string // Optional custom variable name (defaults to paramName if not provided)
}

// Input Parameter node component
function InputParameterNode ({ data, isConnectable, id }: NodeProps) {
  const [question, setQuestion] = useState('')
  const [name, setName] = useState('Input Block')
  const [parameterName, setParameterName] = useState('')
  const [saveAsVariable, setSaveAsVariable] = useState(false)
  const [variableName, setVariableName] = useState('')
  const { setNodes } = useReactFlow()

  // Initialize state from data when component mounts or data changes
  useEffect(() => {
    if (data && typeof data === 'object') {
      if ('name' in data && data.name) setName(data.name as string)
      if ('question' in data && data.question)
        setQuestion(data.question as string)
      if ('paramName' in data && data.paramName)
        setParameterName(data.paramName as string)
      if ('saveAsVariable' in data && data.saveAsVariable !== undefined)
        setSaveAsVariable(data.saveAsVariable as boolean)
      if ('variableName' in data && data.variableName)
        setVariableName(data.variableName as string)
    }
  }, [data])

  const handleQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setQuestion(newValue)

    // Update node data in the flow
    setNodes(nds =>
      nds.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, question: newValue }
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

  const handleParameterNameChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = e.target.value
    setParameterName(newValue)

    // Update node data in the flow
    setNodes(nds =>
      nds.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, paramName: newValue }
          }
        }
        return node
      })
    )
  }

  const handleSaveAsVariableChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const checked = e.target.checked
    setSaveAsVariable(checked)

    // Update node data in the flow
    setNodes(nds =>
      nds.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, saveAsVariable: checked }
          }
        }
        return node
      })
    )
  }

  const handleVariableNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setVariableName(newValue)

    // Update node data in the flow
    setNodes(nds =>
      nds.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, variableName: newValue }
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
        background: '#f0f7ff',
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

      <div style={{ marginBottom: '10px' }}>
        <label
          style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}
        >
          Question:
        </label>
        <textarea
          value={question}
          onChange={handleQuestionChange}
          rows={4}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            boxSizing: 'border-box',
            resize: 'none'
          }}
          placeholder='Enter question to ask user...'
        />
      </div>

      <div>
        <label
          style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}
        >
          Parameter Name:
        </label>
        <input
          type='text'
          value={parameterName}
          onChange={handleParameterNameChange}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            boxSizing: 'border-box'
          }}
          placeholder='e.g. location, user_name, etc.'
        />
      </div>

      <div style={{ marginTop: '10px', marginBottom: '10px' }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            fontWeight: 'bold'
          }}
        >
          <input
            type='checkbox'
            checked={saveAsVariable}
            onChange={handleSaveAsVariableChange}
            style={{ marginRight: '8px' }}
          />
          Save as custom variable
        </label>
      </div>

      {saveAsVariable && (
        <div style={{ marginBottom: '10px' }}>
          <label
            style={{
              display: 'block',
              fontWeight: 'bold',
              marginBottom: '5px'
            }}
          >
            Custom Variable Name:
          </label>
          <input
            type='text'
            value={variableName}
            onChange={handleVariableNameChange}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              boxSizing: 'border-box'
            }}
            placeholder={parameterName || 'customVarName'}
          />
          <div style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
            Access with: $&#123;{variableName || parameterName}&#125;
          </div>
        </div>
      )}

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

export default InputParameterNode
