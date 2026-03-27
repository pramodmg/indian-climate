import bcrypt from 'bcryptjs'
import cors from 'cors'
import express from 'express'
import { API_PORT } from './config.js'
import { getCityById } from './data/cities.js'
import { requireAuth, signAuthToken } from './middleware/auth.js'
import { generateRealtimeAlerts, getAlertThresholds } from './services/alertService.js'
import { getClimateSnapshot } from './services/climateService.js'
import {
  createUser,
  findUserByEmail,
  findUserById,
  updateUserAlertPreferences,
} from './services/userStore.js'

const app = express()

app.use(cors({ origin: true }))
app.use(express.json({ limit: '256kb' }))

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', service: 'india-climate-api' })
})

app.post('/api/auth/register', async (request, response) => {
  const name = String(request.body?.name ?? '').trim()
  const email = String(request.body?.email ?? '').trim().toLowerCase()
  const password = String(request.body?.password ?? '')

  if (!name || !email || password.length < 6) {
    response.status(400).json({ error: 'Name, email, and password (min 6 chars) are required' })
    return
  }

  const existingUser = await findUserByEmail(email)

  if (existingUser) {
    response.status(409).json({ error: 'An account with this email already exists' })
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await createUser({ name, email, passwordHash })
  const token = signAuthToken(user)

  response.status(201).json({ token, user })
})

app.post('/api/auth/login', async (request, response) => {
  const email = String(request.body?.email ?? '').trim().toLowerCase()
  const password = String(request.body?.password ?? '')

  if (!email || !password) {
    response.status(400).json({ error: 'Email and password are required' })
    return
  }

  const existingUser = await findUserByEmail(email)

  if (!existingUser) {
    response.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const isPasswordValid = await bcrypt.compare(password, existingUser.passwordHash)

  if (!isPasswordValid) {
    response.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const user = {
    id: existingUser.id,
    name: existingUser.name,
    email: existingUser.email,
    createdAt: existingUser.createdAt,
  }

  const token = signAuthToken(user)

  response.json({ token, user })
})

app.get('/api/auth/me', requireAuth, async (request, response) => {
  const user = await findUserById(request.userId)

  if (!user) {
    response.status(404).json({ error: 'User not found' })
    return
  }

  response.json(user)
})

app.get('/api/user/alert-preferences', requireAuth, async (request, response) => {
  const user = await findUserById(request.userId)

  if (!user) {
    response.status(404).json({ error: 'User not found' })
    return
  }

  response.json(user.alertPreferences)
})

app.put('/api/user/alert-preferences', requireAuth, async (request, response) => {
  const minSeverity = request.body?.minSeverity
  const enabledTypes = request.body?.enabledTypes

  const updatedUser = await updateUserAlertPreferences(request.userId, {
    minSeverity,
    enabledTypes,
  })

  if (!updatedUser) {
    response.status(404).json({ error: 'User not found' })
    return
  }

  response.json(updatedUser.alertPreferences)
})

app.get('/api/climate/snapshot', async (request, response) => {
  const cityId = String(request.query.cityId ?? '').trim()

  if (!cityId) {
    response.status(400).json({ error: 'cityId query parameter is required' })
    return
  }

  if (!getCityById(cityId)) {
    response.status(404).json({ error: 'Unknown cityId' })
    return
  }

  try {
    const snapshot = await getClimateSnapshot(cityId)
    response.json(snapshot)
  } catch {
    response.status(502).json({ error: 'Unable to load climate snapshot' })
  }
})

app.get('/api/alerts/realtime', async (request, response) => {
  const cityId = String(request.query.cityId ?? '').trim()

  if (!cityId) {
    response.status(400).json({ error: 'cityId query parameter is required' })
    return
  }

  const city = getCityById(cityId)

  if (!city) {
    response.status(404).json({ error: 'Unknown cityId' })
    return
  }

  try {
    const snapshot = await getClimateSnapshot(cityId)
    const alerts = generateRealtimeAlerts(snapshot, city)

    response.json({
      cityId,
      alerts,
      thresholds: getAlertThresholds(),
    })
  } catch {
    response.status(502).json({ error: 'Unable to evaluate realtime alerts' })
  }
})

app.use((_request, response) => {
  response.status(404).json({ error: 'Route not found' })
})

app.listen(API_PORT, () => {
  console.log(`India climate API listening on http://localhost:${API_PORT}`)
})
