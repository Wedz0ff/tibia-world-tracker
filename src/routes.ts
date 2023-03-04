import dayjs from 'dayjs';
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import './helpers/patch';
import { prisma } from './lib/db';
import { GetHighscoreEntriesFromAll } from './services/GetHighscoreEntries';

export async function appRoutes(app: FastifyInstance) {
  app.get('/', () => {
    return {
      message: 'API is Running!',
    };
  });

  app.get('/exphistory/:name', async (request) => {
    const expHistoryParams = z.object({
      name: z.string(),
    });

    const { name } = expHistoryParams.parse(request.params);

    const playerData = await prisma.player.findUnique({
      where: {
        name: name ?? null,
      },
    });

    if (playerData) {
      const expHistory = await prisma.experienceHistory.findMany({
        where: {
          player_id: playerData.id,
        },
      });

      expHistory.forEach((object) => {
        delete object['player_id'];
      });

      return {
        character: playerData.name,
        entries: expHistory,
        informations: {
          generated_at: Date.now(),
        },
      };
    } else {
      return {
        error: `Couldn't find an entry for character: ${name}`,
      };
    }
  });

  app.get('/update/exphistory', async () => {
    const experienceData = await GetHighscoreEntriesFromAll();
    const yesterday = dayjs().add(-1, 'day').toISOString().substring(0, 10);

    const playersByName = await prisma.player.findMany({
      where: { name: { in: experienceData.map((item) => item.name) } },
      select: { id: true, name: true },
    });

    const existingExperience = await prisma.experienceHistory.findMany({
      where: {
        player_id: { in: playersByName.map((p) => p.id) },
        date: yesterday,
      },
      select: { player_id: true },
    });

    const existingExperienceMap = new Set(
      existingExperience.map((e) => e.player_id),
    );

    const newExperienceEntries = experienceData
      .filter((item) => {
        const player = playersByName.find((p) => p.name === item.name);
        return player && !existingExperienceMap.has(player.id);
      })
      .map((item) => {
        const player = playersByName.find((p) => p.name === item.name);
        return {
          player_id: player!.id,
          experience: item.value,
          date: yesterday,
        };
      });

    if (newExperienceEntries.length > 0) {
      const createdEntries = await prisma.experienceHistory.createMany({
        data: newExperienceEntries,
      });
      console.log(`Created ${createdEntries.count} new experience entries.`);
    } else {
      console.log('nothing to create');
    }
    return {
      message: 'Job is done!',
    };
  });

  app.get('/update/players', async () => {
    const entries = await GetHighscoreEntriesFromAll();

    // Add players on players table, skipping duplicates
    const playerNamesAndVocations = entries.map(function (player: {
      name: any;
      vocation: any;
    }) {
      return { name: player.name, vocation: player.vocation };
    });

    await Promise.all(playerNamesAndVocations);
    const createMany = await prisma.player.createMany({
      data: playerNamesAndVocations,
      skipDuplicates: true,
    });

    console.log(createMany);

    return {
      message: 'Job is done!',
    };
  });
}
