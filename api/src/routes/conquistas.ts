import { Hono } from 'hono'
import prisma from '../lib/prisma'
import { authRequired, getCurrentUserId } from '../middleware/auth'

export const conquistasRoutes = new Hono()

// GET /conquistas — lista todas as conquistas com status de desbloqueio do usuário
conquistasRoutes.get('/', authRequired, async (c) => {
  try {
    const userId = getCurrentUserId(c)!

    const todas = await prisma.conquista.findMany({ orderBy: { id: 'asc' } })

    const desbloqueadas = await prisma.aluno_conquista.findMany({
      where: { id_aluno: userId },
      select: { id_conquista: true, desbloqueado_em: true },
    })

    const desbloqueadasSet = new Map(desbloqueadas.map(d => [d.id_conquista, d.desbloqueado_em]))

    return c.json(
      todas.map(c => ({
        id: c.id,
        nome: c.nome,
        descricao: c.descricao,
        icone: c.icone,
        pontos: c.pontos,
        desbloqueada: desbloqueadasSet.has(c.id),
        desbloqueadoEm: desbloqueadasSet.get(c.id) || null,
      }))
    )
  } catch (ex) {
    return c.json({ error: 'Erro ao buscar conquistas' }, 500)
  }
})
