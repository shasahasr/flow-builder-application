import type { Node } from '@xyflow/react'
import type { WeatherDisplayNodeData } from './WeatherDisplayNode'
import type { ActivitySuggestionNodeData } from './ActivitySuggestionNode'
import type { DisplayMessageNodeData } from './DisplayMessageNode'
import type { InputParameterNodeData } from './InputParameterNode'
import type { ApiCallNodeData } from './ApiCallNode'
import type { ConditionNodeData } from './ConditionNode'

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

// Define new AI workflow node types
export type DisplayMessageNodeType = Node<
  DisplayMessageNodeData,
  'display_message'
>
export type InputParameterNodeType = Node<
  InputParameterNodeData,
  'input_parameter'
>
export type ApiCallNodeType = Node<ApiCallNodeData, 'api_call'>
export type ConditionNodeType = Node<ConditionNodeData, 'condition'>

// Update AppNode to include the more specific CityInputNode and other node types
export type AppNode =
  | CityInputNode
  | PositionLoggerNode
  | WeatherDisplayNodeType
  | ActivitySuggestionNodeType
  | DisplayMessageNodeType
  | InputParameterNodeType
  | ApiCallNodeType
  | ConditionNodeType
  | Node<{ label?: string | undefined; [key: string]: unknown }, 'default'>
  | Node<{ label?: string | undefined; [key: string]: unknown }, 'output'>
  | Node<{ label?: string | undefined; [key: string]: unknown }, 'group'>
