import React from 'react'
import { UserButton, useUser } from '@clerk/clerk-react'

const UserProfile: React.FC = () => {
  const { user } = useUser()

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 16px',
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
      }}
    >
      {user && (
        <>
          <span
            style={{
              marginRight: '10px',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            {user.firstName || user.username}
          </span>
          <UserButton afterSignOutUrl='/sign-in' />
        </>
      )}
    </div>
  )
}

export default UserProfile
