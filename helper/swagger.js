const swaggerAutogen = require('swagger-autogen')()
const { DEPLOY_HOST_URL } = require('../config/config')

const outputFile = './swagger_output.json'
const endpointsFiles = [
  '../models-routes-services/admin/adminLogs/routes',
  '../models-routes-services/admin/auth/routes',
  '../models-routes-services/admin/permissions/routes',
  '../models-routes-services/admin/roles/routes',
  '../models-routes-services/admin/subAdmin/routes',
  '../models-routes-services/columnPreference/routes',
  '../models-routes-services/complaints/routes',
  '../models-routes-services/cron/routes'
]
const doc = {
  info: {
    title: 'Fantasy Node Admin',
    description: 'This repo is used for performing all the admin related tasks such as creating subadmin, admin auth. It also contains modules like complaints, column preference and profilelevel'
  },
  host: DEPLOY_HOST_URL,
  servers: [
    {
      // url: DEPLOY_HOST_URL // by default: 'http://localhost:3000'
      url: DEPLOY_HOST_URL
    }
  ]
}

swaggerAutogen(outputFile, endpointsFiles, doc)
