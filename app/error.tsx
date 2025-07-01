"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Unhandled error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="inline-block p-4 bg-red-100 rounded-full mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-red-800 mb-4">¡Ups! Algo salió mal</h2>
        <p className="text-gray-600 mb-6">Ha ocurrido un error inesperado. Estamos trabajando para solucionarlo.</p>
        <div className="space-y-4">
          <Button onClick={reset} className="bg-blue-600 hover:bg-blue-700 w-full">
            Intentar de nuevo
          </Button>
          <Link href="/">
            <Button variant="outline" className="w-full border-blue-300 text-blue-600 hover:bg-blue-50">
              Volver al inicio
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

