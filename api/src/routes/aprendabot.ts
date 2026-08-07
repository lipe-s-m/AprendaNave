import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { authRequired, getCurrentUserId } from '../middleware/auth'

type PapelMensagem = 'user' | 'assistant'

interface MensagemChat {
  role: PapelMensagem
  content: string
}

interface ConversaValida {
  mensagem: string
  historico: MensagemChat[]
}

const LIMITE_CARACTERES = 2_000
const LIMITE_HISTORICO = 10
const LIMITE_REQUISICOES = 15
const JANELA_RATE_LIMIT_MS = 60_000
const requisicoesPorUsuario = new Map<number, number[]>()

const INSTRUCAO_SISTEMA = `Voce e o AprendaBot, tutor virtual da plataforma educacional gamificada AprendaNave.
Responda sempre em portugues do Brasil, de forma acolhedora, clara e didatica.
Ajude o aluno a aprender: explique conceitos passo a passo e use exemplos concretos sempre que forem uteis para esclarecer a resposta. Quando fizer sentido, proponha uma pergunta curta para ele tentar resolver.
Em matematica, priorize o raciocinio mais simples e intuitivo antes de apresentar formulas. Evite criar contas intermediarias grandes ou desnecessarias. Por exemplo, para 20% de 50, prefira explicar que 10% de 50 e 5 e, portanto, 20% e o dobro: 10. So apresente a regra "valor x percentual / 100" como alternativa, sem detalhar multiplicacoes como 50 x 20 = 1000, a menos que o aluno peca esse metodo.
Escreva operacoes de modo legivel em texto simples, como "50 × 0,20 = 10" ou "50 dividido por 2". Nunca use sintaxe LaTeX ou comandos tecnicos, como \\div, \\times, \\frac, \\( ... \\), \\[ ... \\] ou cifroes para formulas, porque eles nao sao renderizados no chat.
Use Markdown leve apenas para destacar ideias importantes com **negrito**.
Nao invente informacoes sobre cursos, aulas ou progresso do aluno que nao foram fornecidas na conversa.
Nao faca a atividade inteira por ele quando puder ensinar o raciocinio. Seja objetivo: em geral, responda em ate 4 paragrafos curtos.`

function textoValido(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.trim().length > 0
}

function normalizarHistorico(valor: unknown): MensagemChat[] {
  if (!Array.isArray(valor)) return []

  return valor
    .filter((mensagem): mensagem is Record<string, unknown> =>
      typeof mensagem === 'object' && mensagem !== null
    )
    .filter(
      (mensagem) =>
        (mensagem.role === 'user' || mensagem.role === 'assistant') &&
        textoValido(mensagem.content)
    )
    .slice(-LIMITE_HISTORICO)
    .map((mensagem) => ({
      role: mensagem.role as PapelMensagem,
      content: (mensagem.content as string).trim().slice(0, LIMITE_CARACTERES),
    }))
}

function validarConversa(body: { mensagem?: unknown; historico?: unknown }): ConversaValida | null {
  if (!textoValido(body.mensagem)) return null

  const mensagem = body.mensagem.trim()
  if (mensagem.length > LIMITE_CARACTERES) return null

  return { mensagem, historico: normalizarHistorico(body.historico) }
}

function podeFazerRequisicao(userId: number): boolean {
  const agora = Date.now()
  const requisicoesRecentes = (requisicoesPorUsuario.get(userId) ?? []).filter(
    (instante) => agora - instante < JANELA_RATE_LIMIT_MS
  )

  if (requisicoesRecentes.length >= LIMITE_REQUISICOES) {
    requisicoesPorUsuario.set(userId, requisicoesRecentes)
    return false
  }

  requisicoesRecentes.push(agora)
  requisicoesPorUsuario.set(userId, requisicoesRecentes)
  return true
}

function criarPayload(conversa: ConversaValida, stream: boolean) {
  return {
    model: process.env.DEEPSEEK_MODEL ?? 'deepseek-chat',
    messages: [
      { role: 'system', content: INSTRUCAO_SISTEMA },
      ...conversa.historico,
      { role: 'user', content: conversa.mensagem },
    ],
    temperature: 0.6,
    max_tokens: 700,
    stream,
  }
}

async function lerCorpo(c: Parameters<typeof authRequired>[0]): Promise<ConversaValida | null> {
  try {
    return validarConversa(await c.req.json())
  } catch {
    return null
  }
}

async function chamarDeepSeek(conversa: ConversaValida, stream: boolean, signal?: AbortSignal) {
  const apiKey = process.env.DEEPSEEK_APRENDANAVE_API_KEY
  if (!apiKey) return null

  return fetch(
    process.env.DEEPSEEK_API_URL ?? 'https://api.deepseek.com/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(criarPayload(conversa, stream)),
      signal: signal ?? AbortSignal.timeout(30_000),
    }
  )
}

function erroDeLimite(c: Parameters<typeof authRequired>[0], userId: number) {
  if (podeFazerRequisicao(userId)) return null
  return c.json(
    { error: 'Voce enviou muitas mensagens. Aguarde um minuto e tente novamente.' },
    429
  )
}

export const aprendabotRoutes = new Hono()

// POST /aprendabot/chat - resposta completa, mantida como fallback para clientes sem streaming.
aprendabotRoutes.post('/chat', authRequired, async (c) => {
  const userId = getCurrentUserId(c)!
  const limite = erroDeLimite(c, userId)
  if (limite) return limite

  const conversa = await lerCorpo(c)
  if (!conversa) {
    return c.json({ error: 'Escreva uma mensagem de ate 2000 caracteres para conversar com o AprendaBot.' }, 400)
  }

  if (!process.env.DEEPSEEK_APRENDANAVE_API_KEY) {
    console.error('[AprendaBot] DEEPSEEK_APRENDANAVE_API_KEY nao configurada.')
    return c.json({ error: 'O AprendaBot esta indisponivel no momento.' }, 503)
  }

  try {
    const resposta = await chamarDeepSeek(conversa, false)
    if (!resposta) return c.json({ error: 'O AprendaBot esta indisponivel no momento.' }, 503)
    if (!resposta.ok) {
      const detalhe = await resposta.text()
      console.error(`[AprendaBot] DeepSeek respondeu ${resposta.status}:`, detalhe.slice(0, 500))
      return c.json({ error: 'O AprendaBot nao conseguiu responder agora. Tente novamente.' }, 502)
    }

    const dados = (await resposta.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>
    }
    const conteudo = dados.choices?.[0]?.message?.content
    if (!textoValido(conteudo)) {
      console.error('[AprendaBot] Resposta da DeepSeek sem conteudo.')
      return c.json({ error: 'O AprendaBot recebeu uma resposta invalida. Tente novamente.' }, 502)
    }

    return c.json({ resposta: conteudo.trim() })
  } catch (erro) {
    console.error('[AprendaBot] Falha ao chamar DeepSeek:', erro)
    return c.json({ error: 'O AprendaBot esta temporariamente indisponivel. Tente novamente.' }, 502)
  }
})

// POST /aprendabot/chat/stream - retransmite os tokens da DeepSeek como Server-Sent Events.
aprendabotRoutes.post('/chat/stream', authRequired, async (c) => {
  const userId = getCurrentUserId(c)!
  const limite = erroDeLimite(c, userId)
  if (limite) return limite

  const conversa = await lerCorpo(c)
  if (!conversa) {
    return c.json({ error: 'Escreva uma mensagem de ate 2000 caracteres para conversar com o AprendaBot.' }, 400)
  }

  if (!process.env.DEEPSEEK_APRENDANAVE_API_KEY) {
    console.error('[AprendaBot] DEEPSEEK_APRENDANAVE_API_KEY nao configurada.')
    return c.json({ error: 'O AprendaBot esta indisponivel no momento.' }, 503)
  }

  const abortController = new AbortController()

  try {
    const resposta = await chamarDeepSeek(conversa, true, abortController.signal)
    if (!resposta) return c.json({ error: 'O AprendaBot esta indisponivel no momento.' }, 503)
    if (!resposta.ok || !resposta.body) {
      const detalhe = await resposta.text()
      console.error(`[AprendaBot] Stream da DeepSeek respondeu ${resposta.status}:`, detalhe.slice(0, 500))
      return c.json({ error: 'O AprendaBot nao conseguiu responder agora. Tente novamente.' }, 502)
    }

    return streamSSE(c, async (stream) => {
      stream.onAbort(() => abortController.abort())
      const reader = resposta.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      const processarLinha = async (linha: string): Promise<void> => {
        if (!linha.startsWith('data:')) return
        const data = linha.slice(5).trim()
        if (!data || data === '[DONE]') return

        try {
          const evento = JSON.parse(data) as {
            choices?: Array<{ delta?: { content?: unknown } }>
          }
          const delta = evento.choices?.[0]?.delta?.content
          if (typeof delta === 'string' && delta.length > 0) {
            await stream.writeSSE({ data: JSON.stringify({ delta }) })
          }
        } catch {
          // Ignora eventos de controle ou fragmentos que nao sejam JSON da DeepSeek.
        }
      }

      try {
        while (!stream.aborted) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const linhas = buffer.split(/\r?\n/)
          buffer = linhas.pop() ?? ''
          for (const linha of linhas) await processarLinha(linha)
        }
        if (buffer) await processarLinha(buffer)
      } catch (erro) {
        if (!stream.aborted) {
          console.error('[AprendaBot] Falha durante stream da DeepSeek:', erro)
          await stream.writeSSE({
            event: 'erro',
            data: JSON.stringify({ error: 'A resposta foi interrompida. Tente novamente.' }),
          })
        }
      } finally {
        reader.releaseLock()
      }
    })
  } catch (erro) {
    console.error('[AprendaBot] Falha ao iniciar stream da DeepSeek:', erro)
    return c.json({ error: 'O AprendaBot esta temporariamente indisponivel. Tente novamente.' }, 502)
  }
})
