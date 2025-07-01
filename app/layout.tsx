import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
// Import the Footer component
import Footer from "@/components/footer"

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.dev",
}

// Update the layout to include the Footer component
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col">
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}

