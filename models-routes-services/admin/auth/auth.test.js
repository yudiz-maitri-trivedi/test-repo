/* eslint-disable max-lines-per-function */
const request = require('supertest')
const { describe, it, before } = require('mocha')
const server = require('../../../index')
const expect = require('expect')
const { messages, status } = require('../../../helper/api.responses')
const { encryption, generateNumber } = require('../../../helper/utilities.services')
const { globalStore } = require('../../../config/testStore')
const config = require('../../../config/config')
const randomNumber = generateNumber(0, 111111)
const randomPhone = generateNumber(1000000000, 9000000000)
const encryptPassword = encryption(`pass${randomNumber}`)
const store = {}

function getAuthFailed (done) {
  return (err, res) => {
    if (err) return done(err)
    expect(res.body.message).toMatch(messages.English.auth_failed)
    done()
  }
}

function getOtpErr (done) {
  return (err, res) => {
    if (err) return done(err)
    expect(res.body.message).toMatch(messages.English.verify_otp_err)
    done()
  }
}

describe('Create a auth routes', () => {
  before(() => {
    store.subAdminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZmM2M2VkYzFhNTlkMDJlMmM2ZjE4ZTkiLCJpYXQiOjE2MTIyNjA0MjUsImV4cCI6MTYyMDAzNjQyNX0.JXnMg9KdzPXP9v87VfSmPklHi3jW2c8gyzm9ViYoo60'
    store.superAdminToken = globalStore.adminToken
    store.ID = undefined
  })

  describe('/GET list of Permission', () => {
    it('should be a get list of Permission', (done) => {
      request(server)
        .get('/api/admin/permission/v1')
        .set('Authorization', store.superAdminToken)
        .expect(status.OK)
        .end(function (err, res) {
          if (err) return done(err)
          expect(res.body.message).toMatch(messages.English.success.replace('##', messages.English.permissions))
          if (res.body.data) {
            store.aPermissions = res.body.data.map(({ sKey, eStatus }) => ({ sKey, eType: eStatus }))
          }
          done()
        })
    })
  })

  describe('/POST Add new role named Full Permission', () => {
    it('should add a new role named Full permission', (done) => {
      const bodyData = {
        sName: 'Full Permission',
        aPermissions: globalStore.aPermissions,
        eStatus: 'Y'
      }

      request(server)
        .post('/api/admin/role/v1')
        .set('Authorization', store.superAdminToken)
        .send(bodyData)
        .expect(status.OK)
        .end(function (err, res) {
          if (err) return done(err)
          store.iRoleId = res.body.data._id
          expect(res.body.message).toMatch(messages.English.add_success.replace('##', messages.English.role))
          done()
        })
    })
  })

  const data = {
    sName: `name${randomNumber}`,
    sUsername: `username${randomNumber}`,
    sEmail: `james${randomNumber}@mailinator.com`,
    sMobNum: `${randomPhone}`,
    sPassword: `${encryptPassword}`,
    eStatus: 'Y'
  }
  describe('/POST create sub-Admin', () => {
    it('should create subadmin', (done) => {
      data.iRoleId = store.iRoleId

      request(server)
        .post('/api/admin/auth/sub-admin/v3')
        .set('Authorization', store.superAdminToken)
        .send(data)
        .expect(status.OK)
        .end(function (err, res) {
          if (err) return done(err)
          expect(res.body.message).toMatch(messages.English.add_success.replace('##', messages.English.subAdmin))
          done()
        })
    })
    it('should not be create sub-Admin as token passed is of SubAdmin', (done) => {
      request(server)
        .post('/api/admin/auth/sub-admin/v3')
        .set('Authorization', store.subAdminToken)
        .send(data)
        .expect(status.Unauthorized)
        .end(function (err, res) {
          if (err) return done(err)
          expect(res.body.message).toMatch(messages.English.err_unauthorized)
          done()
        })
    })

    it('should not be create sub-Admin  permission has N = NONE RIGHTS', (done) => {
      const superAdminData = {
        ...data, aPermissions: [{ sKey: 'LOGIN', eType: 'N' }]
      }

      request(server)
        .post('/api/admin/auth/sub-admin/v3')
        .set('Authorization', store.superAdminToken)
        .send(superAdminData)
        .expect(status.ResourceExist)
        .end(function (err, res) {
          if (err) return done(err)
          expect(res.body.message).toMatch(messages.English.already_exist.replace('##', messages.English.username))
          done()
        })
    })

    it('should not be create sub-Admin permission has N = NONE RIGHTS with mobile login', (done) => {
      data.sUsername = `Raviratna${randomNumber}`
      data.sEmail = 'raviratna@gmail.com'
      // data.aPermissions = [{ sKey: 'ADMIN', eType: 'N' }]
      data.sMobNum = '1234567895'
      request(server)
        .post('/api/admin/auth/sub-admin/v3')
        .set('Authorization', store.superAdminToken)
        .send(data)
        .expect(status.ResourceExist)
        .end(function (err, res) {
          if (err) return done(err)
          expect(res.body.message).toMatch(messages.English.already_exist.replace('##', messages.English.mobileNumber))
          done()
        })
    })

    it('should not be create sub-Admin permission has N = NONE RIGHTS with email', (done) => {
      data.sUsername = `username1${randomNumber}`
      data.sEmail = 'subadmin1@gmail.com'
      data.sMobNum = `${generateNumber(1000000000, 9999999999)}`
      request(server)
        .post('/api/admin/auth/sub-admin/v3')
        .set('Authorization', store.superAdminToken)
        .send(data)
        .expect(status.ResourceExist)
        .end(function (err, res) {
          if (err) return done(err)
          expect(res.body.message).toMatch(messages.English.already_exist.replace('##', messages.English.email))
          done()
        })
    })
  })

  describe('/POST login admin', () => {
    it('should not be login', (done) => {
      const loginData = {
        sLogin: 'admin@fanspotiz.com',
        sPassword: 'ravi1234'
      }
      request(server)
        .post('/api/admin/auth/login/v1')
        .send(loginData)
        .expect(status.BadRequest)
        .end(getAuthFailed(done))
    })

    it('should be login', (done) => {
      const loginpayload = {
        sLogin: 'admin@fanspotiz.com',
        sPassword: 'yudiz@123'
      }
      request(server)
        .post('/api/admin/auth/login/v1')
        .send(loginpayload)
        .expect(status.OK)
        .end(function (err, res) {
          if (err) return done(err)
          expect(res.body.data).toBeA('object')
          expect(res.body.message).toMatch(messages.English.succ_login)
          if (res.body.Authorization) {
            store.subAdminToken = res.body.Authorization
          } else {
            module.exports = 'hello'
          }
          done()
        })
    })

    it('admin should be login v2', (done) => {
      const loginpayload = {
        sLogin: 'admin@fanspotiz.com',
        sPassword: '{"v":"hybrid-crypto-js_0.2.4","iv":"PYXxZgqmM/o6NRRjJoXVj7S83nr5lQlQiSK0rNCuMkA=","keys":{"7d:36:3b:2f:b6:86:7f:f8:dc:5d:e2:82:3b:85:bc:63:a1:c0:b8:e0":"vLtUmPh2c831dOA8Y8B3ljUzIuO5IOO/MimWDcTnonA7Efpew2UQ46A6Z/nYfzDO4cJ7Vb6FHD84Hael8/ci4NMcQF6OvupEOMaUKdIBaBKy1v9zv99tAK+v/Cht1gemPVHbQAWmZZ5rUpYvJUw3XJDR87I2rdOHdMsn7S5kum8="},"cipher":"GVyy6/RKR+UJlmYeTQG0yg=="}'
      }
      request(server)
        .post('/api/admin/auth/login/v2')
        .send(loginpayload)
        .expect(status.OK)
        .end(function (err, res) {
          if (err) return done(err)
          expect(res.body.data).toBeA('object')
          expect(res.body.message).toMatch(messages.English.succ_login)
          if (res.body.Authorization) {
            store.subAdminToken = res.body.Authorization
          }
          done()
        })
    })
    it('admin should not be login v2 as password is wrong', (done) => {
      const loginpayload = {
        sLogin: 'admin@fanspotiz.com',
        sPassword: '{"v":"hybrid-crypto-js_0.2.4","iv":"CY0svJvBcmzuoaZ05dbcBKcmZf/4/SXm5jo1OVA7pzU=","keys":{"7d:36:3b:2f:b6:86:7f:f8:dc:5d:e2:82:3b:85:bc:63:a1:c0:b8:e0":"UmZnl3EuIpXci/BcReXsGITBpKgpq2jxTXoqHVAGhxnW1ODXXqqbfDG/xMkpllzk//3RYvFO7WMKvEUycWz1ZtlEM56WmQBDMnJ2GBay9ujCBAua+nTEzqTwIbmCrYQvdV1F+C2JNjLixz7j3eCgheLYOPG9c0MVC41tvqJyquc="},"cipher":"LSSFN6gl7r4uajmJ9326ig=="}'
      }
      request(server)
        .post('/api/admin/auth/login/v2')
        .send(loginpayload)
        .expect(status.BadRequest)
        .end(getAuthFailed(done))
    })

    it('admin should be login v4', (done) => {
      const loginpayload = {
        sLogin: 'admin@fanspotiz.com',
        sPassword: '{"v":"hybrid-crypto-js_0.2.4","iv":"PYXxZgqmM/o6NRRjJoXVj7S83nr5lQlQiSK0rNCuMkA=","keys":{"7d:36:3b:2f:b6:86:7f:f8:dc:5d:e2:82:3b:85:bc:63:a1:c0:b8:e0":"vLtUmPh2c831dOA8Y8B3ljUzIuO5IOO/MimWDcTnonA7Efpew2UQ46A6Z/nYfzDO4cJ7Vb6FHD84Hael8/ci4NMcQF6OvupEOMaUKdIBaBKy1v9zv99tAK+v/Cht1gemPVHbQAWmZZ5rUpYvJUw3XJDR87I2rdOHdMsn7S5kum8="},"cipher":"GVyy6/RKR+UJlmYeTQG0yg=="}'
      }
      request(server)
        .post('/api/admin/auth/login/v4')
        .send(loginpayload)
        .expect(status.OK)
        .end(function (err, res) {
          if (err) return done(err)
          expect(res.body.data).toBeA('object')
          expect(res.body.message).toMatch(messages.English.succ_login)
          if (res.body.Authorization) {
            store.subAdminToken = res.body.Authorization
          }
          done()
        })
    })

    it('admin should not be login v4 as password is wrong', (done) => {
      const loginpayload = {
        sLogin: 'admin@fanspotiz.com',
        sPassword: '{"v":"hybrid-crypto-js_0.2.4","iv":"CY0svJvBcmzuoaZ05dbcBKcmZf/4/SXm5jo1OVA7pzU=","keys":{"7d:36:3b:2f:b6:86:7f:f8:dc:5d:e2:82:3b:85:bc:63:a1:c0:b8:e0":"UmZnl3EuIpXci/BcReXsGITBpKgpq2jxTXoqHVAGhxnW1ODXXqqbfDG/xMkpllzk//3RYvFO7WMKvEUycWz1ZtlEM56WmQBDMnJ2GBay9ujCBAua+nTEzqTwIbmCrYQvdV1F+C2JNjLixz7j3eCgheLYOPG9c0MVC41tvqJyquc="},"cipher":"LSSFN6gl7r4uajmJ9326ig=="}'
      }
      request(server)
        .post('/api/admin/auth/login/v4')
        .send(loginpayload)
        .expect(status.BadRequest)
        .end(getAuthFailed(done))
    })

    if (config.ADMIN_LOGIN_AUTHENTICATION === 'otp') {
      it('admin should be found', (done) => {
        const loginpayload = {
          sLogin: 'admin@fanspotiz.com'
        }
        request(server)
          .post('/api/admin/auth/login/v4')
          .send(loginpayload)
          .expect(status.OK)
          .end(function (err, res) {
            if (err) return done(err)
            expect(res.body.message).toMatch(messages.English.OTP_sent_succ)
            done()
          })
      })
      it('admin should be not found', (done) => {
        const loginpayload = {
          sLogin: 'admin@ydiz.com',
          eStatus: 'Y'
        }
        request(server)
          .post('/api/admin/auth/login/v4')
          .send(loginpayload)
          .expect(status.NotFound)
          .end(getAuthFailed(done))
      })
    }

    it('logout admin', (done) => {
      request(server)
        .put('/api/admin/auth/logout/v1')
        .set('Authorization', store.subAdminToken)
        .expect(status.OK)
        .end(function (err, res) {
          if (err) return done(err)
          expect(res.body.message).toMatch(messages.English.succ_logout)
          done()
        })
    })
  })

  describe('/POST verify admin otp', () => {
    it('otp should be not in number', (done) => {
      const loginpayload = {
        sLogin: 'admin@fanspotiz.com',
        sType: 'E',
        sAuth: 'L',
        sCode: '1234'
      }
      request(server)
        .post('/api/admin/auth/verify-otp/v1')
        .send(loginpayload)
        .expect(status.BadRequest)
        .end(getOtpErr(done))
    })
    it('otp should be not found or incorrect', (done) => {
      const loginpayload = {
        sLogin: 'admin@fanspotiz.com',
        sCode: 1111
      }
      request(server)
        .post('/api/admin/auth/verify-otp/v1')
        .send(loginpayload)
        .expect(status.BadRequest)
        .end(getOtpErr(done))
    })
    it('otp should be correct', (done) => {
      const bodyData = {
        sLogin: 'admin@fanspotiz.com',
        sType: 'E',
        sAuth: 'L',
        sCode: 1234
      }
      request(server)
        .post('/api/admin/auth/verify-otp/v1')
        .send(bodyData)
        .expect(status.OK)
        .end(function (err, res) {
          if (err) return done(err)
          expect(res.body.data).toBeA('object')
          expect(res.body.message).toMatch(messages.English.verification_success)
          if (res.body.Authorization) {
            store.subAdminToken = res.body.Authorization
          }
          done()
        })
    })
  })
})
