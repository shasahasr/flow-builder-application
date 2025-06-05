import { useCallback, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type OnConnect
} from '@xyflow/react'

import '@xyflow/react/dist/style.css'

import { initialNodes, nodeTypes } from './nodes'
import { initialEdges, edgeTypes } from './edges'
import type { CityInputNodeSpecificData } from './nodes/CityInputNode'
import type { AppNode } from './nodes/types'
import type {
  WeatherDisplayNodeSpecificData,
  WeatherDisplayNodeData
} from './nodes/WeatherDisplayNode'
import type { ActivitySuggestionNodeData } from './nodes/ActivitySuggestionNode'

export default function App () {
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onCityChange = useCallback(
    (nodeId: string, newValue: string) => {
      setNodes(currentNodes => {
        return currentNodes.map(n => {
          // Update the source input node
          if (n.id === nodeId) {
            return {
              ...n,
              data: {
                ...(n.data as CityInputNodeSpecificData),
                value: newValue
              }
            }
          }
          // Update the weather display node with the new city name
          if (n.id === 'weather-display' && n.type === 'weatherDisplay') {
            return {
              ...n,
              data: {
                ...(n.data as WeatherDisplayNodeData),
                cityName: newValue,
                temperature: undefined,
                humidity: undefined,
                windSpeed: undefined,
                isLoading: true,
                error: null
              }
            }
          }
          return n
        })
      })
    },
    [setNodes]
  )

  const handleWeatherDataChange = useCallback(
    (
      nodeId: string, // This is the ID of the WeatherDisplayNode
      weatherDataPayload: Partial<WeatherDisplayNodeSpecificData>
    ) => {
      setNodes(currentNodes => {
        return currentNodes.map(n => {
          // Update the WeatherDisplayNode itself
          if (n.id === nodeId) {
            return {
              ...n,
              data: {
                ...(n.data as WeatherDisplayNodeData),
                ...weatherDataPayload
              }
            }
          }
          // Update the activity suggestion node with weather data
          if (
            n.id === 'activity-suggestion' &&
            n.type === 'activitySuggestion'
          ) {
            // Get the weather data from the current weather node
            const weatherNode = currentNodes.find(
              cn => cn.id === 'weather-display'
            )
            const cityName = (weatherNode?.data as WeatherDisplayNodeData)
              ?.cityName
            const temperature =
              weatherDataPayload.temperature !== undefined
                ? weatherDataPayload.temperature
                : (weatherNode?.data as WeatherDisplayNodeData)?.temperature

            return {
              ...n,
              data: {
                ...(n.data as ActivitySuggestionNodeData),
                cityName: cityName,
                temperature: temperature,
                suggestion: '',
                isLoading: true,
                error: null
              }
            }
          }
          return n
        })
      })
    },
    [setNodes]
  )

  useEffect(() => {
    setNodes(prevNodes => {
      let changed = false
      const newNodes = prevNodes.map(node => {
        if (node.type === 'input') {
          const currentData = node.data as CityInputNodeSpecificData
          if (!currentData.onValueChange) {
            changed = true
            return {
              ...node,
              data: {
                ...node.data,
                onValueChange: (value: string) => onCityChange(node.id, value)
              }
            }
          }
        }
        if (node.type === 'weatherDisplay') {
          const currentData = node.data as WeatherDisplayNodeData
          if (!currentData.onWeatherDataChange) {
            changed = true
            return {
              ...node,
              data: {
                ...currentData,
                onWeatherDataChange: (
                  nodeIdFromCallback: string,
                  payload: Partial<
                    Omit<
                      WeatherDisplayNodeSpecificData,
                      'label' | 'cityName' | 'onWeatherDataChange'
                    >
                  >
                ) => handleWeatherDataChange(nodeIdFromCallback, payload)
              }
            }
          }
        }
        return node
      })
      return changed ? newNodes : prevNodes
    })
  }, [setNodes, onCityChange, handleWeatherDataChange])

  const onConnect: OnConnect = useCallback(
    connection => setEdges(eds => addEdge(connection, eds)),
    [setEdges]
  )

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <ReactFlow
        nodes={nodes}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        edges={edges}
        edgeTypes={edgeTypes}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background />
        <MiniMap />
        <Controls />
      </ReactFlow>
    </div>
  )
}
