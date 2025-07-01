import Link from "next/link"

export default function Footer() {
  return (
    <footer className="py-4 text-center text-sm text-gray-600 border-t mt-auto">
      <p>
        Made with ❤️ by{" "}
        <Link href="https://www.verbodata.com" target="_blank" className="text-blue-600 hover:underline">
          VerboData
        </Link>
      </p>
    </footer>
  )
}

