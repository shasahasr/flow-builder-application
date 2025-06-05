import type { NodeTypes } from '@xyflow/react';

// import { PositionLoggerNode } from './PositionLoggerNode'; // Comment out or remove if not used
import type { AppNode } from './types'; // Ensure AppNode is correctly defined in types.ts
import CityInputNode from './CityInputNode';
import WeatherDisplayNode from './WeatherDisplayNode';
import ActivitySuggestionNode from './ActivitySuggestionNode';

export const initialNodes: AppNode[] = [
  {
    id: 'city-input',
    type: 'input', // This type must be a key in nodeTypes
    position: { x: 0, y: 0 },
    data: { label: 'Enter City' },
    style: { width: 305 },
  },
  {
    id: 'weather-display',
    type: 'weatherDisplay', // This type must be a key in nodeTypes
    position: { x: 0, y: 150 },
    data: { label: 'Weather Information' },
  },
  {
    id: 'activity-suggestion',
    type: 'activitySuggestion', // This type must be a key in nodeTypes
    position: { x: 0, y: 370 }, // Adjusted y for spacing
    data: { label: 'Activity & Outfit Suggestions' },
  },
];

export const nodeTypes = {
  // 'position-logger': PositionLoggerNode, // Comment out or remove if not used
  input: CityInputNode, // Ensure key matches type string in initialNodes and AppNode
  weatherDisplay: WeatherDisplayNode, // Ensure key matches type string
  activitySuggestion: ActivitySuggestionNode, // Ensure key matches type string
  // Add any of your custom nodes here!
} satisfies NodeTypes;
