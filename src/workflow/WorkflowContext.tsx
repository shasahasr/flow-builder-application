import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import { Edge } from "@xyflow/react";
import { AppNode } from "../nodes/types";
import { WorkflowUtils } from "./WorkflowUtils";
import { WorkflowService } from "../firebase/workflowService";

// Chat message structure
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

// Define workflow state and context types
interface WorkflowContextType {
  workflowState: Record<string, unknown>;
  workflowOutput: string[];
  isExecuting: boolean;
  waitingForUserInput: boolean;
  executeWorkflow: (
    nodes: AppNode[],
    edges: Edge[],
    onPreviewOpen?: () => void
  ) => Promise<void>;
  stopWorkflow: () => void;
  clearOutput: () => void;
  submitUserInput: (text: string) => void;
}

// Create the context with default values
export const WorkflowContext = createContext<WorkflowContextType>({
  workflowState: {},
  workflowOutput: [],
  isExecuting: false,
  waitingForUserInput: false,
  executeWorkflow: async () => {},
  stopWorkflow: () => {},
  clearOutput: () => {},
  submitUserInput: () => {},
});

// Hook to use workflow context
export const useWorkflow = () => useContext(WorkflowContext);

// Provider component
export const WorkflowProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [workflowState, setWorkflowState] = useState<Record<string, unknown>>(
    {}
  );
  const [workflowOutput, setWorkflowOutput] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [waitingForUserInput, setWaitingForUserInput] = useState(false);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  // Use refs to store callback functions for handling user input
  const userInputResolveRef = useRef<((value: string) => void) | null>(null);

  // Clear output messages
  const clearOutput = useCallback(() => {
    setWorkflowOutput([]);
    // Clear any active LLM conversation handler and reset conversation
    (window as any).currentLLMHandler = null;
    setWaitingForUserInput(false);
  }, []);

  // Function to handle user input submission
  const submitUserInput = useCallback((text: string) => {
    // Add the user's message to the output
    addOutputMessage(text, "user");

    // Check if we have an active LLM conversation handler
    if ((window as any).currentLLMHandler) {
      // Handle the conversation with the LLM
      (window as any).currentLLMHandler(text);
    } else if (userInputResolveRef.current) {
      // Fallback to the original promise-based user input handling
      userInputResolveRef.current(text);
      userInputResolveRef.current = null;
      setWaitingForUserInput(false);
    }
  }, []);

  // Helper function to process a message with variable replacements
  const processMessage = useCallback(
    (message: string, contextData: Record<string, unknown>): string => {
      // Replace variables in the format ${variableName} with their values from context
      return WorkflowUtils.evaluateExpression(message, contextData);
    },
    []
  );

  // Function to add a message to the workflow output formatted for the chat UI
  const addOutputMessage = useCallback(
    (message: string, role: "user" | "assistant" = "assistant") => {
      const messageObj = {
        role,
        content: message,
        timestamp: new Date().toISOString(),
      };
      const jsonMessage = JSON.stringify(messageObj);
      console.log(`📝 DEBUG: Adding message to output:`, jsonMessage);
      setWorkflowOutput((prev) => [...prev, jsonMessage]);
    },
    []
  );

  // Function to wait for user input (will be connected to the chat UI)
  const waitForUserInput = useCallback(
    (question: string): Promise<string> => {
      // Add the question to the output as an assistant message
      addOutputMessage(question, "assistant");

      // Set waiting state to true
      setWaitingForUserInput(true);

      // Return a promise that resolves when the user enters input
      return new Promise<string>((resolve) => {
        // Store the resolve function in the ref
        userInputResolveRef.current = resolve;
      });
    },
    [addOutputMessage]
  );

  // Helper function to execute a single node
  const executeNode = useCallback(
    async (
      nodeId: string,
      nodeMap: Record<string, AppNode>,
      nodeOutgoingEdges: Record<string, Edge[]>,
      contextData: Record<string, unknown>
    ): Promise<Record<string, unknown>> => {
      const node = nodeMap[nodeId];
      if (!node) return contextData;

      // Update workflow state with context data
      setWorkflowState((prev) => ({ ...prev, ...contextData }));

      const nextContextData: Record<string, unknown> = { ...contextData };

      // Execute node based on type
      switch (node.type) {
        case "display_message": {
          // Get message from node data and process any variables
          let message = (node.data?.message as string) || "No message provided";
          message = processMessage(message, contextData);

          console.log(
            `🔧 DEBUG: Executing display_message node with message: "${message}"`
          );

          // Add as an assistant message
          addOutputMessage(message, "assistant");

          // Add a small delay to prevent React state batching issues
          await new Promise((resolve) => setTimeout(resolve, 1));

          break;
        }

        case "input_parameter": {
          // Get the question from node data and process any variables
          const paramName = (node.data?.paramName as string) || "parameter";
          let question =
            (node.data?.question as string) ||
            `Please provide a value for ${paramName}:`;
          question = processMessage(question, contextData);

          // Check if we should save as a custom variable
          const saveAsVariable = node.data?.saveAsVariable as boolean;
          let variableName = node.data?.variableName as string;

          // If no custom variable name is provided, use the parameter name
          if (saveAsVariable && (!variableName || variableName.trim() === "")) {
            variableName = paramName;
          }

          // Wait for user input
          const userInput = await waitForUserInput(question);

          // Store the user's input in the context
          nextContextData[paramName] = userInput;

          // If saveAsVariable is true, also store with the custom variable name
          if (saveAsVariable && variableName && variableName !== paramName) {
            nextContextData[variableName] = userInput;

            // Don't show variable saving notifications to keep chat clean
            console.log(
              `Input saved as variable: ${variableName} = "${userInput}"`
            );
          }
          break;
        }

        case "api_call": {
          try {
            // Get API details from node data - now directly mapping to fetch parameters
            let url = "unspecified endpoint";
            let method = "GET";
            let headers = "{}";
            let payload = "{}";
            let responsePath = "";
            let resultMessage = "API call result: ${result}";
            let saveAsVariable = false;
            let variableName = "apiResponse";

            if (node.data && typeof node.data === "object") {
              if ("url" in node.data) url = node.data.url as string;
              if ("method" in node.data) method = node.data.method as string;
              if ("headers" in node.data) headers = node.data.headers as string;
              if ("payload" in node.data) payload = node.data.payload as string;
              if ("responsePath" in node.data)
                responsePath = node.data.responsePath as string;
              if ("resultMessage" in node.data)
                resultMessage = node.data.resultMessage as string;
              if ("saveAsVariable" in node.data)
                saveAsVariable = node.data.saveAsVariable as boolean;
              if ("variableName" in node.data)
                variableName = node.data.variableName as string;
            }

            // Process any variables in all fetch parameters
            url = processMessage(url, contextData);
            method = processMessage(method, contextData);
            headers = processMessage(headers, contextData);
            payload = processMessage(payload, contextData);
            resultMessage = processMessage(resultMessage, contextData);

            console.log(`Making API call to ${url}...`);

            // Parse the payload
            let payloadObj = {};
            try {
              if (payload && payload.trim() !== "") {
                payloadObj = JSON.parse(payload);
              }
            } catch (error) {
              // Only log parsing errors to console, not to chat output
              console.error(`Error parsing payload JSON: ${error}`);
              throw new Error(`Invalid payload JSON: ${error}`);
            }

            // Make a real API call
            let responseData;
            try {
              // Parse headers from JSON
              let parsedHeaders: Record<string, string> = {
                "Content-Type": "application/json",
              };

              try {
                if (headers && headers.trim() !== "") {
                  parsedHeaders = {
                    ...parsedHeaders,
                    ...JSON.parse(headers),
                  };
                }
              } catch (error) {
                console.error(`Error parsing headers JSON: ${error}`);
                // Continue with default headers
              }

              // Create request options with appropriate HTTP method from node data
              const requestOptions: RequestInit = {
                method: method,
                headers: parsedHeaders,
              };

              // Handle payload based on HTTP method
              if (
                method === "GET" ||
                method === "HEAD" ||
                method === "DELETE"
              ) {
                // For GET, HEAD, DELETE: convert payload to URL query parameters
                if (Object.keys(payloadObj).length > 0) {
                  const urlParams = new URLSearchParams();
                  Object.entries(payloadObj).forEach(([key, value]) => {
                    urlParams.append(key, String(value));
                  });

                  // Append parameters to URL
                  url = `${url}${
                    url.includes("?") ? "&" : "?"
                  }${urlParams.toString()}`;
                  console.log(`Using URL with query parameters: ${url}`);
                }
              } else {
                // For POST, PUT, PATCH: include payload in request body
                if (Object.keys(payloadObj).length > 0) {
                  requestOptions.body = JSON.stringify(payloadObj);
                  console.log(
                    `Adding request body: ${JSON.stringify(
                      payloadObj,
                      null,
                      2
                    )}`
                  );
                }
              }

              console.log(`Making API call to ${url}...`);

              // Make the fetch call
              const response = await fetch(url, requestOptions);

              // Check if response is ok
              if (!response.ok) {
                throw new Error(
                  `API returned status ${response.status}: ${response.statusText}`
                );
              }

              // Parse the response
              responseData = await response.json();

              console.log(
                `Received response from API. Status: ${response.status}`
              );
            } catch (error) {
              // If the API call fails, just show a failure message
              console.error(`API call failed: ${error}`);
              addOutputMessage(`API call failed: ${error}`, "assistant");
              break;
            }

            // Store the full response in the context
            nextContextData["apiResponse"] = responseData;

            // If saveAsVariable is true, store with the specified variable name
            if (saveAsVariable && variableName) {
              nextContextData[variableName] = responseData;
              console.log(`API response saved as variable: ${variableName}`);
            }

            // Extract specific data if a response path is provided
            let result: unknown = responseData;
            if (responsePath) {
              try {
                const pathParts = responsePath.split(".");
                for (const part of pathParts) {
                  if (result && typeof result === "object") {
                    result = (result as Record<string, unknown>)[part];
                  }
                }
              } catch (e) {
                console.error("Error extracting data from response path", e);
              }
            }

            // Store the extracted result separately
            nextContextData["result"] = result;

            // If saveAsVariable is true, also store the extracted result
            if (saveAsVariable && variableName) {
              nextContextData[`${variableName}_result`] = result;
            }

            // Use the custom result message or show the raw result
            const finalResultMessage = resultMessage
              ? WorkflowUtils.evaluateExpression(resultMessage, {
                  ...contextData,
                  result,
                })
              : `API result: ${JSON.stringify(result, null, 2)}`;

            // Add the result message to the output
            addOutputMessage(finalResultMessage, "assistant");
          } catch (error) {
            // Log error to console only, not to chat output
            console.error(`API call failed: ${error}`);

            // Add a simple failure message
            addOutputMessage(`API call failed: ${error}`, "assistant");
          }
          break;
        }

        case "llm_node": {
          try {
            // Get LLM details from node data
            let apiKey = "";
            let model = "gpt-3.5-turbo";
            let instructions = "";
            let tools: any[] = [];

            if (node.data && typeof node.data === "object") {
              if ("apiKey" in node.data) apiKey = node.data.apiKey as string;
              if ("model" in node.data) model = node.data.model as string;
              if ("instructions" in node.data)
                instructions = node.data.instructions as string;
              if ("tools" in node.data) tools = node.data.tools as any[];
            }

            if (!apiKey) {
              addOutputMessage(
                "API key is required for LLM calls",
                "assistant"
              );
              break;
            }

            if (!instructions.trim()) {
              addOutputMessage(
                "Agent instructions are required to start the conversation",
                "assistant"
              );
              break;
            }

            // Initialize conversation history for this session
            let conversationHistory: Array<{ role: string; content: string }> =
              [
                {
                  role: "system",
                  content: `${instructions}${
                    tools.length > 0
                      ? `\n\nYou have access to these tools:\n${tools
                          .map(
                            (tool) =>
                              `- ${tool.name}: ${tool.description} (${tool.method} ${tool.url})`
                          )
                          .join(
                            "\n"
                          )}\n\nWhen you need to use a tool to answer a user's question, respond with: TOOL_REQUEST: [exact_tool_name]\nAfter I provide the tool data, give a natural, helpful response based on that information.`
                      : ""
                  }`,
                },
              ];

            // Let the AI introduce itself naturally based on its instructions and tools
            try {
              // Ask the AI to introduce itself
              const introPrompt = {
                role: "user",
                content:
                  "Please introduce yourself briefly. Explain what you do and what you can help with based on your role and available tools. Keep it friendly and concise.",
              };

              conversationHistory.push(introPrompt);

              const response = await fetch(
                "https://api.openai.com/v1/chat/completions",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                  },
                  body: JSON.stringify({
                    model: model,
                    messages: conversationHistory,
                    max_tokens: 150,
                    temperature: 0.7,
                  }),
                  signal: abortController?.signal,
                }
              );

              if (response.ok) {
                const responseData = await response.json();
                const aiIntroduction =
                  responseData.choices?.[0]?.message?.content ||
                  "Hello! I'm your AI assistant. What can I help you with today?";

                // Add the AI's introduction to conversation history
                conversationHistory.push({
                  role: "assistant",
                  content: aiIntroduction,
                });

                // Display the introduction to user
                addOutputMessage(`🤖 ${aiIntroduction}`, "assistant");
              } else {
                // Fallback if API call fails
                const fallbackMessage =
                  "Hello! I'm your AI assistant. What can I help you with today?";
                conversationHistory.push({
                  role: "assistant",
                  content: fallbackMessage,
                });
                addOutputMessage(`🤖 ${fallbackMessage}`, "assistant");
              }
            } catch (error) {
              // Fallback if there's an error
              const fallbackMessage =
                "Hello! I'm your AI assistant. What can I help you with today?";
              conversationHistory.push({
                role: "assistant",
                content: fallbackMessage,
              });
              addOutputMessage(`🤖 ${fallbackMessage}`, "assistant");
            }

            // Set up conversational loop - wait for user input
            setWaitingForUserInput(true);

            // Set up the conversation handler for this LLM node
            const handleConversation = async (userMessage: string) => {
              try {
                console.log(`Processing user message: ${userMessage}`);

                // Add user message to conversation history
                conversationHistory.push({
                  role: "user",
                  content: userMessage,
                });

                // Make LLM call with full conversation history
                let response = await fetch(
                  "https://api.openai.com/v1/chat/completions",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                      model: model,
                      messages: conversationHistory,
                      max_tokens: 1500,
                      temperature: 0.7,
                    }),
                    signal: abortController?.signal,
                  }
                );

                if (!response.ok) {
                  throw new Error(
                    `OpenAI API returned status ${response.status}: ${response.statusText}`
                  );
                }

                let responseData = await response.json();
                let llmResponse =
                  responseData.choices?.[0]?.message?.content ||
                  "I'm not sure how to respond to that.";

                // Add LLM response to conversation history
                conversationHistory.push({
                  role: "assistant",
                  content: llmResponse,
                });

                // Check if the LLM wants to use a tool
                const toolRequestMatch = llmResponse.match(
                  /TOOL_REQUEST:\s*(.+?)(?:\n|$)/i
                );

                if (toolRequestMatch && tools.length > 0) {
                  const requestedToolName = toolRequestMatch[1].trim();

                  // Smart tool matching - find the best matching tool
                  const matchedTool = tools.find(
                    (tool) =>
                      tool.name.toLowerCase() ===
                        requestedToolName.toLowerCase() ||
                      tool.name
                        .toLowerCase()
                        .includes(requestedToolName.toLowerCase()) ||
                      requestedToolName
                        .toLowerCase()
                        .includes(tool.name.toLowerCase())
                  );

                  if (matchedTool) {
                    try {
                      // Don't show the technical TOOL_REQUEST message to user
                      // Instead, show a natural response indicating we're looking into it
                      const naturalResponse = llmResponse
                        .replace(/TOOL_REQUEST:\s*(.+?)(?:\n|$)/i, "")
                        .trim();
                      if (naturalResponse) {
                        addOutputMessage(naturalResponse, "assistant");
                      }

                      // Execute the tool silently in the background
                      const toolHeaders = matchedTool.headers
                        ? JSON.parse(matchedTool.headers)
                        : { "Content-Type": "application/json" };

                      // Handle URL and body based on method
                      let finalUrl = matchedTool.url;
                      let requestBody = undefined;

                      if (matchedTool.method === "GET" && matchedTool.payload) {
                        // For GET requests, add payload as query parameters
                        try {
                          const params = JSON.parse(matchedTool.payload);
                          const urlParams = new URLSearchParams();
                          Object.entries(params).forEach(([key, value]) => {
                            urlParams.append(key, String(value));
                          });
                          finalUrl = `${matchedTool.url}${
                            matchedTool.url.includes("?") ? "&" : "?"
                          }${urlParams.toString()}`;
                        } catch (error) {
                          console.warn(
                            "Invalid JSON in query parameters, using URL as-is"
                          );
                        }
                      } else if (
                        matchedTool.method !== "GET" &&
                        matchedTool.payload
                      ) {
                        // For non-GET requests, use payload as request body
                        requestBody = matchedTool.payload;
                      }

                      const toolResponse = await fetch(finalUrl, {
                        method: matchedTool.method,
                        headers: toolHeaders,
                        body: requestBody,
                      });

                      if (!toolResponse.ok) {
                        throw new Error(
                          `Tool API returned status ${toolResponse.status}`
                        );
                      }

                      const toolData = await toolResponse.json();
                      console.log(
                        `Tool ${matchedTool.name} returned:`,
                        toolData
                      );

                      // Add tool result to conversation history and get AI's analysis
                      conversationHistory.push({
                        role: "user",
                        content: `Tool result from ${
                          matchedTool.name
                        }: ${JSON.stringify(
                          toolData,
                          null,
                          2
                        )}\n\nNow please provide a helpful, natural response based on this data. Don't mention the API call or technical details.`,
                      });

                      // Get AI's analysis of the tool result
                      const analysisResponse = await fetch(
                        "https://api.openai.com/v1/chat/completions",
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${apiKey}`,
                          },
                          body: JSON.stringify({
                            model: model,
                            messages: conversationHistory,
                            max_tokens: 1500,
                            temperature: 0.7,
                          }),
                          signal: abortController?.signal,
                        }
                      );

                      if (analysisResponse.ok) {
                        const analysisData = await analysisResponse.json();
                        const finalResponse =
                          analysisData.choices?.[0]?.message?.content ||
                          "I found some information for you.";

                        // Add final response to conversation history
                        conversationHistory.push({
                          role: "assistant",
                          content: finalResponse,
                        });

                        addOutputMessage(finalResponse, "assistant");
                      } else {
                        addOutputMessage(
                          `Here's what I found: ${JSON.stringify(
                            toolData,
                            null,
                            2
                          )}`,
                          "assistant"
                        );
                      }
                    } catch (toolError) {
                      console.error(`Tool execution failed: ${toolError}`);
                      const errorMsg = `I'm having trouble finding that information right now. Please try again later.`;
                      addOutputMessage(errorMsg, "assistant");

                      // Add error to conversation history
                      conversationHistory.push({
                        role: "assistant",
                        content: errorMsg,
                      });
                    }
                  } else {
                    // Tool not found - just show the original response without TOOL_REQUEST
                    const cleanResponse = llmResponse
                      .replace(/TOOL_REQUEST:\s*(.+?)(?:\n|$)/i, "")
                      .trim();
                    addOutputMessage(
                      cleanResponse || "I'm not sure how to help with that.",
                      "assistant"
                    );
                  }
                } else {
                  // No tool request - just show the response
                  addOutputMessage(llmResponse, "assistant");
                }

                // Continue waiting for more user input (conversational loop)
                setWaitingForUserInput(true);

                console.log(
                  `Conversation turn completed. History length: ${conversationHistory.length}`
                );
              } catch (error) {
                console.error(`LLM conversation failed: ${error}`);

                // Don't show error messages for user-initiated abort
                if (error instanceof Error && error.name === "AbortError") {
                  return;
                }

                const errorMsg =
                  "I'm experiencing some technical difficulties. Please try again.";
                addOutputMessage(errorMsg, "assistant");

                // Add error to conversation history
                conversationHistory.push({
                  role: "assistant",
                  content: errorMsg,
                });

                // Continue waiting for user input even after error
                setWaitingForUserInput(true);
              }
            };

            // Store the conversation handler for use with submitUserInput
            (window as any).currentLLMHandler = handleConversation;
          } catch (error) {
            console.error(`LLM initialization failed: ${error}`);
            addOutputMessage(
              `LLM initialization failed: ${error}`,
              "assistant"
            );
          }
          break;
        }

        case "workflow_node": {
          try {
            // Get workflow configuration from node data
            const selectedWorkflowId = node.data?.selectedWorkflowId as string;
            const inputMappings =
              (node.data?.inputMappings as Record<string, string>) || {};
            const outputMappings =
              (node.data?.outputMappings as Record<string, string>) || {};

            if (!selectedWorkflowId) {
              addOutputMessage(
                "⚠️ No workflow selected in Sub Workflow node",
                "assistant"
              );
              break;
            }

            // Get the workflow from Firebase
            const savedWorkflow = await WorkflowService.getWorkflow(
              selectedWorkflowId
            );

            if (!savedWorkflow) {
              addOutputMessage(
                `❌ Sub-workflow not found: ${selectedWorkflowId}`,
                "assistant"
              );
              break;
            }

            console.log(`Sub-workflow nodes:`, savedWorkflow.nodes);
            console.log(`Sub-workflow edges:`, savedWorkflow.edges);

            // Prepare context for sub-workflow execution
            const subWorkflowContext: Record<string, unknown> = {};

            // Map inputs from current context to sub-workflow context
            for (const [subParam, currentVar] of Object.entries(
              inputMappings
            )) {
              if (currentVar && contextData[currentVar] !== undefined) {
                subWorkflowContext[subParam] = contextData[currentVar];
                console.log(
                  `Mapping input: ${subParam} = ${contextData[currentVar]} (from ${currentVar})`
                );
              }
            }

            // Create node and edge maps for sub-workflow
            const subNodeMap: Record<string, AppNode> = {};
            savedWorkflow.nodes.forEach((subNode) => {
              subNodeMap[subNode.id] = subNode as AppNode;
            });

            const subNodeOutgoingEdges: Record<string, Edge[]> = {};
            savedWorkflow.edges.forEach((edge) => {
              if (!subNodeOutgoingEdges[edge.source]) {
                subNodeOutgoingEdges[edge.source] = [];
              }
              subNodeOutgoingEdges[edge.source].push(edge);
            });

            // Find starting nodes for sub-workflow
            const subNodesWithIncomingEdges = new Set(
              savedWorkflow.edges.map((edge) => edge.target)
            );
            const subStartingNodeIds = savedWorkflow.nodes
              .filter((subNode) => !subNodesWithIncomingEdges.has(subNode.id))
              .map((subNode) => subNode.id);

            console.log(`Sub-workflow starting nodes:`, subStartingNodeIds);

            // Execute sub-workflow starting nodes
            let subWorkflowResult = subWorkflowContext;
            for (const subNodeId of subStartingNodeIds) {
              console.log(`Executing sub-workflow node:`, subNodeId);
              subWorkflowResult = await executeNode(
                subNodeId,
                subNodeMap,
                subNodeOutgoingEdges,
                subWorkflowResult
              );
            }

            // Map outputs from sub-workflow back to current context
            for (const [subParam, currentVar] of Object.entries(
              outputMappings
            )) {
              if (currentVar && subWorkflowResult[subParam] !== undefined) {
                nextContextData[currentVar] = subWorkflowResult[subParam];
                console.log(
                  `Mapping output: ${currentVar} = ${subWorkflowResult[subParam]} (from ${subParam})`
                );
              }
            }
          } catch (error) {
            console.error(`Sub-workflow execution failed: ${error}`);
            addOutputMessage(
              `❌ Sub-workflow execution failed: ${error}`,
              "assistant"
            );
          }
          break;
        }

        case "condition": {
          // Access condition expression and name from the node data
          let conditionText = "false";
          let conditionName = "Condition";

          if (node.data && typeof node.data === "object") {
            if ("condition" in node.data)
              conditionText = node.data.condition as string;
            if ("name" in node.data) conditionName = node.data.name as string;
          }

          // Process the condition text to replace any variables
          conditionText = processMessage(conditionText, contextData);

          let conditionResult = false;
          let debugInfo = "";

          try {
            // First check for common comparison patterns - match longer operators first
            const comparison = conditionText.match(
              /(.*?)(>=|<=|==|!=|>|<)(.*)/
            );

            if (comparison) {
              // We have a structured comparison
              const [, left, operator, right] = comparison;
              const leftValue = left.trim();
              const rightValue = right.trim();

              // Get actual values, handling string literals and numbers
              const getComparisonValue = (val: string) => {
                if (val.startsWith('"') && val.endsWith('"')) {
                  return val.slice(1, -1); // Remove quotes
                }
                if (val.startsWith("'") && val.endsWith("'")) {
                  return val.slice(1, -1); // Remove quotes
                }
                if (!isNaN(Number(val))) {
                  return Number(val); // Convert to number
                }
                // Try to find in context
                return contextData[val] !== undefined ? contextData[val] : val;
              };

              const leftEval = getComparisonValue(leftValue);
              const rightEval = getComparisonValue(rightValue);

              // Perform the comparison
              switch (operator) {
                case "==":
                  conditionResult = leftEval == rightEval;
                  break;
                case "!=":
                  conditionResult = leftEval != rightEval;
                  break;
                case ">":
                  conditionResult = Number(leftEval) > Number(rightEval);
                  break;
                case "<":
                  conditionResult = Number(leftEval) < Number(rightEval);
                  break;
                case ">=":
                  conditionResult = Number(leftEval) >= Number(rightEval);
                  break;
                case "<=":
                  conditionResult = Number(leftEval) <= Number(rightEval);
                  break;
              }

              debugInfo = `${leftEval} ${operator} ${rightEval}`;
            } else {
              // Try to evaluate as a boolean expression
              // If it's just a variable name, check if the value is truthy
              if (conditionText in contextData) {
                conditionResult = Boolean(contextData[conditionText]);
                debugInfo = `Variable '${conditionText}' is ${
                  conditionResult ? "truthy" : "falsy"
                }`;
              } else {
                // As a last resort, use a safer approach than eval
                try {
                  // Convert to a boolean result
                  conditionResult = Boolean(
                    new Function(
                      "context",
                      `
                      "use strict";
                      with (context) {
                        return (${conditionText});
                      }
                    `
                    )(contextData)
                  );
                } catch {
                  conditionResult = false;
                }
                debugInfo = conditionText;
              }
            }
          } catch (e) {
            console.error(`Error evaluating condition: ${e}`);
            conditionResult = false;
            debugInfo = `Error: ${e}`;
          }

          // We can optionally show condition evaluation info in developer mode
          console.log(
            `Condition '${conditionName}' evaluated: ${debugInfo} = ${conditionResult}`
          );

          // Only follow edges with matching condition result
          const outgoingEdges = nodeOutgoingEdges[nodeId] || [];
          const filteredEdges = outgoingEdges.filter((edge) => {
            // For condition nodes, follow 'true' edges if condition is true, 'false' edges if false
            const handleId = edge.sourceHandle;
            if (conditionResult && handleId === "true") return true;
            if (!conditionResult && handleId === "false") return true;
            // Also allow edges without specific handles for backwards compatibility
            if (!handleId) return conditionResult;
            return false;
          });

          // Execute all nodes connected to matching condition paths
          for (const edge of filteredEdges) {
            await executeNode(
              edge.target,
              nodeMap,
              nodeOutgoingEdges,
              nextContextData
            );
          }

          // Return early for condition nodes as we've already handled the outgoing edges
          return nextContextData;
        }
      }

      // For non-condition nodes, execute all outgoing nodes
      const outgoingEdges = nodeOutgoingEdges[nodeId] || [];
      for (const edge of outgoingEdges) {
        await executeNode(
          edge.target,
          nodeMap,
          nodeOutgoingEdges,
          nextContextData
        );
      }

      return nextContextData;
    },
    [addOutputMessage, processMessage, waitForUserInput]
  );

  // Stop workflow execution
  const stopWorkflow = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsExecuting(false);
    setWaitingForUserInput(false);
    // Clear any active LLM conversation handler
    (window as any).currentLLMHandler = null;
    setWorkflowOutput((prev) => [...prev, "🛑 Workflow stopped by user"]);
  }, [abortController]);

  // Execute workflow
  const executeWorkflow = useCallback(
    async (nodes: AppNode[], edges: Edge[], onPreviewOpen?: () => void) => {
      // Reset state
      setWorkflowState({});
      setWorkflowOutput([]);
      setIsExecuting(true);

      // Create abort controller for this execution
      const controller = new AbortController();
      setAbortController(controller);

      // Open AI Agent Preview if callback is provided
      if (onPreviewOpen) {
        onPreviewOpen();
      }

      try {
        // Find starting nodes (nodes with no incoming edges)
        const nodesWithIncomingEdges = new Set(
          edges.map((edge) => edge.target)
        );
        const startingNodeIds = nodes
          .filter((node) => !nodesWithIncomingEdges.has(node.id))
          .map((node) => node.id);

        // Create a map of outgoing edges for each node
        const nodeOutgoingEdges: Record<string, Edge[]> = {};
        edges.forEach((edge) => {
          if (!nodeOutgoingEdges[edge.source]) {
            nodeOutgoingEdges[edge.source] = [];
          }
          nodeOutgoingEdges[edge.source].push(edge);
        });

        // Create a map of node id to node
        const nodeMap: Record<string, AppNode> = {};
        nodes.forEach((node) => {
          nodeMap[node.id] = node;
        });

        // Execute starting nodes
        for (const nodeId of startingNodeIds) {
          await executeNode(nodeId, nodeMap, nodeOutgoingEdges, {});
        }
      } finally {
        // Only set isExecuting to false if there's no active LLM conversation handler
        // This keeps the workflow "running" for conversational agents
        if (!(window as any).currentLLMHandler) {
          setIsExecuting(false);
        }
        setAbortController(null);
      }
    },
    [executeNode]
  );

  const contextValue: WorkflowContextType = {
    workflowState,
    workflowOutput,
    isExecuting,
    waitingForUserInput,
    executeWorkflow,
    stopWorkflow,
    clearOutput,
    submitUserInput,
  };

  return (
    <WorkflowContext.Provider value={contextValue}>
      {children}
    </WorkflowContext.Provider>
  );
};
