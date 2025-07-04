// DEPRECATED: Este endpoint ha sido reemplazado por:
// - /api/sources/search (para búsqueda de artículos)
// - /api/sources/explain (para generación de explicaciones)
//
// Este endpoint será eliminado en una futura versión.

import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "Este endpoint ha sido deprecado. Usa /api/sources/search y /api/sources/explain",
    },
    { status: 410 },
  )
}
