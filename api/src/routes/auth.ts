import { Hono } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { verify } from '@node-rs/argon2'
import prisma from '../lib/prisma'

export const authRoutes = new Hono()

// POST /auth/login
authRoutes.post('/login', async (c) => {
  try {
    const body = await c.req.json()
    const email = body.Email || body.email
    const senha = body.Senha || body.senha

    if (!email || !senha) {
      return c.json('Email ou Senha incorretos!', 401)
    }

    const aluno = await prisma.aluno.findFirst({
      where: { email },
    })

    if (!aluno) {
      return c.json('Email ou Senha incorretos!', 401)
    }

    // Try bcrypt first (new hashes), then Argon2 (legacy hashes)
    let passwordValid = false
    try {
      passwordValid = await bcrypt.compare(senha, aluno.senha)
    } catch {
      // Not a bcrypt hash, ignore
    }

    if (!passwordValid) {
      try {
        passwordValid = await verify(aluno.senha, senha)
        if (passwordValid) {
          // Migrate to bcrypt
          const bcryptHash = await bcrypt.hash(senha, 10)
          await prisma.aluno.update({
            where: { id: aluno.id },
            data: { senha: bcryptHash, last_updated_at: new Date() },
          })
        }
      } catch {
        // Not a valid hash
      }
    }

    if (!passwordValid) {
      return c.json('Email ou Senha incorretos!', 401)
    }

    // Generate JWT
    const secret = process.env.PRIVATE_KEY
    if (!secret) {
      return c.json({ error: 'Server configuration error' }, 500)
    }

    const token = jwt.sign(
      {
        id: aluno.id.toString(),
        name: aluno.nome,
        email: aluno.email,
        cargo: aluno.cargo,
      },
      secret,
      { algorithm: 'HS256', expiresIn: '2h' }
    )

    // Set cookie
    setCookie(c, 'access_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 7200,
      path: '/',
    })

    return c.json({
      id: aluno.id,
      nome: aluno.nome,
      email: aluno.email,
      cargo: aluno.cargo,
      pontos: aluno.pontos,
      bio: aluno.bio,
      fotoPerfil: aluno.foto_perfil,
    })
  } catch (ex) {
    return c.json('Email ou Senha incorretos!', 401)
  }
})

// POST /auth/logout
authRoutes.post('/logout', (c) => {
  setCookie(c, 'access_token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    maxAge: 0,
    path: '/',
  })
  return c.json({ message: 'Logout realizado com sucesso' })
})

// GET /auth/validate-token
authRoutes.get('/validate-token', (c) => {
  const token = getCookie(c, 'access_token')
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const secret = process.env.PRIVATE_KEY
    if (!secret) return c.json({ error: 'Unauthorized' }, 401)
    jwt.verify(token, secret)
    return c.body(null, 200)
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }
})
