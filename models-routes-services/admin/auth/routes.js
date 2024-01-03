const router = require('express').Router()
const adminAuthServices = require('./services')
const validators = require('./validators')
const { validateAdmin, validate, isAdminAuthenticated, decrypt } = require('../../../middlewares/middleware')

router.post('/admin/auth/login/v1', validators.adminLoginV1, validate, decrypt, adminAuthServices.loginV1)

router.post('/admin/auth/verify-otp/v1', validators.verifyOTPV1, validate, adminAuthServices.verifyOTPV1)
router.post('/admin/auth/sub-admin/v1', validators.createSubAdminV1, validateAdmin('SUBADMIN', 'W'), decrypt, adminAuthServices.createSubAdminV1)

router.put('/admin/auth/logout/v1', isAdminAuthenticated, adminAuthServices.logout)
router.get('/admin/auth/refresh-token/v1', adminAuthServices.refreshToken)

module.exports = router
