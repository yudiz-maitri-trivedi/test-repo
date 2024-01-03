const { body } = require('express-validator')

const adminLoginV1 = [
  body('sLogin').not().isEmpty(),
  body('sPassword').not().isEmpty().optional()
]

const createSubAdminV1 = [
  body('sName').not().isEmpty(),
  body('sUsername').not().isEmpty(),
  body('sEmail').isEmail().not().isEmpty().escape(),
  body('sMobNum').not().isEmpty(),
  body('sPassword').not().isEmpty(),
  body('aRole').not().isEmpty()
]

const verifyOTPV1 = [
  body('sLogin').not().isEmpty(),
  body('sAuth').not().isEmpty(),
  body('sType').not().isEmpty(),
  body('sCode').isNumeric()
]

module.exports = {
  verifyOTPV1,
  createSubAdminV1,
  adminLoginV1
}
