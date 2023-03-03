import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import Fastify from 'fastify';

const app = Fastify();
const prisma = new PrismaClient();

app.register(cors);

app.get('/', async () => {
  const transactions = await prisma.player.findMany({
    where: {
      name: 'Wedzy',
    },
  });

  return transactions;
});

app
  .listen({
    port: 3333,
  })
  .then(() => {
    console.log('Server is running!');
  });
