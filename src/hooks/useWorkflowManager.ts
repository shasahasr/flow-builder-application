import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { WorkflowService, WorkflowSummary, SavedWorkflow } from '../firebase/workflowService';
import { Node, Edge } from '@xyflow/react';

export const useWorkflowManager = () => {
  const { user } = useUser();
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workflowCache, setWorkflowCache] = useState<Map<string, SavedWorkflow>>(new Map());

  // Load user's workflows on mount
  useEffect(() => {
    if (user?.id) {
      loadWorkflows();
    }
  }, [user?.id]);

  const loadWorkflows = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const userWorkflows = await WorkflowService.getWorkflowSummaries(user.id);
      setWorkflows(userWorkflows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflows');
      console.error('Error loading workflows:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveWorkflow = async (
    name: string,
    description: string,
    nodes: Node[],
    edges: Edge[],
    tags: string[] = []
  ): Promise<string | null> => {
    if (!user?.id) {
      setError('User not authenticated');
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Auto-detect input and output parameters from nodes
      const inputParams = detectInputParameters(nodes);
      const outputParams = detectOutputParameters(nodes);

      const workflowId = await WorkflowService.saveWorkflow(
        user.id,
        name,
        description,
        nodes,
        edges,
        inputParams,
        outputParams,
        tags
      );

      // Refresh the workflows list
      await loadWorkflows();
      
      return workflowId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save workflow');
      console.error('Error saving workflow:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflowById = async (workflowId: string): Promise<SavedWorkflow | null> => {
    try {
      // Check cache first
      if (workflowCache.has(workflowId)) {
        return workflowCache.get(workflowId)!;
      }

      setLoading(true);
      setError(null);
      
      const workflow = await WorkflowService.getWorkflow(workflowId);
      
      if (workflow) {
        // Cache the workflow to prevent duplicate requests
        setWorkflowCache(prev => new Map(prev).set(workflowId, workflow));
        
        // Increment usage count (but don't await to avoid slowing down the UI)
        WorkflowService.incrementUsageCount(workflowId).catch(console.error);
      }
      
      return workflow;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflow');
      console.error('Error loading workflow:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkflow = async (workflowId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await WorkflowService.deleteWorkflow(workflowId);
      
      // Refresh the workflows list
      await loadWorkflows();
      
      // Clear cache for deleted workflow
      setWorkflowCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(workflowId);
        return newCache;
      });
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete workflow');
      console.error('Error deleting workflow:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const searchWorkflows = async (searchTerm: string): Promise<WorkflowSummary[]> => {
    if (!user?.id) return [];

    try {
      setLoading(true);
      setError(null);
      
      const results = await WorkflowService.searchWorkflows(user.id, searchTerm, true);
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search workflows');
      console.error('Error searching workflows:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    workflows,
    loading,
    error,
    saveWorkflow,
    loadWorkflowById,
    deleteWorkflow,
    searchWorkflows,
    refreshWorkflows: loadWorkflows
  };
};

// Helper functions to detect parameters from nodes
const detectInputParameters = (nodes: Node[]) => {
  return nodes
    .filter(node => node.type === 'input_parameter')
    .map(node => ({
      name: (node.data?.label as string) || `input_${node.id}`,
      type: 'string' as const,
      required: true,
      description: (node.data?.placeholder as string) || 'Input parameter'
    }));
};

const detectOutputParameters = (nodes: Node[]) => {
  const outputVariables: Array<{
    name: string;
    type: 'string';
    required: boolean;
    description: string;
    nodeType: string;
    nodeId: string;
  }> = [];

  nodes.forEach(node => {
    // Input Parameter nodes with saveAsVariable enabled
    if (node.type === 'input_parameter' && node.data?.saveAsVariable) {
      const variableName = (node.data?.variableName as string) || (node.data?.paramName as string) || `input_${node.id}`;
      outputVariables.push({
        name: variableName,
        type: 'string' as const,
        required: false,
        description: `Input parameter saved as variable`,
        nodeType: 'input_parameter',
        nodeId: node.id
      });
    }

    // API Call nodes with saveAsVariable enabled
    if (node.type === 'api_call' && node.data?.saveAsVariable) {
      const variableName = (node.data?.variableName as string) || 'apiResponse';
      outputVariables.push({
        name: variableName,
        type: 'string' as const,
        required: false,
        description: `API response saved as variable`,
        nodeType: 'api_call',
        nodeId: node.id
      });
    }

    // Display Message nodes (always output their content)
    if (node.type === 'display_message') {
      const variableName = (node.data?.name as string) || `message_${node.id}`;
      outputVariables.push({
        name: variableName,
        type: 'string' as const,
        required: false,
        description: 'Display message content',
        nodeType: 'display_message',
        nodeId: node.id
      });
    }

    // TODO: Add other node types that can save variables as they're implemented
  });

  return outputVariables;
};
