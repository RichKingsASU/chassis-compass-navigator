import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pier S Yard Management',
  description: 'Yard inventory management for Forrest Transportation - Pier S',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <nav className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6">
              <a href="/" className="text-xl font-bold text-blue-700">
                Pier S Yard
              </a>
              <a
                href="/"
                className="text-sm font-medium text-gray-600 hover:text-blue-600"
              >
                Dashboard
              </a>
              <a
                href="/upload"
                className="text-sm font-medium text-gray-600 hover:text-blue-600"
              >
                Upload
              </a>
            </div>
            <span className="text-xs text-gray-400">
              Forrest Transportation
            </span>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-6 py-6">{children}</main>
      </body>
    </html>
  )
}
