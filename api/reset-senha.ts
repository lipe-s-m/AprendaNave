import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]
  const novaSenha = process.argv[3]

  if (!email || !novaSenha) {
    console.log('Uso: npx tsx reset-senha.ts <email> <nova-senha>')
    process.exit(1)
  }

  const hash = await bcrypt.hash(novaSenha, 10)
  const aluno = await prisma.aluno.findFirst({ where: { email } })
  if (!aluno) {
    console.log(`Email não encontrado: ${email}`)
    await prisma.$disconnect()
    process.exit(1)
  }
  await prisma.aluno.update({ where: { id: aluno.id }, data: { senha: hash } })
  console.log(`Senha resetada para: ${email}`)
  await prisma.$disconnect()
}

main()
