"use client"

import type React from "react"

import { useEffect, useState } from "react"

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    // Override console.error to catch and handle MetaMask errors
    const originalConsoleError = console.error
    console.error = (...args) => {
      // Check if the error is related to MetaMask
      if (
        args[0] &&
        typeof args[0] === "string" &&
        (args[0].includes("MetaMask") || args[0].includes("ChromeTransport"))
      ) {
        // We can ignore these errors as we're not using MetaMask
        return
      }

      // Pass through other errors to the original console.error
      originalConsoleError.apply(console, args)
    }

    // Handle window errors
    const handleError = (event: ErrorEvent) => {
      if (event.message.includes("MetaMask") || event.message.includes("ChromeTransport")) {
        event.preventDefault()
        return
      }
    }

    window.addEventListener("error", handleError)

    // Cleanup
    return () => {
      console.error = originalConsoleError
      window.removeEventListener("error", handleError)
    }
  }, [])

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-6">
          <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
          <p className="mb-4">We've encountered an error. Please try refreshing the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
