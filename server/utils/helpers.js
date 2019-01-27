export function chunkMetafieldJsonString(str, metafieldKey) {
  const parts = str.match(/.{1,79999}/g),
    obj = {},
    remains = 4 - parts.length

  for (let i = 0; i < remains; i++) parts.push(';')
  parts.forEach((part, index) => {
    obj[`${metafieldKey}${index + 1}`] = part
  })

  return obj
}

export const retryPromise = (fn, ms = 1000, maxRetries = 5) =>
  new Promise((resolve, reject) => {
    let retries = 0
    fn()
      .then(resolve)
      .catch(() => {
        setTimeout(() => {
          console.error('retrying failed promise...')
          ++retries
          if (retries === maxRetries) {
            return reject('maximum retries exceeded')
          }
          retryPromise(fn, ms).then(resolve)
        }, ms)
      })
  })
