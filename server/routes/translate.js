import { Router } from 'express'
import GoogleTranslate from 'google-translate'
import iterator from 'object-recursive-iterator'

const router = Router(),
  api = GoogleTranslate('AIzaSyCIhh6n9D-Cz8VhgM3B1uMDgoNbuOz81vQ')

router.post('/string', (req, res) => {
  api.translate(req.body.text, 'vi', 'en', (err, { translatedText }) => {
    if (err) {
      console.log(err)
    } else res.send(translatedText)
  })
})
router.post('/obj', async (req, res) => {
  const content = req.body.vi,
    compare = req.body.en,
    promises = []
  iterator.forAll(content, (path, key, obj) => {
    promises.push(
      new Promise(resolve => {
        if (typeof obj[key] === 'string' && obj[key].length > 0)
          api.translate(obj[key], 'vi', 'en', (err, { translatedText }) => {
            obj[key] = translatedText
            resolve()
          })
        else resolve()
      })
    )
  })
  await Promise.all(promises)
  res.json(content)
})

export default router
