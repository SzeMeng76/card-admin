import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect(`/${locale}/login`)

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Nav role="admin" username={session.username} />
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">{children}</main>
      <Footer />
    </div>
  )
}
