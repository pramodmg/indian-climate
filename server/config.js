export const API_PORT = Number(process.env.API_PORT ?? 8787)
export const CACHE_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS ?? 600)
export const JWT_SECRET = process.env.JWT_SECRET ?? 'replace-this-secret-before-production'
