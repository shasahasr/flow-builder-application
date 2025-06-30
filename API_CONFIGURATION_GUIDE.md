# API Configuration Guide for Flow Builder

This guide explains how to configure API Call nodes in the Flow Builder to work with various APIs like weather services and ChatGPT.

## Overview

The Flow Builder is now completely generic - it doesn't have any hardcoded API logic. All API calls must be configured by you through the flow builder interface. This gives you complete control over how APIs are called and how responses are formatted.

## Generic API Call Node Configuration

Each API Call node has the following configuration options:

- **Name**: Display name for the node
- **URL**: The complete API endpoint URL
- **Method**: HTTP method (GET, POST, PUT, DELETE, etc.)
- **Headers**: JSON object with request headers
- **Payload**: JSON object with request body data
- **Response Path**: Dot notation path to extract specific data from the response
- **Result Message**: Template for displaying the result (use `${result}` to include the extracted data)
- **Save as Variable**: Option to save the response for use in other nodes
- **Variable Name**: Name for the saved variable

## Weather API Configuration (Open-Meteo)

### Step 1: Get City Coordinates
First, create an API Call node to get coordinates for a city:

**Node Configuration:**
- **Name**: Get City Coordinates
- **URL**: `https://geocoding-api.open-meteo.com/v1/search?name=${location}&count=1&language=en&format=json`
- **Method**: GET
- **Headers**: `{}`
- **Payload**: `{}`
- **Response Path**: `results.0`
- **Result Message**: `Found coordinates for ${result.name}, ${result.country}: ${result.latitude}, ${result.longitude}`
- **Save as Variable**: ✓ (checked)
- **Variable Name**: `cityCoords`

### Step 2: Get Weather Data
Create another API Call node to get weather data using the coordinates:

**Node Configuration:**
- **Name**: Get Weather
- **URL**: `https://api.open-meteo.com/v1/forecast?latitude=${cityCoords.latitude}&longitude=${cityCoords.longitude}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=auto`
- **Method**: GET
- **Headers**: `{}`
- **Payload**: `{}`
- **Response Path**: `current_weather`
- **Result Message**: `Current weather: ${result.temperature}°C, Wind: ${result.windspeed} km/h, Weather code: ${result.weathercode}`
- **Save as Variable**: ✓ (checked)
- **Variable Name**: `weather`

### Complete Weather Flow Example:
1. Input Parameter Node → Ask for city name (save as `location`)
2. API Call Node → Get coordinates (using `${location}`)
3. API Call Node → Get weather (using `${cityCoords.latitude}` and `${cityCoords.longitude}`)
4. Display Message Node → Show formatted weather info

## ChatGPT API Configuration (OpenAI)

### Prerequisites:
- You need an OpenAI API key
- Add your API key to the `.env` file: `VITE_OPENAI_API_KEY=your_api_key_here`

### API Call Node Configuration:

**Node Configuration:**
- **Name**: ChatGPT Request
- **URL**: `https://api.openai.com/v1/chat/completions`
- **Method**: POST
- **Headers**: 
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer ${VITE_OPENAI_API_KEY}"
}
```
- **Payload**: 
```json
{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful fashion assistant. Provide clothing recommendations based on weather conditions."
    },
    {
      "role": "user",
      "content": "The weather is ${weather.temperature}°C with wind speed ${weather.windspeed} km/h. What should I wear?"
    }
  ],
  "max_tokens": 150
}
```
- **Response Path**: `choices.0.message.content`
- **Result Message**: `Fashion recommendation: ${result}`
- **Save as Variable**: ✓ (checked)
- **Variable Name**: `chatgptResponse`

### Complete ChatGPT Flow Example:
1. Input Parameter Node → Ask for city name
2. API Call Node → Get coordinates
3. API Call Node → Get weather data
4. API Call Node → Get ChatGPT outfit recommendation (using weather data)
5. Display Message Node → Show the recommendation

## Variable Usage

You can use variables from previous nodes in your API configurations:

- `${variableName}` - Use the entire variable value
- `${variableName.property}` - Access a specific property of an object
- `${variableName.nested.property}` - Access nested properties

## Environment Variables

For API keys and sensitive data, use environment variables:

1. Add to `.env` file: `VITE_API_KEY=your_secret_key`
2. Use in headers or payload: `${VITE_API_KEY}`

## Error Handling

If an API call fails:
- The error will be displayed in the chat output
- The workflow will stop at that node
- Check the browser console for detailed error information

## Tips for Success

1. **Test your JSON**: Make sure your headers and payload are valid JSON
2. **Check API documentation**: Each API has specific requirements for headers, methods, and payload structure
3. **Use small steps**: Break complex API interactions into multiple nodes
4. **Save intermediate results**: Use the "Save as Variable" option to store data for later nodes
5. **Validate responses**: Check the actual API response structure to set the correct response path

## Common Patterns

### Sequential API Calls:
Input → API Call 1 → API Call 2 (using result from 1) → Display

### Conditional API Calls:
Input → API Call → Condition Node → Different API calls based on condition

### Multiple Data Sources:
Input → API Call 1 → API Call 2 → Combine results → Display

## Troubleshooting

**Common Issues:**
- **Invalid JSON**: Check your headers and payload for proper JSON syntax
- **CORS errors**: Some APIs don't allow browser requests - you may need a proxy
- **Rate limits**: Some APIs have request limits
- **Wrong response path**: Check the actual API response structure
- **Missing variables**: Make sure referenced variables exist from previous nodes

**Debugging Tips:**
- Use the browser's Network tab to see actual requests
- Check the console for detailed error messages
- Test API calls with curl or Postman first
- Start with simple requests and add complexity gradually
