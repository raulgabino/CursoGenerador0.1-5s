"use server"

import { validateApiKeys } from "./ai-config"
import { getAIProvidersStatus } from "@/services/unified-ai-service"

export interface DiagnosticResult {
  timestamp: string
  overall: {
    status: "healthy" | "partial" | "critical"
    message: string
  }
  providers: {
    [key: string]: {
      configured: boolean
      available: boolean
      model: string
      status: "ok" | "warning" | "error"
      message: string
    }
  }
  recommendations: string[]
}

export async function runAIDiagnostics(): Promise<DiagnosticResult> {
  const validation = validateApiKeys()
  const providersStatus = getAIProvidersStatus()

  const result: DiagnosticResult = {
    timestamp: new Date().toISOString(),
    overall: {
      status: "critical",
      message: "",
    },
    providers: {},
    recommendations: [],
  }

  // Evaluar cada proveedor
  const providers = ["openai", "anthropic", "google", "grok"] as const
  let healthyProviders = 0

  for (const provider of providers) {
    const isConfigured = validation.availableProviders[provider]
    const providerInfo = providersStatus[provider]

    result.providers[provider] = {
      configured: isConfigured,
      available: providerInfo?.available || false,
      model: providerInfo?.model || "N/A",
      status: isConfigured ? "ok" : "error",
      message: isConfigured
        ? `Configurado correctamente con modelo ${providerInfo?.model || "N/A"}`
        : `API Key no configurada: ${provider.toUpperCase()}_API_KEY`,
    }

    if (isConfigured) {
      healthyProviders++
    } else {
      result.recommendations.push(`Configurar ${provider.toUpperCase()}_API_KEY en las variables de entorno`)
    }
  }

  // Determinar estado general
  if (healthyProviders === providers.length) {
    result.overall.status = "healthy"
    result.overall.message = "Todos los proveedores de IA están configurados correctamente"
  } else if (healthyProviders > 0) {
    result.overall.status = "partial"
    result.overall.message = `${healthyProviders}/${providers.length} proveedores configurados. La aplicación funcionará con capacidades limitadas.`
  } else {
    result.overall.status = "critical"
    result.overall.message = "Ningún proveedor de IA está configurado. La aplicación no funcionará correctamente."
  }

  // Recomendaciones adicionales
  if (result.overall.status !== "healthy") {
    result.recommendations.push("Verificar que las API keys sean válidas y tengan los permisos necesarios")
    result.recommendations.push("Reiniciar la aplicación después de configurar nuevas variables de entorno")
  }

  if (healthyProviders >= 2) {
    result.recommendations.push("Considerar configurar un orden de preferencia para los proveedores de IA")
  }

  return result
}

// Función para logging de diagnósticos
export async function logAIDiagnostics(): Promise<void> {
  try {
    const diagnostics = await runAIDiagnostics()

    console.log("=== DIAGNÓSTICO DE IA ===")
    console.log(`Timestamp: ${diagnostics.timestamp}`)
    console.log(`Estado General: ${diagnostics.overall.status.toUpperCase()}`)
    console.log(`Mensaje: ${diagnostics.overall.message}`)

    console.log("\n--- Proveedores ---")
    for (const [provider, info] of Object.entries(diagnostics.providers)) {
      console.log(`${provider.toUpperCase()}: ${info.status.toUpperCase()} - ${info.message}`)
    }

    if (diagnostics.recommendations.length > 0) {
      console.log("\n--- Recomendaciones ---")
      diagnostics.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`)
      })
    }

    console.log("========================")
  } catch (error) {
    console.error("Error ejecutando diagnósticos de IA:", error)
  }
}
