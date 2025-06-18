import { WorkflowContext } from './WorkflowContext'

// This file contains patches to the WorkflowContext to add support for new node types
// without changing the original WorkflowContext.tsx file.

// Here's the executeNode function with support for the YesNoConditionNode
export const executeNodeWithYesNoCondition = async (
  nodeId: string,
  nodeMap: Record<string, any>,
  nodeOutgoingEdges: Record<string, any[]>,
  contextData: Record<string, unknown>,
  addOutputMessage: (message: string, role?: 'user' | 'assistant') => void,
  waitForUserInput: (question: string, paramName: string) => Promise<string>
): Promise<Record<string, unknown>> => {
  const node = nodeMap[nodeId]
  if (!node) return contextData

  const nextContextData: Record<string, unknown> = { ...contextData }

  if (node.type === 'yes_no_condition') {
    // Handle the yes/no condition node
    let condition = 'Did you enjoy the weather today?'
    let name = 'Yes/No Condition'
    let conditionType = 'yes-no'

    if (node.data && typeof node.data === 'object') {
      if ('condition' in node.data) condition = node.data.condition as string
      if ('name' in node.data) name = node.data.name as string
      if ('conditionType' in node.data)
        conditionType = node.data.conditionType as string
    }

    // For expressions, handle like regular conditions
    if (conditionType === 'expression') {
      // Use the existing condition evaluation logic
      // (Add this functionality from the standard condition node)
      // ...
      return nextContextData
    }

    // For yes/no questions, ask the user
    try {
      // Ask the user for their answer
      const userInput = await waitForUserInput(condition, 'condition_answer')

      // Check if the user's response is affirmative
      const response = userInput.toLowerCase().trim()
      const isYes = [
        'yes',
        'y',
        'yeah',
        'yep',
        'sure',
        'ok',
        'okay',
        'true'
      ].includes(response)

      console.log(
        `Yes/No condition '${name}' evaluated: User said "${userInput}" = ${
          isYes ? 'YES' : 'NO'
        }`
      )

      // Store the result in the context
      nextContextData['condition_result'] = isYes
      nextContextData['condition_answer'] = userInput

      // Only follow edges with matching condition result
      const outgoingEdges = nodeOutgoingEdges[nodeId] || []
      const filteredEdges = outgoingEdges.filter(
        edge =>
          (isYes && edge.sourceHandle === 'yes') ||
          (!isYes && edge.sourceHandle === 'no')
      )

      // Execute all nodes connected to matching condition paths
      for (const edge of filteredEdges) {
        // Call the original executeNode function
        // This is just a stub - you would call your actual function here
        // await executeNode(edge.target, nodeMap, nodeOutgoingEdges, nextContextData);
      }

      return nextContextData
    } catch (e) {
      console.error(`Error in yes/no condition: ${e}`)
      addOutputMessage(
        `I had trouble processing your answer. Let's continue.`,
        'assistant'
      )
      return nextContextData
    }
  }

  // For other node types, return the context data
  return nextContextData
}
