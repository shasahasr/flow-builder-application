import React, { useState } from 'react'
import { FiMessageSquare, FiEdit3, FiCode, FiCpu } from 'react-icons/fi'

const onDragStart = (
  event: React.DragEvent<HTMLDivElement>,
  nodeType: string
) => {
  event.dataTransfer.setData('application/reactflow', nodeType)
  event.dataTransfer.effectAllowed = 'move'
}

const menuContainerStyle: React.CSSProperties = {
  position: 'fixed',
  top: '50%', // Center vertically
  left: '20px',
  transform: 'translateY(-50%)', // Perfect vertical centering
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  zIndex: 1000,
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  padding: '16px',
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
  border: '1px solid rgba(255, 255, 255, 0.2)'
}

const iconStyle: React.CSSProperties = {
  width: '48px',
  height: '48px',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  border: 'none',
  borderRadius: '12px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  transition: 'all 0.2s ease',
  color: '#ffffff',
  fontSize: '20px'
}

const menuStyle: React.CSSProperties = {
  position: 'absolute',
  top: '0px',
  left: '70px',
  background: 'rgba(255, 255, 255, 0.98)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  borderRadius: '12px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
  padding: '12px',
  zIndex: 1001,
  minWidth: '180px',
  animation: 'slideIn 0.2s ease-out'
}

const menuItemStyle: React.CSSProperties = {
  padding: '12px 16px',
  cursor: 'pointer',
  borderRadius: '8px',
  transition: 'all 0.2s ease',
  fontSize: '14px',
  fontWeight: '500',
  color: '#333',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}

const SidebarMenu: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null)

  const toggleMenu = (menu: string) => {
    setActiveMenu(prev => (prev === menu ? null : menu))
  }

  const getIconStyle = (isActive: boolean) => ({
    ...iconStyle,
    background: isActive
      ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)'
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    transform: isActive ? 'scale(1.05)' : 'scale(1)'
  })

  const getMenuStyle = (index: number) => ({
    ...menuStyle,
    top: `${index * 60}px` // Position each menu next to its corresponding button
  })

  return (
    <div style={menuContainerStyle}>
      <div
        style={getIconStyle(activeMenu === 'output')}
        onClick={() => toggleMenu('output')}
        title='Output Blocks'
      >
        <FiMessageSquare />
      </div>
      {activeMenu === 'output' && (
        <div style={getMenuStyle(0)}>
          <div
            style={menuItemStyle}
            onDragStart={e => onDragStart(e, 'display_message')}
            draggable
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <FiMessageSquare />
            Display Message
          </div>
        </div>
      )}

      <div
        style={getIconStyle(activeMenu === 'input')}
        onClick={() => toggleMenu('input')}
        title='Input Blocks'
      >
        <FiEdit3 />
      </div>
      {activeMenu === 'input' && (
        <div style={getMenuStyle(1)}>
          <div
            style={menuItemStyle}
            onDragStart={e => onDragStart(e, 'input_parameter')}
            draggable
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <FiEdit3 />
            Input Parameter
          </div>
        </div>
      )}

      <div
        style={getIconStyle(activeMenu === 'dev')}
        onClick={() => toggleMenu('dev')}
        title='Dev Stuff'
      >
        <FiCode />
      </div>
      {activeMenu === 'dev' && (
        <div style={getMenuStyle(2)}>
          <div
            style={menuItemStyle}
            onDragStart={e => onDragStart(e, 'condition')}
            draggable
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <FiCode />
            Condition
          </div>
        </div>
      )}

      <div
        style={getIconStyle(activeMenu === 'llm')}
        onClick={() => toggleMenu('llm')}
        title='LLM Tools'
      >
        <FiCpu />
      </div>
      {activeMenu === 'llm' && (
        <div style={getMenuStyle(3)}>
          <div
            style={menuItemStyle}
            onDragStart={e => onDragStart(e, 'api_call')}
            draggable
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <FiCpu />
            API Call
          </div>
        </div>
      )}
    </div>
  )
}

export default function Sidebar () {
  return (
    <>
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
      <SidebarMenu />
    </>
  )
}
