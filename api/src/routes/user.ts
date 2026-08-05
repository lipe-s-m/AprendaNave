import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma'
import { authRequired, getCurrentUserId } from '../middleware/auth'
import cloudinary from '../lib/cloudinary'

export const userRoutes = new Hono()

// GET /user/ - returns current user ID from JWT
userRoutes.get('/', (c) => {
  const userId = getCurrentUserId(c)
  if (userId === null) return c.json({ error: 'Unauthorized' }, 401)
  return c.json(userId)
})

// POST /user/ - register new user
userRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json()
    console.log('[POST /user] body recebido:', JSON.stringify(body, null, 2))

    const { nome, email, senha, cargo } = body
    const senhaConfirmacao = body.senhaConfirmacao ?? body.confirmarSenha

    const erros: string[] = []
    if (!nome) erros.push('nome é obrigatório')
    if (!email) erros.push('email é obrigatório')
    if (!senha) erros.push('senha é obrigatória')
    if (!senhaConfirmacao) erros.push('senhaConfirmacao/confirmarSenha é obrigatória')

    if (erros.length > 0) {
      console.log('[POST /user] Erro de validação:', erros)
      return c.json({ error: erros.join('; ') }, 400)
    }

    if (senha.length <= 2) {
      console.log('[POST /user] Senha muito curta')
      return c.json({ error: 'Senha deve ter mais de 2 caracteres.' }, 400)
    }

    if (senha !== senhaConfirmacao) {
      console.log('[POST /user] Senhas não conferem')
      return c.json({ error: 'Senhas não conferem.' }, 400)
    }

    const hashedPassword = await bcrypt.hash(senha, 10)

    const aluno = await prisma.aluno.create({
      data: {
        nome,
        email,
        senha: hashedPassword,
        cargo: cargo || 'Aluno',
        pontos: 0,
        created_at: new Date(),
        last_updated_at: new Date(),
      },
    })

    console.log('[POST /user] Aluno criado:', aluno.id, aluno.email)
    return c.json(
      { id: aluno.id, nome: aluno.nome, email: aluno.email, cargo: aluno.cargo },
      201
    )
  } catch (ex: any) {
    console.error('[POST /user] ERRO:', ex?.message ?? ex, ex?.code ? `(code: ${ex.code})` : '')
    return c.json({ error: ex?.message ?? 'Falha na criação do aluno.' }, 400)
  }
})

// GET /user/progresso - consolidated progress for current user (auth required)
userRoutes.get('/progresso', authRequired, async (c) => {
  try {
    const userId = getCurrentUserId(c)!

    const [aulasProgresso, modulosProgresso] = await Promise.all([
      prisma.aluno_aula_progresso.findMany({
        where: { id_aluno: userId },
        select: { id_aula: true },
      }),
      prisma.aluno_modulo_progresso.findMany({
        where: { id_aluno: userId },
      }),
    ])

    // Enrich each module progress with aula counts
    const modulosEnriquecidos = await Promise.all(
      modulosProgresso.map(async (mp) => {
        const modulo = await prisma.modulo.findFirst({
          where: { id: mp.id_modulo },
          select: { id: true, curso_id: true },
        })

        const [totalAulas, aulasConcluidas] = await Promise.all([
          prisma.aula.count({ where: { modulo_id: mp.id_modulo, status: 'Aprovado' } }),
          prisma.aluno_aula_progresso.count({ where: { id_aluno: userId, id_modulo: mp.id_modulo } }),
        ])

        const statusMap = ['NAO_INICIADO', 'EM_ANDAMENTO', 'CONCLUIDO']
        return {
          idModulo: mp.id_modulo,
          idCurso: modulo?.curso_id ?? 0,
          status: statusMap[mp.status_progresso] || 'NAO_INICIADO',
          aulasConcluidas,
          totalAulas,
        }
      })
    )

    return c.json({
      aulasConcluidas: aulasProgresso.map((a) => a.id_aula),
      modulosProgresso: modulosEnriquecidos,
    })
  } catch (ex: any) {
    console.error('[GET /user/progresso] ERRO:', ex?.message ?? ex, ex?.stack?.split('\n')[0])
    return c.json({ error: 'Erro ao buscar progresso' }, 500)
  }
})

// GET /user/list - paginated list of all users
userRoutes.get('/list', async (c) => {
  try {
    const page = parseInt(c.req.query('pagina') || '1')
    const perPage = 10

    const alunos = await prisma.aluno.findMany({
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        nome: true,
        bio: true,
        foto_perfil: true,
        email: true,
        cargo: true,
        pontos: true,
        created_at: true,
        last_updated_at: true,
      },
    })

    return c.json(alunos)
  } catch (ex) {
    return c.json({ error: 'Erro interno' }, 500)
  }
})

// PATCH /user/ - update user data (auth required)
userRoutes.patch('/', authRequired, async (c) => {
  try {
    const userId = getCurrentUserId(c)!
    const body = await c.req.json()

    const aluno = await prisma.aluno.findFirst({ where: { id: userId } })
    if (!aluno) {
      return c.json({ error: 'Usuário não encontrado' }, 404)
    }

    const updated = await prisma.aluno.update({
      where: { id: userId },
      data: {
        nome: body.nome ?? aluno.nome,
        bio: body.bio ?? aluno.bio,
        last_updated_at: new Date(),
      },
    })

    const modulosProgresso = await prisma.aluno_modulo_progresso.findMany({
      where: { id_aluno: userId },
    })

    const statusMap = ['NAO_INICIADO', 'EM_ANDAMENTO', 'CONCLUIDO']
    const progresso = await Promise.all(
      modulosProgresso.map(async (mp) => {
        const modulo = await prisma.modulo.findFirst({
          where: { id: mp.id_modulo },
          select: { id: true, curso_id: true },
        })
        const [totalAulas, aulasConcluidas] = await Promise.all([
          prisma.aula.count({ where: { modulo_id: mp.id_modulo, status: 'Aprovado' } }),
          prisma.aluno_aula_progresso.count({ where: { id_aluno: userId, id_modulo: mp.id_modulo } }),
        ])
        return {
          idModulo: mp.id_modulo,
          idCurso: modulo?.curso_id ?? 0,
          status: statusMap[mp.status_progresso] || 'NAO_INICIADO',
          aulasConcluidas,
          totalAulas,
        }
      })
    )

    return c.json({
      nome: updated.nome,
      bio: updated.bio,
      fotoPerfil: updated.foto_perfil,
      email: updated.email,
      cargo: updated.cargo,
      pontos: updated.pontos,
      alunoModuloProgresso: progresso,
    })
  } catch (ex) {
    return c.json({ error: 'Erro ao atualizar usuário' }, 400)
  }
})

// PATCH /user/image - update profile image (auth required)
userRoutes.patch('/image', authRequired, async (c) => {
  try {
    const userId = getCurrentUserId(c)!

    const formData = await c.req.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return c.json({ error: 'No file provided' }, 400)
    }

    // Upload to Cloudinary
    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString('base64')
    const dataUri = `data:${file.type};base64,${base64}`

    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: 'users/profilePic',
      public_id: `user_${userId}`,
      overwrite: true,
      transformation: [{ width: 500, height: 500, crop: 'fill' }],
    })

    const updated = await prisma.aluno.update({
      where: { id: userId },
      data: {
        foto_perfil: uploadResult.secure_url,
        last_updated_at: new Date(),
      },
    })

    const modulosProgressoImg = await prisma.aluno_modulo_progresso.findMany({
      where: { id_aluno: userId },
    })

    const statusMapImg = ['NAO_INICIADO', 'EM_ANDAMENTO', 'CONCLUIDO']
    const progressoImg = await Promise.all(
      modulosProgressoImg.map(async (mp) => {
        const modulo = await prisma.modulo.findFirst({
          where: { id: mp.id_modulo },
          select: { id: true, curso_id: true },
        })
        const [totalAulas, aulasConcluidas] = await Promise.all([
          prisma.aula.count({ where: { modulo_id: mp.id_modulo, status: 'Aprovado' } }),
          prisma.aluno_aula_progresso.count({ where: { id_aluno: userId, id_modulo: mp.id_modulo } }),
        ])
        return {
          idModulo: mp.id_modulo,
          idCurso: modulo?.curso_id ?? 0,
          status: statusMapImg[mp.status_progresso] || 'NAO_INICIADO',
          aulasConcluidas,
          totalAulas,
        }
      })
    )

    return c.json({
      nome: updated.nome,
      bio: updated.bio,
      fotoPerfil: updated.foto_perfil,
      email: updated.email,
      cargo: updated.cargo,
      pontos: updated.pontos,
      alunoModuloProgresso: progressoImg,
    })
  } catch (ex) {
    // If Cloudinary isn't configured, return user without updating photo
    const aluno = await prisma.aluno.findFirst({ where: { id: getCurrentUserId(c)! } })
    if (!aluno) return c.json({ error: 'Usuário não encontrado' }, 404)

    const fallbackModulosProgresso = await prisma.aluno_modulo_progresso.findMany({
      where: { id_aluno: aluno.id },
    })

    const statusMapFallback = ['NAO_INICIADO', 'EM_ANDAMENTO', 'CONCLUIDO']
    const fallbackProgresso = await Promise.all(
      fallbackModulosProgresso.map(async (mp) => {
        const modulo = await prisma.modulo.findFirst({
          where: { id: mp.id_modulo },
          select: { id: true, curso_id: true },
        })
        const [totalAulas, aulasConcluidas] = await Promise.all([
          prisma.aula.count({ where: { modulo_id: mp.id_modulo, status: 'Aprovado' } }),
          prisma.aluno_aula_progresso.count({ where: { id_aluno: aluno.id, id_modulo: mp.id_modulo } }),
        ])
        return {
          idModulo: mp.id_modulo,
          idCurso: modulo?.curso_id ?? 0,
          status: statusMapFallback[mp.status_progresso] || 'NAO_INICIADO',
          aulasConcluidas,
          totalAulas,
        }
      })
    )

    return c.json({
      nome: aluno.nome,
      bio: aluno.bio,
      fotoPerfil: aluno.foto_perfil,
      email: aluno.email,
      cargo: aluno.cargo,
      pontos: aluno.pontos,
      alunoModuloProgresso: fallbackProgresso,
    })
  }
})
