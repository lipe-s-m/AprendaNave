import { Hono } from 'hono'
import prisma from '../lib/prisma'
import { getCurrentUserId, authRequired } from '../middleware/auth'
import { RANKING_CATEGORIAS, getRankingCategoria } from '../lib/ranking-categorias'
import { obterRanking, registrarMelhorPontuacao } from '../services/ranking.service'

export const rankingRoutes = new Hono()

// ─────────────────────────────────────────────────────────────
// NOVO FLUXO DE RANKING GAMIFICADO (2026-08-05)
// Rotas estáticas ANTES de /:slug para evitar conflito de rota.
// ─────────────────────────────────────────────────────────────

// GET /rankings/categorias - catálogo público de categorias
rankingRoutes.get('/categorias', (c) => {
  return c.json(
    RANKING_CATEGORIAS.map((cat) => ({
      slug: cat.slug,
      nome: cat.nome,
      descricao: cat.descricao,
      icone: cat.icone,
      unidade: cat.unidade,
    }))
  )
})

// POST /rankings/desafio-matematica/resultado - registra melhor score (auth)
rankingRoutes.post('/desafio-matematica/resultado', authRequired, async (c) => {
  try {
    const userId = getCurrentUserId(c)!
    const body = await c.req.json()
    const pontos = body.pontos

    // O servidor ignora qualquer idAluno/nome enviado pelo cliente:
    // o dono do score é sempre o usuário do cookie JWT.
    const resultado = await registrarMelhorPontuacao(userId, 'desafio-matematica', pontos)
    return c.json(resultado, 201)
  } catch (ex: any) {
    if (ex?.message?.startsWith('Pontuação inválida')) {
      return c.json({ error: ex.message }, 400)
    }
    return c.json({ error: 'Erro ao registrar pontuação' }, 500)
  }
})

// GET /rankings/:slug?limite=20 - ranking de uma categoria (público)
rankingRoutes.get('/:slug', async (c) => {
  const slug = c.req.param('slug')
  const categoria = getRankingCategoria(slug)
  if (!categoria) {
    return c.json({ error: 'Categoria de ranking não encontrada.' }, 404)
  }

  // Limite normalizado silenciosamente: inteiro entre 1 e 50, default 20
  const limiteRaw = parseInt(c.req.query('limite') ?? '20')
  const limite = Number.isNaN(limiteRaw) ? 20 : Math.min(50, Math.max(1, limiteRaw))

  const userId = getCurrentUserId(c) // opcional — página pública

  try {
    const resposta = await obterRanking(categoria.slug, userId, limite)
    return c.json(resposta)
  } catch (ex) {
    return c.json({ error: 'Erro ao carregar ranking' }, 500)
  }
})

// ─────────────────────────────────────────────────────────────
// ENDPOINTS LEGADOS — manter temporariamente por compatibilidade.
// O frontend já parou de usá-los; remover numa release futura.
// ─────────────────────────────────────────────────────────────

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
