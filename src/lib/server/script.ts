// script.ts
import type { Prisma } from '@prisma/client'
import prisma from './prisma'

// 1
export const findHeroes = async () => {
  // 2 & 3
  return await prisma.hero.findMany()
}