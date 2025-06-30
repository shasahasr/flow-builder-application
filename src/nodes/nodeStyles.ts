/**
 * Shared styling utilities for workflow nodes
 */

export const nodeColors = {
  // Base colors
  background: '#ffffff',
  border: '#e2e8f0',
  borderHover: '#cbd5e1',
  borderError: '#ef4444',
  text: '#1f2937',
  textSecondary: '#6b7280',
  textError: '#dc2626',

  // Node type specific colors
  input: {
    background: '#fef3c7',
    border: '#f59e0b',
    accent: '#d97706'
  },
  output: {
    background: '#ecfdf5',
    border: '#10b981',
    accent: '#059669'
  },
  condition: {
    background: '#fff4e6',
    border: '#f59e0b',
    accent: '#d97706'
  },
  api: {
    background: '#ede9fe',
    border: '#8b5cf6',
    accent: '#7c3aed'
  },
  message: {
    background: '#f0f9ff',
    border: '#0ea5e9',
    accent: '#0284c7'
  }
}

export const nodeStyles = {
  container: {
    padding: '16px',
    borderRadius: '12px',
    border: `2px solid ${nodeColors.border}`,
    background: nodeColors.background,
    fontSize: '13px',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    boxSizing: 'border-box' as const,
    boxShadow:
      '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    transition: 'all 0.2s ease',
    minWidth: '280px',
    maxWidth: '400px'
  },

  containerHover: {
    borderColor: nodeColors.borderHover,
    boxShadow:
      '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
  },

  containerError: {
    borderColor: nodeColors.borderError,
    boxShadow:
      '0 4px 6px -1px rgba(239, 68, 68, 0.1), 0 2px 4px -1px rgba(239, 68, 68, 0.06)'
  },

  label: {
    display: 'block',
    fontWeight: '600',
    marginBottom: '6px',
    color: nodeColors.text,
    fontSize: '12px'
  },

  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: `1px solid ${nodeColors.border}`,
    fontSize: '13px',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
    transition: 'all 0.2s ease',
    backgroundColor: '#fafafa'
  },

  inputFocus: {
    outline: 'none',
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
  },

  textarea: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: `1px solid ${nodeColors.border}`,
    fontSize: '13px',
    fontFamily:
      'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, monospace',
    boxSizing: 'border-box' as const,
    resize: 'none' as const,
    minHeight: '80px',
    backgroundColor: '#fafafa',
    transition: 'all 0.2s ease'
  },

  fieldGroup: {
    marginBottom: '16px'
  },

  helpText: {
    fontSize: '11px',
    color: nodeColors.textSecondary,
    marginTop: '4px',
    fontStyle: 'italic'
  },

  errorText: {
    fontSize: '11px',
    color: nodeColors.textError,
    marginTop: '4px',
    padding: '6px 8px',
    backgroundColor: '#fef2f2',
    borderRadius: '6px',
    border: '1px solid #fecaca'
  },

  handle: {
    width: '14px',
    height: '14px',
    border: '2px solid #ffffff',
    borderRadius: '50%',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  },

  handleInput: {
    background: '#6b7280'
  },

  handleOutput: {
    background: '#10b981'
  },

  handleTrue: {
    background: '#22c55e'
  },

  handleFalse: {
    background: '#ef4444'
  },

  button: {
    background: 'none',
    border: `1px solid ${nodeColors.border}`,
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '11px',
    cursor: 'pointer',
    color: nodeColors.textSecondary,
    transition: 'all 0.2s ease'
  },

  buttonHover: {
    borderColor: nodeColors.borderHover,
    backgroundColor: '#f8fafc'
  }
}

/**
 * Get themed container styles for specific node types
 */
export const getNodeContainerStyle = (
  nodeType:
    | 'input'
    | 'output'
    | 'condition'
    | 'api'
    | 'message'
    | 'default' = 'default',
  hasError = false
) => {
  const baseStyle = { ...nodeStyles.container }

  if (hasError) {
    return { ...baseStyle, ...nodeStyles.containerError }
  }

  switch (nodeType) {
    case 'input':
      return {
        ...baseStyle,
        background: nodeColors.input.background,
        borderColor: nodeColors.input.border
      }
    case 'output':
      return {
        ...baseStyle,
        background: nodeColors.output.background,
        borderColor: nodeColors.output.border
      }
    case 'condition':
      return {
        ...baseStyle,
        background: nodeColors.condition.background,
        borderColor: nodeColors.condition.border
      }
    case 'api':
      return {
        ...baseStyle,
        background: nodeColors.api.background,
        borderColor: nodeColors.api.border
      }
    case 'message':
      return {
        ...baseStyle,
        background: nodeColors.message.background,
        borderColor: nodeColors.message.border
      }
    default:
      return baseStyle
  }
}
