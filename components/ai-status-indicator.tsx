"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, XCircle, RefreshCw, Eye, EyeOff } from "lucide-react"
import { runAIDiagnostics, type DiagnosticResult } from "@/lib/ai-diagnostics"

export default function AIStatusIndicator() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  const runDiagnostics = async () => {
    setIsLoading(true)
    try {
      const result = await runAIDiagnostics()
      setDiagnostics(result)
      setLastCheck(new Date())
    } catch (error) {
      console.error("Error running diagnostics:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Run diagnostics on component mount
    runDiagnostics()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "partial":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "critical":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ok":
        return "bg-green-100 text-green-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      case "error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (!diagnostics) {
    return (
      <div className="fixed bottom-4 left-4 z-40">
        <Button
          variant="outline"
          size="sm"
          onClick={runDiagnostics}
          disabled={isLoading}
          className="bg-white shadow-lg"
        >
          {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <AlertCircle className="h-4 w-4 mr-2" />}
          Estado IA
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div className="flex flex-col items-start space-y-2">
        {/* Status indicator button */}
        <Button variant="outline" size="sm" onClick={() => setIsVisible(!isVisible)} className="bg-white shadow-lg">
          {getStatusIcon(diagnostics.overall.status)}
          <span className="ml-2">Estado IA</span>
          {isVisible ? <EyeOff className="h-4 w-4 ml-2" /> : <Eye className="h-4 w-4 ml-2" />}
        </Button>

        {/* Detailed status panel */}
        {isVisible && (
          <Card className="w-80 bg-white shadow-xl border">
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-sm">Estado de Proveedores IA</h3>
                <Button variant="ghost" size="sm" onClick={runDiagnostics} disabled={isLoading}>
                  <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>

              {/* Overall status */}
              <div className="mb-4 p-2 rounded-lg bg-gray-50">
                <div className="flex items-center mb-1">
                  {getStatusIcon(diagnostics.overall.status)}
                  <span className="ml-2 font-medium text-sm">
                    {diagnostics.overall.status === "healthy"
                      ? "Todos los sistemas operativos"
                      : diagnostics.overall.status === "partial"
                        ? "Funcionamiento parcial"
                        : "Problemas críticos"}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{diagnostics.overall.message}</p>
              </div>

              {/* Provider status */}
              <div className="space-y-2">
                <h4 className="font-medium text-xs text-gray-700 uppercase tracking-wide">Proveedores</h4>
                {Object.entries(diagnostics.providers).map(([provider, info]) => (
                  <div key={provider} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Badge variant="outline" className={`text-xs ${getStatusColor(info.status)}`}>
                        {provider.toUpperCase()}
                      </Badge>
                      <span className="ml-2 text-xs text-gray-600">{info.model}</span>
                    </div>
                    <div className="flex items-center">
                      {info.configured ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Last check time */}
              {lastCheck && (
                <div className="mt-3 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500">Última verificación: {lastCheck.toLocaleTimeString()}</p>
                </div>
              )}

              {/* Recommendations */}
              {diagnostics.recommendations.length > 0 && (
                <div className="mt-3 pt-2 border-t border-gray-200">
                  <h4 className="font-medium text-xs text-gray-700 mb-1">Recomendaciones:</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {diagnostics.recommendations.slice(0, 2).map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-1">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
