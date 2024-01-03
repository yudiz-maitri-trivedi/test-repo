const { status, jsonStatus } = require('../helper/api.responses')
const { DISABLE_ADMIN_ROUTES } = require('../config/config')
const swaggerUI = require('swagger-ui-express')
const swaggerFile = require('../helper/swagger_output.json')
const { isDocAuthenticated } = require('./middleware')

module.exports = (app) => {
  if (DISABLE_ADMIN_ROUTES) {
    app.all('/api/admin/*', (req, res) => { return res.status(status.NotFound).jsonp({ status: jsonStatus.NotFound }) })
  }
  // Swagger documentation route

  app.use('/api/administrator/docs', isDocAuthenticated, swaggerUI.serve, swaggerUI.setup(swaggerFile))
  // in every service we have some initial, we need to change in this service to
  // REMEMBER : to tell front end and app team and then remove old route(above routes)
  app.use('/api', [
    require('../models-routes-services/admin/auth/routes'),
    require('../models-routes-services/admin/permissions/routes'),
    require('../models-routes-services/admin/subAdmin/routes'),
    require('../models-routes-services/admin/roles/routes'),
    require('../models-routes-services/admin/adminLogs/routes'),
    require('../models-routes-services/cron/routes'),
    require('../models-routes-services/vendor/routes'),
    require('../models-routes-services/template/routes')
  ])
  app.get('/health-check', (req, res) => {
    const sDate = new Date().toJSON()
    return res.status(status.OK).jsonp({ status: jsonStatus.OK, sDate })
  })
  app.get('*', (req, res) => {
    return res.status(status.NotFound).jsonp({ status: jsonStatus.NotFound })
  })
}
