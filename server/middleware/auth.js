import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../config.js'

export function signAuthToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '7d' },
  )
}

export function requireAuth(request, response, next) {
  const authorizationHeader = request.headers.authorization

  if (!authorizationHeader?.startsWith('Bearer ')) {
    response.status(401).json({ error: 'Missing bearer token' })
    return
  }

  const token = authorizationHeader.slice('Bearer '.length)

  try {
    const decoded = jwt.verify(token, JWT_SECRET)

    if (!decoded || typeof decoded !== 'object' || typeof decoded.sub !== 'string') {
      response.status(401).json({ error: 'Invalid token payload' })
      return
    }

    request.userId = decoded.sub
    next()
  } catch {
    response.status(401).json({ error: 'Invalid or expired token' })
  }
}
