import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma'
 
export const GET: RequestHandler = async ({ params, url }) => {
  const result = await fetch(
    'http://worldtimeapi.org/api/timezone/America/Chicago',
  );
  const data = await result.json();
 
  return new Response(JSON.stringify(data))
}