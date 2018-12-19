import Images3D from '@server/models/Images3D'
import fs from 'fs'

export default async () => {
  // clean before test
  const exists = await Images3D.find({ host: 'https://localhost:8089' })
  await Promise.all(exists.map(f => f.remove()))

  const image3d = await Images3D.upload(
    fs.readFileSync('/Users/myowngrave/video.mp4'),
    'video-demo.mp4'
  )
  console.log(image3d.toJSON())

  process.exit(0)
}
