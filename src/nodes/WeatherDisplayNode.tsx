import { useEffect } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'

// Define the specific properties for our node's data
export interface WeatherDisplayNodeSpecificData {
  label: string
  cityName?: string
  // weatherData?: any; // Replaced by specific fields
  temperature?: number
  humidity?: number
  windSpeed?: number
  isLoading?: boolean
  error?: string | null
  // Callback to update its own data in App.tsx
  onWeatherDataChange?: (
    nodeId: string,
    data: Partial<
      Omit<
        WeatherDisplayNodeSpecificData,
        'label' | 'cityName' | 'onWeatherDataChange'
      >
    >
  ) => void
}

// Intersect with Record<string, unknown> to satisfy React Flow's constraints
// while keeping our specific properties strongly typed.
export type WeatherDisplayNodeData = WeatherDisplayNodeSpecificData &
  Record<string, unknown>

// Define the full Node type for this custom node.
// 'weatherDisplay' should match the type string used when registering this node type.
type CustomWeatherNode = Node<WeatherDisplayNodeData, 'weatherDisplay'>

// Use NodeProps with our full custom node type for strong typing
function WeatherDisplayNode ({
  id, // Added id to pass to onWeatherDataChange
  data,
  isConnectable
}: NodeProps<CustomWeatherNode>) {
  const {
    label,
    cityName,
    temperature,
    humidity,
    windSpeed,
    isLoading,
    error,
    onWeatherDataChange
  } = data as WeatherDisplayNodeSpecificData

  useEffect(() => {
    if (!onWeatherDataChange) return // Callback not ready

    if (!cityName) {
      // Clear previous data if city name is removed
      // Check if there is actually data to clear to prevent unnecessary updates
      if (
        temperature !== undefined ||
        humidity !== undefined ||
        windSpeed !== undefined ||
        error !== null ||
        isLoading
      ) {
        onWeatherDataChange(id, {
          temperature: undefined,
          humidity: undefined,
          windSpeed: undefined,
          isLoading: false,
          error: null
        })
      }
      return
    }

    const fetchWeather = async () => {
      console.log(`WeatherNode (id: ${id}): Fetching weather for ${cityName}`)
      onWeatherDataChange(id, { isLoading: true, error: null })
      try {
        // 1. Geocode city name to get latitude and longitude
        console.log(`WeatherNode (id: ${id}): Geocoding ${cityName}`)
        const geoResponse = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            cityName
          )}&count=1&language=en&format=json`
        )
        console.log(
          `WeatherNode (id: ${id}): GeoResponse status: ${geoResponse.status}`
        )
        if (!geoResponse.ok) {
          const errorText = await geoResponse.text()
          throw new Error(
            `Geocoding failed: ${geoResponse.status} ${geoResponse.statusText}. Response: ${errorText}`
          )
        }
        const geoData = await geoResponse.json()
        console.log(`WeatherNode (id: ${id}): GeoData: `, geoData)

        if (!geoData.results || geoData.results.length === 0) {
          throw new Error(`Could not find location: ${cityName}`)
        }
        const { latitude, longitude } = geoData.results[0]
        console.log(
          `WeatherNode (id: ${id}): Lat: ${latitude}, Lon: ${longitude}`
        )

        // 2. Fetch weather data
        console.log(`WeatherNode (id: ${id}): Fetching weather for lat,lon`)
        const weatherApiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timeformat=iso8601&timezone=auto`
        console.log(
          `WeatherNode (id: ${id}): Weather API URL: ${weatherApiUrl}`
        )
        const weatherResponse = await fetch(weatherApiUrl)
        console.log(
          `WeatherNode (id: ${id}): WeatherResponse status: ${weatherResponse.status}`
        )
        if (!weatherResponse.ok) {
          const errorText = await weatherResponse.text()
          throw new Error(
            `Fetching weather failed: ${weatherResponse.status} ${weatherResponse.statusText}. Response: ${errorText}`
          )
        }
        const weatherData = await weatherResponse.json()
        console.log(`WeatherNode (id: ${id}): WeatherData: `, weatherData)

        if (weatherData.current) {
          const payload = {
            temperature: weatherData.current.temperature_2m,
            humidity: weatherData.current.relative_humidity_2m,
            windSpeed: weatherData.current.wind_speed_10m,
            isLoading: false,
            error: null
          }
          console.log(`WeatherNode (id: ${id}): Success payload: `, payload)
          onWeatherDataChange(id, payload)
        } else {
          throw new Error(
            'Weather data format incorrect. Missing current weather.'
          )
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An unknown error occurred'
        console.error(
          `WeatherNode (id: ${id}): Error fetching weather: `,
          errorMessage
        )
        const errorPayload = {
          isLoading: false,
          error: errorMessage,
          temperature: undefined,
          humidity: undefined,
          windSpeed: undefined
        }
        console.log(`WeatherNode (id: ${id}): Error payload: `, errorPayload)
        onWeatherDataChange(id, errorPayload)
      }
    }

    fetchWeather()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityName, id, onWeatherDataChange]) // Intentionally not including temperature, humidity, etc. to avoid loops

  console.log(
    `WeatherNode (id: ${id}) rendering with: `,
    `isLoading: ${isLoading}, `,
    `error: ${error}, `,
    `cityName: ${cityName}, `,
    `temperature: ${temperature}, `,
    `humidity: ${humidity}, `,
    `windSpeed: ${windSpeed}`
  )

  return (
    <div
      style={{
        border: '1px solid #1E90FF', // Blue border for weather node
        padding: '15px',
        borderRadius: '8px',
        background: 'white',
        width: 300, // Slightly wider for more content
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        minHeight: '140px' // Adjusted min height
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
          style={{ display: 'block', marginBottom: '10px', color: '#1E90FF' }}
        >
          {label || 'Weather Information'}
        </strong>

        {isLoading && <p>Loading weather data...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}

        {!isLoading &&
          !error &&
          temperature !== undefined &&
          humidity !== undefined &&
          windSpeed !== undefined && (
            <div style={{ textAlign: 'left' }}>
              <p>Temperature: {temperature}°F</p>
              <p>Humidity: {humidity}%</p>
              <p>Wind Speed: {windSpeed} mph</p>
            </div>
          )}
        {/* More specific waiting messages */}
        {!isLoading &&
          !error &&
          cityName &&
          temperature === undefined &&
          !error && <p>Fetching data for {cityName}...</p>}
        {!cityName && !isLoading && !error && <p>Waiting for city input...</p>}
      </div>
      <Handle
        type='source'
        position={Position.Bottom}
        isConnectable={isConnectable}
        style={{ background: '#555' }}
      />
    </div>
  )
}

export default WeatherDisplayNode
