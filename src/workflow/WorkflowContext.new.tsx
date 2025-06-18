import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect
} from 'react'
import { Edge } from '@xyflow/react'
import { AppNode } from '../nodes/types'
import { WorkflowUtils } from './WorkflowUtils'
import {
  supabase,
  isSupabaseConfigured,
  type SavedWorkflow
} from '../utils/supabaseClient'
import { useAuth } from '@clerk/clerk-react'
import { getUserIdOrDefault } from '../auth/userUtils'

// Chat message structure
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

// Define workflow state and context types
interface WorkflowContextType {
  workflowState: Record<string, unknown>
  workflowOutput: string[]
  isExecuting: boolean
  waitingForUserInput: boolean
  executeWorkflow: (nodes: AppNode[], edges: Edge[]) => Promise<void>
  saveWorkflow: (name: string, nodes: AppNode[], edges: Edge[]) => Promise<void>
  loadWorkflow: (
    name: string
  ) => Promise<{ nodes: AppNode[]; edges: Edge[] } | null>
  deleteWorkflow: (name: string) => Promise<boolean>
  updateWorkflowName: (oldName: string, newName: string) => Promise<boolean>
  savedWorkflows: string[]
  loadingSavedWorkflows: boolean
  clearOutput: () => void
  submitUserInput: (text: string) => void
}

// Create the context with default values
const WorkflowContext = createContext<WorkflowContextType>({
  workflowState: {},
  workflowOutput: [],
  isExecuting: false,
  waitingForUserInput: false,
  executeWorkflow: async () => {},
  saveWorkflow: async () => {},
  loadWorkflow: async () => null,
  deleteWorkflow: async () => false,
  updateWorkflowName: async () => false,
  savedWorkflows: [],
  loadingSavedWorkflows: false,
  clearOutput: () => {},
  submitUserInput: () => {}
})

// Hook to use workflow context
export const useWorkflow = () => useContext(WorkflowContext)

// Save key for local storage fallback
const SAVED_WORKFLOWS_KEY = 'ai_agent_saved_workflows'

// Provider component
export const WorkflowProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const { userId } = useAuth()
  const currentUserId = getUserIdOrDefault(userId)
  const [workflowState, setWorkflowState] = useState<Record<string, unknown>>(
    {}
  )
  const [workflowOutput, setWorkflowOutput] = useState<string[]>([])
  const [isExecuting, setIsExecuting] = useState(false)
  const [waitingForUserInput, setWaitingForUserInput] = useState(false)
  const [savedWorkflows, setSavedWorkflows] = useState<string[]>([])
  const [loadingSavedWorkflows, setLoadingSavedWorkflows] = useState(false)

  // Use refs to store callback functions for handling user input
  const userInputResolveRef = useRef<((value: string) => void) | null>(null)

  // Load saved workflows when user changes
  useEffect(() => {
    const fetchSavedWorkflows = async () => {
      setLoadingSavedWorkflows(true)

      try {
        if (isSupabaseConfigured()) {
          // Fetch from Supabase first
          const { data, error } = await supabase
            .from('workflows')
            .select('name')
            .eq('user_id', currentUserId)

          if (error) {
            console.error('Error fetching workflows from Supabase:', error)
            loadFromLocalStorage() // Fall back to localStorage
            return
          }

          if (data) {
            setSavedWorkflows(data.map(workflow => workflow.name))
          }
        } else {
          loadFromLocalStorage()
        }
      } catch (error) {
        console.error('Error in fetchSavedWorkflows:', error)
        loadFromLocalStorage() // Fall back to localStorage
      } finally {
        setLoadingSavedWorkflows(false)
      }
    }

    // Helper to load from localStorage
    const loadFromLocalStorage = () => {
      // Initialize from localStorage if available
      const saved = localStorage.getItem(SAVED_WORKFLOWS_KEY)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setSavedWorkflows(Object.keys(parsed))
        } catch (e) {
          setSavedWorkflows([])
        }
      } else {
        setSavedWorkflows([])
      }
    }

    fetchSavedWorkflows()
  }, [currentUserId])

  // Clear output messages
  const clearOutput = useCallback(() => {
    setWorkflowOutput([])
  }, [])

  // Function to handle user input submission
  const submitUserInput = useCallback((text: string) => {
    if (userInputResolveRef.current) {
      // Add the user's message to the output
      addOutputMessage(text, 'user')

      // Resolve the promise with the user's input
      userInputResolveRef.current(text)
      userInputResolveRef.current = null
      setWaitingForUserInput(false)
    }
  }, [])

  // Save workflow to Supabase and localStorage
  const saveWorkflow = useCallback(
    async (name: string, nodes: AppNode[], edges: Edge[]) => {
      const flowData = JSON.stringify({ nodes, edges })

      try {
        if (isSupabaseConfigured()) {
          // First check if this workflow name already exists for this user
          const { data: existingData } = await supabase
            .from('workflows')
            .select('id')
            .eq('user_id', currentUserId)
            .eq('name', name)
            .single()

          if (existingData) {
            // Update existing workflow
            const { error } = await supabase
              .from('workflows')
              .update({
                flow_data: flowData,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingData.id)

            if (error) {
              console.error('Error updating workflow:', error)
              throw error
            }
          } else {
            // Insert new workflow
            const { error } = await supabase.from('workflows').insert([
              {
                user_id: currentUserId,
                name,
                flow_data: flowData
              }
            ])

            if (error) {
              console.error('Error saving workflow:', error)
              throw error
            }
          }

          // Update the list of saved workflows
          const { data, error } = await supabase
            .from('workflows')
            .select('name')
            .eq('user_id', currentUserId)

          if (!error && data) {
            setSavedWorkflows(data.map(workflow => workflow.name))
          }
        } else {
          // Fallback to localStorage
          saveToLocalStorage(name, nodes, edges)
        }
      } catch (error) {
        console.error('Error in saveWorkflow:', error)
        // Fallback to localStorage if Supabase fails
        saveToLocalStorage(name, nodes, edges)
      }
    },
    [currentUserId]
  )

  // Helper function to save to localStorage
  const saveToLocalStorage = (
    name: string,
    nodes: AppNode[],
    edges: Edge[]
  ) => {
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
  }

  // Load workflow from Supabase or localStorage
  const loadWorkflow = useCallback(
    async (name: string) => {
      try {
        if (isSupabaseConfigured()) {
          const { data, error } = await supabase
            .from('workflows')
            .select('flow_data')
            .eq('user_id', currentUserId)
            .eq('name', name)
            .single()

          if (error) {
            console.error('Error loading workflow from Supabase:', error)
            // Fall back to localStorage
            return loadFromLocalStorage(name)
          }

          if (data && data.flow_data) {
            try {
              const parsedData = JSON.parse(data.flow_data)
              return {
                nodes: parsedData.nodes as AppNode[],
                edges: parsedData.edges as Edge[]
              }
            } catch (e) {
              console.error('Error parsing flow data from Supabase:', e)
            }
          }
        } else {
          // Fall back to localStorage
          return loadFromLocalStorage(name)
        }
      } catch (error) {
        console.error('Error in loadWorkflow:', error)
        return loadFromLocalStorage(name)
      }

      return null
    },
    [currentUserId]
  )

  // Helper function to load from localStorage
  const loadFromLocalStorage = (name: string) => {
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
      console.error('Error loading workflow from localStorage:', e)
    }

    return null
  }

  // Delete a workflow
  const deleteWorkflow = useCallback(
    async (name: string) => {
      try {
        if (isSupabaseConfigured()) {
          const { error } = await supabase
            .from('workflows')
            .delete()
            .eq('user_id', currentUserId)
            .eq('name', name)

          if (error) {
            console.error('Error deleting workflow from Supabase:', error)
            // Fall back to localStorage deletion
            return deleteFromLocalStorage(name)
          }

          // Update the list of saved workflows
          const { data, error: fetchError } = await supabase
            .from('workflows')
            .select('name')
            .eq('user_id', currentUserId)

          if (!fetchError && data) {
            setSavedWorkflows(data.map(workflow => workflow.name))
          }

          return true
        } else {
          // Fall back to localStorage
          return deleteFromLocalStorage(name)
        }
      } catch (error) {
        console.error('Error in deleteWorkflow:', error)
        return deleteFromLocalStorage(name)
      }
    },
    [currentUserId]
  )

  // Helper function to delete from localStorage
  const deleteFromLocalStorage = (name: string): boolean => {
    const existingSaved = localStorage.getItem(SAVED_WORKFLOWS_KEY)
    if (!existingSaved) return false

    try {
      const savedData = JSON.parse(existingSaved)
      if (name in savedData) {
        delete savedData[name]
        localStorage.setItem(SAVED_WORKFLOWS_KEY, JSON.stringify(savedData))
        setSavedWorkflows(Object.keys(savedData))
        return true
      }
    } catch (e) {
      console.error('Error deleting workflow from localStorage:', e)
    }

    return false
  }

  // Update a workflow's name
  const updateWorkflowName = useCallback(
    async (oldName: string, newName: string) => {
      if (oldName === newName) return true

      try {
        if (isSupabaseConfigured()) {
          // First check if the workflow exists
          const { data: existingData } = await supabase
            .from('workflows')
            .select('id, flow_data')
            .eq('user_id', currentUserId)
            .eq('name', oldName)
            .single()

          if (!existingData) {
            return false
          }

          // Update the name
          const { error } = await supabase
            .from('workflows')
            .update({ name: newName })
            .eq('id', existingData.id)

          if (error) {
            console.error('Error updating workflow name in Supabase:', error)
            // Fall back to localStorage
            return updateNameInLocalStorage(oldName, newName)
          }

          // Update the list of saved workflows
          const { data, error: fetchError } = await supabase
            .from('workflows')
            .select('name')
            .eq('user_id', currentUserId)

          if (!fetchError && data) {
            setSavedWorkflows(data.map(workflow => workflow.name))
          }

          return true
        } else {
          // Fall back to localStorage
          return updateNameInLocalStorage(oldName, newName)
        }
      } catch (error) {
        console.error('Error in updateWorkflowName:', error)
        return updateNameInLocalStorage(oldName, newName)
      }
    },
    [currentUserId]
  )

  // Helper function to update name in localStorage
  const updateNameInLocalStorage = (
    oldName: string,
    newName: string
  ): boolean => {
    const existingSaved = localStorage.getItem(SAVED_WORKFLOWS_KEY)
    if (!existingSaved) return false

    try {
      const savedData = JSON.parse(existingSaved)
      if (oldName in savedData) {
        savedData[newName] = savedData[oldName]
        delete savedData[oldName]
        localStorage.setItem(SAVED_WORKFLOWS_KEY, JSON.stringify(savedData))
        setSavedWorkflows(Object.keys(savedData))
        return true
      }
    } catch (e) {
      console.error('Error updating workflow name in localStorage:', e)
    }

    return false
  }

  // Function to add a message to the workflow output formatted for the chat UI
  const addOutputMessage = useCallback(
    (message: string, role: 'user' | 'assistant' = 'assistant') => {
      const messageObj = {
        role,
        content: message,
        timestamp: new Date().toISOString()
      }
      setWorkflowOutput(prev => [...prev, JSON.stringify(messageObj)])
    },
    []
  )

  // Function to wait for user input (will be connected to the chat UI)
  const waitForUserInput = useCallback(
    (question: string, paramName: string): Promise<string> => {
      // Add the question to the output as an assistant message
      addOutputMessage(question, 'assistant')

      // Set waiting state to true
      setWaitingForUserInput(true)

      // Return a promise that resolves when the user enters input
      return new Promise<string>(resolve => {
        // Store the resolve function in the ref
        userInputResolveRef.current = resolve
      })
    },
    [addOutputMessage]
  )

  // Helper function to process a message with variable replacements
  const processMessage = useCallback(
    (message: string, contextData: Record<string, unknown>): string => {
      // Replace variables in the format ${variableName} with their values from context
      return WorkflowUtils.evaluateExpression(message, contextData)
    },
    []
  )

  // Include the original executeNode function and other existing handlers...
  // (Copy the rest of the WorkflowContext implementation for executeNode and other functions)

  // ...

  return (
    <WorkflowContext.Provider
      value={{
        workflowState,
        workflowOutput,
        isExecuting,
        waitingForUserInput,
        executeWorkflow,
        saveWorkflow,
        loadWorkflow,
        deleteWorkflow,
        updateWorkflowName,
        savedWorkflows,
        loadingSavedWorkflows,
        clearOutput,
        submitUserInput
      }}
    >
      {children}
    </WorkflowContext.Provider>
  )
}
