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
