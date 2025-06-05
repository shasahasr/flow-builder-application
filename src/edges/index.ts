import type { Edge, EdgeTypes } from '@xyflow/react';

export const initialEdges: Edge[] = [
  {
    id: 'city-to-weather',
    source: 'city-input',
    target: 'weather-display',
    animated: true,
  },
  {
    id: 'weather-to-activity',
    source: 'weather-display',
    target: 'activity-suggestion',
    animated: true,
  },
];

export const edgeTypes = {
  // Add your custom edge types here!
} satisfies EdgeTypes;
