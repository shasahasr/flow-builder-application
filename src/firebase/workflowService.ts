import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp} from 'firebase/firestore';
import { db } from './config';
import { Node, Edge } from '@xyflow/react';

export interface ParameterDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  required: boolean;
  description: string;
  defaultValue?: any;
}

export interface SavedWorkflow {
  id?: string;
  userId: string;
  name: string;
  description: string;
  tags: string[];
  nodes: Node[];
  edges: Edge[];
  inputSchema: ParameterDefinition[];
  outputSchema: ParameterDefinition[];
  isPublic: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  usageCount: number;
  version: number;
}

export interface WorkflowSummary {
  id: string;
  name: string;
  description: string;
  inputParameters: string[];
  outputParameters: string[];
  tags: string[];
  usageCount: number;
  updatedAt: Timestamp;
}

const WORKFLOWS_COLLECTION = 'workflows';

export class WorkflowService {
  /**
   * Save a new workflow to Firebase
   */
  static async saveWorkflow(
    userId: string,
    name: string,
    description: string,
    nodes: Node[],
    edges: Edge[],
    inputSchema: ParameterDefinition[] = [],
    outputSchema: ParameterDefinition[] = [],
    tags: string[] = [],
    isPublic: boolean = false
  ): Promise<string> {
    try {
      const now = Timestamp.now();
      
      const workflowData: Omit<SavedWorkflow, 'id'> = {
        userId,
        name,
        description,
        tags,
        nodes,
        edges,
        inputSchema,
        outputSchema,
        isPublic,
        createdAt: now,
        updatedAt: now,
        usageCount: 0,
        version: 1
      };

      const docRef = await addDoc(collection(db, WORKFLOWS_COLLECTION), workflowData);
      return docRef.id;
    } catch (error) {
      console.error('Error saving workflow:', error);
      throw new Error('Failed to save workflow');
    }
  }

  /**
   * Update an existing workflow
   */
  static async updateWorkflow(
    workflowId: string,
    updates: Partial<SavedWorkflow>
  ): Promise<void> {
    try {
      const workflowRef = doc(db, WORKFLOWS_COLLECTION, workflowId);
      
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now(),
        version: (updates.version || 1) + 1
      };

      await updateDoc(workflowRef, updateData);
    } catch (error) {
      console.error('Error updating workflow:', error);
      throw new Error('Failed to update workflow');
    }
  }

  /**
   * Delete a workflow
   */
  static async deleteWorkflow(workflowId: string): Promise<void> {
    try {
      const workflowRef = doc(db, WORKFLOWS_COLLECTION, workflowId);
      await deleteDoc(workflowRef);
    } catch (error) {
      console.error('Error deleting workflow:', error);
      throw new Error('Failed to delete workflow');
    }
  }

  /**
   * Get a specific workflow by ID
   */
  static async getWorkflow(workflowId: string): Promise<SavedWorkflow | null> {
    try {
      const workflowRef = doc(db, WORKFLOWS_COLLECTION, workflowId);
      const docSnap = await getDoc(workflowRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as SavedWorkflow;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting workflow:', error);
      throw new Error('Failed to get workflow');
    }
  }

  /**
   * Get all workflows for a user
   */
  static async getUserWorkflows(userId: string): Promise<SavedWorkflow[]> {
    try {
      // Get all workflows and filter client-side for now
      const q = query(
        collection(db, WORKFLOWS_COLLECTION),
        orderBy('updatedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const workflows: SavedWorkflow[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Filter by userId client-side for now
        if (data.userId === userId) {
          workflows.push({ id: doc.id, ...data } as SavedWorkflow);
        }
      });

      return workflows;
    } catch (error) {
      console.error('Error getting user workflows:', error);
      throw new Error('Failed to get user workflows');
    }
  }

  /**
   * Get workflow summaries for dropdown selection (lighter data)
   */
  static async getWorkflowSummaries(userId: string): Promise<WorkflowSummary[]> {
    try {
      // For now, get all workflows and filter client-side
      // Later we can implement proper Clerk-Firebase integration
      const q = query(
        collection(db, WORKFLOWS_COLLECTION),
        orderBy('name', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const summaries: WorkflowSummary[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Filter by userId client-side for now
        if (data.userId === userId) {
          summaries.push({
            id: doc.id,
            name: data.name,
            description: data.description,
            inputParameters: data.inputSchema?.map((param: ParameterDefinition) => param.name) || [],
            outputParameters: data.outputSchema?.map((param: ParameterDefinition) => param.name) || [],
            tags: data.tags || [],
            usageCount: data.usageCount || 0,
            updatedAt: data.updatedAt
          });
        }
      });

      return summaries;
    } catch (error) {
      console.error('Error getting workflow summaries:', error);
      throw new Error('Failed to get workflow summaries');
    }
  }

  /**
   * Get public workflows (for sharing)
   */
  static async getPublicWorkflows(limitCount: number = 50): Promise<WorkflowSummary[]> {
    try {
      const q = query(
        collection(db, WORKFLOWS_COLLECTION),
        where('isPublic', '==', true),
        orderBy('usageCount', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const summaries: WorkflowSummary[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        summaries.push({
          id: doc.id,
          name: data.name,
          description: data.description,
          inputParameters: data.inputSchema?.map((param: ParameterDefinition) => param.name) || [],
          outputParameters: data.outputSchema?.map((param: ParameterDefinition) => param.name) || [],
          tags: data.tags || [],
          usageCount: data.usageCount || 0,
          updatedAt: data.updatedAt
        });
      });

      return summaries;
    } catch (error) {
      console.error('Error getting public workflows:', error);
      throw new Error('Failed to get public workflows');
    }
  }

  /**
   * Increment workflow usage count
   */
  static async incrementUsageCount(workflowId: string): Promise<void> {
    try {
      const workflowRef = doc(db, WORKFLOWS_COLLECTION, workflowId);
      const docSnap = await getDoc(workflowRef);
      
      if (docSnap.exists()) {
        const currentCount = docSnap.data().usageCount || 0;
        await updateDoc(workflowRef, {
          usageCount: currentCount + 1
        });
      }
    } catch (error) {
      console.error('Error incrementing usage count:', error);
      // Don't throw error for usage count updates
    }
  }

  /**
   * Search workflows by name or tags
   */
  static async searchWorkflows(
    userId: string,
    searchTerm: string,
    includePublic: boolean = false
  ): Promise<WorkflowSummary[]> {
    try {
      // Note: Firestore doesn't support full-text search natively
      // This is a basic implementation - consider using Algolia for advanced search
      
      const queries = [];
      
      // User's workflows
      queries.push(
        query(
          collection(db, WORKFLOWS_COLLECTION),
          where('userId', '==', userId),
          orderBy('updatedAt', 'desc')
        )
      );

      // Public workflows if requested
      if (includePublic) {
        queries.push(
          query(
            collection(db, WORKFLOWS_COLLECTION),
            where('isPublic', '==', true),
            orderBy('usageCount', 'desc')
          )
        );
      }

      const allWorkflows: WorkflowSummary[] = [];

      for (const q of queries) {
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          allWorkflows.push({
            id: doc.id,
            name: data.name,
            description: data.description,
            inputParameters: data.inputSchema?.map((param: ParameterDefinition) => param.name) || [],
            outputParameters: data.outputSchema?.map((param: ParameterDefinition) => param.name) || [],
            tags: data.tags || [],
            usageCount: data.usageCount || 0,
            updatedAt: data.updatedAt
          });
        });
      }

      // Client-side filtering by search term
      const searchTermLower = searchTerm.toLowerCase();
      return allWorkflows.filter(workflow =>
        workflow.name.toLowerCase().includes(searchTermLower) ||
        workflow.description.toLowerCase().includes(searchTermLower) ||
        workflow.tags.some(tag => tag.toLowerCase().includes(searchTermLower))
      );

    } catch (error) {
      console.error('Error searching workflows:', error);
      throw new Error('Failed to search workflows');
    }
  }
}
