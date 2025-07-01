import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"

interface HeaderProps {
  showBackToHome?: boolean
  title?: string
}

export default function Header({ showBackToHome = true, title = "Whorkshop" }: HeaderProps) {
  return (
    <header className="py-4 px-4 border-b">
      <div className="container mx-auto max-w-4xl flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-800">{title}</h1>
        {showBackToHome && (
          <Link href="/">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              <Home className="h-4 w-4" />
              Volver al inicio
            </Button>
          </Link>
        )}
      </div>
    </header>
  )
}

