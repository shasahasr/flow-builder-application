import React from 'react'
import { SignUp } from '@clerk/clerk-react'

const SignUpPage: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #a1c4fd, #c2e9fb)',
        padding: '20px'
      }}
    >
      <div
        style={{
          background: '#fff',
          padding: '0',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '460px',
          minHeight: '520px', // Increase minimum height
          overflow: 'hidden'
        }}
      >
        <h1
          style={{
            textAlign: 'center',
            margin: '24px 0',
            fontSize: '2rem',
            color: '#333',
            fontWeight: '600',
            padding: '0 24px'
          }}
        >
          Create an Account
        </h1>
        <div
          className='clerk-sign-up-wrapper'
          style={{
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
            paddingBottom: '30px' // Add padding at the bottom
          }}
        >
          <SignUp
            routing='path'
            path='/sign-up'
            signInUrl='/sign-in'
            appearance={{
              layout: {
                socialButtonsVariant: 'iconButton',
                socialButtonsPlacement: 'top',
                showOptionalFields: false,
                shimmer: true
              },
              elements: {
                rootBox: {
                  width: '100%',
                  maxWidth: '400px',
                  margin: '0 auto'
                },
                card: {
                  boxShadow: 'none',
                  border: 'none',
                  width: '100%',
                  margin: '0 auto',
                  paddingBottom: '40px', // Add extra bottom padding
                  minHeight: '440px' // Set minimum height
                },
                formButtonPrimary: {
                  fontSize: '16px',
                  fontWeight: '500',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  width: '100%'
                },
                formFieldInput: {
                  fontSize: '16px',
                  padding: '10px 16px',
                  borderRadius: '6px'
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default SignUpPage
