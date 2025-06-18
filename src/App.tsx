import { useCallback, useEffect, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type OnConnect,
  useReactFlow,
  ReactFlowProvider
} from '@xyflow/react'

import '@xyflow/react/dist/style.css'

import { initialNodes, nodeTypes } from './nodes'
import { initialEdges, edgeTypes } from './edges'
import type { CityInputNodeSpecificData } from './nodes/CityInputNode'
import type { AppNode } from './nodes/types'
import UserProfile from './auth/UserProfile'
import type {
  WeatherDisplayNodeSpecificData,
  WeatherDisplayNodeData
} from './nodes/WeatherDisplayNode'
import type { ActivitySuggestionNodeData } from './nodes/ActivitySuggestionNode'
import Sidebar from './Sidebar'
import { WorkflowProvider } from './workflow/WorkflowContext'
import WorkflowControls from './workflow/WorkflowControls'
import WorkflowOutput from './workflow/WorkflowOutput'

let id = 0
const getId = () => `dndnode_${id++}`

export function FlowApp() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const { screenToFlowPosition } = useReactFlow()

  const onCityChange = useCallback(
    (nodeId: string, newValue: string) => {
      setNodes(currentNodes => {
        // Find connected target node IDs - only update nodes that are already connected
        const targetNodeIds = edges
          .filter(edge => edge.source === nodeId)
          .map(edge => edge.target)

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
          // Automatically update connected weather display nodes (only if already connected)
          if (targetNodeIds.includes(n.id) && n.type === 'weatherDisplay') {
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
    [setNodes, edges]
  )

  const handleWeatherDataChange = useCallback(
    (
      nodeId: string, // This is the ID of the WeatherDisplayNode
      weatherDataPayload: Partial<WeatherDisplayNodeSpecificData>
    ) => {
      setNodes(currentNodes => {
        // Find connected target node IDs - only update nodes that are already connected
        const targetNodeIds = edges
          .filter(edge => edge.source === nodeId)
          .map(edge => edge.target)

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
          // Automatically update connected activity suggestion nodes (only if already connected)
          if (targetNodeIds.includes(n.id) && n.type === 'activitySuggestion') {
            // Get the weather data from the current weather node
            const weatherNode = currentNodes.find(cn => cn.id === nodeId)
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
    [setNodes, edges]
  )

  useEffect(() => {
    setNodes(prevNodes => {
      let changed = false
      const newNodes = prevNodes.map(node => {
        if (node.type === 'input') {
          // Always update the callback to ensure it has the latest edges state
          changed = true
          return {
            ...node,
            data: {
              ...node.data,
              onValueChange: (value: string) => onCityChange(node.id, value)
            }
          }
        }
        if (node.type === 'weatherDisplay') {
          const currentData = node.data as WeatherDisplayNodeData
          // Always update the callback to ensure it has the latest edges state
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
        return node
      })
      return changed ? newNodes : prevNodes
    })
  }, [setNodes, onCityChange, handleWeatherDataChange, edges])

  const onConnect: OnConnect = useCallback(
    connection => {
      // First add the edge
      setEdges(eds => addEdge(connection, eds))
      
      // Then immediately propagate data through the new connection
      const sourceNode = nodes.find(node => node.id === connection.source)
      const targetNode = nodes.find(node => node.id === connection.target)

      if (sourceNode && targetNode) {
        // Connect: CityInput -> WeatherDisplay
        if (sourceNode.type === 'input' && targetNode.type === 'weatherDisplay') {
          const sourceData = sourceNode.data as CityInputNodeSpecificData
          setNodes(nds =>
            nds.map(n => {
              if (n.id === targetNode.id) {
                return {
                  ...n,
                  data: {
                    ...(n.data as WeatherDisplayNodeData),
                    cityName: sourceData.value || '',
                    temperature: undefined,
                    humidity: undefined,
                    windSpeed: undefined,
                    isLoading: !!sourceData.value,
                    error: null
                  }
                }
              }
              return n
            })
          )
        }
        // Connect: WeatherDisplay -> ActivitySuggestion
        else if (sourceNode.type === 'weatherDisplay' && targetNode.type === 'activitySuggestion') {
          const sourceData = sourceNode.data as WeatherDisplayNodeData
          setNodes(nds =>
            nds.map(n => {
              if (n.id === targetNode.id) {
                return {
                  ...n,
                  data: {
                    ...(n.data as ActivitySuggestionNodeData),
                    cityName: sourceData.cityName,
                    temperature: sourceData.temperature,
                    suggestion: '',
                    isLoading: !!(sourceData.cityName && typeof sourceData.temperature === 'number'),
                    error: null
                  }
                }
              }
              return n
            })
          )
        }
        
        // For AI agent workflow nodes, just add the connection
        // Data flow will be managed at runtime when executing the workflow
      }
    },
    [setEdges, setNodes, nodes]
  )

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()

      if (!reactFlowWrapper.current) {
        return
      }

      const type = event.dataTransfer.getData('application/reactflow')

      if (typeof type === 'undefined' || !type) {
        return
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY
      })

      let newNodeData: Record<string, unknown> = { label: `${type} node` }
      let nodeStyle: Record<string, unknown> = {}

      // Set up initial data based on node type to match the initial nodes
      if (type === 'input') {
        newNodeData = {
          label: 'Enter City', // Match the initial node label
          value: ''
        } satisfies Omit<CityInputNodeSpecificData, 'onValueChange'>
        nodeStyle = { width: 305 } // Match the initial node width
      } else if (type === 'weatherDisplay') {
        newNodeData = {
          label: 'Weather Information' // Match the initial node label
        } satisfies Omit<WeatherDisplayNodeData, 'onWeatherDataChange' | 'cityName' | 'temperature' | 'humidity' | 'windSpeed' | 'isLoading' | 'error'>
      } else if (type === 'activitySuggestion') {
        newNodeData = {
          label: 'Activity & Outfit Suggestions' // Match the initial node label
        } satisfies Omit<ActivitySuggestionNodeData, 'cityName' | 'temperature' | 'suggestion' | 'isLoading' | 'error'>
      } 
      // New AI agent workflow node types
      else if (type === 'display_message') {
        newNodeData = {
          label: 'Display Message'
        }
      } else if (type === 'input_parameter') {
        newNodeData = {
          label: 'Input Parameter'
        }
      } else if (type === 'api_call') {
        newNodeData = {
          label: 'API Call'
        }
      } else if (type === 'condition') {
        newNodeData = {
          label: 'Condition'
        }
      }

      const newNode: AppNode = {
        id: getId(),
        type,
        position,
        data: newNodeData,
        ...(Object.keys(nodeStyle).length > 0 && { style: nodeStyle }) // Only add style if it exists
      } as AppNode

      setNodes(nds => {
        const newNodes = nds.concat(newNode)
        // Force callback injection for the new node
        return newNodes.map(node => {
          if (node.id === newNode.id) {
            if (node.type === 'input') {
              return {
                ...node,
                data: {
                  ...node.data,
                  onValueChange: (value: string) => onCityChange(node.id, value)
                }
              }
            }
            if (node.type === 'weatherDisplay') {
              return {
                ...node,
                data: {
                  ...node.data,
                  onWeatherDataChange: (nodeIdFromCallback: string, payload: Partial<Omit<WeatherDisplayNodeSpecificData, 'label' | 'cityName' | 'onWeatherDataChange'>>) => handleWeatherDataChange(nodeIdFromCallback, payload)
                }
              }
            }
          }
          return node
        })
      })
    },
    [screenToFlowPosition, setNodes, onCityChange, handleWeatherDataChange]
  )

  return (
    <WorkflowProvider>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh', 
        width: '100vw',
        background: '#f5f5f5' // Add explicit background color to entire app
      }}>
        {/* Header with user profile */}
        <div style={{ 
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '12px 20px',
          borderBottom: '1px solid #e0e0e0',
          background: '#f5f5f5'
        }}>
          <UserProfile />
        </div>
        
        {/* Main content */}
        <div style={{ display: 'flex', flexGrow: 1, flexDirection: 'row', background: '#ffffff' }}>
          {/* Left side - Flow Builder (50% of screen) */}
          <div style={{ width: '50%', height: '100%', display: 'flex', flexDirection: 'row', background: '#fafafa' }}>
            <Sidebar />
            <div style={{ flexGrow: 1, height: '100%', position: 'relative', background: '#f5f5f5' }} ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodes}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              edges={edges}
              edgeTypes={edgeTypes}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onDrop={onDrop}
              onDragOver={onDragOver}
              fitView
            >
              <Background
                color="#aaa"
                gap={16}
                size={1}
              />
              <MiniMap />
              <Controls />
              <WorkflowControls />
            </ReactFlow>
          </div>
        </div>
        
        {/* Right side - Chatbot Output (50% of screen) */}
        <div style={{ 
          width: '50%', 
          height: '100%',
          borderLeft: '1px solid #ddd',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff'
        }}>
          <WorkflowOutput />
        </div>
        </div>
      </div>
    </WorkflowProvider>
  )
}

export default function App() {
  return (
    <ReactFlowProvider>
      <FlowApp />
    </ReactFlowProvider>
  );
}
