import { Hono } from 'hono'
import { getCurrentUserId } from '../middleware/auth'
import { buscarEvento, criarParticipacaoGuest, obterEventoPublico, obterOuCriarParticipacaoAluno, obterRankingEvento, registrarMelhorScore, validarParticipacao } from '../services/desafio-eventos.service'

export const desafioEventosRoutes = new Hono()

desafioEventosRoutes.get('/:slug', async (c) => {
  const resultado = await obterEventoPublico(c.req.param('slug')!)
  return resultado ? c.json(resultado) : c.json({ error: 'Evento não encontrado' }, 404)
})

desafioEventosRoutes.get('/:slug/ranking', async (c) => {
  const evento = await buscarEvento(c.req.param('slug')!)
  if (!evento) return c.json({ error: 'Evento não encontrado' }, 404)
  const limite = Math.min(50, Math.max(1, Number(c.req.query('limite') ?? 20)))
  return c.json(await obterRankingEvento(evento.id, Number.isFinite(limite) ? limite : 20))
})

desafioEventosRoutes.post('/:slug/participantes/guest', async (c) => {
  try {
    const evento = await buscarEvento(c.req.param('slug')!)
    if (!evento) return c.json({ error: 'Evento não encontrado' }, 404)
    const body = await c.req.json()
    return c.json(await criarParticipacaoGuest(evento, body.nome, body.contato), 201)
  } catch (error: any) {
    return c.json({ error: error.message === 'EVENTO_ENCERRADO' ? 'O evento não está aceitando novas partidas' : 'Informe nome e contato válidos' }, 400)
  }
})

desafioEventosRoutes.post('/:slug/participantes/aluno', async (c) => {
  try {
    const alunoId = getCurrentUserId(c)
    if (alunoId === null) return c.json({ error: 'Unauthorized' }, 401)
    const evento = await buscarEvento(c.req.param('slug')!)
    if (!evento) return c.json({ error: 'Evento não encontrado' }, 404)
    return c.json(await obterOuCriarParticipacaoAluno(evento, alunoId))
  } catch (error: any) { return c.json({ error: 'O evento não está aceitando novas partidas' }, 400) }
})

desafioEventosRoutes.post('/:slug/resultado', async (c) => {
  try {
    const evento = await buscarEvento(c.req.param('slug')!)
    if (!evento) return c.json({ error: 'Evento não encontrado' }, 404)
    const body = await c.req.json()
    const participacao = await validarParticipacao(evento, getCurrentUserId(c), c.req.header('X-Desafio-Session'))
    return c.json(await registrarMelhorScore(evento, participacao, body.pontos))
  } catch (error: any) {
    const mensagens: Record<string, string> = { EVENTO_ENCERRADO: 'O evento não está aceitando resultados', SESSAO_INVALIDA: 'Sessão de participante inválida', PARTICIPACAO_NAO_ENCONTRADA: 'Inicie o desafio antes de enviar pontos', PONTUACAO_INVALIDA: 'Pontuação inválida' }
    return c.json({ error: mensagens[error.message] ?? 'Não foi possível registrar a pontuação' }, 400)
  }
})
