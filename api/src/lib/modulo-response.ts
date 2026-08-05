import type { modulo as ModuloRecord } from '@prisma/client'
import prisma from './prisma'

export type ContagemAulasModulo = {
  total: number
  aprovadas: number
  pendentes: number
  rejeitadas: number
}

/**
 * Formata um módulo para resposta da API.
 *
 * `modo: 'publico'` → quantidadeAulas = aulas APROVADAS (visíveis ao aluno).
 * `modo: 'criador'` → quantidadeAulas = total de aulas (inclui pendentes/rejeitadas)
 *                     e detalha a distribuição por status.
 *
 * A coluna legada `modulo.quantidade_aulas` NÃO é usada aqui como fonte de
 * verdade — as contagens sempre vêm de `obterContagensAulasPorModulo`.
 */
export function mapModuloResponse(
  modulo: ModuloRecord,
  contagem: ContagemAulasModulo,
  modo: 'publico' | 'criador'
) {
  return {
    id: modulo.id,
    nome: modulo.nome,
    descricao: modulo.descricao,
    ordem: modulo.ordem,
    nivel: modulo.nivel,
    quantidadeAulas: modo === 'criador' ? contagem.total : contagem.aprovadas,
    ...(modo === 'criador' && {
      quantidadeAulasAprovadas: contagem.aprovadas,
      quantidadeAulasPendentes: contagem.pendentes,
      quantidadeAulasRejeitadas: contagem.rejeitadas,
    }),
    quantidadeHoras: modulo.quantidade_horas,
    playlist: modulo.playlist,
    status: modulo.status,
    cursoId: modulo.curso_id,
    createdAt: modulo.created_at,
    lastUpdatedAt: modulo.last_updated_at,
  }
}

/**
 * Conta aulas por módulo em lote (uma única query), evitando N+1.
 */
export async function obterContagensAulasPorModulo(
  moduloIds: number[]
): Promise<Map<number, ContagemAulasModulo>> {
  if (moduloIds.length === 0) return new Map()

  const aulas = await prisma.aula.findMany({
    where: { modulo_id: { in: moduloIds } },
    select: { modulo_id: true, status: true },
  })

  const contagens = new Map<number, ContagemAulasModulo>()
  for (const id of moduloIds) {
    contagens.set(id, { total: 0, aprovadas: 0, pendentes: 0, rejeitadas: 0 })
  }

  for (const aula of aulas) {
    const contagem = contagens.get(aula.modulo_id)
    if (!contagem) continue
    contagem.total++
    if (aula.status === 'Aprovado') contagem.aprovadas++
    else if (aula.status === 'Pendente') contagem.pendentes++
    else if (aula.status === 'Rejeitado') contagem.rejeitadas++
  }

  return contagens
}
