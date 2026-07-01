import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "YT Prepis",
  description: "Prepis YouTube videí a zvukových súborov",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sk">
      <body>{children}</body>
    </html>
  )
}
