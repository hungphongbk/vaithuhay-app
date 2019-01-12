import request from 'request-promise-native'
import YAML from 'yamljs'

const client = request.defaults({
  baseUrl: 'https://vaithuhay.com'
})

export default async url => {
  const yaml = await client.get(url)
  return YAML.parse(yaml)
}
