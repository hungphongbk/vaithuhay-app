import createQueue from '@server/jobs/classes/createQueue'

const queue = createQueue()

async function clearCache(productId) {}

queue.process('update', 1, async ({ data }, done) => {})

async function updateProductJson(productId) {}

export default updateProductJson
