const router = require('express').Router()
const VendorServices = require('./services')
const validators = require('./validators')
const { isVendorAuthenticated, validateAdmin, decrypt, validate, isValidApiToken } = require('../../middlewares/middleware')
const { linkWhatsAppAccount, sendMessage, logoutWp } = require('./wp-service')
const { validateVendor } = require('./common')

// vendor auth routes
router.post('/vendor/v1', validators.createVendor, validateAdmin('VENDOR', 'W'), decrypt, VendorServices.createVendor)
router.post('/vendor/login/v1', validators.vendorLogin, validate, VendorServices.loginV1)
router.put('/vendor/logout/v1', isVendorAuthenticated, VendorServices.logout)
router.get('/vendor/:id/v1', isVendorAuthenticated, VendorServices.getV1)
router.put('/vendor/:id/v1', isVendorAuthenticated, validateVendor, VendorServices.update)
router.delete('/vendor/:id/v1', isVendorAuthenticated, VendorServices.delete)

// admin routes
router.get('/admin/get-vendors/list/v1', validators.limitValidator, validateAdmin('VENDOR', 'R'), VendorServices.listV1)

// whatsapp routes
router.post('/vendor/wp/link-acc/v1', validators.linkWpAcc, isVendorAuthenticated, isValidApiToken, linkWhatsAppAccount)
router.post('/vendor/wp/send-message/v1', validators.sendMessage, isVendorAuthenticated, isValidApiToken, sendMessage)
router.put('/vendor/wp/logout/v1', validators.logoutWp, isVendorAuthenticated, logoutWp)

module.exports = router
