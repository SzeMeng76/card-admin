import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import Nav from '@/components/Nav'

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await getSession()
  if (!session) redirect(`/${locale}/login`)
  if (session.role === 'admin') redirect(`/${locale}/dashboard`)

  return (
    <div className="min-h-screen bg-zinc-50">
      <Nav role="user" username={session.username} />
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
