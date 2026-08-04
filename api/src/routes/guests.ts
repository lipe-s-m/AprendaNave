import { Hono } from 'hono'
import prisma from '../lib/prisma'

export const guestsRoutes = new Hono()

// POST /guests
guestsRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const { nome, contato } = body

    const guest = await prisma.guest_user.create({
      data: {
        nome,
        contato,
        created_at: new Date(),
        last_updated_at: new Date(),
      },
    })

    return c.json(
      { id: guest.id, nome: guest.nome, contato: guest.contato },
      201
    )
  } catch (ex) {
    return c.json({ error: 'Erro ao criar visitante' }, 400)
  }
})

// GET /guests
guestsRoutes.get('/', async (c) => {
  try {
    const guests = await prisma.guest_user.findMany()

    return c.json(
      guests.map((g) => ({
        id: g.id,
        nome: g.nome,
        contato: g.contato,
      }))
    )
  } catch (ex) {
    return c.json({ error: 'Erro interno' }, 500)
  }
})
