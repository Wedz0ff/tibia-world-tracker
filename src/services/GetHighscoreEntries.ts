import axios from 'axios';
import cacheData from 'memory-cache';

export async function GetHighScoreEntries(
  pageToFetch?: Number,
  vocation?: String,
) {
  const worldName = process.env.WORLD_NAME ?? 'belobra';
  const parseUrl = `https://api.tibiadata.com/v3/highscores/${worldName}/experience/${
    vocation ?? 'all'
  }/${pageToFetch ?? 1}`;

  const cachedData = cacheData.get(parseUrl);

  if (cachedData) {
    return cachedData;
  }

  try {
    const { data } = await axios.get<any>(parseUrl);

    const timeToCache = 60 * 60 * 1000; // 1 hour

    cacheData.put(parseUrl, data.highscores.highscore_list, timeToCache);
    return data.highscores.highscore_list;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log('error message: ', error.message);
      return error.message;
    } else {
      console.log('unexpected error: ', error);
      return 'An unexpected error occurred';
    }
  }
}

export async function GetHighscoreEntriesFromVocation(vocation?: String) {
  console.log(`STARTED: Fetching highscores entries from ${vocation ?? 'all'}`);

  const promises: Promise<any>[] = [];

  for (let currentPage = 1; currentPage <= 20; currentPage++) {
    promises.push(GetHighScoreEntries(currentPage, vocation));
  }

  try {
    const data = await Promise.all(promises);

    const entries = data.reduce((prev, curr) => prev.concat(curr), []);

    console.log(
      `COMPLETED: Fetching highscores entries from ${vocation ?? 'all'}`,
    );
    return entries;
  } catch (error) {
    console.log('unexpected error: ', error);
    return 'An unexpected error occurred';
  }
}

export async function GetHighscoreEntriesFromAll() {
  const vocations = ['knights', 'paladins', 'druids', 'sorcerers'];

  console.log(`STARTED: Fetching highscores entries from all vocations`);

  const promises: Promise<any>[] = [];

  for (const vocation of vocations) {
    promises.push(GetHighscoreEntriesFromVocation(vocation));
  }

  try {
    const data = await Promise.all(promises);

    const entries = data.reduce((prev, curr) => prev.concat(curr), []);

    entries.forEach((object) => {
      delete object['rank'];
    });

    entries.sort((a, b) => b.level - a.level);

    console.log(
      `COMPLETED: Fetching highscores entries from all vocations - Total entries: ${
        entries.length
      } - Highest Level: ${entries.at(0)!.level} - Lowest Level: ${
        entries.at(-1)!.level
      }`,
    );

    return entries;
  } catch (error) {
    console.log('unexpected error: ', error);
    return 'An unexpected error occurred';
  }
}

// export async function GetHighscoreEntriesFromVocation(vocation?: String) {
//   let entries: any[] = [];

//   console.log(`STARTED: Fetching highscores entries from ${vocation ?? 'all'}`);

//   for (let currentPage = 1; currentPage <= 20; currentPage++) {
//     const data = await GetHighScoreEntries(currentPage, vocation);

//     console.log(`Page: ${currentPage}/20`);
//     entries.push.apply(entries, data);
//   }

//   console.log(
//     `COMPLETED: Fetching highscores entries from ${vocation ?? 'all'}`,
//   );
//   return entries;
// }

// export async function GetHighscoreEntriesFromAll() {
//   const vocations = ['knights', 'paladins', 'druids', 'sorcerers'];

//   let entries: any[] = [];

//   for (const vocation of vocations) {
//     const vocEntries = await GetHighscoreEntriesFromVocation(vocation);
//     entries.push.apply(entries, vocEntries);
//   }

//   entries.forEach((object) => {
//     delete object['rank'];
//   });

//   entries.sort((a, b) => b.level - a.level);

//   console.log(
//     `Total entries: ${entries.length} - Highest Level: ${
//       entries.at(0)!.level
//     } - Lowest Level: ${entries.at(-1)!.level}`,
//   );

//   return entries;
// }
