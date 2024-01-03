/**
 * Auth middleware containes the common methods to authenticate user or admin by token.
 * @method {validateAdmin('MATCH','R')} is for authenticating the token and make sure its a admin.
 * @method {isUserAuthenticated} is for authenticating the token.
 * @method {findByToken} is specified in user.model.js
 */
const Sentry = require('@sentry/node')
const Crypt = require('hybrid-crypto-js').Crypt
const crypt = new Crypt()
const AdminsModel = require('../models-routes-services/admin/model')
const RolesModel = require('../models-routes-services/admin/roles/model')
const { messages, status, jsonStatus } = require('../helper/api.responses')
const { validationResult } = require('express-validator')
const { PRIVATE_KEY } = require('../config/config')
const jwt = require('jsonwebtoken')
const ObjectId = require('mongoose').Types.ObjectId
const config = require('../config/config')
const { encryption, catchError } = require('../helper/utilities.services')
const vendorsModel = require('../models-routes-services/vendor/model')

const validateAdmin = (sKey, eType) => {
  return async (req, res, next) => {
    try {
      const token = req.header('Authorization')
      if (!token) {
        return res.status(status.Unauthorized).jsonp({
          status: jsonStatus.Unauthorized,
          message: messages[req.userLanguage].err_unauthorized
        })
      }
      let admin
      try {
        admin = await AdminsModel.findByToken(token)
      } catch (err) {
        return res.status(status.Unauthorized).jsonp({
          status: jsonStatus.Unauthorized,
          message: messages[req.userLanguage].err_unauthorized
        })
      }
      if (!admin) {
        return res.status(status.Unauthorized).jsonp({
          status: jsonStatus.Unauthorized,
          message: messages[req.userLanguage].err_unauthorized
        })
      }
      req.admin = admin
      let errors
      if (req.admin.eType === 'SUPER') {
        errors = validationResult(req)
        if (!errors.isEmpty()) {
          return res.status(status.UnprocessableEntity).jsonp({
            status: jsonStatus.UnprocessableEntity,
            errors: errors.array()
          })
        }

        return next(null, null)
      } else {
        if (!req.admin.aRole) return res.status(status.Unauthorized).jsonp({ status: jsonStatus.Unauthorized, message: messages[req.userLanguage].access_denied })

        const roles = await RolesModel.find({ _id: { $in: req.admin.aRole }, eStatus: 'Y' }, { aPermissions: 1 }).lean()
        if (!roles.length) return res.status(status.Unauthorized).jsonp({ status: jsonStatus.Unauthorized, message: messages[req.userLanguage].access_denied })
        let aPermissions = roles.map(role => role.aPermissions)
        aPermissions = [].concat.apply([], aPermissions)
        const hasPermission = aPermissions.find((permission) => {
          return (
            permission.sKey === sKey &&
            (permission.eType === eType ||
              (eType === 'R' && permission.eType === 'W'))
          )
        })
        if (!hasPermission) {
          let hasSubAdminPermission
          if (sKey === 'DEPOSIT' && eType === 'W') {
            hasSubAdminPermission = roles.aPermissions.find((permission) => {
              return (
                permission.sKey === 'SYSTEM_USERS' && permission.eType === 'W'
              )
            })
          }
          if (!hasSubAdminPermission) {
            let message

            switch (eType) {
              case 'R':
                message = messages[req.userLanguage].read_access_denied.replace('##', sKey)
                break
              case 'W':
                message = messages[req.userLanguage].write_access_denied.replace('##', sKey)
                break
              case 'N':
                message = messages[req.userLanguage].access_denied
                break
              default:
                message = messages[req.userLanguage].access_denied
                break
            }

            return res.status(status.Unauthorized).jsonp({
              status: jsonStatus.Unauthorized,
              message
            })
          }
        }
        errors = validationResult(req)
        if (!errors.isEmpty()) {
          return res.status(status.UnprocessableEntity).jsonp({
            status: jsonStatus.UnprocessableEntity,
            errors: errors.array()
          })
        }
        return next(null, null)
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'production') Sentry.captureMessage(error)
      return res.status(status.InternalServerError).jsonp({
        status: jsonStatus.InternalServerError,
        message: messages[req.userLanguage].error
      })
    }
  }
}

const isAdminAuthenticated = async (req, res, next) => {
  try {
    const token = req.header('Authorization')
    if (!token) {
      return res.status(status.Unauthorized).jsonp({
        status: jsonStatus.Unauthorized,
        message: messages[req.userLanguage].err_unauthorized
      })
    }
    const admin = await AdminsModel.findByToken(token)
    if (!admin) {
      return res.status(status.Unauthorized).jsonp({
        status: jsonStatus.Unauthorized,
        message: messages[req.userLanguage].err_unauthorized
      })
    }
    req.admin = admin

    return next(null, null)
  } catch (error) {
    if (process.env.NODE_ENV === 'production') Sentry.captureMessage(error)
    return res.status(status.InternalServerError).jsonp({
      status: jsonStatus.InternalServerError,
      message: messages[req.userLanguage].error
    })
  }
}

const isAdminAuthenticatedToDeposit = async (req, res, next) => {
  try {
    const token = req.header('Authorization')
    if (!token) {
      return res.status(status.Unauthorized).jsonp({
        status: jsonStatus.Unauthorized,
        message: messages[req.userLanguage].err_unauthorized
      })
    }
    const admin = await AdminsModel.findByDepositToken(token)
    if (!admin) {
      return res.status(status.Unauthorized).jsonp({
        status: jsonStatus.Unauthorized,
        message: messages[req.userLanguage].err_unauthorized
      })
    }
    req.admin = admin

    return next(null, null)
  } catch (error) {
    if (process.env.NODE_ENV === 'production') Sentry.captureMessage(error)
    return res.status(status.InternalServerError).jsonp({
      status: jsonStatus.InternalServerError,
      message: messages[req.userLanguage].error
    })
  }
}

const isAdminAuthorized = (sKey, eType) => {
  return async function (req, res, next) {
    if (req.admin.eType === 'SUPER') {
      next()
    } else {
      if (!req.admin.aRole) return res.status(status.Unauthorized).jsonp({ status: jsonStatus.Unauthorized, message: messages[req.userLanguage].access_denied })

      const role = await RolesModel.find({ _id: { $in: req.admin.aRole }, eStatus: 'Y' }, { aPermissions: 1 }).lean()
      if (!role) return res.status(status.Unauthorized).jsonp({ status: jsonStatus.Unauthorized, message: messages[req.userLanguage].access_denied })
      let aPermissions = role.map(roles => roles.aPermissions)
      aPermissions = [].concat.apply([], aPermissions)
      const hasPermission = aPermissions.find((permission) => {
        return (
          permission.sKey === sKey &&
          (permission.eType === eType ||
            (eType === 'R' && permission.eType === 'W'))
        )
      })

      if (!hasPermission) {
        let message

        switch (eType) {
          case 'R':
            message = messages[req.userLanguage].read_access_denied.replace('##', sKey)
            break
          case 'W':
            message = messages[req.userLanguage].write_access_denied.replace('##', sKey)
            break
          case 'N':
            message = messages[req.userLanguage].access_denied
            break
          default:
            message = messages[req.userLanguage].access_denied
            break
        }

        return res.status(status.Unauthorized).jsonp({
          status: jsonStatus.Unauthorized,
          message
        })
      }
      next()
    }
  }
}

const validate = function (req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res
      .status(status.UnprocessableEntity)
      .jsonp({ status: jsonStatus.UnprocessableEntity, errors: errors.array() })
  }
  next()
}

const decryption = function (password) {
  const decrypted = crypt.decrypt(PRIVATE_KEY, password)
  const decryptedData = decrypted.message
  return decryptedData.toString()
}
const decrypt = function (req, res, next) {
  const { sPassword, sOldPassword, sNewPassword } = req.body
  if (sPassword) {
    // added encryption for temp remove when commit code
    req.sPassword = encryption(sPassword)
    console.log(req.sPassword)
    req.body.sPassword = decryption(req.sPassword)
  } else if (sOldPassword && sNewPassword) {
    req.body.sOldPassword = decryption(sOldPassword)
    req.body.sNewPassword = decryption(sNewPassword)
  } else if (!sOldPassword && sNewPassword) {
    req.body.sNewPassword = decryption(sNewPassword)
  }
  next()
}

const isUserAuthenticated = (req, res, next) => {
  try {
    const token = req.header('Authorization')
    if (!token) {
      return res.status(status.Unauthorized).jsonp({
        status: jsonStatus.Unauthorized,
        message: messages[req.userLanguage].err_unauthorized
      })
    }
    req.user = {}
    let user
    try {
      // user = await UsersModel.findByToken(token)
      user = jwt.verify(token, config.JWT_SECRET_USER)
    } catch (err) {
      return res.status(status.Unauthorized).jsonp({
        status: jsonStatus.Unauthorized,
        message: messages[req.userLanguage].err_unauthorized
      })
    }

    if (!user) {
      return res.status(status.Unauthorized).jsonp({
        status: jsonStatus.Unauthorized,
        message: messages[req.userLanguage].err_unauthorized
      })
    }
    // 2 means user.eType = 'B'
    if (user.eType === '2') {
      return res.status(status.NotFound).jsonp({ status: jsonStatus.NotFound, message: messages[req.userLanguage].user_blocked })
    }
    // await redisClient.hset(`at:${token}`, '_id', user._id.toString())
    // await redisClient.expire(`at:${token}`, 86400)
    req.user = user
    req.user._id = new ObjectId(user._id)
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(status.UnprocessableEntity).jsonp({
        status: jsonStatus.UnprocessableEntity,
        errors: errors.array()
      })
    }
    return next(null, null)
  } catch (error) {
    if (process.env.NODE_ENV === 'production') Sentry.captureMessage(error)
    return res.status(status.InternalServerError).jsonp({
      status: jsonStatus.InternalServerError,
      message: messages[req.userLanguage].error
    })
  }
}

const isVendorAuthenticated = async (req, res, next) => {
  try {
    const token = req.header('Authorization')
    if (!token) {
      return res.status(status.Unauthorized).jsonp({
        status: jsonStatus.Unauthorized,
        message: messages[req.userLanguage].err_unauthorized
      })
    }
    req.vendor = {}
    let vendor
    try {
      vendor = await vendorsModel.findByToken(token)
    } catch (err) {
      return res.status(status.Unauthorized).jsonp({
        status: jsonStatus.Unauthorized,
        message: messages[req.userLanguage].err_unauthorized
      })
    }
    if (!vendor) {
      return res.status(status.Unauthorized).jsonp({
        status: jsonStatus.Unauthorized,
        message: messages[req.userLanguage].err_unauthorized
      })
    }
    req.vendor = vendor
    req.vendor._id = new ObjectId(vendor._id)
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(status.UnprocessableEntity).jsonp({
        status: jsonStatus.UnprocessableEntity,
        errors: errors.array()
      })
    }
    return next(null, null)
  } catch (error) {
    if (process.env.NODE_ENV === 'production') Sentry.captureMessage(error)
    return res.status(status.InternalServerError).jsonp({
      status: jsonStatus.InternalServerError,
      message: messages[req.userLanguage].error
    })
  }
}

const isCronAuthenticated = (req, res, next) => {
  try {
    if (config.CRON_AUTH_ENABLED) {
      const token = req.header('Authorization')
      if (!token || !config.CRON_AUTH_TOKEN || token !== config.CRON_AUTH_TOKEN) {
        return res.status(status.Unauthorized).jsonp({
          status: jsonStatus.Unauthorized,
          message: messages[req.userLanguage].err_unauthorized
        })
      }
    }
    return next()
  } catch (error) {
    if (process.env.NODE_ENV === 'production') Sentry.captureMessage(error)
    return res.status(status.InternalServerError).jsonp({
      status: jsonStatus.InternalServerError,
      message: messages[req.userLanguage].error
    })
  }
}

const isDocAuthenticated = (req, res, next) => {
  try {
    const token = req?.query.token
    if ((!token || token !== config.SWAGGER_AUTH_TOKEN) && (!req.url.startsWith('/swagger-ui'))) {
      return res.status(status.Unauthorized).jsonp({
        status: jsonStatus.Unauthorized,
        message: messages[req.userLanguage].err_unauthorized
      })
    }

    return next()
  } catch (error) {
    if (process.env.NODE_ENV === 'production') Sentry.captureMessage(error)
    return res.status(status.InternalServerError).jsonp({
      status: jsonStatus.InternalServerError,
      message: messages[req.userLanguage].error
    })
  }
}

const isValidApiToken = (req, res, next) => {
  try {
    const apiToken = req.header('api-token')
    if (!apiToken) return res.status(status.BadRequest).jsonp({ status: jsonStatus.BadRequest, message: messages[req.userLanguage].api_token_err })
    if (req.vendor.sApiToken !== apiToken) return res.status(status.UnprocessableEntity).jsonp({ status: jsonStatus.UnprocessableEntity, message: messages[req.userLanguage].invalid.replace('##', messages[req.userLanguage].apiToken) })
    next()
  } catch (error) {
    return catchError('ApiToken.error', error, req, res)
  }
}
module.exports = {
  validateAdmin,
  validate,
  isAdminAuthorized,
  isAdminAuthenticated,
  decrypt,
  decryption,
  isAdminAuthenticatedToDeposit,
  isUserAuthenticated,
  isVendorAuthenticated,
  isValidApiToken,
  isCronAuthenticated,
  isDocAuthenticated
}
