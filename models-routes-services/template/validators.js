const { body, query, param } = require('express-validator')
const { PAGINATION_LIMIT } = require('../../config/common')
const { status } = require('../../data')

const templateCreate = [
  body('sImageUrl').optional().isURL({ protocols: ['https'] }),
  body('sMessage').not().isEmpty()
]

const templateUpdate = [
  param('id').isMongoId(),
  body('sMessage').optional(),
  body('eStatus').optional().toUpperCase().isIn(status)
]

const getSignedUrl = [
  body('sFileName').not().isEmpty(),
  body('sContentType').not().isEmpty()
]

const limitValidator = [
  query('limit').optional().isNumeric({ max: PAGINATION_LIMIT })
]

module.exports = {
  templateCreate,
  templateUpdate,
  getSignedUrl,
  limitValidator
}
