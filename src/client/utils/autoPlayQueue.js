// Czysta funkcja wyboru kolejnego odcinka do odtworzenia na podstawie priorytetów
// Nie posiada efektów ubocznych; operuje na danych wejściowych/adaptorach przekazanych w opts

/**
 * @typedef {Object} GetNextOpts
 * @property {string|number} currentEpisodeId
 * @property {string|number} currentSeriesId
 * @property {Array<string|number>} favoritesSeriesOrdered
 * @property {{
 *   isUnfinished: (episodeId: string|number) => boolean,
 *   isListened: (episodeId: string|number) => boolean
 * }} history
 * @property {{
 *   listBySeries: (seriesId: string|number) => Promise<Array<any>>
 * }} episodesApi
 */

/**
 * @param {GetNextOpts} opts
 * @returns {Promise<any|null>}
 */
export async function getNextEpisodeToPlay(opts) {
  const {
    currentEpisodeId,
    currentSeriesId,
    favoritesSeriesOrdered,
    history,
    episodesApi
  } = opts;

  const pickUnfinished = (eps) => eps.filter((e) => history.isUnfinished(e.id));
  const pickUnlistened = (eps) => eps.filter((e) => !history.isListened(e.id) && !history.isUnfinished(e.id));

  const rotateFromCurrent = (list) => {
    const idx = list.findIndex((e) => String(e.id) === String(currentEpisodeId));
    if (idx < 0) return list;
    return [...list.slice(idx + 1), ...list.slice(0, idx + 1)];
  };

  const tryFromSeries = async (seriesId, preferUnfinished) => {
    const list = await episodesApi.listBySeries(seriesId);
    const ordered = seriesId === currentSeriesId ? rotateFromCurrent(list) : list;
    const pool = preferUnfinished ? pickUnfinished(ordered) : pickUnlistened(ordered);
    return pool.length ? pool[0] : null;
  };

  // 1) niedokończony z tej samej serii
  try {
    const s1 = await tryFromSeries(currentSeriesId, true);
    if (s1) {
      console.debug('[autoPlay] next-picked', { episodeId: s1.id, seriesId: currentSeriesId, reason: 'unfinished-same-series' });
      return s1;
    }
  } catch (e) {
    console.warn('[autoPlay] failed series unfinished (same series)', e);
  }

  // 2) niesłuchany z tej samej serii
  try {
    const s2 = await tryFromSeries(currentSeriesId, false);
    if (s2) {
      console.debug('[autoPlay] next-picked', { episodeId: s2.id, seriesId: currentSeriesId, reason: 'unlistened-same-series' });
      return s2;
    }
  } catch (e) {
    console.warn('[autoPlay] failed series unlistened (same series)', e);
  }

  if (!favoritesSeriesOrdered || favoritesSeriesOrdered.length === 0) {
    return null;
  }

  // 3) niedokończony z ulubionych serii (kolejno)
  for (const sid of favoritesSeriesOrdered) {
    if (String(sid) === String(currentSeriesId)) continue;
    try {
      const list = await episodesApi.listBySeries(sid);
      const unfinished = pickUnfinished(list);
      if (unfinished.length) {
        const picked = unfinished[0];
        console.debug('[autoPlay] next-picked', { episodeId: picked.id, seriesId: sid, reason: 'unfinished-favorite-series' });
        return picked;
      }
    } catch (e) {
      console.warn('[autoPlay] failed listing favorite series (unfinished)', sid, e);
    }
  }

  // 4) niesłuchany z ulubionych serii (kolejno)
  for (const sid of favoritesSeriesOrdered) {
    if (String(sid) === String(currentSeriesId)) continue;
    try {
      const list = await episodesApi.listBySeries(sid);
      const unlistened = pickUnlistened(list);
      if (unlistened.length) {
        const picked = unlistened[0];
        console.debug('[autoPlay] next-picked', { episodeId: picked.id, seriesId: sid, reason: 'unlistened-favorite-series' });
        return picked;
      }
    } catch (e) {
      console.warn('[autoPlay] failed listing favorite series (unlistened)', sid, e);
    }
  }

  return null;
}



