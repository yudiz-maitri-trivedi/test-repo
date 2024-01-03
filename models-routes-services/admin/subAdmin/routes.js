const router = require('express').Router()
const subAdminServices = require('./services')
const validators = require('./validators')
const { validateAdmin, decrypt } = require('../../../middlewares/middleware')

router.get('/admin/sub-admin/list/v1', validators.limitValidator, validateAdmin('SUBADMIN', 'R'), subAdminServices.listV1)

router.get('/admin/sub-admin/:id/v1', validateAdmin('SUBADMIN', 'R'), subAdminServices.getV1)

router.put('/admin/sub-admin/:id/v1', validators.updateSubAdminV3, validateAdmin('SUBADMIN', 'W'), decrypt, subAdminServices.updateV1)

router.get('/admin/sub-admin-ids/v1', validateAdmin('SUBADMIN', 'R'), subAdminServices.getAdminIds)

module.exports = router
