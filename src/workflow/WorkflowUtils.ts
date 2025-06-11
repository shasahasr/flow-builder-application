import { Edge, Node } from '@xyflow/react'
import { AppNode } from '../nodes/types'

/**
 * Utility class for working with workflow variables and expressions
 */
export class WorkflowUtils {
  /**
   * Evaluates a variable reference expression
   * Format: ${nodeId.paramName}
   */
  static evaluateExpression (
    expression: string,
    context: Record<string, any>
  ): any {
    // Simple reference pattern: ${nodeId.paramName}
    const refPattern = /\${([^}]+)}/g

    return expression.replace(refPattern, (match, path) => {
      try {
        const pathParts = path.split('.')
        let value = context

        for (const part of pathParts) {
          if (value === undefined || value === null) return match
          value = value[part]
        }

        return typeof value === 'string' ? value : JSON.stringify(value)
      } catch (e) {
        console.error('Error evaluating expression:', e)
        return match
      }
    })
  }

  /**
   * Builds a context object from workflow nodes and their data
   */
  static buildWorkflowContext (nodes: AppNode[]): Record<string, any> {
    const context: Record<string, any> = {}

    nodes.forEach(node => {
      if (node.id && node.data) {
        context[node.id] = { ...node.data }
      }
    })

    return context
  }

  /**
   * Gets an ordered execution sequence for nodes based on connections
   */
  static getExecutionSequence (nodes: AppNode[], edges: Edge[]): string[] {
    const adjacencyList: Record<string, string[]> = {}
    const inDegree: Record<string, number> = {}
    const nodeIds = nodes.map(node => node.id)

    // Initialize
    nodeIds.forEach(id => {
      adjacencyList[id] = []
      inDegree[id] = 0
    })

    // Build adjacency list and calculate in-degrees
    edges.forEach(edge => {
      const { source, target, sourceHandle } = edge

      // Skip condition false edges in the execution sequence
      // They will be handled separately during execution
      if (sourceHandle === 'false') return

      if (adjacencyList[source]) {
        adjacencyList[source].push(target)
      }

      inDegree[target] = (inDegree[target] || 0) + 1
    })

    // Nodes with no incoming edges (start nodes)
    const queue = nodeIds.filter(id => inDegree[id] === 0)
    const result: string[] = []

    // Topological sort
    while (queue.length > 0) {
      const current = queue.shift()!
      result.push(current)

      for (const neighbor of adjacencyList[current]) {
        inDegree[neighbor]--
        if (inDegree[neighbor] === 0) {
          queue.push(neighbor)
        }
      }
    }

    return result
  }
}
