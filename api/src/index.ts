import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { authRoutes } from './routes/auth'
import { userRoutes } from './routes/user'
import { cursosRoutes } from './routes/cursos'
import { modulosRoutes } from './routes/modulos'
import { aulasRoutes } from './routes/aulas'
import { desafioJccRoutes } from './routes/desafioJcc'
import { rankingRoutes } from './routes/ranking'
import { guestsRoutes } from './routes/guests'

const app = new Hono()

// CORS
app.use('*', cors({
  origin: ['http://localhost:4200', 'https://aprendanave.vercel.app'],
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// Health check
app.get('/', (c) => c.text('Hello World!'))

// Mount routes
app.route('/auth', authRoutes)
app.route('/user', userRoutes)
app.route('/cursos', cursosRoutes)
app.route('/modulos', modulosRoutes)
app.route('/aulas', aulasRoutes)
app.route('/desafio/desafio-jcc', desafioJccRoutes)
app.route('/rankings', rankingRoutes)
app.route('/guests', guestsRoutes)

const port = parseInt(process.env.PORT || '3000')

console.log(`Server running on port ${port}`)

serve({
  fetch: app.fetch,
  port,
})
