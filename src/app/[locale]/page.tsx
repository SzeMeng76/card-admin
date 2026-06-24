import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export default async function LocaleHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const session = await getSession()
  if (session) {
    redirect(`/${locale}/${session.role === 'admin' ? 'dashboard' : 'portal'}`)
  }
  redirect(`/${locale}/login`)
}
