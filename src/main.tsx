import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import App from "./App";
import "./index.css";
import LoginPage from "./auth/LoginPage";
import SignUpPage from "./auth/SignUpPage";
import AuthGuard from "./auth/AuthGuard";

// Get your Clerk publishable key from environment variables
// For development, you can hardcode it, but use environment variables for production
const clerkPubKey =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "YOUR_CLERK_PUBLISHABLE_KEY";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkPubKey}>
      <BrowserRouter>
        <Routes>
          <Route path="/sign-in" element={<LoginPage />} />
          <Route path="/sign-in/*" element={<LoginPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
          <Route
            path="/app"
            element={
              <AuthGuard>
                <App />
              </AuthGuard>
            }
          />
          <Route path="/" element={<Navigate to="/app" replace />} />
        </Routes>
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
);
