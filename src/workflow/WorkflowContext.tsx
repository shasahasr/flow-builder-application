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
import { useAuth } from '@clerk/clerk-react'
import { getUserIdOrDefault } from '../auth/userUtils'
// Removed Supabase import to use only localStorage

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
  saveWorkflow: (name: string, nodes: AppNode[], edges: Edge[]) => void
  loadWorkflow: (name: string) => { nodes: AppNode[]; edges: Edge[] } | null
  deleteWorkflow: (name: string) => boolean
  updateWorkflowName: (oldName: string, newName: string) => boolean
  savedWorkflows: string[]
  clearOutput: () => void
  submitUserInput: (text: string) => void
}

// Create the context with default values
export const WorkflowContext = createContext<WorkflowContextType>({
  workflowState: {},
  workflowOutput: [],
  isExecuting: false,
  waitingForUserInput: false,
  executeWorkflow: async () => {},
  saveWorkflow: () => {},
  loadWorkflow: () => null,
  deleteWorkflow: () => false,
  updateWorkflowName: () => false,
  savedWorkflows: [],
  clearOutput: () => {},
  submitUserInput: () => {}
})

// Hook to use workflow context
export const useWorkflow = () => useContext(WorkflowContext)

// Save key for local storage
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

  // Load saved workflows when user changes
  useEffect(() => {
    const fetchSavedWorkflows = async () => {
      try {
        // Always load from localStorage in this simplified version
        loadFromLocalStorage()
      } catch (error) {
        console.error('Error in fetchSavedWorkflows:', error)
        setSavedWorkflows([])
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

  // Use refs to store callback functions for handling user input
  const userInputResolveRef = useRef<((value: string) => void) | null>(null)

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

  // Save workflow to localStorage only
  const saveWorkflow = useCallback(
    (name: string, nodes: AppNode[], edges: Edge[]) => {
      console.log(`Saving workflow "${name}" for user ${currentUserId}`)

      // Always save to localStorage in this simplified version
      saveToLocalStorage(name, nodes, edges)
    },
    [currentUserId]
  )

  // Helper function to save to localStorage
  const saveToLocalStorage = useCallback(
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

  // Helper function to load from localStorage
  const loadFromLocalStorage = useCallback((name: string) => {
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
  }, [])

  // Load workflow from localStorage only
  const loadWorkflow = useCallback(
    (name: string) => {
      console.log(`Loading workflow "${name}" for user ${currentUserId}`)

      // Always load from localStorage in this simplified version
      return loadFromLocalStorage(name)
    },
    [currentUserId, loadFromLocalStorage]
  )

  // Helper function to process a message with variable replacements
  const processMessage = useCallback(
    (message: string, contextData: Record<string, unknown>): string => {
      // Replace variables in the format ${variableName} with their values from context
      return WorkflowUtils.evaluateExpression(message, contextData)
    },
    []
  )

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
    (question: string): Promise<string> => {
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
          // Get message from node data and process any variables
          let message = (node.data?.message as string) || 'No message provided'
          message = processMessage(message, contextData)

          // Add as an assistant message
          addOutputMessage(message, 'assistant')
          break
        }

        case 'input_parameter': {
          // Get the question from node data and process any variables
          const paramName = (node.data?.paramName as string) || 'parameter'
          let question =
            (node.data?.question as string) ||
            `Please provide a value for ${paramName}:`
          question = processMessage(question, contextData)

          // Check if we should save as a custom variable
          const saveAsVariable = node.data?.saveAsVariable as boolean
          let variableName = node.data?.variableName as string

          // If no custom variable name is provided, use the parameter name
          if (saveAsVariable && (!variableName || variableName.trim() === '')) {
            variableName = paramName
          }

          // Wait for user input
          const userInput = await waitForUserInput(question)

          // Store the user's input in the context
          nextContextData[paramName] = userInput

          // If saveAsVariable is true, also store with the custom variable name
          if (saveAsVariable && variableName && variableName !== paramName) {
            nextContextData[variableName] = userInput

            // Add a notification that the variable was saved
            addOutputMessage(
              `Input saved as variable: ${variableName} = "${userInput}"`,
              'assistant'
            )
          }
          break
        }

        case 'api_call': {
          try {
            // Get API details from node data - now directly mapping to fetch parameters
            let url = 'unspecified endpoint'
            let method = 'GET'
            let headers = '{}'
            let payload = '{}'
            let responsePath = ''
            let resultMessage = 'API call result: ${result}'
            let saveAsVariable = false
            let variableName = 'apiResponse'
            let selectedFunction = ''
            let apiType = ''

            if (node.data && typeof node.data === 'object') {
              if ('url' in node.data) url = node.data.url as string
              if ('method' in node.data) method = node.data.method as string
              if ('headers' in node.data) headers = node.data.headers as string
              if ('payload' in node.data) payload = node.data.payload as string
              if ('responsePath' in node.data)
                responsePath = node.data.responsePath as string
              if ('resultMessage' in node.data)
                resultMessage = node.data.resultMessage as string
              if ('saveAsVariable' in node.data)
                saveAsVariable = node.data.saveAsVariable as boolean
              if ('variableName' in node.data)
                variableName = node.data.variableName as string
              if ('apiType' in node.data) apiType = node.data.apiType as string
              if ('selectedFunction' in node.data)
                selectedFunction = node.data.selectedFunction as string
            }

            // Process any variables in all fetch parameters
            url = processMessage(url, contextData)
            method = processMessage(method, contextData)
            headers = processMessage(headers, contextData)
            payload = processMessage(payload, contextData)
            resultMessage = processMessage(resultMessage, contextData)

            // Include selected function in the message if available
            const functionDetail = selectedFunction
              ? ` (function: ${selectedFunction})`
              : ''

            // Skip the API call message in the chat output, log to console only
            console.log(`Making API call to ${url}${functionDetail}...`)

            // Parse the payload
            let payloadObj = {}
            try {
              if (payload && payload.trim() !== '') {
                payloadObj = JSON.parse(payload)
              }
            } catch (error) {
              // Only log parsing errors to console, not to chat output
              console.error(`Error parsing payload JSON: ${error}`)
              throw new Error(`Invalid payload JSON: ${error}`)
            }

            // Make a real API call
            let responseData
            try {
              // Import OpenAI API key from environment
              const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY

              // Parse headers from JSON
              let parsedHeaders: Record<string, string> = {
                'Content-Type': 'application/json'
              }

              try {
                if (headers && headers.trim() !== '') {
                  parsedHeaders = {
                    ...parsedHeaders,
                    ...JSON.parse(headers)
                  }
                }
              } catch (error) {
                console.error(`Error parsing headers JSON: ${error}`)
                // Continue with default headers
              }

              // Process API key variables in headers
              if (
                apiType === 'chatgpt' &&
                !('Authorization' in parsedHeaders)
              ) {
                if (!OPENAI_API_KEY) {
                  throw new Error(
                    'OpenAI API key not found in environment variables. Please set VITE_OPENAI_API_KEY in your .env file.'
                  )
                }
                parsedHeaders.Authorization = `Bearer ${OPENAI_API_KEY}`
              }

              // Replace any variables in headers
              Object.keys(parsedHeaders).forEach(key => {
                const value = parsedHeaders[key]
                if (typeof value === 'string' && value.includes('${')) {
                  // Replace ${VARIABLE_NAME} with actual values
                  parsedHeaders[key] = value.replace(
                    /\${([^}]+)}/g,
                    (match, varName) => {
                      if (varName === 'OPENAI_API_KEY' && OPENAI_API_KEY) {
                        return OPENAI_API_KEY
                      }
                      return match // Keep as is if not found
                    }
                  )
                }
              })

              // Create request options with appropriate HTTP method from node data
              const requestOptions: RequestInit = {
                method: method,
                headers: parsedHeaders
              }

              // Special handling for OpenAI models
              if (apiType === 'chatgpt') {
                // Update model in payload to a more widely available one if it's gpt-4o
                if (
                  payloadObj &&
                  typeof payloadObj === 'object' &&
                  'model' in payloadObj
                ) {
                  const model = payloadObj.model as string
                  if (model === 'gpt-4o') {
                    console.log(
                      'Replacing gpt-4o with gpt-3.5-turbo for better compatibility'
                    )
                    ;(payloadObj as Record<string, unknown>).model =
                      'gpt-3.5-turbo'
                  }
                }
              }

              // Handle payload based on HTTP method and API type
              if (
                method === 'GET' ||
                method === 'HEAD' ||
                method === 'DELETE'
              ) {
                // For GET, HEAD, DELETE: convert payload to URL query parameters
                if (Object.keys(payloadObj).length > 0) {
                  // Special handling for OpenMeteo's location parameter
                  if (apiType === 'openmeteo' && 'location' in payloadObj) {
                    try {
                      // Convert location name to coordinates
                      const locationName = String(payloadObj.location)
                      console.log(
                        `Converting location "${locationName}" to coordinates...`
                      )

                      // Use the Open-Meteo Geocoding API
                      const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
                        locationName
                      )}&count=1`

                      const geocodeResponse = await fetch(geocodingUrl)

                      if (geocodeResponse.ok) {
                        const geocodeData = await geocodeResponse.json()

                        if (
                          geocodeData.results &&
                          geocodeData.results.length > 0
                        ) {
                          const { latitude, longitude } = geocodeData.results[0]
                          console.log(
                            `Found coordinates: lat=${latitude}, lon=${longitude} for "${locationName}"`
                          )

                          // Replace location with lat/lon
                          delete (payloadObj as Record<string, unknown>)
                            .location
                          ;(payloadObj as Record<string, unknown>).latitude =
                            latitude
                          ;(payloadObj as Record<string, unknown>).longitude =
                            longitude
                        } else {
                          console.error(
                            `No coordinates found for location "${locationName}"`
                          )
                          // Use defaults
                          ;(
                            payloadObj as Record<string, unknown>
                          ).latitude = 40.7128 // New York
                          ;(payloadObj as Record<string, unknown>).longitude =
                            -74.006
                        }
                      } else {
                        console.error(
                          `Geocoding API error: ${geocodeResponse.statusText}`
                        )
                        // Use defaults
                        ;(
                          payloadObj as Record<string, unknown>
                        ).latitude = 40.7128
                        ;(payloadObj as Record<string, unknown>).longitude =
                          -74.006
                      }
                    } catch (geoError) {
                      console.error(`Error during geocoding: ${geoError}`)
                      // Use defaults
                      ;(
                        payloadObj as Record<string, unknown>
                      ).latitude = 40.7128
                      ;(payloadObj as Record<string, unknown>).longitude =
                        -74.006
                    }
                  }

                  // Convert payload to URL parameters for GET requests
                  const urlParams = new URLSearchParams()
                  Object.entries(payloadObj).forEach(([key, value]) => {
                    urlParams.append(key, String(value))
                  })

                  // Append parameters to URL
                  url = `${url}${
                    url.includes('?') ? '&' : '?'
                  }${urlParams.toString()}`
                  console.log(`Using URL with query parameters: ${url}`)
                }
              } else {
                // For POST, PUT, PATCH: include payload in request body
                if (Object.keys(payloadObj).length > 0) {
                  requestOptions.body = JSON.stringify(payloadObj)
                  console.log(
                    `Adding request body: ${JSON.stringify(
                      payloadObj,
                      null,
                      2
                    )}`
                  )
                }
              }

              // We'll skip the API call message to make the flow more seamless
              // Only log to console for debugging
              console.log(`Making API call to ${url} (${apiType})...`)

              // Make the fetch call with CORS handling
              let response
              try {
                response = await fetch(url, requestOptions)
              } catch (corsError) {
                console.error('CORS error, trying proxy:', corsError)

                // Try multiple CORS-friendly proxies for Open-Meteo (GET) requests only
                if (apiType === 'openmeteo') {
                  const corsProxies = [
                    `https://cors-anywhere.herokuapp.com/${url}`,
                    `https://api.allorigins.win/raw?url=${encodeURIComponent(
                      url
                    )}`,
                    `https://cors-proxy.htmldriven.com/?url=${encodeURIComponent(
                      url
                    )}`
                  ]

                  for (const proxyUrl of corsProxies) {
                    try {
                      console.log(
                        `API call with direct URL failed. Trying CORS proxy...`
                      )

                      const proxyOptions = { ...requestOptions }
                      if (proxyOptions.headers) {
                        // Add the required header for some CORS proxies
                        proxyOptions.headers = {
                          ...proxyOptions.headers,
                          'X-Requested-With': 'XMLHttpRequest'
                        }
                      }

                      response = await fetch(proxyUrl, proxyOptions)
                      if (response.ok) {
                        console.log(`Successfully connected using CORS proxy`)
                        break
                      }
                    } catch (err) {
                      console.error(`Proxy attempt failed: ${err}`)
                    }
                  }
                } else {
                  // For ChatGPT API, we can't easily use CORS proxies
                  throw new Error(
                    `CORS error for ${apiType} API request. Consider enabling CORS on the API or using a server-side proxy.`
                  )
                }

                // If all proxies failed
                if (!response || !response.ok) {
                  throw new Error(
                    `Failed to make API call through direct URL and proxies`
                  )
                }
              }

              // Check if response is ok
              if (!response.ok) {
                throw new Error(
                  `API returned status ${response.status}: ${response.statusText}`
                )
              }

              // Parse the response
              responseData = await response.json()

              // Log successful response to console only
              console.log(
                `Received response from API. Status: ${response.status}`
              )
            } catch (error) {
              // If the API call fails, log to console and create a fallback response
              console.error(`API call failed: ${error}. Using fallback data.`)

              // Add a user-friendly error message - make it simple and non-technical
              addOutputMessage(
                `I'll show you some example information instead:`,
                'assistant'
              )

              // Fall back to mock data if the real API call fails
              if (selectedFunction) {
                // Create mock response based on the selected function
                switch (selectedFunction) {
                  case 'getUserData':
                    responseData = {
                      success: true,
                      data: {
                        id: 'user123',
                        name: 'Alex Johnson',
                        email: 'alex@example.com',
                        preferences: {
                          theme: 'dark',
                          notifications: true
                        }
                      }
                    }
                    break
                  case 'getWeatherForecast':
                    responseData = {
                      success: true,
                      data: {
                        location: 'New York',
                        current: {
                          temperature: 72,
                          conditions: 'partly cloudy',
                          humidity: 45
                        },
                        forecast: [
                          {
                            day: 'Monday',
                            high: 75,
                            low: 62,
                            conditions: 'sunny'
                          },
                          {
                            day: 'Tuesday',
                            high: 70,
                            low: 60,
                            conditions: 'rain'
                          }
                        ]
                      }
                    }
                    break
                  default:
                    responseData = {
                      success: false,
                      error: `API call failed: ${error}`,
                      timestamp: new Date().toISOString()
                    }
                }
              } else {
                // Generic fallback response
                responseData = {
                  success: false,
                  error: `API call failed: ${error}`,
                  timestamp: new Date().toISOString()
                }
              }
            }

            // Store the full response in the context
            nextContextData['apiResponse'] = responseData

            // If saveAsVariable is true, store with the specified variable name
            if (saveAsVariable && variableName) {
              nextContextData[variableName] = responseData

              // Log to console only
              console.log(`API response saved as variable: ${variableName}`)
            }

            // Extract specific data if a response path is provided
            let result: unknown = responseData
            if (responsePath) {
              try {
                const pathParts = responsePath.split('.')
                for (const part of pathParts) {
                  if (result && typeof result === 'object') {
                    result = (result as Record<string, unknown>)[part]
                  }
                }
              } catch (e) {
                console.error('Error extracting data from response path', e)
              }
            }

            // Store the extracted result separately
            nextContextData['result'] = result

            // If saveAsVariable is true, also store the extracted result
            if (saveAsVariable && variableName) {
              // Store the actual result in a result property
              nextContextData[`${variableName}_result`] = result
            }

            // Format the result message based on the API type
            let finalResultMessage = ''

            // For ChatGPT text responses, just output the content directly
            if (apiType === 'chatgpt' && selectedFunction === 'Generate Text') {
              finalResultMessage = (result as string) || 'No response received'
            }
            // For ChatGPT image responses, provide a link
            else if (
              apiType === 'chatgpt' &&
              selectedFunction === 'Generate Image'
            ) {
              const imageUrl = result as string
              finalResultMessage = imageUrl
                ? `Here's your generated image: ${imageUrl}`
                : 'Image generation failed'
            }
            // For OpenMeteo, format the weather data in a user-friendly way
            else if (apiType === 'openmeteo') {
              if (typeof result === 'object' && result !== null) {
                // Format weather data in a conversational way
                if (selectedFunction === 'Current Weather') {
                  try {
                    const weather = result as Record<string, unknown>
                    const temperature =
                      (weather.temperature as number) ||
                      (weather.temperature_2m as number)
                    const weatherCode = weather.weathercode as number
                    const windSpeed =
                      (weather.windspeed as number) ||
                      (weather.wind_speed as number)

                    let weatherCondition = 'clear'
                    if (weatherCode >= 1 && weatherCode <= 3)
                      weatherCondition = 'partly cloudy'
                    else if (weatherCode >= 45 && weatherCode <= 48)
                      weatherCondition = 'foggy'
                    else if (weatherCode >= 51 && weatherCode <= 67)
                      weatherCondition = 'rainy'
                    else if (weatherCode >= 71 && weatherCode <= 77)
                      weatherCondition = 'snowy'
                    else if (weatherCode >= 80 && weatherCode <= 99)
                      weatherCondition = 'stormy'

                    finalResultMessage = `The current weather is ${weatherCondition}`
                    if (temperature !== undefined)
                      finalResultMessage += ` with a temperature of ${temperature}°C`
                    if (windSpeed !== undefined)
                      finalResultMessage += ` and wind speed of ${windSpeed} km/h`
                    finalResultMessage += '.'
                  } catch (e) {
                    // Fall back to JSON if we can't parse the specific format
                    finalResultMessage = `Here's the current weather: ${JSON.stringify(
                      result
                    )}`
                  }
                } else if (selectedFunction === 'Weather Forecast') {
                  // Define type for weather forecast outside try block
                  interface WeatherForecast {
                    daily?: {
                      weathercode?: number[]
                      time?: string[]
                      temperature_2m_max?: number[]
                      temperature_2m_min?: number[]
                      [key: string]: unknown
                    }
                    [key: string]: unknown
                  }

                  try {
                    const weather = result as WeatherForecast
                    if (weather.daily) {
                      finalResultMessage = `Weather forecast: `
                      if (weather.daily.weathercode && weather.daily.time) {
                        const days = [
                          'Today',
                          'Tomorrow',
                          'In 2 days',
                          'In 3 days',
                          'In 4 days'
                        ]
                        for (
                          let i = 0;
                          i < Math.min(3, weather.daily.time.length);
                          i++
                        ) {
                          const code = weather.daily.weathercode[i]
                          let condition = 'clear'
                          if (code >= 1 && code <= 3)
                            condition = 'partly cloudy'
                          else if (code >= 45 && code <= 48) condition = 'foggy'
                          else if (code >= 51 && code <= 67) condition = 'rainy'
                          else if (code >= 71 && code <= 77) condition = 'snowy'
                          else if (code >= 80 && code <= 99)
                            condition = 'stormy'

                          finalResultMessage += `${days[i]}: ${condition}`

                          if (
                            weather.daily.temperature_2m_max &&
                            weather.daily.temperature_2m_min
                          ) {
                            finalResultMessage += ` (${weather.daily.temperature_2m_min[i]}°C to ${weather.daily.temperature_2m_max[i]}°C)`
                          }

                          if (i < 2) finalResultMessage += ', '
                        }
                      } else {
                        // Safely stringify the daily object
                        finalResultMessage += JSON.stringify(weather.daily)
                      }
                    } else {
                      finalResultMessage = `Forecast data: ${JSON.stringify(
                        result
                      )}`
                    }
                  } catch (e) {
                    finalResultMessage = `Here's the weather forecast: ${JSON.stringify(
                      result
                    )}`
                  }
                } else {
                  // For other types of weather data
                  finalResultMessage = `${selectedFunction} data: ${JSON.stringify(
                    result,
                    null,
                    2
                  )}`
                }
              } else {
                finalResultMessage = `${selectedFunction} results: ${result}`
              }
            }
            // Default case: use the raw result or a custom message
            else {
              finalResultMessage = WorkflowUtils.evaluateExpression(
                resultMessage,
                { ...contextData, result }
              )
            }

            // Add the result message to the output
            addOutputMessage(finalResultMessage, 'assistant')
          } catch (error) {
            // Log error to console only, not to chat output
            console.error(`API call failed: ${error}`)

            // Add a user-friendly message instead
            addOutputMessage(
              "I couldn't complete this request. Let's try something else.",
              'assistant'
            )
          }
          break
        }

        case 'condition':
        case 'yes_no_condition': {
          // Access condition expression and name from the node data
          let conditionText = 'false'
          let conditionName = 'Condition'
          let conditionType =
            node.type === 'yes_no_condition' ? 'yes-no' : 'expression'

          if (node.data && typeof node.data === 'object') {
            if ('condition' in node.data)
              conditionText = node.data.condition as string
            if ('name' in node.data) conditionName = node.data.name as string
            if (
              'conditionType' in node.data &&
              node.type === 'yes_no_condition'
            )
              conditionType = node.data.conditionType as string
          }

          // Process the condition text to replace any variables
          conditionText = processMessage(conditionText, contextData)

          let conditionResult = false
          let debugInfo = ''

          // For yes_no_condition node with yes-no condition type, ask the user
          if (node.type === 'yes_no_condition' && conditionType === 'yes-no') {
            try {
              // Ask the user for their answer
              const userInput = await waitForUserInput(conditionText)

              // Check if the user's response is affirmative
              const response = userInput.toLowerCase().trim()
              conditionResult = [
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
                `Yes/No condition '${conditionName}' evaluated: User said "${userInput}" = ${
                  conditionResult ? 'YES' : 'NO'
                }`
              )

              // Store the result in the context
              nextContextData['condition_result'] = conditionResult
              nextContextData['condition_answer'] = userInput
              debugInfo = `User said: "${userInput}"`

              // Skip the standard condition evaluation
              break
            } catch (e) {
              console.error(`Error in yes/no condition: ${e}`)
              addOutputMessage(
                `I had trouble processing your answer. Let's continue.`,
                'assistant'
              )
              conditionResult = false
              break
            }
          }

          try {
            // First check for common comparison patterns
            const comparison = conditionText.match(/(.*?)(==|!=|>|<|>=|<=)(.*)/)

            if (comparison) {
              // We have a structured comparison
              const [, left, operator, right] = comparison
              const leftValue = left.trim()
              const rightValue = right.trim()

              // Get actual values, handling string literals and numbers
              const getComparisonValue = (val: string) => {
                if (val.startsWith('"') && val.endsWith('"')) {
                  return val.slice(1, -1) // Remove quotes
                }
                if (val.startsWith("'") && val.endsWith("'")) {
                  return val.slice(1, -1) // Remove quotes
                }
                if (!isNaN(Number(val))) {
                  return Number(val) // Convert to number
                }
                // Try to find in context
                return contextData[val] !== undefined ? contextData[val] : val
              }

              const leftEval = getComparisonValue(leftValue)
              const rightEval = getComparisonValue(rightValue)

              // Perform the comparison
              switch (operator) {
                case '==':
                  conditionResult = leftEval == rightEval
                  break
                case '!=':
                  conditionResult = leftEval != rightEval
                  break
                case '>':
                  conditionResult = Number(leftEval) > Number(rightEval)
                  break
                case '<':
                  conditionResult = Number(leftEval) < Number(rightEval)
                  break
                case '>=':
                  conditionResult = Number(leftEval) >= Number(rightEval)
                  break
                case '<=':
                  conditionResult = Number(leftEval) <= Number(rightEval)
                  break
              }

              debugInfo = `${leftEval} ${operator} ${rightEval}`
            } else {
              // Try to evaluate as a boolean expression
              // If it's just a variable name, check if the value is truthy
              if (conditionText in contextData) {
                conditionResult = Boolean(contextData[conditionText])
                debugInfo = `Variable '${conditionText}' is ${
                  conditionResult ? 'truthy' : 'falsy'
                }`
              } else {
                // As a last resort, use a safer approach than eval
                try {
                  // Convert to a boolean result
                  conditionResult = Boolean(
                    new Function(
                      'context',
                      `
                      "use strict";
                      with (context) {
                        return (${conditionText});
                      }
                    `
                    )(contextData)
                  )
                } catch {
                  conditionResult = false
                }
                debugInfo = conditionText
              }
            }
          } catch (e) {
            console.error(`Error evaluating condition: ${e}`)
            conditionResult = false
            debugInfo = `Error: ${e}`
          }

          // We can optionally show condition evaluation info in developer mode
          console.log(
            `Condition '${conditionName}' evaluated: ${debugInfo} = ${conditionResult}`
          )

          // Only follow edges with matching condition result
          const outgoingEdges = nodeOutgoingEdges[nodeId] || []
          const filteredEdges = outgoingEdges.filter(edge => {
            if (node.type === 'yes_no_condition') {
              // For yes/no condition nodes, use all handles including side handles
              // Add debug logging to help trace handle matching
              const isMatchingYesHandle =
                conditionResult &&
                (edge.sourceHandle === 'yes' ||
                  edge.sourceHandle === 'handle-yes' ||
                  edge.sourceHandle === 'handle-yes-side')
              const isMatchingNoHandle =
                !conditionResult &&
                (edge.sourceHandle === 'no' ||
                  edge.sourceHandle === 'handle-no' ||
                  edge.sourceHandle === 'handle-no-side')

              if (isMatchingYesHandle || isMatchingNoHandle) {
                console.log(
                  `Following edge ${edge.id} from yes/no condition node ${nodeId} with handle: ${edge.sourceHandle}, condition result: ${conditionResult}`
                )
              }

              return isMatchingYesHandle || isMatchingNoHandle
            } else {
              // For regular condition nodes, use 'true' and 'false' handle IDs
              return (
                (conditionResult && edge.sourceHandle === 'true') ||
                (!conditionResult && edge.sourceHandle === 'false')
              )
            }
          })

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
    [addOutputMessage, processMessage, waitForUserInput]
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

  // Helper function to delete from localStorage
  const deleteFromLocalStorage = useCallback((name: string): boolean => {
    // Get existing saved workflows
    const existingSaved = localStorage.getItem(SAVED_WORKFLOWS_KEY)
    if (!existingSaved) return false

    try {
      const savedData = JSON.parse(existingSaved)
      if (!savedData[name]) return false

      // Delete the workflow
      delete savedData[name]

      // Save back to localStorage
      localStorage.setItem(SAVED_WORKFLOWS_KEY, JSON.stringify(savedData))

      // Update state
      setSavedWorkflows(Object.keys(savedData))
      return true
    } catch (e) {
      console.error('Error deleting workflow from localStorage:', e)
      return false
    }
  }, [])

  // Delete a workflow from localStorage only
  const deleteWorkflow = useCallback(
    (name: string): boolean => {
      console.log(`Deleting workflow "${name}" for user ${currentUserId}`)

      // Always delete from localStorage in this simplified version
      return deleteFromLocalStorage(name)
    },
    [currentUserId, deleteFromLocalStorage]
  )

  // Update workflow name
  const updateWorkflowName = useCallback(
    (oldName: string, newName: string): boolean => {
      if (newName.trim() === '' || oldName === newName) return false

      // Get existing saved workflows
      const existingSaved = localStorage.getItem(SAVED_WORKFLOWS_KEY)
      if (!existingSaved) return false

      try {
        const savedData = JSON.parse(existingSaved)
        if (!savedData[oldName]) return false

        // Don't overwrite existing workflow with the new name
        if (savedData[newName]) return false

        // Move workflow data to new name
        savedData[newName] = savedData[oldName]
        delete savedData[oldName]

        // Save back to localStorage
        localStorage.setItem(SAVED_WORKFLOWS_KEY, JSON.stringify(savedData))

        // Update state
        setSavedWorkflows(Object.keys(savedData))
        return true
      } catch (e) {
        console.error('Error updating workflow name', e)
        return false
      }
    },
    []
  )

  const contextValue: WorkflowContextType = {
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
    clearOutput,
    submitUserInput
  }

  return (
    <WorkflowContext.Provider value={contextValue}>
      {children}
    </WorkflowContext.Provider>
  )
}
