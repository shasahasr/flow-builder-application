/**
 * LLM Tool Integration Example
 * 
 * This file demonstrates how the LLM would actually use the tools
 * in a real implementation.
 */

interface ApiTool {
  id: string;
  name: string;
  url: string;
  method: string;
  headers: string;
  payload: string;
  description: string;
}

/**
 * Example: How the LLM processes a query with tools
 */
export class LLMToolProcessor {
  private tools: ApiTool[];

  constructor(tools: ApiTool[]) {
    this.tools = tools;
  }

  /**
   * Generate the system prompt that tells the LLM about available tools
   */
  generateSystemPrompt(): string {
    if (this.tools.length === 0) {
      return "You are a helpful AI assistant.";
    }

    const toolDescriptions = this.tools.map(tool => 
      `- ${tool.name}: ${tool.description} (API: ${tool.method} ${tool.url})`
    ).join('\n');

    return `You are a helpful AI assistant with access to the following tools:

${toolDescriptions}

When answering questions:
1. Determine if the question requires external data from any of your tools
2. If so, use the tool to fetch the data first
3. Provide a comprehensive answer based on the actual data
4. If no tools are needed, answer directly from your knowledge

To use a tool, indicate your intent and I will execute the API call for you.`;
  }

  /**
   * Execute an API tool call
   */
  async executeToolCall(toolId: string, params?: any): Promise<any> {
    const tool = this.tools.find(t => t.id === toolId);
    if (!tool) {
      throw new Error(`Tool ${toolId} not found`);
    }

    try {
      const headers = JSON.parse(tool.headers);
      const payload = tool.payload ? JSON.parse(tool.payload) : undefined;

      const response = await fetch(tool.url, {
        method: tool.method,
        headers,
        body: payload && tool.method !== 'GET' ? JSON.stringify({...payload, ...params}) : undefined
      });

      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Failed to execute ${tool.name}: ${error}`);
    }
  }

  /**
   * Example conversation flow
   */
  async processQuery(userQuery: string): Promise<string> {
    // Step 1: LLM analyzes the query with tool context
    // const systemPrompt = this.generateSystemPrompt(); // Available if needed
    
    // Step 2: LLM decides if it needs to use a tool
    // (In a real implementation, this would be the LLM's decision-making process)
    const needsTool = this.analyzeQueryForToolUsage(userQuery);
    
    if (!needsTool) {
      return "I can answer this directly from my knowledge...";
    }

    // Step 3: LLM requests tool usage
    const toolToUse = this.selectAppropriiateTool(userQuery);
    if (!toolToUse) {
      return "I don't have the right tools to answer this question.";
    }

    try {
      // Step 4: Execute the tool
      const toolResult = await this.executeToolCall(toolToUse.id);
      
      // Step 5: LLM processes the result and provides answer
      return `Based on the data from ${toolToUse.name}: ${JSON.stringify(toolResult, null, 2)}`;
      
    } catch (error) {
      return `I tried to fetch the data but encountered an error: ${error}`;
    }
  }

  private analyzeQueryForToolUsage(query: string): boolean {
    // Simple example - check if query mentions topics covered by our tools
    return this.tools.some(tool => 
      query.toLowerCase().includes(tool.description.toLowerCase()) ||
      tool.description.toLowerCase().includes(this.extractKeywords(query))
    );
  }

  private selectAppropriiateTool(query: string): ApiTool | null {
    // Find the most relevant tool based on description matching
    return this.tools.find(tool => 
      this.calculateRelevanceScore(query, tool.description) > 0.5
    ) || null;
  }

  private extractKeywords(query: string): string {
    // Simple keyword extraction
    return query.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(' ')
      .filter(word => word.length > 3)
      .join(' ');
  }

  private calculateRelevanceScore(query: string, description: string): number {
    // Simple relevance scoring
    const queryWords = query.toLowerCase().split(' ');
    const descWords = description.toLowerCase().split(' ');
    
    const matches = queryWords.filter(word => descWords.includes(word));
    return matches.length / queryWords.length;
  }
}

/**
 * Example Usage:
 * 
 * const tools = [
 *   {
 *     id: 'sales-api',
 *     name: 'Sales Data API',
 *     description: 'Retrieves sales data and revenue information',
 *     url: 'https://api.company.com/sales',
 *     method: 'GET',
 *     headers: '{"Authorization": "Bearer token"}',
 *     payload: ''
 *   }
 * ];
 * 
 * const processor = new LLMToolProcessor(tools);
 * 
 * // User asks: "What were our sales last month?"
 * // LLM recognizes this needs sales data
 * // Calls the Sales Data API
 * // Returns: "Based on the Sales Data API, your sales last month were $150,000..."
 */
