import type { Node } from '@xyflow/react'
import type { WeatherDisplayNodeData } from './WeatherDisplayNode' // Import the specific data type
import type { ActivitySuggestionNodeData } from './ActivitySuggestionNode' // Import the new data type

export type PositionLoggerNode = Node<{ label: string }, 'position-logger'>

// Define a type for the city input node data
export type CityInputNodeData = {
  label: string
  value?: string // Added value to store the input
}

// Define the city input node type, explicitly using 'input' as the type literal
export type CityInputNode = Node<CityInputNodeData, 'input'>

// Define the weather display node type
export type WeatherDisplayNodeType = Node<
  WeatherDisplayNodeData,
  'weatherDisplay'
>

// Define the activity suggestion node type
export type ActivitySuggestionNodeType = Node<
  ActivitySuggestionNodeData,
  'activitySuggestion'
>

// Update AppNode to include the more specific CityInputNode and other node types
export type AppNode =
  | CityInputNode
  | PositionLoggerNode
  | WeatherDisplayNodeType // Add the new node type here
  | ActivitySuggestionNodeType // Add the new activity suggestion node type
  | Node<{ label?: string | undefined; [key: string]: unknown }, 'default'>
  | Node<{ label?: string | undefined; [key: string]: unknown }, 'output'>
  | Node<{ label?: string | undefined; [key: string]: unknown }, 'group'>
