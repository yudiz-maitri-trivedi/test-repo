const { catchError, pick, removenull, checkValidImageType } = require('../helper/utilities.services')
const { status, jsonStatus, messages } = require('../helper/api.responses')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const config = require('../config/config')

const s3Client = new S3Client({
  region: config.AWS_REGION,
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY,
    secretAccessKey: config.AWS_SECRET_KEY
  }
})

const preSignedUrl = async (req, res) => {
  try {
    req.body = pick(req.body, ['sFileName', 'sContentType'])
    removenull(req.body)
    const { sFileName, sContentType } = req.body
    const valid = checkValidImageType(sFileName, sContentType)
    if (!valid) return res.status(status.BadRequest).jsonp({ status: jsonStatus.BadRequest, message: messages[req.userLanguage].invalid.replace('##', messages[req.userLanguage].image) })

    const s3Path = req.body?.s3Path
    const key = s3Path ? `${s3Path}/${Date.now()}-${req.body?.sFileName}` : `${Date.now()}-${req.body?.sFileName}`

    const command = new PutObjectCommand({
      Bucket: config.AWS_BUCKET_NAME,
      Key: key,
      ContentType: sContentType
    })

    const sPreSignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300 // expires time in second
    })

    return res.status(status.OK).jsonp({ status: jsonStatus.OK, message: messages[req.userLanguage].presigned_succ, sUrl: sPreSignedUrl, sPath: key, sImageUrl: config.S3_BUCKET_URL + key })
  } catch (error) {
    return catchError('presign.error', error, req, res)
  }
}

module.exports = {
  preSignedUrl
}
