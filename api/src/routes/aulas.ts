import { Hono } from 'hono'
import prisma from '../lib/prisma'
import { authRequired, getCurrentUserId, isAulaOwner } from '../middleware/auth'
import { verificarConquistas } from '../services/conquistas.service'

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

// PUT /aulas/:id - update aula (owner only)
aulasRoutes.put('/:id', authRequired, async (c) => {
  try {
    const userId = getCurrentUserId(c)!
    const aulaId = parseInt(c.req.param('id')!)

    if (!(await isAulaOwner(userId, aulaId))) {
      return c.json({ error: 'Você não tem permissão para editar esta aula' }, 403)
    }

    const body = await c.req.json()
    const updated = await prisma.aula.update({
      where: { id: aulaId },
      data: {
        ...(body.titulo !== undefined && { titulo: body.titulo }),
        ...(body.descricao !== undefined && { descricao: body.descricao }),
        ...(body.ordem !== undefined && { ordem: body.ordem }),
        ...(body.duracao !== undefined && { duracao: body.duracao }),
        ...(body.videoYoutubeId !== undefined && { video_youtube_id: body.videoYoutubeId }),
      },
    })

    return c.json({
      idAula: updated.id,
      tituloAula: updated.titulo,
      descricaoAula: updated.descricao,
      ordemAula: updated.ordem,
      duracaoAula: updated.duracao,
      videoYoutubeIdAula: updated.video_youtube_id,
      idModulo: updated.modulo_id,
    })
  } catch (ex) {
    return c.json({ error: 'Erro ao atualizar aula' }, 400)
  }
})

// DELETE /aulas/:id - delete aula (owner only)
aulasRoutes.delete('/:id', authRequired, async (c) => {
  try {
    const userId = getCurrentUserId(c)!
    const aulaId = parseInt(c.req.param('id')!)

    if (!(await isAulaOwner(userId, aulaId))) {
      return c.json({ error: 'Você não tem permissão para excluir esta aula' }, 403)
    }

    await prisma.aula.delete({ where: { id: aulaId } })
    return c.json({ ok: true })
  } catch (ex) {
    return c.json({ error: 'Erro ao excluir aula' }, 400)
  }
})

// POST /aulas/:aulaId/concluir - mark aula as completed + auto-upsert module progress (auth required)
aulasRoutes.post('/:aulaId/concluir', authRequired, async (c) => {
  try {
    const userId = getCurrentUserId(c)!
    const aulaId = parseInt(c.req.param('aulaId')!)

    const aula = await prisma.aula.findFirst({ where: { id: aulaId } })
    if (!aula) {
      return c.json({ error: 'Aula não encontrada' }, 404)
    }

    const moduloId = aula.modulo_id

    // Check if aula progress record already exists (idempotent)
    const existing = await prisma.aluno_aula_progresso.findFirst({
      where: { id_aluno: userId, id_aula: aulaId },
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

    // Calculate module progress
    const [totalAulas, aulasConcluidas] = await Promise.all([
      prisma.aula.count({ where: { modulo_id: moduloId, status: 'Aprovado' } }),
      prisma.aluno_aula_progresso.count({ where: { id_aluno: userId, id_modulo: moduloId } }),
    ])

    let moduloStatus = 'EM_ANDAMENTO'
    let statusProgresso = 1

    // Um quiz só passa a integrar a conclusão quando já está aprovado. Quizzes em
    // rascunho, pendentes ou rejeitados não podem bloquear o aluno.
    const quizAprovado = await prisma.quiz.findFirst({
      where: { id_modulo: moduloId, status: 'Aprovado' },
      select: { id: true },
    })
    const quizConcluido = !quizAprovado || !!(await prisma.aluno_modulo_quiz.findUnique({
      where: { id_aluno_id_modulo: { id_aluno: userId, id_modulo: moduloId } },
      select: { primeira_aprovacao_em: true },
    }))?.primeira_aprovacao_em

    if (aulasConcluidas >= totalAulas && totalAulas > 0 && quizConcluido) {
      moduloStatus = 'CONCLUIDO'
      statusProgresso = 2
    }

    // Upsert aluno_modulo_progresso
    const existingModuloProgress = await prisma.aluno_modulo_progresso.findFirst({
      where: { id_aluno: userId, id_modulo: moduloId },
    })

    if (!existingModuloProgress) {
      await prisma.aluno_modulo_progresso.create({
        data: {
          id_aluno: userId,
          id_modulo: moduloId,
          status_progresso: statusProgresso,
        },
      })
    } else {
      await prisma.aluno_modulo_progresso.update({
        where: { id_aluno_id_modulo: { id_aluno: userId, id_modulo: moduloId } },
        data: { status_progresso: statusProgresso },
      })
    }

    // Verificar conquistas (async, não bloqueia a resposta)
    verificarConquistas(userId).then(novas => {
      if (novas.length > 0) console.log(`[Conquistas] ${novas.length} nova(s) para userId=${userId}:`, novas)
    })

    return c.json({
      idAula: aulaId,
      idModulo: moduloId,
      moduloStatus,
      todasAulasConcluidas: statusProgresso === 2,
    })
  } catch (ex) {
    return c.json({ error: 'Erro ao marcar aula como concluída' }, 500)
  }
})
