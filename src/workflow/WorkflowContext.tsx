import React, { createContext, useContext, useState, useCallback } from 'react'
import { Edge } from '@xyflow/react'
import { AppNode } from '../nodes/types'
import { WorkflowUtils } from './WorkflowUtils'

// Define workflow state and context types
type WorkflowContextType = {
  workflowState: Record<string, unknown>
  workflowOutput: string[]
  isExecuting: boolean
  executeWorkflow: (nodes: AppNode[], edges: Edge[]) => Promise<void>
  saveWorkflow: (name: string, nodes: AppNode[], edges: Edge[]) => void
  loadWorkflow: (name: string) => { nodes: AppNode[]; edges: Edge[] } | null
  savedWorkflows: string[]
  clearOutput: () => void
}

// Create the context with default values
const WorkflowContext = createContext<WorkflowContextType>({
  workflowState: {},
  workflowOutput: [],
  isExecuting: false,
  executeWorkflow: async () => {},
  saveWorkflow: () => {},
  loadWorkflow: () => null,
  savedWorkflows: [],
  clearOutput: () => {}
})

// Hook to use workflow context
export const useWorkflow = () => useContext(WorkflowContext)

// Save key for local storage
const SAVED_WORKFLOWS_KEY = 'ai_agent_saved_workflows'

// Provider component
export const WorkflowProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [workflowState, setWorkflowState] = useState<Record<string, unknown>>(
    {}
  )
  const [workflowOutput, setWorkflowOutput] = useState<string[]>([])
  const [isExecuting, setIsExecuting] = useState(false)
  const [savedWorkflows, setSavedWorkflows] = useState<string[]>(() => {
    // Initialize from localStorage if available
    const saved = localStorage.getItem(SAVED_WORKFLOWS_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return Object.keys(parsed)
      } catch (e) {
        return []
      }
    }
    return []
  })

  // Clear output messages
  const clearOutput = useCallback(() => {
    setWorkflowOutput([])
  }, [])

  // Save workflow to localStorage
  const saveWorkflow = useCallback(
    (name: string, nodes: AppNode[], edges: Edge[]) => {
      // Get existing saved workflows
      const existingSaved = localStorage.getItem(SAVED_WORKFLOWS_KEY)
      let savedData: Record<string, { nodes: AppNode[]; edges: Edge[] }> = {}

      if (existingSaved) {
        try {
          savedData = JSON.parse(existingSaved)
        } catch (e) {
          console.error('Error parsing saved workflows', e)
        }
      }

      // Add or update the workflow
      savedData[name] = { nodes, edges }

      // Save back to localStorage
      localStorage.setItem(SAVED_WORKFLOWS_KEY, JSON.stringify(savedData))

      // Update state
      setSavedWorkflows(Object.keys(savedData))
    },
    []
  )

  // Load workflow from localStorage
  const loadWorkflow = useCallback((name: string) => {
    const existingSaved = localStorage.getItem(SAVED_WORKFLOWS_KEY)
    if (!existingSaved) return null

    try {
      const savedData = JSON.parse(existingSaved)
      if (savedData[name]) {
        // Cast the loaded data to the proper types
        const workflow = savedData[name]
        return {
          nodes: workflow.nodes as AppNode[],
          edges: workflow.edges as Edge[]
        }
      }
    } catch (e) {
      console.error('Error loading workflow', e)
    }

    return null
  }, [])

  // Helper function to execute a single node
  const executeNode = useCallback(
    async (
      nodeId: string,
      nodeMap: Record<string, AppNode>,
      nodeOutgoingEdges: Record<string, Edge[]>,
      contextData: Record<string, unknown>
    ): Promise<Record<string, unknown>> => {
      const node = nodeMap[nodeId]
      if (!node) return contextData

      // Update workflow state with context data
      setWorkflowState(prev => ({ ...prev, ...contextData }))

      const nextContextData: Record<string, unknown> = { ...contextData }

      // Execute node based on type
      switch (node.type) {
        case 'display_message': {
          // Get message from node data or state
          const message =
            (node.data?.message as string) || 'No message provided'
          setWorkflowOutput(prev => [...prev, message])
          break
        }

        case 'input_parameter': {
          // In a real app, we would prompt the user for input
          // For now, let's just use a mock value
          const paramName = (node.data?.paramName as string) || 'parameter'
          const mockValue = 'mock_user_input'
          nextContextData[paramName] = mockValue
          setWorkflowOutput(prev => [
            ...prev,
            `Input parameter ${paramName}: ${mockValue}`
          ])
          break
        }

        case 'api_call': {
          try {
            // Mock API call - in a real app, we would make an actual fetch request
            // Access url from the node data if it exists
            let url = 'unspecified endpoint'
            if (
              node.data &&
              typeof node.data === 'object' &&
              'url' in node.data
            ) {
              url = node.data.url as string
            }
            setWorkflowOutput(prev => [...prev, `Making API call to ${url}`])

            // Simulate delay
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Mock response
            const mockApiResponse = {
              success: true,
              data: { result: 'API response data' }
            }
            nextContextData['apiResponse'] = mockApiResponse

            setWorkflowOutput(prev => [
              ...prev,
              `API call succeeded: ${JSON.stringify(mockApiResponse)}`
            ])
          } catch (error) {
            setWorkflowOutput(prev => [...prev, `API call failed: ${error}`])
          }
          break
        }

        case 'condition': {
          // Access condition from the node data if it exists
          let conditionText = 'false'
          if (
            node.data &&
            typeof node.data === 'object' &&
            'condition' in node.data
          ) {
            conditionText = node.data.condition as string
          }
          let conditionResult = false

          try {
            // Evaluate condition - this is a simplified version
            // A real implementation would safely evaluate expressions
            conditionResult = Boolean(
              eval(`
            const context = ${JSON.stringify(contextData)};
            ${conditionText}
          `)
            )
          } catch (e) {
            setWorkflowOutput(prev => [
              ...prev,
              `Error evaluating condition: ${e}`
            ])
            conditionResult = false
          }

          setWorkflowOutput(prev => [
            ...prev,
            `Condition evaluated to: ${conditionResult}`
          ])

          // Only follow edges with matching condition result
          const outgoingEdges = nodeOutgoingEdges[nodeId] || []
          const filteredEdges = outgoingEdges.filter(
            edge =>
              (conditionResult && edge.sourceHandle === 'true') ||
              (!conditionResult && edge.sourceHandle === 'false')
          )

          // Execute all nodes connected to matching condition paths
          for (const edge of filteredEdges) {
            await executeNode(
              edge.target,
              nodeMap,
              nodeOutgoingEdges,
              nextContextData
            )
          }

          // Return early for condition nodes as we've already handled the outgoing edges
          return nextContextData
        }
      }

      // For non-condition nodes, execute all outgoing nodes
      const outgoingEdges = nodeOutgoingEdges[nodeId] || []
      for (const edge of outgoingEdges) {
        await executeNode(
          edge.target,
          nodeMap,
          nodeOutgoingEdges,
          nextContextData
        )
      }

      return nextContextData
    },
    []
  )

  // Execute workflow
  const executeWorkflow = useCallback(
    async (nodes: AppNode[], edges: Edge[]) => {
      // Reset state
      setWorkflowState({})
      setWorkflowOutput([])
      setIsExecuting(true)

      try {
        // Find starting nodes (nodes with no incoming edges)
        const nodesWithIncomingEdges = new Set(edges.map(edge => edge.target))
        const startingNodeIds = nodes
          .filter(node => !nodesWithIncomingEdges.has(node.id))
          .map(node => node.id)

        // Create a map of outgoing edges for each node
        const nodeOutgoingEdges: Record<string, Edge[]> = {}
        edges.forEach(edge => {
          if (!nodeOutgoingEdges[edge.source]) {
            nodeOutgoingEdges[edge.source] = []
          }
          nodeOutgoingEdges[edge.source].push(edge)
        })

        // Create a map of node id to node
        const nodeMap: Record<string, AppNode> = {}
        nodes.forEach(node => {
          nodeMap[node.id] = node
        })

        // Execute starting nodes
        for (const nodeId of startingNodeIds) {
          await executeNode(nodeId, nodeMap, nodeOutgoingEdges, {})
        }
      } finally {
        setIsExecuting(false)
      }
    },
    [executeNode]
  )

  const contextValue: WorkflowContextType = {
    workflowState,
    workflowOutput,
    isExecuting,
    executeWorkflow,
    saveWorkflow,
    loadWorkflow,
    savedWorkflows,
    clearOutput
  }

  return (
    <WorkflowContext.Provider value={contextValue}>
      {children}
    </WorkflowContext.Provider>
  )
}
