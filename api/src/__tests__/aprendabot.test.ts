import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Hono } from 'hono'
import { authCookie, jsonBody } from './setup'
import { aprendabotRoutes } from '../routes/aprendabot'

const app = new Hono()
app.route('/aprendabot', aprendabotRoutes)

describe('POST /aprendabot/chat', () => {
  beforeEach(() => {
    process.env.DEEPSEEK_APRENDANAVE_API_KEY = 'deepseek-test-key'
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.DEEPSEEK_APRENDANAVE_API_KEY
  })

  it('retorna a resposta da DeepSeek e envia apenas o historico permitido', async () => {
    const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ choices: [{ message: { content: 'Vamos resolver passo a passo.' } }] }),
        { status: 200 }
      )
    )

    const res = await app.request('http://localhost/aprendabot/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: authCookie(901) },
      body: JSON.stringify({
        mensagem: 'Como resolvo 2x + 4 = 10?',
        historico: [
          { role: 'assistant', content: 'Ola!' },
          { role: 'system', content: 'Este papel nao pode chegar ao provedor.' },
        ],
      }),
    })

    expect(res.status).toBe(200)
    expect(await jsonBody(res)).toEqual({ resposta: 'Vamos resolver passo a passo.' })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const chamada = fetchMock.mock.calls[0]
    const payload = JSON.parse(chamada[1].body as string)
    expect(payload.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: 'system' }),
        { role: 'assistant', content: 'Ola!' },
        { role: 'user', content: 'Como resolvo 2x + 4 = 10?' },
      ])
    )
    expect(payload.messages).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ content: 'Este papel nao pode chegar ao provedor.' })])
    )
  })

  it('exige uma mensagem valida', async () => {
    const res = await app.request('http://localhost/aprendabot/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: authCookie(902) },
      body: JSON.stringify({ mensagem: '   ' }),
    })

    expect(res.status).toBe(400)
    expect(await jsonBody(res)).toEqual(
      expect.objectContaining({ error: expect.any(String) })
    )
  })

  it('nao tenta chamar a DeepSeek sem chave configurada', async () => {
    delete process.env.DEEPSEEK_APRENDANAVE_API_KEY

    const res = await app.request('http://localhost/aprendabot/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: authCookie(903) },
      body: JSON.stringify({ mensagem: 'Ola' }),
    })

    expect(res.status).toBe(503)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('retransmite os trechos da DeepSeek via SSE', async () => {
    const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>
    fetchMock.mockResolvedValue(
      new Response(
        'data: {"choices":[{"delta":{"content":"Ola"}}]}\n\n' +
          'data: {"choices":[{"delta":{"content":" mundo"}}]}\n\n' +
          'data: [DONE]\n\n',
        { status: 200, headers: { 'Content-Type': 'text/event-stream' } }
      )
    )

    const res = await app.request('http://localhost/aprendabot/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: authCookie(904) },
      body: JSON.stringify({ mensagem: 'Ola' }),
    })

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('text/event-stream')
    const corpo = await res.text()
    expect(corpo).toContain('data: {"delta":"Ola"}')
    expect(corpo).toContain('data: {"delta":" mundo"}')
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual(
      expect.objectContaining({ stream: true })
    )
  })
})
