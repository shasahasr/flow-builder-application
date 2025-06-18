import React from 'react'

const onDragStart = (
  event: React.DragEvent<HTMLDivElement>,
  nodeType: string
) => {
  event.dataTransfer.setData('application/reactflow', nodeType)
  event.dataTransfer.effectAllowed = 'move'
}

const sidebarStyle: React.CSSProperties = {
  width: '250px',
  padding: '15px',
  borderRight: '1px solid #eee',
  background: '#f7f7f7',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px'
}

const nodeStyle: React.CSSProperties = {
  padding: '10px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  background: 'white',
  cursor: 'grab',
  textAlign: 'center'
}

const categoryStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 'bold',
  marginTop: '15px',
  marginBottom: '8px'
}

export default function Sidebar () {
  return (
    <aside style={sidebarStyle}>
      <div style={categoryStyle}>AI Agent Workflow</div>

      <div
        style={nodeStyle}
        onDragStart={event => onDragStart(event, 'display_message')}
        draggable
      >
        Display Message
      </div>

      <div
        style={nodeStyle}
        onDragStart={event => onDragStart(event, 'input_parameter')}
        draggable
      >
        Input Parameter
      </div>

      <div
        style={nodeStyle}
        onDragStart={event => onDragStart(event, 'api_call')}
        draggable
      >
        API Call
      </div>

      <div
        style={nodeStyle}
        onDragStart={event => onDragStart(event, 'condition')}
        draggable
      >
        Condition
      </div>

      <div
        style={{ ...nodeStyle, background: '#f0fff0', borderColor: '#88cc88' }}
        onDragStart={event => onDragStart(event, 'yes_no_condition')}
        draggable
      >
        Yes/No Condition
      </div>

      {/* Original nodes are kept commented for reference
      <div
        style={nodeStyle}
        onDragStart={event => onDragStart(event, 'input')}
        draggable
      >
        City Input Node
      </div>
      <div
        style={nodeStyle}
        onDragStart={event => onDragStart(event, 'weatherDisplay')}
        draggable
      >
        Weather Display Node
      </div>
      <div
        style={nodeStyle}
        onDragStart={event => onDragStart(event, 'activitySuggestion')}
        draggable
      >
        Activity Suggestion Node
      </div>
      */}
    </aside>
  )
}
