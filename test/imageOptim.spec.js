import chai from 'chai'
import path from 'path'
import fs from 'fs'
import chaiHttp from 'chai-http'
import chaiAsPromise from 'chai-as-promised'
import { server, socket } from './setup'

describe('Optimize image', function() {
  this.timeout(0)

  it('Create optimize tasks', async function() {
    this.slow(5000)
    const urls = [
        'http://file.hstatic.net/1000069970/collection/screen_shot_2017-07-23_at_6.41.40_pm.png',
        'http://product.hstatic.net/1000069970/product/untitled-1_1000x.png',
        'http://product.hstatic.net/1000069970/product/k3.jpg',
        'http://product.hstatic.net/1000069970/product/3843298892_154883748.400x400.jpg'
      ],
      optimizedUrls = await Promise.all(
        urls.map(url => server.jobs.ImageOptim.compressImageToWebp(url))
      )
    console.log(optimizedUrls)
    console.log(server.jobs.ImageOptim.cachedStorage)
  })
})
