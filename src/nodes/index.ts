import type { NodeTypes } from '@xyflow/react';

import type { AppNode } from './types';

// Import new AI agent workflow nodes
import DisplayMessageNode from './elements/DisplayMessageNode';
import InputParameterNode from './elements/InputParameterNode';
import ApiCallNode from './elements/ApiCallNode';
import ConditionNode from './elements/ConditionNode';
import LLMNode from './elements/LLMNode';

export const initialNodes: AppNode[] = [
  // Initial nodes for the workflow
];

export const nodeTypes = {
  // Original node types (commented out but kept for reference)
  
  // New node types for AI agent workflow
  display_message: DisplayMessageNode,
  input_parameter: InputParameterNode,
  api_call: ApiCallNode,
  condition: ConditionNode,
  llm_node: LLMNode,
} satisfies NodeTypes;
