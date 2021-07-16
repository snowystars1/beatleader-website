import queue from '../../queues'
import process from './utils/process';

const get = async ({playerId, page = 1, priority = queue.PRIORITY.FG_HIGH, signal = null} = {}) => queue.SCORESABER_API.recentScores(playerId, page, signal, priority);

export default {
  get,
  process,
  getProcessed: async ({playerId, page = 1, priority = queue.PRIORITY.FG_HIGH, signal = null} = {}) => process(await get({playerId, page, priority, signal}), new Date()),
  type: 'recent',
}