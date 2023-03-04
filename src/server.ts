import cors from '@fastify/cors';
import Fastify from 'fastify';
import { toNumber } from 'lodash';
import { appRoutes } from './routes';

const app = Fastify();

app.register(cors);
app.register(appRoutes);

app
  .listen({
    port: toNumber(process.env.PORT || '3333'),
    host: '0.0.0.0',
  })
  .then(() => {
    console.log('Server is running!');
  });
