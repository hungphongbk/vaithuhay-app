import request from 'request-promise-native'
import YAML from 'yamljs'

const client = request.defaults({
  baseUrl: 'https://vaithuhay.com'
})

export default url =>
  client
    .get(url)
    .then(yaml => YAML.parse(yaml))
    .catch(e => null)
