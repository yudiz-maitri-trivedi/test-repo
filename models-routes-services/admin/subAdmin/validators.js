const { body, query } = require('express-validator')
const { PAGINATION_LIMIT } = require('../../../config/common')

const updateSubAdminV2 = [
  body('sName').not().isEmpty(),
  body('sUsername').not().isEmpty(),
  body('sEmail').isEmail().escape(),
  body('sMobNum').not().isEmpty(),
  body('iRoleId').not().isEmpty()
]
const updateSubAdminV3 = [
  body('sName').not().isEmpty(),
  body('sUsername').not().isEmpty(),
  body('sEmail').isEmail().escape(),
  body('sMobNum').not().isEmpty(),
  body('aRole').not().isEmpty()
]

const limitValidator = [
  query('limit').optional().isNumeric({ max: PAGINATION_LIMIT })
]

module.exports = {
  updateSubAdminV2,
  updateSubAdminV3,
  limitValidator
}
