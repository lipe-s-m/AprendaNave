import { Hono } from 'hono'
import prisma from '../lib/prisma'

export const modulosRoutes = new Hono()

// GET /modulos/aprovados
modulosRoutes.get('/aprovados', async (c) => {
  try {
    const modulos = await prisma.modulo.findMany({
      where: { status: 'Aprovado' },
    })

    return c.json(
      modulos.map((m) => ({
        id: m.id,
        nome: m.nome,
        descricao: m.descricao,
        ordem: m.ordem,
        nivel: m.nivel,
        quantidadeAulas: m.quantidade_aulas,
        quantidadeHoras: m.quantidade_horas,
        playlist: m.playlist,
        status: m.status,
        cursoId: m.curso_id,
        createdAt: m.created_at,
        lastUpdatedAt: m.last_updated_at,
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

// POST /modulos/:moduloId/aulas
modulosRoutes.post('/:moduloId/aulas', async (c) => {
  try {
    const moduloId = parseInt(c.req.param('moduloId'))
    const body = await c.req.json()

    if (moduloId !== body.idModulo) {
      return c.json('IDs incompativeis.', 404)
    }

    if (body.ordem < 1) {
      return c.json('A ordem deve ser maior ou igual a 1', 400)
    }

    const aula = await prisma.aula.create({
      data: {
        titulo: body.titulo,
        descricao: body.descricao,
        ordem: body.ordem,
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
