import type { NodeTypes } from '@xyflow/react';

// import { PositionLoggerNode } from './PositionLoggerNode'; // Comment out or remove if not used
import type { AppNode } from './types'; // Ensure AppNode is correctly defined in types.ts
import CityInputNode from './CityInputNode';
import WeatherDisplayNode from './WeatherDisplayNode';
import ActivitySuggestionNode from './ActivitySuggestionNode';

export const initialNodes: AppNode[] = [];

export const nodeTypes = {
  // 'position-logger': PositionLoggerNode, // Comment out or remove if not used
  input: CityInputNode, // Ensure key matches type string in initialNodes and AppNode
  weatherDisplay: WeatherDisplayNode, // Ensure key matches type string
  activitySuggestion: ActivitySuggestionNode, // Ensure key matches type string
  // Add any of your custom nodes here!
} satisfies NodeTypes;
