import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SM ONE CARD MANAGER',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}
