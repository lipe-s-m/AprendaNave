import { Hono } from 'hono'
import prisma from '../lib/prisma'
import { authRequired, getCurrentUserId } from '../middleware/auth'

export const aulasRoutes = new Hono()

// GET /aulas/progresso/:moduloId - list completed aula IDs for a module (auth required)
aulasRoutes.get('/progresso/:moduloId', authRequired, async (c) => {
  try {
    const userId = getCurrentUserId(c)!
    const moduloId = parseInt(c.req.param('moduloId')!)

    const registros = await prisma.aluno_aula_progresso.findMany({
      where: {
        id_aluno: userId,
        id_modulo: moduloId,
      },
      select: { id_aula: true },
    })

    const aulaIds = registros.map((r) => r.id_aula)
    return c.json(aulaIds)
  } catch (ex) {
    return c.json({ error: 'Erro ao buscar progresso' }, 500)
  }
})

// GET /aulas/:aulaId
aulasRoutes.get('/:aulaId', async (c) => {
  try {
    const aulaId = parseInt(c.req.param('aulaId'))

    const aula = await prisma.aula.findFirst({
      where: { id: aulaId },
    })

    if (!aula) {
      return c.json('aula não encontrada', 404)
    }

    return c.json({
      idAula: aula.id,
      tituloAula: aula.titulo,
      descricaoAula: aula.descricao,
      ordemAula: aula.ordem,
      duracaoAula: aula.duracao,
      videoYoutubeIdAula: aula.video_youtube_id,
      idModulo: aula.modulo_id,
    })
  } catch (ex) {
    return c.json({ error: 'Erro interno' }, 500)
  }
})

// POST /aulas/:aulaId/concluir - mark aula as completed (auth required)
aulasRoutes.post('/:aulaId/concluir', authRequired, async (c) => {
  try {
    const userId = getCurrentUserId(c)!
    const aulaId = parseInt(c.req.param('aulaId')!)

    const aula = await prisma.aula.findFirst({ where: { id: aulaId } })
    if (!aula) {
      return c.json({ error: 'Aula não encontrada' }, 404)
    }

    const moduloId = aula.modulo_id

    // Check if record already exists (idempotent)
    const existing = await prisma.aluno_aula_progresso.findFirst({
      where: {
        id_aluno: userId,
        id_aula: aulaId,
      },
    })

    if (!existing) {
      await prisma.aluno_aula_progresso.create({
        data: {
          id_aluno: userId,
          id_aula: aulaId,
          id_modulo: moduloId,
          aluno_id: userId,
          aula_id: aulaId,
          modulo_id: moduloId,
        },
      })
    }

    return c.json({ idAula: aulaId, idModulo: moduloId })
  } catch (ex) {
    return c.json({ error: 'Erro ao marcar aula como concluída' }, 500)
  }
})
