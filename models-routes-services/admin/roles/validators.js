const { body, query } = require('express-validator')
const { status } = require('../../../data')
const { PAGINATION_LIMIT } = require('../../../config/common')

const roleAdd = [
  body('sName').not().isEmpty(),
  body('aPermissions').not().isEmpty().isArray()
]

const roleUpdate = [
  body('sName').not().isEmpty(),
  body('eStatus').not().isEmpty().toUpperCase().isIn(status),
  body('aPermissions').not().isEmpty().isArray()
]

const limitValidator = [
  query('limit').optional().isNumeric({ max: PAGINATION_LIMIT })
]

module.exports = {
  roleAdd,
  roleUpdate,
  limitValidator
}
