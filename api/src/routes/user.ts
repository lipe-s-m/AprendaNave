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
    const { nome, email, senha, senhaConfirmacao, cargo } = body

    if (!nome || !email || !senha || !senhaConfirmacao) {
      return c.json('Falha na criação do aluno (ex: senha muito curta).', 400)
    }

    if (senha.length <= 2) {
      return c.json('Falha na criação do aluno (ex: senha muito curta).', 400)
    }

    if (senha !== senhaConfirmacao) {
      return c.json('Falha na criação do aluno (ex: senha muito curta).', 400)
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

    return c.json(
      { id: aluno.id, nome: aluno.nome, email: aluno.email, cargo: aluno.cargo },
      201
    )
  } catch (ex) {
    return c.json('Falha na criação do aluno.', 400)
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

    return c.json({
      nome: updated.nome,
      bio: updated.bio,
      fotoPerfil: updated.foto_perfil,
      email: updated.email,
      cargo: updated.cargo,
      pontos: updated.pontos,
      alunoModuloProgresso: [],
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

    return c.json({
      nome: updated.nome,
      bio: updated.bio,
      fotoPerfil: updated.foto_perfil,
      email: updated.email,
      cargo: updated.cargo,
      pontos: updated.pontos,
      alunoModuloProgresso: [],
    })
  } catch (ex) {
    // If Cloudinary isn't configured, return user without updating photo
    const aluno = await prisma.aluno.findFirst({ where: { id: getCurrentUserId(c)! } })
    if (!aluno) return c.json({ error: 'Usuário não encontrado' }, 404)

    return c.json({
      nome: aluno.nome,
      bio: aluno.bio,
      fotoPerfil: aluno.foto_perfil,
      email: aluno.email,
      cargo: aluno.cargo,
      pontos: aluno.pontos,
      alunoModuloProgresso: [],
    })
  }
})
