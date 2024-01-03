const thirdPartyCred = {
  GCS_PROJECT_ID: process.env.GCS_PROJECT_ID || 'eleven-wicket',
  GCS_BUCKET_NAME: process.env.GCS_BUCKET_NAME || 'yudiz-fantasy-media',
  GCS_BUCKET_URL: process.env.GCS_BUCKET_URL || '',

  AZURE_ACCOUNT_NAME: process.env.AZURE_ACCOUNT_NAME || 'fantasywl',
  AZURE_ACCOUNT_KEY: process.env.AZURE_ACCOUNT_KEY || '',
  AZURE_STORAGE_CONTAINER_NAME: process.env.AZURE_STORAGE_CONTAINER_NAME || 'yudiz-fantasy-media',
  AZURE_STORAGE_CONTAINER_URL: process.env.AZURE_STORAGE_CONTAINER_URL || '',

  CLOUD_STORAGE_PROVIDER: process.env.CLOUD_STORAGE_PROVIDER || 'AWS',

  AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY || 'your aws access key',
  AWS_SECRET_KEY: process.env.AWS_SECRET_KEY || 'your aws secretAccessKey',
  AWS_REGION: process.env.AWS_REGION || 'ap-south-1',
  SMTP_FROM: process.env.SMTP_FROM || 'fwl47576@gmail.com',
  FRESH_DESK_DOMAIN: process.env.FRESH_DESK_DOMAIN || 'https://shrey.freshdesk.com',
  FRESH_DESK_API_KEY: process.env.FRESH_DESK_API_KEY || 'FE6pHORkKdhrBdLeW5Q4',

  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || 'yudiz-fantasy-media',
  S3_BUCKET_URL: process.env.S3_BUCKET_URL || 'https://yudiz-fantasy-media.s3.ap-south-1.amazonaws.com/',

  s3Complain: process.env.S3_COMPLAINS_PATH || 'complain/',
  s3Complaint: process.env.S3_COMPLAINTS_PATH || 'complaint/'

}
module.exports = thirdPartyCred
