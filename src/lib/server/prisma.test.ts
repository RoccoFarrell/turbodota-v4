// test/sample.test.ts
import { expect, test, vi } from 'vitest' // 👈🏻 Added the `vi` import
import { findHeroes } from './script'
import prisma from './__mocks__/prisma'

vi.mock('./prisma')

test('findHeroes should return heroes', async () => {
  //const newUser = { email: 'user@prisma.io', name: 'Prisma Fan' }
  prisma.hero.findMany.mockResolvedValue([{ attack_type: "Melee", id: 102, legs: 2, localized_name: "Abbadon", name: "npc_dota_hero_abbadon", primary_attr: "all", roles: "[\"Support\",\"Carry\",\"Durable\"]"}])
  const heroes = await findHeroes()
  expect(heroes).toStrictEqual([{ attack_type: "Melee", id: 102, legs: 2, localized_name: "Abbadon", name: "npc_dota_hero_abbadon", primary_attr: "all", roles: "[\"Support\",\"Carry\",\"Durable\"]"}])
})