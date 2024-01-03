const router = require('express').Router()
const { isCronAuthenticated } = require('../../middlewares/middleware')
const cronServices = require('./services')

// It'll remove admin logs older than 2 months
router.get('/admin/cron/backup-old-adminlogs/v1', isCronAuthenticated, cronServices.backupOldAdminLogs)

module.exports = router
