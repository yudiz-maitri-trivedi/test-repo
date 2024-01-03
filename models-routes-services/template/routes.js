const router = require('express').Router()
const validators = require('./validators')
const templateServices = require('./services')
const { isVendorAuthenticated, validateAdmin } = require('../../middlewares/middleware')
const { preSignedUrl } = require('../../helper/s3config')

router.post('/vendor/template/pre-signed-url/v1', validators.getSignedUrl, isVendorAuthenticated, preSignedUrl)
router.post('/vendor/template/v1', validators.templateCreate, isVendorAuthenticated, templateServices.create)
router.get('/vendor/template/list/v1', validators.limitValidator, isVendorAuthenticated, templateServices.list)
router.get('/vendor/template/:id/v1', isVendorAuthenticated, templateServices.get)
router.put('/vendor/template/:id/v1', validators.templateUpdate, isVendorAuthenticated, templateServices.update)
router.delete('/vendor/template/:id/v1', isVendorAuthenticated, templateServices.delete)

// admin route
router.get('/admin/template/list/v1', validateAdmin('MESSAGE_TEMPLATES', 'R'), templateServices.adminList)

module.exports = router
