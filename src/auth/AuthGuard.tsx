import React from "react";
import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth();

  // Show a loading state while Clerk loads
  if (!isLoaded) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "linear-gradient(135deg, #a1c4fd, #c2e9fb)", // Match login page background
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "4px solid rgba(0, 0, 0, 0.1)",
            borderRadius: "50%",
            borderLeftColor: "#1a73e8",
            animation: "spin 1s linear infinite",
          }}
        />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // If not signed in, redirect to login
  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  // If signed in, show the protected content
  return <>{children}</>;
};

export default AuthGuard;
