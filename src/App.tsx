import { useCallback, useEffect, useRef, useState } from 'react'
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
import { FaRobot } from 'react-icons/fa'; // Import robot icon
import { Resizable } from 're-resizable';
import { UserButton } from '@clerk/clerk-react'

import '@xyflow/react/dist/style.css'

import { initialNodes, nodeTypes } from './nodes'
import { initialEdges, edgeTypes } from './edges'
import type { AppNode, CityInputNodeData } from './nodes/types'
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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false); // Set initial state to false to keep AI Agent Preview closed on startup

  const togglePreview = () => {
    setIsPreviewOpen(!isPreviewOpen)
  }

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
                ...(n.data as CityInputNodeData),
                value: newValue
              }
            } as AppNode
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
            } as AppNode
          }
          return n
        }) as AppNode[]
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
          const sourceData = sourceNode.data as CityInputNodeData
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
        } satisfies Omit<CityInputNodeData, 'onValueChange'>
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
      } else if (type === 'llm_node') {
        newNodeData = {
          label: 'LLM Node'
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
        
        {/* Floating User Button */}
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            zIndex: 1000,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '50px',
            padding: '8px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "width: 40px; height: 40px;",
                userButtonPopoverCard: "backdrop-filter: blur(10px); background: rgba(255, 255, 255, 0.95);"
              }
            }}
          />
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flexGrow: 1, flexDirection: 'row', background: '#ffffff', minHeight: 0 }}>
          {/* Left side - Flow Builder */}
          <div
            style={{
              width: isPreviewOpen ? '60%' : '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'row',
              background: '#fafafa',
              minWidth: 0, // Allow shrinking
              transition: 'width 0.3s ease', // Smooth transition when toggling
              flex: isPreviewOpen ? '1 1 60%' : '1 1 100%' // Use flex for better responsiveness
            }}
          >
            <Sidebar />
            <div
              style={{
                flexGrow: 1,
                height: '100%',
                position: 'relative',
                background: '#f5f5f5'
              }}
              ref={reactFlowWrapper}
            >
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
          
          {/* Right side - Chatbot Output */}
          {isPreviewOpen && (
            <Resizable
              defaultSize={{ width: '25%', height: '100%' }}
              minWidth={320} // Increased minimum width for better usability
              maxWidth="70%" // Allow more flexibility
              enable={{ left: true }} // Allow resizing from the left side
              style={{
                borderLeft: '1px solid #ddd',
                display: 'flex',
                flexDirection: 'column',
                background: '#ffffff',
                overflow: 'hidden', // Prevent overflow issues
                position: 'relative' // Ensure proper positioning
              }}
              handleStyles={{
                left: {
                  width: '6px',
                  background: 'transparent',
                  cursor: 'col-resize'
                }
              }}
            >
              <WorkflowOutput onClose={togglePreview} />
            </Resizable>
          )}
        </div>

        {/* Button to reopen AI Agent Preview */}
        {!isPreviewOpen && (
          <button
            onClick={togglePreview}
            style={{
              position: 'absolute',
              bottom: '20px',
              right: '220px', // Move further away from the minimap
              padding: '10px',
              background: '#1a73e8',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              zIndex: 10 // Ensure it doesn't overlap with the minimap
            }}
          >
            <FaRobot /> {/* Robot icon */}
          </button>
        )}
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
