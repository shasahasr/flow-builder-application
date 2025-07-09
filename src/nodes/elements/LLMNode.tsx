import React, { useState, useEffect } from 'react'
import { Handle, Position, type NodeProps, useReactFlow } from '@xyflow/react'
import { nodeStyles, getNodeContainerStyle } from '../nodeStyles'

const LLMNode = ({ data, isConnectable, id }: NodeProps) => {
  const [apiKey, setApiKey] = useState<string>(
    typeof data.apiKey === 'string' ? data.apiKey : ''
  )
  const [model, setModel] = useState<string>(
    typeof data.model === 'string' ? data.model : ''
  )
  const [query, setQuery] = useState<string>(
    typeof data.query === 'string' ? data.query : ''
  )
  const [ai, setAi] = useState<string>(
    typeof data.ai === 'string' ? data.ai : 'chatgpt'
  )

  const { setNodes } = useReactFlow()

  // Initialize state from data when component mounts or data changes
  useEffect(() => {
    if (data && typeof data === 'object') {
      if ('ai' in data && data.ai) setAi(data.ai as string)
      if ('apiKey' in data && data.apiKey) setApiKey(data.apiKey as string)
      if ('model' in data && data.model) setModel(data.model as string)
      if ('query' in data && data.query) setQuery(data.query as string)
    }
  }, [data])

  const updateNodeData = (key: string, value: string) => {
    setNodes(nds =>
      nds.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, [key]: value }
          }
        }
        return node
      })
    )
  }

  const modelOptions = ['gpt-3.5-turbo', 'gpt-4', 'text-davinci-003', 'gpt-4o']

  return (
    <div style={getNodeContainerStyle('api')}>
      <Handle
        type='target'
        position={Position.Top}
        style={{
          ...nodeStyles.handle,
          ...nodeStyles.handleInput,
          pointerEvents: 'auto' as const
        }}
        isConnectable={isConnectable}
      />

      <div style={nodeStyles.fieldGroup}>
        <label style={nodeStyles.label}>LLM Node</label>
      </div>

      <div style={nodeStyles.fieldGroup}>
        <label style={nodeStyles.label}>
          AI:
          <select
            value={ai}
            onChange={e => {
              setAi(e.target.value)
              updateNodeData('ai', e.target.value)
            }}
            style={nodeStyles.input}
          >
            <option value='chatgpt'>ChatGPT</option>
          </select>
        </label>
      </div>

      <div style={nodeStyles.fieldGroup}>
        <label style={nodeStyles.label}>
          API Key:
          <input
            type='text'
            value={apiKey}
            onChange={e => {
              setApiKey(e.target.value)
              updateNodeData('apiKey', e.target.value)
            }}
            style={nodeStyles.input}
            placeholder='Enter your API key'
          />
        </label>
      </div>

      <div style={nodeStyles.fieldGroup}>
        <label style={nodeStyles.label}>
          Model:
          <select
            value={model}
            onChange={e => {
              setModel(e.target.value)
              updateNodeData('model', e.target.value)
            }}
            style={nodeStyles.input}
          >
            {modelOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={nodeStyles.fieldGroup}>
        <label style={nodeStyles.label}>
          Query:
          <textarea
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              updateNodeData('query', e.target.value)
            }}
            style={nodeStyles.textarea}
            placeholder='What do you want to ask?'
          />
        </label>
      </div>

      <Handle
        type='source'
        position={Position.Bottom}
        style={{
          ...nodeStyles.handle,
          ...nodeStyles.handleOutput,
          pointerEvents: 'auto' as const
        }}
        isConnectable={isConnectable}
      />
    </div>
  )
}

export default LLMNode
