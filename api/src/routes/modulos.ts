import { Hono } from 'hono'
import prisma from '../lib/prisma'
import { authRequired, getCurrentUserId, isModuloOwner } from '../middleware/auth'
import { mapModuloResponse, obterContagensAulasPorModulo } from '../lib/modulo-response'

export const modulosRoutes = new Hono()

// GET /modulos/:moduloId/progresso - user's progress in a module (auth required)
modulosRoutes.get('/:moduloId/progresso', authRequired, async (c) => {
  try {
    const userId = getCurrentUserId(c)!
    const moduloId = parseInt(c.req.param('moduloId')!)

    const [totalAulas, aulasConcluidas, moduloProgresso] = await Promise.all([
      prisma.aula.count({ where: { modulo_id: moduloId, status: 'Aprovado' } }),
      prisma.aluno_aula_progresso.count({ where: { id_aluno: userId, id_modulo: moduloId } }),
      prisma.aluno_modulo_progresso.findFirst({ where: { id_aluno: userId, id_modulo: moduloId } }),
    ])

    const statusMap = ['NAO_INICIADO', 'EM_ANDAMENTO', 'CONCLUIDO']
    const status = moduloProgresso
      ? statusMap[moduloProgresso.status_progresso] || 'NAO_INICIADO'
      : 'NAO_INICIADO'

    return c.json({
      idModulo: moduloId,
      status,
      aulasConcluidas,
      totalAulas,
    })
  } catch (ex: any) {
    console.error('[GET /modulos/progresso] ERRO:', ex?.message ?? ex)
    return c.json({ error: 'Erro ao buscar progresso' }, 500)
  }
})

// GET /modulos/aprovados
modulosRoutes.get('/aprovados', async (c) => {
  try {
    const modulos = await prisma.modulo.findMany({
      where: { status: 'Aprovado' },
    })

    const contagens = await obterContagensAulasPorModulo(modulos.map((m) => m.id))

    return c.json(
      modulos.map((m) =>
        mapModuloResponse(m, contagens.get(m.id)!, 'publico')
      )
    )
  } catch (ex) {
    return c.json({ error: 'Erro interno' }, 500)
  }
})

// PUT /modulos/:id - update module (owner only)
modulosRoutes.put('/:id', authRequired, async (c) => {
  try {
    const userId = getCurrentUserId(c)!
    const moduloId = parseInt(c.req.param('id')!)

    if (!(await isModuloOwner(userId, moduloId))) {
      return c.json({ error: 'Você não tem permissão para editar este módulo' }, 403)
    }

    const body = await c.req.json()
    const modulo = await prisma.modulo.findFirst({ where: { id: moduloId } })
    if (!modulo) return c.json({ error: 'Módulo não encontrado' }, 404)

    // `body.quantidadeAulas` é ignorado de propósito: a contagem é calculada
    // dinamicamente a partir da tabela `aula` (coluna legada não é fonte de verdade).
    const updated = await prisma.modulo.update({
      where: { id: moduloId },
      data: {
        ...(body.nome !== undefined && { nome: body.nome }),
        ...(body.descricao !== undefined && { descricao: body.descricao }),
        ...(body.ordem !== undefined && { ordem: body.ordem }),
        ...(body.nivel !== undefined && { nivel: body.nivel }),
        ...(body.quantidadeHoras !== undefined && { quantidade_horas: body.quantidadeHoras }),
        ...(body.playlist !== undefined && { playlist: body.playlist }),
        last_updated_at: new Date(),
      },
    })

    const contagens = await obterContagensAulasPorModulo([updated.id])

    return c.json(
      mapModuloResponse(updated, contagens.get(updated.id)!, 'criador')
    )
  } catch (ex) {
    return c.json({ error: 'Erro ao atualizar módulo' }, 400)
  }
})

// DELETE /modulos/:id - delete module (owner only, cascade aulas)
modulosRoutes.delete('/:id', authRequired, async (c) => {
  try {
    const userId = getCurrentUserId(c)!
    const moduloId = parseInt(c.req.param('id')!)

    if (!(await isModuloOwner(userId, moduloId))) {
      return c.json({ error: 'Você não tem permissão para excluir este módulo' }, 403)
    }

    await prisma.modulo.delete({ where: { id: moduloId } })
    return c.json({ ok: true })
  } catch (ex) {
    return c.json({ error: 'Erro ao excluir módulo' }, 400)
  }
})

// GET /modulos/:moduloId/aulas - all aulas (owner sees all, others see only approved)
modulosRoutes.get('/:moduloId/aulas', async (c) => {
  try {
    const moduloId = parseInt(c.req.param('moduloId')!)
    const userId = getCurrentUserId(c)

    const where: any = { modulo_id: moduloId }
    const isOwner = userId ? await isModuloOwner(userId, moduloId) : false
    if (!isOwner) {
      where.status = 'Aprovado'
    }

    const aulas = await prisma.aula.findMany({ where, orderBy: { ordem: 'asc' } })

    return c.json(
      aulas.map((aula) => ({
        idAula: aula.id,
        tituloAula: aula.titulo,
        descricaoAula: aula.descricao,
        ordemAula: aula.ordem,
        duracaoAula: aula.duracao,
        videoYoutubeIdAula: aula.video_youtube_id,
        idModulo: aula.modulo_id,
        status: aula.status,
      }))
    )
  } catch (ex) {
    return c.json({ error: 'Erro interno' }, 500)
  }
})

// GET /modulos/:moduloId/aulas/aprovadas
modulosRoutes.get('/:moduloId/aulas/aprovadas', async (c) => {
  try {
    const moduloId = parseInt(c.req.param('moduloId'))

    const aulas = await prisma.aula.findMany({
      where: { modulo_id: moduloId, status: 'Aprovado' },
    })

    return c.json(
      aulas.map((aula) => ({
        idAula: aula.id,
        tituloAula: aula.titulo,
        descricaoAula: aula.descricao,
        ordemAula: aula.ordem,
        duracaoAula: aula.duracao,
        videoYoutubeIdAula: aula.video_youtube_id,
        idModulo: aula.modulo_id,
      }))
    )
  } catch (ex) {
    return c.json({ error: 'Erro interno' }, 500)
  }
})

// POST /modulos/:moduloId/aulas - create aula (owner only)
modulosRoutes.post('/:moduloId/aulas', authRequired, async (c) => {
  try {
    const userId = getCurrentUserId(c)!
    const moduloId = parseInt(c.req.param('moduloId')!)

    if (!(await isModuloOwner(userId, moduloId))) {
      return c.json({ error: 'Você não tem permissão para adicionar aulas a este módulo' }, 403)
    }

    const body = await c.req.json()

    if (moduloId !== body.idModulo) {
      return c.json('IDs incompativeis.', 404)
    }

    // A ordem é opcional no create: quando ausente, empilha no final
    // (total de aulas existentes + 1). O criador pode reordenar depois
    // com os botões subir/descer (PUT /aulas/:id).
    const totalAulas = await prisma.aula.count({ where: { modulo_id: moduloId } })
    const ordem = body.ordem ?? totalAulas + 1

    if (ordem < 1) {
      return c.json('A ordem deve ser maior ou igual a 1', 400)
    }

    const aula = await prisma.aula.create({
      data: {
        titulo: body.titulo,
        descricao: body.descricao,
        ordem,
        duracao: body.duracao ?? null,
        video_youtube_id: body.videoYoutubeId,
        modulo_id: body.idModulo,
        status: 'Pendente',
      },
    })

    return c.json(
      {
        id: aula.id,
        titulo: aula.titulo,
        descricao: aula.descricao,
        ordem: aula.ordem,
        duracao: aula.duracao,
        videoYoutubeId: aula.video_youtube_id,
        status: aula.status,
        moduloId: aula.modulo_id,
      },
      201
    )
  } catch (ex) {
    return c.json({ error: 'Erro ao criar aula' }, 400)
  }
})
