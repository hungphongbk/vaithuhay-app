import request from 'request-promise-native'
import { HaravanAPIMetrics } from '@server/core/pm2'

const HaravanAPI = request.defaults({
  baseUrl:
    'https://c96aab241903b825360305142e40a08a:66921be54a74fe0e36d2671d0c5fb77e@vai-thu-hay-i-something-nice.myharavan.com/',
  callback: () => {
    HaravanAPIMetrics.first.mark()
  }
})
const HaravanAPIAlternative = request.defaults({
    baseUrl:
      'https://0960be1b285c555d784594798247dae8:213dee7cc59da754bd713f633fd48275@vai-thu-hay-i-something-nice.myharavan.com/',
    callback: () => HaravanAPIMetrics.second.mark()
  }),
  HrvAPISelector = () =>
    Math.random() > 0.5 ? HaravanAPI : HaravanAPIAlternative

export { HaravanAPI, HrvAPISelector }
