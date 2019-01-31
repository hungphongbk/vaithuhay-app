import Images3D from '@server/models/Images3D'
import fs from 'fs'

const fn = async args => {
  // clean before test
  const exists = await Images3D.find({ host: global.APP_HOST })
  await Promise.all(exists.map(f => f.remove()))

  if (args.create) {
    const image3d = await Images3D.upload(
      fs.readFileSync('/Users/phong.truong/video2.mp4'),
      'video-demo.mp4'
    )
    // console.log(image3d.toJSON())
  }
}

fn.options = {
  '--no-create': 'Prevent create new model'
}

export default fn
