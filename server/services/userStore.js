import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const dataDirectory = path.resolve(currentDir, '../data')
const usersFilePath = path.join(dataDirectory, 'users.json')

async function ensureUsersFile() {
  await mkdir(dataDirectory, { recursive: true })

  try {
    await readFile(usersFilePath, 'utf8')
  } catch {
    await writeFile(usersFilePath, '[]', 'utf8')
  }
}

async function readUsers() {
  await ensureUsersFile()

  try {
    const rawContent = await readFile(usersFilePath, 'utf8')
    const parsedUsers = JSON.parse(rawContent)

    if (Array.isArray(parsedUsers)) {
      return parsedUsers
    }

    return []
  } catch {
    return []
  }
}

async function writeUsers(users) {
  await ensureUsersFile()
  await writeFile(usersFilePath, `${JSON.stringify(users, null, 2)}\n`, 'utf8')
}

function toSafeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  }
}

export async function findUserByEmail(email) {
  const users = await readUsers()
  return users.find((user) => user.email === email) ?? null
}

export async function findUserById(userId) {
  const users = await readUsers()
  const user = users.find((candidate) => candidate.id === userId)

  return user ? toSafeUser(user) : null
}

export async function createUser({ name, email, passwordHash }) {
  const users = await readUsers()

  const createdUser = {
    id: randomUUID(),
    name,
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
  }

  users.push(createdUser)
  await writeUsers(users)

  return toSafeUser(createdUser)
}
