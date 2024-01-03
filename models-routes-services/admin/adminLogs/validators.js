const { param, query } = require('express-validator')
const { PAGINATION_LIMIT } = require('../../../config/common')

const adminLogsMatch = [
  param('id').isMongoId(),
  query('limit').optional().isInt({ max: PAGINATION_LIMIT })
]

const adminLogsLeague = [
  param('id').isMongoId(),
  query('limit').optional().isInt({ max: PAGINATION_LIMIT })
]

const AdminLogs = [
  query('limit').optional().isInt({ max: PAGINATION_LIMIT })
]

const AdminLogsV2 = [
  query('nLimit').optional().isInt({ max: PAGINATION_LIMIT })
]

module.exports = {
  adminLogsMatch,
  adminLogsLeague,
  AdminLogs,
  AdminLogsV2
}
