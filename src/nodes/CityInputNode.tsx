import { useState, useEffect } from 'react'
import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react'

// City Input node component optimized for weather location input
function CityInputNode ({ data, id, isConnectable }: NodeProps) {
  const [name, setName] = useState('City Input')
  const [question, setQuestion] = useState(
    'What city would you like weather information for?'
  )
  const [paramName, setParamName] = useState('location')
  const [saveAsVariable, setSaveAsVariable] = useState(true)
  const [variableName, setVariableName] = useState('location')
  const { setNodes } = useReactFlow()

  // Initialize state from data when component mounts or data changes
  useEffect(() => {
    if (data && typeof data === 'object') {
      if ('name' in data && data.name) setName(data.name as string)
      if ('question' in data && data.question)
        setQuestion(data.question as string)
      if ('paramName' in data && data.paramName)
        setParamName(data.paramName as string)
      if ('saveAsVariable' in data && data.saveAsVariable !== undefined)
        setSaveAsVariable(data.saveAsVariable as boolean)
      if ('variableName' in data && data.variableName)
        setVariableName(data.variableName as string)
    }
  }, [data])

  // Handle name change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setName(newValue)
    updateNodeData({ name: newValue })
  }

  // Handle question change
  const handleQuestionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setQuestion(newValue)
    updateNodeData({ question: newValue })
  }

  // Handle parameter name change
  const handleParamNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setParamName(newValue)
    updateNodeData({ paramName: newValue })
  }

  // Handle save as variable change
  const handleSaveAsVariableChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const checked = e.target.checked
    setSaveAsVariable(checked)
    updateNodeData({ saveAsVariable: checked })
  }

  // Handle variable name change
  const handleVariableNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setVariableName(newValue)
    updateNodeData({ variableName: newValue })
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
        background: '#e3f2fd', // Light blue background for weather/location theme
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
          Question:
        </label>
        <input
          type='text'
          value={question}
          onChange={handleQuestionChange}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            boxSizing: 'border-box'
          }}
          placeholder='What city would you like to check?'
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label
          style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}
        >
          Parameter Name:
        </label>
        <input
          type='text'
          value={paramName}
          onChange={handleParamNameChange}
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
          Save as variable
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
            Variable Name:
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
          />
          <div style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
            Access with: ${'{' + variableName + '}'}
          </div>
        </div>
      )}

      <div
        style={{
          backgroundColor: '#e1f5fe',
          padding: '8px',
          borderRadius: '4px',
          marginBottom: '10px',
          fontSize: '11px'
        }}
      >
        <strong>Tip:</strong> This node is optimized for asking users about a
        city or location for weather data. Use this with Open-Meteo API calls.
      </div>

      {/* Output handle */}
      <Handle
        type='source'
        position={Position.Bottom}
        style={{ background: '#555' }}
        isConnectable={isConnectable}
      />
    </div>
  )
}

export default CityInputNode
