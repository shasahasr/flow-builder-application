import { NodeProps, Handle, Position, useReactFlow } from '@xyflow/react'
import { useState, useEffect} from 'react'

// Define the API call node data structure
export type ApiCallNodeData = {
  label?: string
  name?: string
  url?: string
  payload?: string
}

// API Call node component
function ApiCallNode ({ data, isConnectable, id }: NodeProps) {
  const [url, setUrl] = useState('')
  const [payloadStr, setPayloadStr] = useState('{\n  "key": "value"\n}')
  const [name, setName] = useState('API Block')
  const [payloadError, setPayloadError] = useState('')
  const { setNodes } = useReactFlow()

  // Initialize state from data when component mounts or data changes
  useEffect(() => {
    if (data && typeof data === 'object') {
      if ('name' in data && data.name) setName(data.name as string)
      if ('url' in data && data.url) setUrl(data.url as string)
      if ('payload' in data && data.payload)
        setPayloadStr(data.payload as string)
    }
  }, [data])

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setUrl(newValue)

    // Update node data in the flow
    setNodes(nds =>
      nds.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, url: newValue }
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

  const handlePayloadChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setPayloadStr(newValue)

    try {
      JSON.parse(newValue)
      setPayloadError('')

      // Update node data in the flow
      setNodes(nds =>
        nds.map(node => {
          if (node.id === id) {
            return {
              ...node,
              data: { ...node.data, payload: newValue }
            }
          }
          return node
        })
      )
    } catch (error) {
      setPayloadError('Invalid JSON')
    }
  }

  return (
    <div
      style={{
        padding: '15px',
        borderRadius: '5px',
        border: '1px solid #ddd',
        background: '#f5f5f5',
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
          API URL:
        </label>
        <input
          type='text'
          value={url}
          onChange={handleUrlChange}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            boxSizing: 'border-box'
          }}
          placeholder='https://api.example.com/endpoint'
        />
      </div>

      <div>
        <label
          style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}
        >
          Payload:
        </label>
        <textarea
          value={payloadStr}
          onChange={handlePayloadChange}
          rows={6}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: payloadError ? '1px solid red' : '1px solid #ddd',
            fontFamily: 'monospace',
            boxSizing: 'border-box',
            resize: 'none'
          }}
          placeholder='{"key": "value", "parameterName": "{variableName}"}'
        />
        {payloadError && (
          <div style={{ color: 'red', fontSize: '11px', marginTop: '5px' }}>
            {payloadError}
          </div>
        )}
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

export default ApiCallNode
