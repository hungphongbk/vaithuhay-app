import aws from 'aws-sdk'
import memoize from 'async-decorators/memoize'
import path from 'path'

import BaseUploader from './classes/BaseUploader'

class LocalUploader extends BaseUploader {}

class AwsUploader extends BaseUploader {
  async upload(filename: String, buf: Buffer) {}

  constructor(...args) {
    super(...args)
  }

  async moveFromLocalToS3(
    image,
    filename: String,
    localPathFn: (_filename: String) => String
  ) {
    image.storage = 's3'
  }
}

class Uploader {
  select(uploader: String, options = {}): BaseUploader {
    return {
      local: new LocalUploader(options),
      aws: new AwsUploader(options)
    }[uploader]
  }
}

export default new Uploader()
