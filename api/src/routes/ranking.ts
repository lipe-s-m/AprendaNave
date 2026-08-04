import { Hono } from 'hono'
import prisma from '../lib/prisma'

export const rankingRoutes = new Hono()

// GET /rankings/modalidade/ranking?modalidade=X - top 5
rankingRoutes.get('/modalidade/ranking', async (c) => {
  try {
    const modalidade = c.req.query('modalidade')
    if (!modalidade) {
      return c.json({ error: 'Modalidade is required' }, 400)
    }

    const ranking = await prisma.ranking.findMany({
      where: { modalidade },
      orderBy: { pontos: 'desc' },
      take: 5,
    })

    return c.json(
      ranking.map((r) => ({
        idAluno: r.id_aluno,
        nomeAluno: r.nome_aluno,
        pontuacaoAluno: r.pontos,
        modalidade: r.modalidade,
      }))
    )
  } catch (ex) {
    return c.json({ error: 'Erro interno' }, 500)
  }
})

// GET /rankings/desafiantes?modalidade=X - all
rankingRoutes.get('/desafiantes', async (c) => {
  try {
    const modalidade = c.req.query('modalidade')
    if (!modalidade) {
      return c.json({ error: 'Modalidade is required' }, 400)
    }

    const all = await prisma.ranking.findMany({
      where: { modalidade },
    })

    return c.json(
      all.map((r) => ({
        idAluno: r.id_aluno,
        nomeAluno: r.nome_aluno,
        pontuacaoAluno: r.pontos,
        modalidade: r.modalidade,
      }))
    )
  } catch (ex) {
    return c.json({ error: 'Erro interno' }, 500)
  }
})

// PATCH /rankings/pontuacao - upsert
rankingRoutes.patch('/pontuacao', async (c) => {
  try {
    const body = await c.req.json()
    const idAluno = body.IdAluno ?? body.idAluno
    const nomeAluno = body.NomeAluno ?? body.nomeAluno
    const pontuacaoAluno = body.PontuacaoAluno ?? body.pontuacaoAluno
    const modalidade = body.Modalidade ?? body.modalidade

    if (pontuacaoAluno < 0) {
      return c.json({ error: 'A pontuação não pode ser negativa.' }, 400)
    }
    if (idAluno <= 0) {
      return c.json({ error: 'O ID do aluno deve ser um número positivo.' }, 400)
    }

    const existing = await prisma.ranking.findFirst({
      where: { id_aluno: idAluno, nome_aluno: nomeAluno, modalidade },
    })

    if (!existing) {
      await prisma.ranking.create({
        data: {
          id_aluno: idAluno,
          nome_aluno: nomeAluno,
          pontos: pontuacaoAluno,
          modalidade,
          aluno_id: idAluno,
          created_at: new Date(),
          last_updated_at: new Date(),
        },
      })
    } else {
      await prisma.ranking.update({
        where: { id: existing.id },
        data: {
          pontos: pontuacaoAluno,
          last_updated_at: new Date(),
        },
      })
    }

    return c.json({
      idAluno,
      nomeAluno,
      pontuacaoAluno,
      modalidade,
    })
  } catch (ex) {
    return c.json({ error: 'Erro ao atualizar pontuação' }, 400)
  }
})
