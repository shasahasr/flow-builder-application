import { NodeProps, Handle, Position, useReactFlow } from '@xyflow/react'
import { useState, useEffect } from 'react'

// Define the API call node data structure with direct mapping to fetch parameters
export type ApiCallNodeData = {
  label?: string
  name?: string
  url?: string
  method?: string // HTTP method (GET, POST, PUT, DELETE, etc.)
  headers?: string // JSON string of headers
  payload?: string // Request body as JSON string
  responsePath?: string // Path to extract from response
  saveAsVariable?: boolean // Whether to save the response as a variable
  variableName?: string // Name of the variable to save the response
}

// API Call node component
function ApiCallNode ({ data, isConnectable, id }: NodeProps) {
  // Core fetch parameters
  const [url, setUrl] = useState('')
  const [method, setMethod] = useState('GET')
  const [headersStr, setHeadersStr] = useState(
    '{\n  "Content-Type": "application/json"\n}'
  )
  const [payloadStr, setPayloadStr] = useState('{\n  "key": "value"\n}')

  // Node display and configuration
  const [name, setName] = useState('API Block')
  const [responsePath, setResponsePath] = useState('')
  const [saveAsVariable, setSaveAsVariable] = useState(false)
  const [variableName, setVariableName] = useState('apiResponse')

  // Validation errors
  const [payloadError, setPayloadError] = useState('')
  const [headersError, setHeadersError] = useState('')

  const { setNodes } = useReactFlow()

  // Initialize state from data when component mounts or data changes
  useEffect(() => {
    if (data && typeof data === 'object') {
      if ('name' in data && data.name) setName(data.name as string)
      if ('url' in data && data.url) setUrl(data.url as string)
      if ('method' in data && data.method) setMethod(data.method as string)
      if ('headers' in data && data.headers)
        setHeadersStr(data.headers as string)
      if ('payload' in data && data.payload)
        setPayloadStr(data.payload as string)
      if ('responsePath' in data && data.responsePath)
        setResponsePath(data.responsePath as string)
      if ('saveAsVariable' in data && data.saveAsVariable !== undefined)
        setSaveAsVariable(data.saveAsVariable as boolean)
      if ('variableName' in data && data.variableName)
        setVariableName(data.variableName as string)
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

  const handleMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMethod = e.target.value
    setMethod(newMethod)

    // Update node data in the flow
    setNodes(nds =>
      nds.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, method: newMethod }
          }
        }
        return node
      })
    )
  }

  const handleHeadersChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setHeadersStr(newValue)

    try {
      JSON.parse(newValue)
      setHeadersError('')

      // Update node data in the flow
      setNodes(nds =>
        nds.map(node => {
          if (node.id === id) {
            return {
              ...node,
              data: { ...node.data, headers: newValue }
            }
          }
          return node
        })
      )
    } catch (error) {
      setHeadersError('Invalid JSON')
    }
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

  const handleResponsePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setResponsePath(newValue)

    // Update node data in the flow
    setNodes(nds =>
      nds.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, responsePath: newValue }
          }
        }
        return node
      })
    )
  }

  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false)

  const toggleInfoModal = () => {
    setIsInfoModalOpen(prev => !prev)
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
        boxSizing: 'border-box',
        position: 'relative'
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <label style={{ fontWeight: 'bold', marginBottom: '5px' }}>
            API Fetch Block
          </label>
          <div
            style={{
              cursor: 'pointer',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: '#f0f0f0',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#666',
              border: '1px solid #ccc'
            }}
            onClick={toggleInfoModal}
          >
            i
          </div>
        </div>
        {isInfoModalOpen && (
          <div
            style={{
              position: 'absolute',
              top: '40px',
              right: '10px',
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderRadius: '5px',
              padding: '10px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              zIndex: 1000,
              width: '300px'
            }}
          >
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
              How to Use
            </h4>
            <p style={{ fontSize: '12px', margin: '0 0 5px 0' }}>
              This block allows you to make API calls using JavaScript's fetch
              API. You can:
            </p>
            <ul style={{ fontSize: '12px', paddingLeft: '20px', margin: '0' }}>
              <li>Enter the API URL in the URL field.</li>
              <li>Select the HTTP method (GET, POST, etc.).</li>
              <li>Add headers in JSON format (e.g., authentication tokens).</li>
              <li>Provide a payload for POST/PUT requests in JSON format.</li>
              <li>
                Specify a response path to extract specific data from the API
                response.
              </li>
              <li>
                Optionally save the response as a variable for use in other
                nodes.
              </li>
            </ul>
            <button
              style={{
                marginTop: '10px',
                padding: '5px 10px',
                fontSize: '12px',
                borderRadius: '3px',
                border: '1px solid #ccc',
                backgroundColor: '#f0f0f0',
                cursor: 'pointer'
              }}
              onClick={toggleInfoModal}
            >
              Close
            </button>
          </div>
        )}
      </div>

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

      <div style={{ marginBottom: '10px' }}>
        <label
          style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}
        >
          HTTP Method:
        </label>
        <select
          value={method}
          onChange={handleMethodChange}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            boxSizing: 'border-box',
            backgroundColor: 'white'
          }}
        >
          <option value='GET'>GET</option>
          <option value='POST'>POST</option>
          <option value='PUT'>PUT</option>
          <option value='DELETE'>DELETE</option>
          <option value='PATCH'>PATCH</option>
          <option value='HEAD'>HEAD</option>
          <option value='OPTIONS'>OPTIONS</option>
        </select>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <label style={{ fontWeight: 'bold', marginBottom: '5px' }}>
            Headers:
          </label>
        </div>
        <textarea
          value={headersStr}
          onChange={handleHeadersChange}
          rows={3}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: headersError ? '1px solid red' : '1px solid #ddd',
            fontFamily: 'monospace',
            boxSizing: 'border-box',
            resize: 'none'
          }}
          placeholder='{"Content-Type": "application/json", "Authorization": "Bearer ${API_KEY}"}'
        />
        {headersError && (
          <div style={{ color: 'red', fontSize: '11px', marginTop: '5px' }}>
            {headersError}
          </div>
        )}
        <div style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
          Common headers: <code>Content-Type</code>, <code>Authorization</code>.
          Use <code>${'{variableName}'}</code> for API keys.
        </div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <label style={{ fontWeight: 'bold', marginBottom: '5px' }}>
            {method === 'GET' ? 'Query Parameters:' : 'Request Body:'}
          </label>
        </div>
        <textarea
          value={payloadStr}
          onChange={handlePayloadChange}
          rows={5}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: payloadError ? '1px solid red' : '1px solid #ddd',
            fontFamily: 'monospace',
            boxSizing: 'border-box',
            resize: 'none'
          }}
          placeholder={
            method === 'GET'
              ? '{"param1": "value1", "param2": "${variableName}"}'
              : '{"key": "value", "data": "${variableName}"}'
          }
        />
        {payloadError && (
          <div style={{ color: 'red', fontSize: '11px', marginTop: '5px' }}>
            {payloadError}
          </div>
        )}
        <div style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
          {method === 'GET' ? (
            <>
              These parameters will be converted to URL query parameters (
              <code>?param1=value1&param2=value2</code>)
            </>
          ) : (
            <>
              This JSON will be sent as the request body. Use{' '}
              <code>${'{variableName}'}</code> for dynamic values.
            </>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <label style={{ fontWeight: 'bold', marginBottom: '5px' }}>
            Response Path (optional):
          </label>
        </div>
        <input
          type='text'
          value={responsePath}
          onChange={handleResponsePathChange}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            boxSizing: 'border-box'
          }}
          placeholder='e.g. data.results.0.id'
        />
        <div style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
          Common examples: <code>data.results</code>, <code>items.0.name</code>,{' '}
          <code>choices.0.message.content</code> (OpenAI)
        </div>
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
          Save response as variable
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
            placeholder='apiResponse'
          />
          <div style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
            Access with: $&#123;{variableName}&#125;
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

export default ApiCallNode
