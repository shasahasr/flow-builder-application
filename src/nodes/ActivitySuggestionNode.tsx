import { useEffect, useState } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'

// Define the specific properties for our node's data
export interface ActivitySuggestionNodeSpecificData {
  label: string
  cityName?: string
  temperature?: number // Temperature in Fahrenheit
  suggestion?: string // Combined suggestion from API
  isLoading?: boolean
  error?: string | null
}

// Intersect with Record<string, unknown> to satisfy React Flow's constraints
export type ActivitySuggestionNodeData = ActivitySuggestionNodeSpecificData &
  Record<string, unknown>

// Define the full Node type for this custom node
type CustomActivityNode = Node<ActivitySuggestionNodeData, 'activitySuggestion'>

// IMPORTANT: In a production environment, API keys should NOT be handled client-side.
// This should be done via a backend server to protect your API key.
// For local development/demo, ensure VITE_OPENAI_API_KEY is set in your .env file.
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY

const fetchSuggestionsFromOpenAI = async (
  city: string,
  tempF: number
): Promise<string> => {
  if (!OPENAI_API_KEY) {
    console.error(
      'OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your .env file.'
    )
    throw new Error('OpenAI API key not configured.')
  }

  console.log(
    `ActivityNode: Fetching suggestions from OpenAI for ${city} at ${tempF}°F`
  )

  try {
    // Check if we're using a project-based API key (starts with 'sk-proj-')
    // New format requires slightly different headers
    const isProjectKey = OPENAI_API_KEY.startsWith('sk-proj-')

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`
    }

    // Add 'OpenAI-Beta: assistants=v1' header for project-based keys if needed
    if (isProjectKey) {
      console.log('Using project-based OpenAI API key format')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // Fallback to a more widely available model
        messages: [
          {
            role: 'system',
            content:
              'You are an assistant that provides activity and clothing suggestions based on city and temperature. Structure your answer with "Activity:" and "Clothing:" labels.'
          },
          {
            role: 'user',
            content: `The temperature in ${city} is ${tempF}°F. What is a suitable activity and what should I wear?`
          }
        ],
        max_tokens: 150 // Adjust as needed
      })
    })

    if (!response.ok) {
      let errorMessage = `OpenAI API request failed with status ${response.status}`
      try {
        const errorData = await response.json()
        console.error('OpenAI API Error:', errorData)

        if (errorData.error?.message) {
          errorMessage = errorData.error.message
        } else if (errorData.error?.code) {
          errorMessage = `Error ${errorData.error.code}: ${
            errorData.error.message || 'Unknown error'
          }`
        } else if (errorData.message) {
          errorMessage = errorData.message
        }
      } catch (jsonError) {
        console.error('Failed to parse error response:', jsonError)
        // Just use the status code message if we can't parse the JSON
      }

      throw new Error(errorMessage)
    }

    const data = await response.json()
    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
      return data.choices[0].message.content.trim()
    } else {
      throw new Error('No suggestion received from OpenAI API.')
    }
  } catch (error) {
    console.error('Error fetching suggestions from OpenAI:', error)

    // Provide fallback suggestions based on temperature range
    let fallbackSuggestion = ''
    if (tempF >= 80) {
      fallbackSuggestion =
        "Activity: Since it's quite hot, consider indoor activities like visiting museums, shopping centers, or enjoying a water park or pool if available.\n\nClothing: Wear light, breathable fabrics like cotton or linen. Shorts, t-shirts, sundresses, and don't forget a hat and sunscreen!"
    } else if (tempF >= 65) {
      fallbackSuggestion =
        'Activity: The weather is pleasant! Great for outdoor dining, parks, hiking, or sightseeing around the city.\n\nClothing: Light layers work best - a t-shirt with a light jacket or sweater that you can remove if it gets warmer.'
    } else if (tempF >= 45) {
      fallbackSuggestion =
        "Activity: The weather is a bit cool. Consider visiting indoor attractions, coffee shops, or light outdoor activities if dressed appropriately.\n\nClothing: You'll need layers - jeans or pants, a long-sleeve shirt, and a medium-weight jacket."
    } else {
      fallbackSuggestion =
        "Activity: It's cold! Indoor activities are best - museums, theaters, restaurants, or indoor shopping.\n\nClothing: Bundle up with a heavy coat, scarf, gloves, and a hat. Layer underneath with warm sweaters."
    }

    return `(Using offline suggestions)\n\n${fallbackSuggestion}`
  }
}

function ActivitySuggestionNode ({
  id,
  data,
  isConnectable
}: NodeProps<CustomActivityNode>) {
  const { label, cityName, temperature } =
    data as ActivitySuggestionNodeSpecificData

  const [suggestion, setSuggestion] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cityName && temperature !== undefined) {
      if (!OPENAI_API_KEY) {
        setError(
          'OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file.'
        )
        setIsLoading(false)
        setSuggestion(undefined)
        return
      }
      setIsLoading(true)
      setError(null)
      setSuggestion(undefined) // Clear previous suggestion

      fetchSuggestionsFromOpenAI(cityName, temperature)
        .then(fetchedSuggestion => {
          setSuggestion(fetchedSuggestion)
          setIsLoading(false)
        })
        .catch(err => {
          const errorMessage =
            err instanceof Error ? err.message : 'Failed to fetch suggestions'
          console.error(`ActivityNode (id: ${id}): Error: `, errorMessage)
          setError(errorMessage)
          setSuggestion(undefined)
          setIsLoading(false)
        })
    } else {
      // Clear suggestions if city or temperature is missing
      setSuggestion(undefined)
      setIsLoading(false)
      setError(null)
    }
  }, [cityName, temperature, id])

  console.log(
    `ActivityNode (id: ${id}) rendering with: `,
    `isLoading: ${isLoading}, `,
    `error: ${error}, `,
    `cityName: ${cityName}, `,
    `temperature: ${temperature}, `,
    `suggestion: ${suggestion}`
  )

  // Helper to format suggestion text with line breaks
  const formatSuggestion = (text?: string) => {
    if (!text) return null
    return text.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        <br />
      </span>
    ))
  }

  return (
    <div
      style={{
        border: '1px solid #4CAF50', // Green border
        padding: '15px',
        borderRadius: '8px',
        background: 'white',
        width: 350,
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        minHeight: '200px',
        fontSize: '14px' // Slightly smaller font for potentially more text
      }}
    >
      <Handle
        type='target'
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ background: '#555' }}
      />
      <div style={{ marginBottom: '10px', textAlign: 'center' }}>
        <strong
          style={{ display: 'block', marginBottom: '10px', color: '#4CAF50' }}
        >
          {label || 'AI Activity & Outfit Suggestions'}
        </strong>

        {isLoading && <p>AI is thinking...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}

        {!isLoading && !error && suggestion && (
          <div style={{ textAlign: 'left', whiteSpace: 'pre-wrap' }}>
            {formatSuggestion(suggestion)}
          </div>
        )}
        {!isLoading &&
          !error &&
          !suggestion &&
          cityName &&
          temperature !== undefined &&
          OPENAI_API_KEY && (
            <p>
              Waiting for valid city and temperature to generate suggestions...
            </p>
          )}
        {!isLoading && !error && !suggestion && !OPENAI_API_KEY && (
          <p style={{ color: 'orange' }}>
            OpenAI API Key not configured. Please check console.
          </p>
        )}
        {!isLoading &&
          !error &&
          !suggestion &&
          (!cityName || temperature === undefined) && (
            <p>Connect to weather data to get suggestions.</p>
          )}
      </div>
      {/* <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} style={{ background: '#555' }} /> */}
    </div>
  )
}

export default ActivitySuggestionNode
