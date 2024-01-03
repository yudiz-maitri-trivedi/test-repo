const router = require('express').Router()
const services = require('./services')
const validators = require('./validators')
const { validateAdmin } = require('../../../middlewares/middleware')

router.get('/admin/sub-admin-logs/v2', validators.AdminLogsV2, validateAdmin('SUBADMIN', 'R'), services.AdminLogsV2)
router.get('/admin/sub-admin-logs/:id/v1', validateAdmin('SUBADMIN', 'R'), services.getAdminLog)

module.exports = router
