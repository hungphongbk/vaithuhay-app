import { memoize } from 'async-decorators'
import fs from 'fs'
import jpeg from 'jpeg-js'
import pixelmatch from 'pixelmatch'
import minBy from 'lodash/minBy'

let width, height
const send = (event, data) => process.send({ event, data })

const compare = (img1, img2) =>
  new Promise(resolve => {
    const fn = memoize(
      img =>
        new Promise((resolve$1, reject$1) =>
          fs.readFile(img, (err, data) => {
            if (err) {
              console.error('Unexpected when processing ' + img, err)
              reject$1(err)
              return
            }
            // console.log(data)
            resolve$1(jpeg.decode(data))
          })
        )
    )
    Promise.all([fn(img1), fn(img2)]).then(([img$1, img$2]) => {
      if (!(width && height)) {
        width = img$1.width
        height = img$1.height
      }
      // console.log(img$1)
      resolve(
        pixelmatch(img$1.data, img$2.data, null, img$1.width, img$1.height)
      )
    })
  })

process.on('message', ({ frames, lastFrame }) => {
  let proceeded = 0
  Promise.all(
    frames.map((compareFrame, index) =>
      compare(lastFrame, compareFrame).then(value => {
        ++proceeded

        // report percentage
        const p = Math.round((proceeded * 100) / frames.length)
        send('progress', { message: p + '% analyzed...' })

        return { index, value }
      })
    )
  ).then(analyzed => {
    const analyzedDupe = minBy(analyzed, 'value')
    send('completed', {
      analyzedDupe,
      width,
      height
    })
  })
})
