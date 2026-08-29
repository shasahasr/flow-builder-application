# AI Agent Flow Builder

A visual editor for building conversational AI agents. Users assemble agents from drag-and-drop nodes on a canvas, wire them together into a workflow, and test the result in a live chat panel. Workflows execute as a directed graph with branching logic, variable passing, and calls out to external APIs.

Built during a Software Engineering internship at Ascendo AI, summer 2025.

## Stack

React 18, TypeScript, Vite, React Flow (@xyflow/react) for the canvas, Clerk for authentication, and Firebase Firestore for per-user workflow storage.

## Features

- Drag-and-drop canvas for composing agent workflows
- Live chat panel for testing an agent as you build it
- Conditional branching with true/false execution paths
- Variables that persist across nodes and can be referenced anywhere
- API Call nodes supporting GET, POST, PUT, DELETE, and PATCH
- Per-user workflow save, load, rename, and delete
- Email and password authentication

## How workflow execution works

The execution engine lives in `src/workflow/WorkflowContext.tsx`. Running a workflow is a depth-first traversal of the node graph starting from the entry node.

Each node executes, produces output, and passes a context object down its outgoing edges. Child executions merge their context back up, so a value produced early in the graph stays available to every node downstream. Conditional nodes evaluate their expression and follow only the matching edge, which is how branching paths stay isolated from one another.

Variables use `${variableName}` syntax and resolve at execution time. Nested values are reachable with dot notation, so an API response can be referenced as `${apiResponse.data.name}` inside a later message node.

## API integration

API Call nodes hit external services and feed the results back into the workflow.

- Configure a URL, HTTP method, payload, and optional API key
- Presets for OpenAI and Open-Meteo configure endpoints automatically
- Response Path pulls a specific value out of a nested response using dot notation
- Extracted values save as variables for use in any downstream node

Browser CORS restrictions are handled by attempting a direct call first, then falling back through several public proxies. A production deployment should run its own proxy instead.

## Running locally

```bash
npm install
npm run dev
```

Authentication requires a Clerk publishable key. Create an application at [clerk.com](https://clerk.com/), enable email and password sign-in, add `http://localhost:5173/*` as an allowed redirect URL, then create a `.env.local` file:

```
VITE_CLERK_PUBLISHABLE_KEY=your_publishable_key_here
```

Firestore configuration lives in `src/firebase/config.ts`.

## Project layout

```
src/
  workflow/     execution engine, canvas controls, output panel
  nodes/        node type definitions, styling, condition evaluation
  auth/         Clerk integration, login and signup, route guards
  firebase/     Firestore persistence layer
  components/   modals and shared UI
  hooks/        workflow state management
```

## Credits

Canvas scaffolding started from the [xyflow vite-react-flow-template](https://github.com/xyflow/vite-react-flow-template). The workflow engine, node system, authentication, persistence layer, and API integration were built on top of it.
