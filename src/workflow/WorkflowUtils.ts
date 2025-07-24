import { Edge } from "@xyflow/react";
import { AppNode } from "../nodes/types";

/**
 * Utility class for working with workflow variables and expressions
 */
export class WorkflowUtils {
  /**
   * Evaluates a variable reference expression
   * Format: ${nodeId.paramName}
   */
  static evaluateExpression(
    expression: string,
    context: Record<string, any>,
  ): string {
    // Simple reference pattern: ${nodeId.paramName}
    const refPattern = /\${([^}]+)}/g;

    return expression.replace(refPattern, (match, path) => {
      try {
        // Check if the path is directly in the context
        if (context[path] !== undefined) {
          const value = context[path];
          return this.formatValue(value);
        }

        // Otherwise, handle nested paths
        const pathParts = path.split(".");
        let value = context;

        for (const part of pathParts) {
          if (value === undefined || value === null) return match;
          value = value[part];
        }

        return this.formatValue(value);
      } catch (e) {
        console.error("Error evaluating expression:", e);
        return match;
      }
    });
  }

  /**
   * Format a value for display in a string
   */
  static formatValue(value: any): string {
    if (value === undefined || value === null) {
      return "";
    }

    if (typeof value === "string") {
      return value;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return value.toString();
    }

    if (typeof value === "object") {
      try {
        return JSON.stringify(value, null, 2);
      } catch (e) {
        console.error("Error stringifying object:", e);
        return "[Object]";
      }
    }

    return String(value);
  }

  /**
   * Builds a context object from workflow nodes and their data
   */
  static buildWorkflowContext(nodes: AppNode[]): Record<string, any> {
    const context: Record<string, any> = {};

    nodes.forEach((node) => {
      if (node.id && node.data) {
        context[node.id] = { ...node.data };
      }
    });

    return context;
  }

  /**
   * Gets an ordered execution sequence for nodes based on connections
   */
  static getExecutionSequence(nodes: AppNode[], edges: Edge[]): string[] {
    const adjacencyList: Record<string, string[]> = {};
    const inDegree: Record<string, number> = {};
    const nodeIds = nodes.map((node) => node.id);

    // Initialize
    nodeIds.forEach((id) => {
      adjacencyList[id] = [];
      inDegree[id] = 0;
    });

    // Build adjacency list and calculate in-degrees
    edges.forEach((edge) => {
      const { source, target, sourceHandle } = edge;

      // Skip condition false edges in the execution sequence
      // They will be handled separately during execution
      if (sourceHandle === "false") return;

      if (adjacencyList[source]) {
        adjacencyList[source].push(target);
      }

      inDegree[target] = (inDegree[target] || 0) + 1;
    });

    // Nodes with no incoming edges (start nodes)
    const queue = nodeIds.filter((id) => inDegree[id] === 0);
    const result: string[] = [];

    // Topological sort
    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      for (const neighbor of adjacencyList[current]) {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) {
          queue.push(neighbor);
        }
      }
    }

    return result;
  }

  /**
   * Gets all variables that exist in a workflow
   */
  static getExistingVariables(nodes: AppNode[]): string[] {
    const variables = new Set<string>();

    nodes.forEach(node => {
      // Input Parameter nodes with saveAsVariable enabled
      if (node.type === 'input_parameter' && node.data?.saveAsVariable) {
        const variableName = (node.data?.variableName as string) || (node.data?.paramName as string);
        if (variableName) variables.add(variableName);
      }

      // API Call nodes with saveAsVariable enabled
      if (node.type === 'api_call' && node.data?.saveAsVariable) {
        const variableName = (node.data?.variableName as string);
        if (variableName) variables.add(variableName);
      }

      // Display Message nodes (their name becomes a variable)
      if (node.type === 'display_message') {
        const variableName = (node.data?.name as string);
        if (variableName) variables.add(variableName);
      }

      // Sub-workflow nodes that have imported variables
      if (node.type === 'workflow_node' && node.data?.selectedVariables) {
        const selectedVars = node.data.selectedVariables as Record<string, string>;
        Object.values(selectedVars).forEach(varName => {
          if (varName) variables.add(varName);
        });
      }
    });

    return Array.from(variables);
  }

  /**
   * Gets variables that would exist before a specific node executes
   * Takes into account the execution order based on edges
   */
  static getVariablesBeforeNode(
    nodes: AppNode[], 
    edges: Edge[], 
    targetNodeId: string
  ): string[] {
    const variables = new Set<string>();
    
    // Find all nodes that would execute before the target node
    const nodesBefore = this.getNodesExecutedBefore(nodes, edges, targetNodeId);
    
    console.log(`🔍 For node ${targetNodeId}, found ${nodesBefore.length} nodes before:`, nodesBefore.map(n => `${n.id}(${n.type})`));
    
    nodesBefore.forEach(node => {
      // Input Parameter nodes with saveAsVariable enabled
      if (node.type === 'input_parameter' && node.data?.saveAsVariable) {
        const variableName = (node.data?.variableName as string) || (node.data?.paramName as string);
        if (variableName) {
          variables.add(variableName);
          console.log(`🔍 Found input_parameter variable: ${variableName} from node ${node.id}`);
        }
      }

      // API Call nodes with saveAsVariable enabled
      if (node.type === 'api_call' && node.data?.saveAsVariable) {
        const variableName = (node.data?.variableName as string);
        if (variableName) {
          variables.add(variableName);
          console.log(`🔍 Found api_call variable: ${variableName} from node ${node.id}`);
        }
      }

      // Display Message nodes (their name becomes a variable)
      if (node.type === 'display_message') {
        const variableName = (node.data?.name as string);
        if (variableName) {
          variables.add(variableName);
          console.log(`🔍 Found display_message variable: ${variableName} from node ${node.id}`);
        }
      }

      // Sub-workflow nodes that have imported variables
      if (node.type === 'workflow_node' && node.data?.selectedVariables) {
        const selectedVars = node.data.selectedVariables as Record<string, string>;
        Object.values(selectedVars).forEach(varName => {
          if (varName) {
            variables.add(varName);
            console.log(`🔍 Found workflow_node variable: ${varName} from node ${node.id}`);
          }
        });
      }
    });

    console.log(`🔍 Final variables before node ${targetNodeId}:`, Array.from(variables));
    return Array.from(variables);
  }

  /**
   * Gets all nodes that would execute before a target node
   * Uses a simple topological approach based on edges
   */
  private static getNodesExecutedBefore(
    nodes: AppNode[], 
    edges: Edge[], 
    targetNodeId: string
  ): AppNode[] {
    const nodesBefore: AppNode[] = [];
    const visited = new Set<string>();
    const nodeMap = new Map(nodes.map(node => [node.id, node]));

    // Recursive function to traverse backwards from target node
    const traverseBackwards = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      // Find all edges that lead TO this node (incoming edges)
      const incomingEdges = edges.filter(edge => edge.target === nodeId);
      
      incomingEdges.forEach(edge => {
        const sourceNode = nodeMap.get(edge.source);
        if (sourceNode) {
          // Add this source node to our list if not already added
          if (!nodesBefore.find(n => n.id === sourceNode.id)) {
            nodesBefore.push(sourceNode);
          }
          // Continue traversing backwards from this source node
          traverseBackwards(edge.source);
        }
      });
    };

    traverseBackwards(targetNodeId);
    return nodesBefore;
  }
}
