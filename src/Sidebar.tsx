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

export default function Sidebar () {
  return (
    <aside style={sidebarStyle}>
      <div
        style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}
      >
        Nodes
      </div>
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
    </aside>
  )
}
