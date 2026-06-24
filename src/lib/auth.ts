import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET || 'changeme-set-in-env')

export async function signToken(payload: { id: number; username: string; role: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(await getSecret())
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, await getSecret())
  return payload as { id: number; username: string; role: string }
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) return null
  try {
    return await verifyToken(token)
  } catch {
    return null
  }
}
