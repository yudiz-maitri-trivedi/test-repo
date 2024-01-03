const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const AdminsModel = require('../../admin/model')
const OTPVerificationsModel = require('../otpverifications.model')
const adminServices = require('../adminLogs/services')
const AdminAuthLogsModel = require('../authlogs.model')
const RolesModel = require('../roles/model')
const { messages, status, jsonStatus } = require('../../../helper/api.responses')
const { removenull, catchError, pick, checkAlphanumeric, getIp, validateMobile, generateOTP, encryptKeyPromise, decryptValuePromise, decryptIfExist } = require('../../../helper/utilities.services')
const config = require('../../../config/config')
const { checkRateLimit, checkRateLimitOTP, queuePush } = require('../../../helper/redis')
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const axios = require('axios')
const { testCasesDefault } = require('../../../config/testCases.js')
const { checkCodeValidity } = require('./common.js')

class AdminAuth {
  /**
   * Admin login using OTP or Password.
   * @param {*} req  'sLogin', 'sDeviceToken', 'sPassword', 'sPushToken'.
   * @param {*} res  OTP send message or Login successful message with jwt token
   * @returns OTP send message or Login admin with jwt token
   */
  async loginV1 (req, res) {
    try {
      if (config.ADMIN_LOGIN_AUTHENTICATION === 'otp') {
        req.body = pick(req.body, ['sLogin', 'sDeviceToken'])
        removenull(req.body)
        let { sLogin, sDeviceToken } = req.body

        const sType = validateMobile(sLogin) ? 'E' : 'M'
        sLogin = sLogin.toLowerCase().trim()
        sLogin = await encryptKeyPromise(sLogin)
        const admin = await AdminsModel.findOne({ $or: [{ sEmail: sLogin }, { sMobNum: sLogin }], eStatus: 'Y' }).populate({ path: 'aRole' })
        if (!admin) {
          return res.status(status.NotFound).jsonp({
            status: jsonStatus.NotFound,
            message: messages[req.userLanguage].auth_failed
          })
        }
        if (process.env.NODE_ENV === 'production') {
          const d = new Date()
          d.setSeconds(d.getSeconds() - 30)
          const exist = await OTPVerificationsModel.findOne({ sLogin, sType, sAuth: 'L', dCreatedAt: { $gt: d } }, null, { readPreference: 'primary' }).sort({ dCreatedAt: -1 })
          if (exist) return res.status(status.BadRequest).jsonp({ status: jsonStatus.BadRequest, message: messages[req.userLanguage].err_resend_otp.replace('##', messages[req.userLanguage].nThirty) })
        }
        let sCode = 8697
        if (['production', 'staging'].includes(process.env.NODE_ENV) && config.OTP_PROVIDER !== 'TEST') sCode = generateOTP(4)
        if (sType === 'E') {
          const decEmail = await decryptValuePromise(admin.sEmail)
          await Promise.all([
            OTPVerificationsModel.create({ sLogin, sCode, sType, sAuth: 'L', sDeviceToken, iAdminId: admin._id }),
            queuePush('SendMail', {
              sSlug: 'send-otp-email',
              replaceData: {
                email: admin.sEmail,
                otp: sCode,
                from: config.SMTP_FROM
              },
              to: decEmail
            })
          ])
        } else if (sType === 'M' && ['production', 'staging'].includes(process.env.NODE_ENV) && config.OTP_PROVIDER !== 'TEST') {
          const decLogin = await decryptValuePromise(sLogin)
          await Promise.all([
            OTPVerificationsModel.create({ sLogin, sCode, sType, sAuth: 'L', sDeviceToken, iAdminId: admin._id }),
            queuePush('sendSms', {
              sProvider: config.OTP_PROVIDER,
              oUser: {
                sPhone: decLogin,
                sOTP: sCode
              }
            })
          ])
        }

        return res.status(status.OK).jsonp({ status: jsonStatus.OK, message: messages[req.userLanguage].OTP_sent_succ })
      } else {
        req.body = pick(req.body, ['sLogin', 'sPassword', 'sPushToken', 'sDeviceToken'])
        removenull(req.body)
        let { sLogin, sPushToken, sPassword, sDeviceToken } = req.body
        // check rate limit for password sending from same ip at multiple time. we'll make sure not too many request from same ip will occurs.
        const rateLimit = await checkRateLimit(5, `rlpassword:${sLogin}`, getIp(req))
        if (rateLimit === 'LIMIT_REACHED') return res.status(status.TooManyRequest).jsonp({ status: jsonStatus.TooManyRequest, message: messages[req.userLanguage].limit_reached.replace('##', messages[req.userLanguage].cpassword) })

        sLogin = sLogin.toLowerCase().trim()
        sLogin = await encryptKeyPromise(sLogin)
        let admin = await AdminsModel.findOne({ $or: [{ sEmail: sLogin }, { sMobNum: sLogin }], eStatus: 'Y' }).populate({ path: 'aRole' })

        if (!admin) {
          return res.status(status.NotFound).jsonp({
            status: jsonStatus.NotFound,
            message: messages[req.userLanguage].auth_failed
          })
        }

        if (!bcrypt.compareSync(sPassword, admin.sPassword)) {
          return res.status(status.BadRequest).jsonp({
            status: jsonStatus.BadRequest,
            message: messages[req.userLanguage].auth_failed
          })
        }
        if (rateLimit === 'LIMIT_REACHED') {
          return res.status(status.TooManyRequest).jsonp({ status: jsonStatus.TooManyRequest, message: messages[req.userLanguage].limit_reached.replace('##', messages[req.userLanguage].cpassword) })
        }

        const sRefreshToken = jwt.sign({ _id: (admin._id), eType: admin.eType, sLatitude: admin?.sLatitude || '', sLongitude: admin?.sLongitude || '' }, config.REFRESH_TOKEN_SECRET, { expiresIn: config.REFRESH_TOKEN_VALIDITY })

        const newToken = {
          sToken: jwt.sign({ _id: (admin._id).toHexString(), eType: admin.eType, sLatitude: admin?.sLatitude || '', sLongitude: admin?.sLongitude || '' }, config.JWT_SECRET, { expiresIn: config.JWT_VALIDITY }),
          sIpAddress: getIp(req),
          sPushToken
        }

        // Admin can login in LOGIN_HARD_LIMIT_ADMIN time.
        // for e.g. LOGIN_HARD_LIMIT_ADMIN=5 -> Admin can login only for 5 times, After that we'll remove first login token from db.
        if (admin.aJwtTokens.length < config.LOGIN_HARD_LIMIT_ADMIN || config.LOGIN_HARD_LIMIT_ADMIN === 0) {
          admin.aJwtTokens.push(newToken)
        } else {
          admin.aJwtTokens.splice(0, 1)
          admin.aJwtTokens.push(newToken)
        }

        admin.dLoginAt = new Date()
        admin.bLoggedOut = false
        await admin.save()

        const ePlatform = ['A', 'I', 'W'].includes(req.header('Platform')) ? req.header('Platform') : 'O'

        await AdminAuthLogsModel.create({ iAdminId: admin._id, ePlatform, eType: 'L', sDeviceToken, sIpAddress: getIp(req) })

        admin = AdminsModel.filterData(admin)
        if (admin.sEmail) admin.sEmail = await decryptValuePromise(admin.sEmail)
        if (admin.sMobNum) admin.sMobNum = await decryptValuePromise(admin.sMobNum)

        return res.status(status.OK).set({ Authorization: newToken.sToken, RefreshToken: sRefreshToken }).jsonp({
          status: jsonStatus.OK,
          message: messages[req.userLanguage].succ_login,
          data: admin,
          Authorization: newToken.sToken,
          RefreshToken: sRefreshToken
        })
      }
    } catch (error) {
      return catchError('AdminAuth.loginV3', error, req, res)
    }
  }

  /**
   * New version of verify otp for Verifying otp for admin login. add location feature
   * @body {*} req  'sLogin', 'sType', 'sAuth', 'sCode', 'sDeviceToken', 'sLatitude', 'sLongitude'.
   * @param {*} res  verify otp with Login successful message with jwt token
   * @returns verify otp with Login successful message with jwt token
   */
  async verifyOTPV1 (req, res) {
    try {
      req.body = pick(req.body, ['sLogin', 'sType', 'sAuth', 'sCode', 'sDeviceToken', 'sLatitude', 'sLongitude'])
      let { sLogin, sType, sAuth, sCode, sDeviceToken, sPushToken, sLatitude, sLongitude } = req.body
      removenull(req.body)

      // const isLocationValid = await checkLocationValidity(req, res, sLatitude, sLongitude)
      // if (isLocationValid) {
      //   return res.status(status.BadRequest).jsonp({
      //     status: jsonStatus.BadRequest,
      //     message: messages[req.userLanguage].location_details_required
      //   })
      // }

      sCode = parseInt(sCode)
      const isCodeValid = await checkCodeValidity(req, res, sCode)
      if (isCodeValid) {
        const errorMessage = messages[req.userLanguage].verify_otp_err
        return res.status(status.BadRequest).jsonp({
          status: jsonStatus.BadRequest,
          message: errorMessage
        })
      }

      const envs = ['production', 'staging']
      const checkEnv = envs.includes(process.env.NODE_ENV)
      // check rate limit for otp verify from same ip at multiple time. we'll make sure not too many request from same ip will occurs.
      if (checkEnv) {
        const rateLimit = await checkRateLimitOTP(sLogin, sType, `${sAuth}-V`)
        if (rateLimit === 'LIMIT_REACHED') return res.status(status.TooManyRequest).jsonp({ status: jsonStatus.TooManyRequest, message: messages[req.userLanguage].limit_reached.replace('##', messages[req.userLanguage].cotpVerification) })
      }
      sLogin = await encryptKeyPromise(sLogin)
      const exist = await OTPVerificationsModel.findOne({ sLogin }, null, { readPreference: 'primary' }).sort({ dCreatedAt: -1 }).lean()
      const checkExist = (!exist || (exist.sCode !== sCode))
      if (checkExist) return res.status(status.BadRequest).jsonp({ status: jsonStatus.BadRequest, message: messages[req.userLanguage].verify_otp_err })

      const platforms = ['A', 'I', 'W']
      const platformHeader = req.header('Platform')
      const isPlatformIncluded = platforms.includes(platformHeader)
      const ePlatform = isPlatformIncluded ? platformHeader : 'O'
      const [, AdminDetails = {}] = await Promise.all([
        OTPVerificationsModel.findByIdAndUpdate(exist._id, { bIsVerify: true }, { runValidators: true, readPreference: 'primary' }).lean(),
        AdminsModel.findById(exist.iAdminId, null, { readPreference: 'primary' }).populate({ path: 'aRole' }).lean()
      ])

      const sNewLatitude = sLatitude || ''
      const sNewLongitude = sLongitude || ''

      const sRefreshToken = jwt.sign({ _id: (AdminDetails._id).toHexString(), eType: AdminDetails.eType, sLatitude: sNewLatitude, sLongitude: sNewLongitude }, config.REFRESH_TOKEN_SECRET, { expiresIn: config.REFRESH_TOKEN_VALIDITY })

      const newToken = {
        sToken: jwt.sign({ _id: (AdminDetails._id).toHexString(), eType: AdminDetails.eType, sLatitude: sNewLatitude, sLongitude: sNewLongitude }, config.JWT_SECRET, { expiresIn: config.JWT_VALIDITY }),
        sPushToken,
        sLatitude,
        sLongitude
      }
      const isLoginHardLimitAdmin = ((AdminDetails.aJwtTokens.length < config.LOGIN_HARD_LIMIT_ADMIN) || config.LOGIN_HARD_LIMIT_ADMIN === 0)
      if (isLoginHardLimitAdmin) {
        AdminDetails.aJwtTokens.push(newToken)
      } else {
        AdminDetails.aJwtTokens.splice(0, 1)
        AdminDetails.aJwtTokens.push(newToken)
      }
      await Promise.all([
        AdminsModel.updateOne({ _id: new ObjectId(AdminDetails._id) }, { aJwtTokens: AdminDetails.aJwtTokens, dLoginAt: new Date(), bLoggedOut: false }),
        AdminAuthLogsModel.create({ iAdminId: AdminDetails._id, ePlatform, eType: exist.sAuth, sDeviceToken, sIpAddress: getIp(req) })
      ])

      AdminsModel.filterData(AdminDetails)
      await decryptIfExist(AdminDetails, ['sEmail', 'sMobNum'])

      return res.status(status.OK).set({ Authorization: newToken.sToken, RefreshToken: sRefreshToken }).jsonp({ status: jsonStatus.OK, message: messages[req.userLanguage].verification_success, data: AdminDetails, Authorization: newToken.sToken, RefreshToken: sRefreshToken })
    } catch (error) {
      return catchError('AdminAuth.verifyOTPV2', error, req, res)
    }
  }

  /**
   * Logout admin from admin panel
   * @param {*} req  admin id
   * @param {*} res  logout message
   * @returns logout message
   */
  async logout (req, res) {
    try {
      // We'll remove auth token from db at logout time
      await AdminsModel.updateOne({ _id: new ObjectId(req.admin._id) }, { $pull: { aJwtTokens: { sToken: req.header('Authorization') } } })
      return res.status(status.OK).jsonp({
        status: jsonStatus.OK,
        message: messages[req.userLanguage].succ_logout
      })
    } catch (error) {
      return catchError('AdminAuth.logout', error, req, res)
    }
  }

  /**
   * for super user => Create sub-admin
   * @body {*} req  aRole', 'sName', 'sUsername', 'sEmail', 'sMobNum', 'sPassword', 'eStatus'
   * @param {*} res  Message => admin create successfully
   * @returns  Message => admin create successfully
   */
  async createSubAdminV1 (req, res) {
    try {
      req.body = pick(req.body, ['aRole', 'sName', 'sUsername', 'sEmail', 'sMobNum', 'sPassword', 'eStatus'])

      let { sName, sUsername, sEmail, sMobNum, aRole, eStatus } = req.body

      sEmail = sEmail.toLowerCase().trim()

      // only super admin has rights to create sub admin
      if (req.admin.eType !== 'SUPER') return res.status(status.Unauthorized).jsonp({ status: jsonStatus.Unauthorized, message: messages[req.userLanguage].access_denied })

      if (!checkAlphanumeric(sUsername)) return res.status(status.BadRequest).jsonp({ status: jsonStatus.BadRequest, message: messages[req.userLanguage].must_alpha_num })

      if (validateMobile(sMobNum)) return res.status(status.BadRequest).jsonp({ status: jsonStatus.BadRequest, message: messages[req.userLanguage].invalid.replace('##', messages[req.userLanguage].mobileNumber) })
      // We'll check that role that is to be assigned to sub admin is active or not.
      const roles = await RolesModel.find({ _id: { $in: aRole }, eStatus: 'Y' }, { _id: 1 }).lean()
      if (!roles.length) return res.status(status.NotFound).jsonp({ status: jsonStatus.NotFound, message: messages[req.userLanguage].do_not_exist.replace('##', messages[req.userLanguage].croles) })

      sEmail = await encryptKeyPromise(sEmail)
      sMobNum = await encryptKeyPromise(sMobNum)

      const adminExist = await AdminsModel.findOne({ $or: [{ sEmail }, { sMobNum }, { sUsername }] }).lean()
      if (adminExist && adminExist.sUsername === sUsername) return res.status(status.ResourceExist).jsonp({ status: jsonStatus.ResourceExist, message: messages[req.userLanguage].already_exist.replace('##', messages[req.userLanguage].username) })
      if (adminExist && adminExist.sMobNum === sMobNum) return res.status(status.ResourceExist).jsonp({ status: jsonStatus.ResourceExist, message: messages[req.userLanguage].already_exist.replace('##', messages[req.userLanguage].mobileNumber) })
      if (adminExist && adminExist.sEmail === sEmail) return res.status(status.ResourceExist).jsonp({ status: jsonStatus.ResourceExist, message: messages[req.userLanguage].already_exist.replace('##', messages[req.userLanguage].email) })
      const newAdmin = new AdminsModel({ ...req.body, sEmail, sMobNum, aRole: roles, eType: 'SUB' })
      await newAdmin.save()

      // Log the record for future purpose to know which super admin has create sub admin
      const { _id: iAdminId } = req.admin
      const oNewFields = { sName, sUsername, sEmail, sMobNum, aRole, eStatus }
      const logData = { oOldFields: {}, oNewFields, iAdminId: new ObjectId(iAdminId), sIP: getIp(req), eKey: 'SUB', sLatitude: req.admin.sLatitude, sLongitude: req.admin.sLongitude }
      await adminServices.adminLog(req, res, logData)

      return res.status(status.OK).jsonp({ status: jsonStatus.OK, message: messages[req.userLanguage].add_success.replace('##', messages[req.userLanguage].subAdmin) })
    } catch (error) {
      return catchError('AdminAuth.createSubAdminV1', error, req, res)
    }
  }

  /**
  * Give you a Admin Authorization token to run test script.
  * @returns Authorization token.
  */
  async getAdminToken () {
    let response
    try {
      const result = await axios.post('localhost:3001/api/admin/auth/login/v1', { // v1 api for admin login already deprecated, need to check
        sLogin: testCasesDefault.superAdmin.sLogin,
        sPassword: testCasesDefault.superAdmin.sPassword
      })
      response = result.data.Authorization
    } catch (error) {
      return catchError('AdminAuth.getAdminToken', error, '', '')
    }
    return response
  }

  /**
   * This api is used for getting new token from refreshToken for admin as we will process login in background if the jwt token expires
  */
  async refreshToken (req, res) {
    try {
      const sRefreshToken = req.header('RefreshToken')
      // const sOldToken = req.header('Authorization')
      if (sRefreshToken) {
        const admin = await AdminsModel.findByRefreshToken(sRefreshToken)
        if (!admin) return res.status(status.Unauthorized).json({ status: jsonStatus.Unauthorized, message: messages[req.userLanguage].err_unauthorized })
        const sToken = jwt.sign({ _id: (admin._id).toHexString(), eType: admin.eType, sLatitude: admin?.sLatitude || '', sLongitude: admin?.sLongitude || '' }, config.JWT_SECRET, { expiresIn: config.JWT_VALIDITY })
        const newToken = {
          sToken,
          sIpAddress: getIp(req)
        }
        if (admin.aJwtTokens.length < config.LOGIN_HARD_LIMIT_ADMIN || config.LOGIN_HARD_LIMIT_ADMIN === 0) {
          admin.aJwtTokens.push(newToken)
        } else {
          admin.aJwtTokens.splice(0, 1)
          admin.aJwtTokens.push(newToken)
        }

        await AdminsModel.updateOne({ _id: new ObjectId(admin._id) }, { aJwtTokens: admin.aJwtTokens, dLoginAt: new Date() })

        return res.set({ Authorization: sToken, RefreshToken: sRefreshToken }).jsonp({ status: jsonStatus.OK, message: messages[req.userLanguage].generate_success.replace('##', messages[req.userLanguage].cToken), Authorization: sToken, RefreshToken: sRefreshToken })
      }
    } catch (err) {
      return catchError('AdminAuth.refreshToken', err, req, res)
    }
  }
}

module.exports = new AdminAuth()
