import type { Node } from "@xyflow/react";
import type { DisplayMessageNodeData } from "./elements/DisplayMessageNode";
import type { ApiCallNodeData } from "./elements/ApiCallNode";
import type { ConditionNodeData } from "./elements/ConditionNode";
import type { InputParameterNodeData } from "./elements/InputParameterNode";

// Define LLM node data type
export type LLMNodeData = {
  label?: string;
  ai?: string;
  apiKey?: string;
  model?: string;
  query?: string;
};

export type PositionLoggerNode = Node<{ label?: string }, "position-logger">;

// Define new AI workflow node types
export type DisplayMessageNodeType = Node<
  DisplayMessageNodeData,
  "display_message"
>;
export type InputParameterNodeType = Node<
  InputParameterNodeData,
  "input_parameter"
>;
export type ApiCallNodeType = Node<ApiCallNodeData, "api_call">;
export type ConditionNodeType = Node<ConditionNodeData, "condition">;
export type LLMNodeType = Node<LLMNodeData, "llm_node">;

// Update AppNode to include the more specific node types
export type AppNode =
  | PositionLoggerNode
  | DisplayMessageNodeType
  | InputParameterNodeType
  | ApiCallNodeType
  | ConditionNodeType
  | LLMNodeType
  | Node<{ label?: string | undefined; [key: string]: unknown }, "default">
  | Node<{ label?: string | undefined; [key: string]: unknown }, "output">
  | Node<{ label?: string | undefined; [key: string]: unknown }, "group">;
