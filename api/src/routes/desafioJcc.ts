import { Hono } from 'hono'
import prisma from '../lib/prisma'

export const desafioJccRoutes = new Hono()

// GET /desafio/desafio-jcc/ranking - top 5
desafioJccRoutes.get('/ranking', async (c) => {
  try {
    const ranking = await prisma.desafio_jcc.findMany({
      orderBy: { pontos: 'desc' },
      take: 5,
    })

    return c.json(
      ranking.map((d) => ({
        idAluno: d.id_aluno,
        nomeAluno: d.nome_aluno,
        pontuacaoAluno: d.pontos,
      }))
    )
  } catch (ex) {
    return c.json({ error: 'Erro interno' }, 500)
  }
})

// GET /desafio/desafio-jcc/desafiantes - all entries
desafioJccRoutes.get('/desafiantes', async (c) => {
  try {
    const all = await prisma.desafio_jcc.findMany()

    return c.json(
      all.map((d) => ({
        idAluno: d.id_aluno,
        nomeAluno: d.nome_aluno,
        pontuacaoAluno: d.pontos,
      }))
    )
  } catch (ex) {
    return c.json({ error: 'Erro interno' }, 500)
  }
})

// PATCH /desafio/desafio-jcc/pontuacao - upsert
desafioJccRoutes.patch('/pontuacao', async (c) => {
  try {
    const body = await c.req.json()
    const idAluno = body.IdAluno ?? body.idAluno
    const nomeAluno = body.NomeAluno ?? body.nomeAluno
    const pontuacaoAluno = body.PontuacaoAluno ?? body.pontuacaoAluno

    if (pontuacaoAluno < 0) {
      return c.json({ error: 'A pontuação não pode ser negativa.' }, 400)
    }
    if (idAluno <= 0) {
      return c.json({ error: 'O ID do aluno deve ser um número positivo.' }, 400)
    }

    const existing = await prisma.desafio_jcc.findFirst({
      where: { id_aluno: idAluno, nome_aluno: nomeAluno },
    })

    if (!existing) {
      await prisma.desafio_jcc.create({
        data: {
          id_aluno: idAluno,
          nome_aluno: nomeAluno,
          pontos: pontuacaoAluno,
          created_at: new Date(),
          last_updated_at: new Date(),
        },
      })
    } else {
      await prisma.desafio_jcc.update({
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
    })
  } catch (ex) {
    return c.json({ error: 'Erro ao atualizar pontuação' }, 400)
  }
})
