import type { NodeTypes } from '@xyflow/react';

import type { AppNode } from './types';
import CityInputNode from './CityInputNode';
import WeatherDisplayNode from './WeatherDisplayNode';
import ActivitySuggestionNode from './ActivitySuggestionNode';

// Import new AI agent workflow nodes
import DisplayMessageNode from './DisplayMessageNode';
import InputParameterNode from './InputParameterNode';
import ApiCallNode from './ApiCallNode';
import ConditionNode from './ConditionNode';
import YesNoConditionNode from './YesNoConditionNode';

export const initialNodes: AppNode[] = [];

export const nodeTypes = {
  // Original node types (commented out but kept for reference)
  input: CityInputNode,
  weatherDisplay: WeatherDisplayNode,
  activitySuggestion: ActivitySuggestionNode,
  
  // New node types for AI agent workflow
  display_message: DisplayMessageNode,
  input_parameter: InputParameterNode,
  api_call: ApiCallNode,
  condition: ConditionNode,
  yes_no_condition: YesNoConditionNode // New yes/no condition node
} satisfies NodeTypes;
