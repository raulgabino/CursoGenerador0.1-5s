import { Suspense } from "react"
import BlueprintGenerator from "@/components/blueprint-generator"
import { Loader2 } from "lucide-react"

// Loading fallback component
function BlueprintLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-800 mb-2">Generador de Blueprint de Cursos</h1>
          <p className="text-gray-600">Cargando editor...</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-lg text-gray-600">Inicializando editor de blueprints...</p>
              <p className="text-sm text-gray-500 mt-2">Esto solo tomará un momento</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function BlueprintPage() {
  return (
    <Suspense fallback={<BlueprintLoading />}>
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <BlueprintGenerator />
      </main>
    </Suspense>
  )
}
