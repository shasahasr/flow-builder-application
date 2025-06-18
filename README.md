![](https://github.com/xyflow/web/blob/main/assets/codesandbox-header-ts.png?raw=true)

# AI Agent Flow Builder

An interactive flow builder for creating AI agent workflows with a chat interface. Build blocks that act as instructions for the bot, handle user interactions, and make API calls.

## Authentication Setup

This application uses [Clerk](https://clerk.com/) for authentication. Follow these steps to set it up:

1. Create a Clerk account at [clerk.com](https://clerk.com/)
2. Create a new application in the Clerk dashboard
3. Get your publishable key from the Clerk dashboard
4. Add your key to the `.env.local` file:

```
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
```

5. Configure your Clerk application settings in the dashboard:
   - Enable Email/Password authentication
   - Set allowed redirect URLs for your development environment (e.g., http://localhost:5173/*)

## Features

- Drag-and-drop interface to build AI agent workflows
- Chat interface for testing your agent
- User authentication with Clerk
- Save, load, and manage workflows (rename, delete)
- Dynamic API integration with documentation parsing
- Variable saving and referencing
- Scrollable chat interface

## API Integration

The API Call node allows you to connect to external APIs and integrate their responses into your workflow:

1. **Basic Configuration**:
   - Set the API URL endpoint
   - Choose HTTP method (GET, POST, PUT, DELETE, PATCH)
   - Configure payload for non-GET requests
   - Optionally provide an API key for authentication

2. **API Integration**:
   - Choose from supported API types: OpenAI/ChatGPT and Open-Meteo Weather
   - Select from predefined API functions for each service
   - Automatically configures endpoints based on selected function
   - Customize API calls with parameters, headers, and authentication

3. **Response Handling**:
   - Extract specific data from complex responses using Response Path (dot notation)
   - Save responses as variables to use in other blocks
   - Reference API response data in message blocks with `${variableName}` syntax

4. **CORS Considerations**:
   - The application attempts to handle CORS issues automatically using multiple proxies
   - When making API calls to external domains, the system will try:
     - Direct API call
     - CORS Anywhere proxy
     - AllOrigins proxy
     - HTMLDriven proxy
   - For production, consider setting up your own CORS proxy server

## Working with Variables

Variables allow you to store and reference data throughout your workflow:

1. **Creating Variables**:
   - Use Input Parameter blocks with "Save as custom variable" enabled
   - Configure API Call blocks to save responses as variables
   - Variables are accessible in the entire workflow after they're created

2. **Using Variables**:
   - Reference variables in any block using `${variableName}` syntax
   - Access nested properties with dot notation: `${apiResponse.data.name}`
   - Use variables in API payloads, URLs, and message blocks

## Workflow Management

You can save and manage your workflow configurations:

1. **Saving Workflows**:
   - Enter a workflow name and click "Save Workflow"
   - Workflows are stored locally in your browser's localStorage

2. **Loading Workflows**:
   - Select a saved workflow from the dropdown
   - Click "Load Workflow" to restore the entire flow configuration

3. **Managing Workflows**:
   - Rename: Select a workflow and click "Rename" to change its name
   - Delete: Select a workflow and click "Delete" to remove it permanently

4. **Chat Interface**:
   - The chat output area is scrollable with a fixed height
   - See real-time messages as your workflow executes

## Getting up and running

You can get this template without forking/cloning the repo using `degit`:

```bash
npx degit xyflow/vite-react-flow-template your-app-name
```

The template contains mostly the minimum dependencies to get up and running, but
also includes eslint and some additional rules to help you write React code that
is less likely to run into issues:

```bash
npm install # or `pnpm install` or `yarn install`
```

Vite is a great development server and build tool that we recommend our users to
use. You can start a development server with:

```bash
npm run dev
```

While the development server is running, changes you make to the code will be
automatically reflected in the browser!

## Things to try:

- Create a new custom node inside `src/nodes/` (don't forget to export it from `src/nodes/index.ts`).
- Change how things look by [overriding some of the built-in classes](https://reactflow.dev/learn/customization/theming#overriding-built-in-classes).
- Add a layouting library to [position your nodes automatically](https://reactflow.dev/learn/layouting/layouting)

## Resources

Links:

- [React Flow - Docs](https://reactflow.dev)
- [React Flow - Discord](https://discord.com/invite/Bqt6xrs)

Learn:

- [React Flow – Custom Nodes](https://reactflow.dev/learn/customization/custom-nodes)
- [React Flow – Layouting](https://reactflow.dev/learn/layouting/layouting)
