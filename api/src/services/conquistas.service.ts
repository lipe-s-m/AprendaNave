import prisma from '../lib/prisma'

export async function verificarConquistas(userId: number): Promise<string[]> {
  const novas: string[] = []

  // Buscar conquistas já desbloqueadas
  const desbloqueadas = await prisma.aluno_conquista.findMany({
    where: { id_aluno: userId },
    select: { id_conquista: true },
  })
  const desbloqueadasIds = new Set(desbloqueadas.map(d => d.id_conquista))

  // Estatísticas atuais
  const [totalAulas, totalModulos, totalConquistas, aluno] = await Promise.all([
    prisma.aluno_aula_progresso.count({ where: { id_aluno: userId } }),
    prisma.aluno_modulo_progresso.count({ where: { id_aluno: userId, status_progresso: 2 } }),
    desbloqueadas.length,
    prisma.aluno.findFirst({ where: { id: userId }, select: { pontos: true } }),
  ])

  // Buscar todas as conquistas
  const todas = await prisma.conquista.findMany()

  for (const c of todas) {
    if (desbloqueadasIds.has(c.id)) continue

    let ganhou = false

    switch (c.tipo) {
      case 'aulas_concluidas':
        ganhou = totalAulas >= c.condicao_valor
        break
      case 'modulo_concluido':
        // modulo_concluido valor=1 → completou pelo menos 1 módulo
        ganhou = totalModulos >= c.condicao_valor
        break
      case 'modulos_concluidos':
        ganhou = totalModulos >= c.condicao_valor
        break
      case 'pontos_acumulados':
        ganhou = (aluno?.pontos || 0) >= c.condicao_valor
        break
      case 'conquistas_desbloqueadas':
        ganhou = totalConquistas >= c.condicao_valor
        break
      // outros tipos (quiz_completo, quiz_perfeito, curso_aprovado, aulas_dia, curso_concluido)
      // precisam de contexto adicional — são verificados nos endpoints específicos
    }

    if (ganhou) {
      try {
        await prisma.aluno_conquista.create({
          data: { id_aluno: userId, id_conquista: c.id },
        })
        // Dar pontos da conquista
        if (c.pontos > 0) {
          await prisma.aluno.update({
            where: { id: userId },
            data: { pontos: (aluno?.pontos || 0) + c.pontos },
          })
        }
        novas.push(c.nome)
        desbloqueadasIds.add(c.id)
      } catch (err: any) {
        // P2002 = unique constraint violation → já desbloqueada, ignora
        if (err?.code !== 'P2002') throw err
      }
    }
  }

  return novas
}

/** Verifica conquistas específicas de quiz */
export async function verificarConquistasQuiz(userId: number, acertouTodas: boolean): Promise<string[]> {
  const novas: string[] = []

  const desbloqueadas = await prisma.aluno_conquista.findMany({
    where: { id_aluno: userId },
    select: { id_conquista: true },
  })
  const ids = new Set(desbloqueadas.map(d => d.id_conquista))

  const quizCompleto = await prisma.conquista.findFirst({ where: { tipo: 'quiz_completo' } })
  const quizPerfeito = await prisma.conquista.findFirst({ where: { tipo: 'quiz_perfeito' } })

  const aluno = await prisma.aluno.findFirst({ where: { id: userId }, select: { pontos: true } })

  if (quizCompleto && !ids.has(quizCompleto.id)) {
    try {
      await prisma.aluno_conquista.create({ data: { id_aluno: userId, id_conquista: quizCompleto.id } })
      if (quizCompleto.pontos > 0) {
        await prisma.aluno.update({ where: { id: userId }, data: { pontos: (aluno?.pontos || 0) + quizCompleto.pontos } })
      }
      novas.push(quizCompleto.nome)
      ids.add(quizCompleto.id)
    } catch (err: any) {
      if (err?.code !== 'P2002') throw err
    }
  }

  if (acertouTodas && quizPerfeito && !ids.has(quizPerfeito.id)) {
    try {
      await prisma.aluno_conquista.create({ data: { id_aluno: userId, id_conquista: quizPerfeito.id } })
      if (quizPerfeito.pontos > 0) {
        const pontosAtuais = await prisma.aluno.findFirst({ where: { id: userId }, select: { pontos: true } })
        await prisma.aluno.update({ where: { id: userId }, data: { pontos: (pontosAtuais?.pontos || 0) + quizPerfeito.pontos } })
      }
      novas.push(quizPerfeito.nome)
      ids.add(quizPerfeito.id)
    } catch (err: any) {
      if (err?.code !== 'P2002') throw err
    }
  }

  // Depois de ganhar quiz, verifica as outras conquistas (Lenda, etc.)
  const extras = await verificarConquistas(userId)
  novas.push(...extras)

  return novas
}
