import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// Simple pages without Firebase dependencies
import LoginPage from './pages/LoginPage-simple'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  )
}

export default App
