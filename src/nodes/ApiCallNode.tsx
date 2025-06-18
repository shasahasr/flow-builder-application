import { NodeProps, Handle, Position, useReactFlow } from '@xyflow/react'
import { useState, useEffect } from 'react'

// Import API key from environment
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY

// Define the API call node data structure
export type ApiCallNodeData = {
  label?: string
  name?: string
  url?: string
  payload?: string
  responsePath?: string // Path to extract from response
  apiType?: 'chatgpt' | 'openmeteo' | '' // Type of API (ChatGPT or Open-Meteo)
  selectedFunction?: string // Selected function from the API
  saveAsVariable?: boolean // Whether to save the response as a variable
  variableName?: string // Name of the variable to save the response
  detectedFunctions?: string[] // List of functions detected from the API documentation
}

// API Call node component
function ApiCallNode ({ data, isConnectable, id }: NodeProps) {
  const [url, setUrl] = useState('')
  const [payloadStr, setPayloadStr] = useState('{\n  "key": "value"\n}')
  const [name, setName] = useState('API Block')
  const [responsePath, setResponsePath] = useState('')
  const [payloadError, setPayloadError] = useState('')
  const [apiType, setApiType] = useState<'chatgpt' | 'openmeteo' | ''>('')
  const [selectedFunction, setSelectedFunction] = useState('')
  const [saveAsVariable, setSaveAsVariable] = useState(false)
  const [variableName, setVariableName] = useState('apiResponse')
  const [detectedFunctions, setDetectedFunctions] = useState<string[]>([])
  const [isLoadingFunctions, setIsLoadingFunctions] = useState(false)
  const { setNodes } = useReactFlow()

  // Initialize state from data when component mounts or data changes
  useEffect(() => {
    if (data && typeof data === 'object') {
      if ('name' in data && data.name) setName(data.name as string)
      if ('url' in data && data.url) setUrl(data.url as string)
      if ('payload' in data && data.payload)
        setPayloadStr(data.payload as string)
      if ('responsePath' in data && data.responsePath)
        setResponsePath(data.responsePath as string)
      if ('apiType' in data && data.apiType)
        setApiType(data.apiType as 'chatgpt' | 'openmeteo' | '')
      if ('selectedFunction' in data && data.selectedFunction)
        setSelectedFunction(data.selectedFunction as string)
      if ('saveAsVariable' in data && data.saveAsVariable !== undefined)
        setSaveAsVariable(data.saveAsVariable as boolean)
      if ('variableName' in data && data.variableName)
        setVariableName(data.variableName as string)
      if ('detectedFunctions' in data && data.detectedFunctions)
        setDetectedFunctions(data.detectedFunctions as string[])
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

  const handleApiTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedApiType = e.target.value as 'chatgpt' | 'openmeteo' | ''
    setApiType(selectedApiType)

    // Update node data in the flow
    setNodes(nds =>
      nds.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, apiType: selectedApiType }
          }
        }
        return node
      })
    )

    setIsLoadingFunctions(true)

    // Set predefined functions and URL based on the selected API type
    let functions: string[] = []
    let apiUrl = ''
    let defaultPayload = '{\n  "key": "value"\n}'
    let suggestedResponsePath = ''

    if (selectedApiType === 'chatgpt') {
      // Use more user-friendly function names
      functions = [
        'Generate Text',
        'Generate Image',
        'Text Completion',
        'Create Embeddings',
        'Transcribe Audio',
        'List Models'
      ]
      apiUrl = 'https://api.openai.com/v1/'
      defaultPayload =
        '{\n  "model": "gpt-3.5-turbo",\n  "messages": [\n    {\n      "role": "user",\n      "content": "Tell me about the weather today"\n    }\n  ]\n}'
      suggestedResponsePath = 'choices.0.message.content'
    } else if (selectedApiType === 'openmeteo') {
      functions = [
        'Current Weather',
        'Weather Forecast',
        'Air Quality',
        'Marine Forecast',
        'Historical Data',
        'Climate Data',
        'Ensemble Prediction'
      ]
      apiUrl = 'https://api.open-meteo.com/v1/'
      defaultPayload =
        '{\n  "latitude": 52.52,\n  "longitude": 13.41,\n  "current_weather": true,\n  "timezone": "auto"\n}'
      suggestedResponsePath = 'current_weather'
    }

    // Update payload with a helpful default example
    setPayloadStr(defaultPayload)
    setNodes(nds =>
      nds.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, payload: defaultPayload }
          }
        }
        return node
      })
    )

    // Update response path with a suggested value
    setResponsePath(suggestedResponsePath)
    setNodes(nds =>
      nds.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, responsePath: suggestedResponsePath }
          }
        }
        return node
      })
    )

    // Update URL
    setUrl(apiUrl)
    setNodes(nds =>
      nds.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, url: apiUrl }
          }
        }
        return node
      })
    )

    // Update functions
    setDetectedFunctions(functions)
    setIsLoadingFunctions(false)

    setNodes(nds =>
      nds.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, detectedFunctions: functions }
          }
        }
        return node
      })
    )

    // Reset selected function when API type changes
    setSelectedFunction('')
    setNodes(nds =>
      nds.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, selectedFunction: '' }
          }
        }
        return node
      })
    )
  }

  const handleFunctionSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value
    setSelectedFunction(newValue)

    // Update node data in the flow
    setNodes(nds =>
      nds.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, selectedFunction: newValue }
          }
        }
        return node
      })
    )

    // Update URL based on the selected function
    if (newValue && url) {
      let updatedUrl = url
      let functionSpecificPayload = payloadStr
      let apiEndpoint = ''

      // Map friendly names to actual API endpoints
      if (apiType === 'chatgpt') {
        // Extract base URL up to v1/
        const baseUrlMatch = updatedUrl.match(/(.*?v1\/)(.*)/)
        if (baseUrlMatch) {
          updatedUrl = baseUrlMatch[1]
        }

        // Set API endpoint and payload based on friendly function name
        switch (newValue) {
          case 'Generate Text':
            apiEndpoint = 'chat/completions'
            functionSpecificPayload =
              '{\n  "model": "gpt-4o",\n  "messages": [\n    {\n      "role": "user",\n      "content": "Tell me about the weather today"\n    }\n  ]\n}'
            break
          case 'Generate Image':
            apiEndpoint = 'images/generations'
            functionSpecificPayload =
              '{\n  "prompt": "A beautiful mountain landscape at sunset",\n  "n": 1,\n  "size": "1024x1024"\n}'
            break
          case 'Text Completion':
            apiEndpoint = 'completions'
            functionSpecificPayload =
              '{\n  "model": "gpt-3.5-turbo-instruct",\n  "prompt": "Write a short poem about rain",\n  "max_tokens": 150\n}'
            break
          case 'Create Embeddings':
            apiEndpoint = 'embeddings'
            functionSpecificPayload =
              '{\n  "model": "text-embedding-3-small",\n  "input": "The food was delicious and the service was excellent."\n}'
            break
          case 'Transcribe Audio':
            apiEndpoint = 'audio/transcriptions'
            functionSpecificPayload =
              '{\n  "model": "whisper-1",\n  "file": "<file data would be here>",\n  "language": "en"\n}'
            break
          case 'List Models':
            apiEndpoint = 'models'
            functionSpecificPayload = '{}'
            break
          default:
            apiEndpoint = 'chat/completions'
            break
        }

        // Update the URL with the actual API endpoint
        updatedUrl += apiEndpoint
      } else if (apiType === 'openmeteo') {
        // Extract base URL up to v1/
        const baseUrlMatch = updatedUrl.match(/(.*?v1\/)(.*)/)
        if (baseUrlMatch) {
          updatedUrl = baseUrlMatch[1]
        }

        // Set API endpoint and payload based on friendly function name
        switch (newValue) {
          case 'Current Weather':
            apiEndpoint = 'forecast'
            functionSpecificPayload =
              '{\n  "location": "New York",\n  "current_weather": true,\n  "timezone": "auto"\n}'
            break
          case 'Weather Forecast':
            apiEndpoint = 'forecast'
            functionSpecificPayload =
              '{\n  "location": "London",\n  "daily": "temperature_2m_max,temperature_2m_min,weathercode",\n  "timezone": "auto"\n}'
            break
          case 'Air Quality':
            apiEndpoint = 'air-quality'
            functionSpecificPayload =
              '{\n  "location": "Beijing",\n  "hourly": "pm10,pm2_5,carbon_monoxide",\n  "timezone": "auto"\n}'
            break
          case 'Marine Forecast':
            apiEndpoint = 'marine'
            functionSpecificPayload =
              '{\n  "location": "Miami",\n  "hourly": "wave_height,wave_direction",\n  "timezone": "auto"\n}'
            break
          case 'Historical Data':
            apiEndpoint = 'archive'
            functionSpecificPayload =
              '{\n  "location": "Paris",\n  "start_date": "2023-01-01",\n  "end_date": "2023-01-31",\n  "daily": "temperature_2m_max",\n  "timezone": "auto"\n}'
            break
          case 'Climate Data':
            apiEndpoint = 'climate'
            functionSpecificPayload =
              '{\n  "location": "Berlin",\n  "monthly": true,\n  "daily": "temperature_2m_mean"\n}'
            break
          case 'Ensemble Prediction':
            apiEndpoint = 'ensemble'
            functionSpecificPayload =
              '{\n  "location": "Tokyo",\n  "hourly": "temperature_2m",\n  "timezone": "auto"\n}'
            break
          default:
            apiEndpoint = 'forecast'
            break
        }

        // Update the URL with the actual API endpoint
        updatedUrl += apiEndpoint
      }

      // Update URL
      setUrl(updatedUrl)
      setNodes(nds =>
        nds.map(node => {
          if (node.id === id) {
            return {
              ...node,
              data: { ...node.data, url: updatedUrl }
            }
          }
          return node
        })
      )

      // Update payload with function-specific example
      setPayloadStr(functionSpecificPayload)
      setNodes(nds =>
        nds.map(node => {
          if (node.id === id) {
            return {
              ...node,
              data: {
                ...node.data,
                payload: functionSpecificPayload,
                // Also update the API endpoint in the node data
                apiEndpoint: apiEndpoint
              }
            }
          }
          return node
        })
      )
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
          Select API:
        </label>
        <select
          value={apiType}
          onChange={handleApiTypeChange}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            boxSizing: 'border-box',
            backgroundColor: 'white'
          }}
        >
          <option value=''>-- Select an API --</option>
          <option value='chatgpt'>OpenAI / ChatGPT</option>
          <option value='openmeteo'>Open-Meteo Weather</option>
        </select>
      </div>

      {isLoadingFunctions && (
        <div
          style={{ marginBottom: '10px', textAlign: 'center', color: '#666' }}
        >
          Loading API functions...
        </div>
      )}

      {!isLoadingFunctions && detectedFunctions.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <label
            style={{
              display: 'block',
              fontWeight: 'bold',
              marginBottom: '5px'
            }}
          >
            {apiType === 'chatgpt'
              ? 'What would you like to do?'
              : 'What weather data do you need?'}
          </label>
          <select
            value={selectedFunction}
            onChange={handleFunctionSelect}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              boxSizing: 'border-box',
              backgroundColor: 'white'
            }}
          >
            <option value=''>-- Select an option --</option>
            {detectedFunctions.map(func => (
              <option key={func} value={func}>
                {func}
              </option>
            ))}
          </select>
        </div>
      )}

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

      {apiType === 'chatgpt' && (
        <div style={{ marginBottom: '10px' }}>
          <label
            style={{
              display: 'block',
              fontWeight: 'bold',
              marginBottom: '5px'
            }}
          >
            API Key Status:
          </label>
          <div
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              backgroundColor: OPENAI_API_KEY ? '#e6f7e6' : '#f7e6e6',
              color: OPENAI_API_KEY ? '#2e7d32' : '#c62828'
            }}
          >
            {OPENAI_API_KEY
              ? `✅ API key found (${
                  OPENAI_API_KEY.startsWith('sk-proj-')
                    ? 'project-based key'
                    : 'standard key'
                })`
              : '❌ API key not found. Set VITE_OPENAI_API_KEY in your .env file'}
          </div>
        </div>
      )}

      <div style={{ marginBottom: '10px' }}>
        <label
          style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}
        >
          {apiType === 'openmeteo'
            ? 'Location and parameters:'
            : apiType === 'chatgpt' &&
              (selectedFunction === 'Generate Text' ||
                selectedFunction === 'Text Completion')
            ? 'Enter your prompt:'
            : apiType === 'chatgpt' && selectedFunction === 'Generate Image'
            ? 'Image description:'
            : 'Parameters:'}
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
          placeholder={
            apiType === 'openmeteo'
              ? '{"location": "New York", "current_weather": true}'
              : '{"key": "value", "parameterName": "{variableName}"}'
          }
        />
        {payloadError && (
          <div style={{ color: 'red', fontSize: '11px', marginTop: '5px' }}>
            {payloadError}
          </div>
        )}
        <div style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
          {apiType === 'openmeteo' ? (
            <>
              For weather data, simply enter a location name (e.g., "New York",
              "London") instead of latitude/longitude
            </>
          ) : (
            <>
              Tip: Use ${'{variableName}'} to insert variables from other nodes
            </>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label
          style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}
        >
          Response Path (optional):
        </label>
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
          placeholder={
            apiType === 'chatgpt'
              ? 'e.g. choices.0.message.content'
              : apiType === 'openmeteo'
              ? 'e.g. current_weather, daily.temperature_2m_max'
              : 'e.g. data.results'
          }
        />
        <div style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
          {apiType === 'chatgpt' ? (
            <>
              Extract specific OpenAI data like{' '}
              <code>choices.0.message.content</code>
            </>
          ) : apiType === 'openmeteo' ? (
            <>
              Extract specific weather data like <code>current_weather</code> or{' '}
              <code>hourly.temperature_2m</code>
            </>
          ) : (
            <>Dot notation path to extract specific data from the response</>
          )}
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
