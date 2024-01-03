const { body, query } = require('express-validator')
const { PAGINATION_LIMIT } = require('../../config/common')

const createVendor = [
  body('sName').not().isEmpty(),
  body('sUsername').not().isEmpty(),
  body('sEmail').isEmail().not().isEmpty().escape(),
  body('sMobNum').not().isEmpty(),
  body('sPassword').not().isEmpty()
]

const vendorLogin = [
  body('sLogin').not().isEmpty(),
  body('sPassword').not().isEmpty()
]

const linkWpAcc = [
  body('sMobNum').not().isEmpty()
]

const limitValidator = [
  query('limit').optional().isNumeric({ max: PAGINATION_LIMIT })
]

const logoutWp = [
  body('sMobNum').not().isEmpty()
]

const sendMessage = [
  body('aReceiver').not().isEmpty(),
  body('isImage').not().isEmpty(),
  body('iTemplateId').not().isEmpty()
]

module.exports = {
  vendorLogin,
  limitValidator,
  createVendor,
  linkWpAcc,
  logoutWp,
  sendMessage
}
