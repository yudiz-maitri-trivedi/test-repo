/* eslint-disable max-lines-per-function */
const request = require('supertest')
const { describe, it, before } = require('mocha')
const expect = require('expect')
const server = require('../../../index')
const store = {}
const { status, messages } = require('../../../helper/api.responses')
const { globalStore } = require('../../../config/testStore')
const { encryption, randomStr, generateNumber } = require('../../../helper/utilities.services')
const randomNumber = generateNumber(1, 111111)
const randomPhone = generateNumber(1000000000, 9999999999)
const encryptPassword = encryption(`Pass${randomNumber}`)

const data = {
  sName: `testName${randomNumber}`,
  sUsername: `testUsername${randomNumber}`,
  sEmail: `james${randomNumber}@mailinator.com`,
  sMobNum: `${randomPhone}`,
  sPassword: `${encryptPassword}`
}

function getAdminLog (done) {
  return (err, res) => {
    if (err) return done(err)
    expect(res.body.message).toMatch(messages.English.success.replace('##', messages.English.cAdminlog))
    done()
  }
}

describe('Subadmin Routes', () => {
  before(async () => {
    store.token = globalStore.adminToken
    store.ID = undefined
    store.permission = undefined
    store.wID = '5f892aee05b16f154f12b60e'
  })

  describe('get list of Permission', () => {
    it('should be a get list of banner', (done) => {
      request(server)
        .get('/api/admin/permission/v1')
        .set('Authorization', store.token)
        .expect(status.OK)
        .end(function (err, res) {
          if (err) return done(err)
          expect(res.body.message).toMatch('Permissions fetched successfully.')
          store.permission = res.body.data[0].sKey
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
        .set('Authorization', store.token)
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
  describe('get list of subadmin', () => {
    it('should be a get list of subadmin', (done) => {
      request(server)
        .get('/api/admin/sub-admin/list/v1')
        .set('Authorization', store.token)
        .expect(status.OK)
        .end(function (err, res) {
          if (err) return done(err)
          expect(res.body.data).toBeA('array')
          expect(res.body.message).toMatch(messages.English.success
            .replace('##', messages.English.subAdmin))
          store.ID = res.body.data[0].results[0]._id
          store.username = res.body.data[0].results[0].sUsername
          store.email = res.body.data[0].results[0].sEmail
          store.mobile = res.body.data[0].results[0].sMobNum
          done()
        })
    })

    describe('/POST Add subadmin', () => {
      it('should be a create a subadmin ', (done) => {
        data.iRoleId = `${store.iRoleId}`
        request(server)
          .post('/api/admin/auth/sub-admin/v3')
          .set('Authorization', store.token)
          .send(data)
          .expect(status.OK)
          .end(function (err, res) {
            if (err) return done(err)
            expect(res.body.message).toMatch(messages.English.add_success.replace('##', messages.English.subAdmin))
            done()
          })
      })

      it('should not be a create a subadmin Email ', (done) => {
        let mob = randomStr(10, 'otp')
        if (mob.charAt(0) === '0') mob = mob.replace(mob.charAt(0), '1')
        data.sUsername = `testcases${randomNumber}test`
        data.sEmail = 'superman@gmail.com'
        data.sMobNum = mob
        request(server)
          .post('/api/admin/auth/sub-admin/v3')
          .set('Authorization', store.token)
          .send(data)
          .expect(status.ResourceExist)
          .end(function (err, res) {
            if (err) return done(err)
            expect(res.body.message).toMatch(messages.English.already_exist.replace('##', messages.English.email))
            done()
          })
      })

      it('should not be a create a subadmin Username', (done) => {
        let mob = randomStr(10, 'otp')
        if (mob.charAt(0) === '0') mob = mob.replace(mob.charAt(0), '1')
        data.sUsername = 'superadmin'
        data.sEmail = `testcase${randomNumber}@test.com`
        data.sMobNum = mob
        request(server)
          .post('/api/admin/auth/sub-admin/v3')
          .set('Authorization', store.token)
          .send(data)
          .expect(status.ResourceExist)
          .end(function (err, res) {
            if (err) return done(err)
            expect(res.body.message).toMatch(messages.English.already_exist.replace('##', messages.English.username))
            done()
          })
      })

      it('should not be a create a subadmin Mobile Number', (done) => {
        data.sUsername = `Raviratna${randomNumber}`
        data.sEmail = 'raviratna@gmail.com'
        data.sMobNum = '7878787878'
        request(server)
          .post('/api/admin/auth/sub-admin/v3')
          .set('Authorization', store.token)
          .send(data)
          .expect(status.ResourceExist)
          .end(function (err, res) {
            if (err) return done(err)
            expect(res.body.message).toMatch(messages.English.already_exist.replace('##', messages.English.mobileNumber))
            done()
          })
      })

      it('should not be a create a subadmin Alpha number', (done) => {
        data.sUsername = 'username```'
        request(server)
          .post('/api/admin/auth/sub-admin/v3')
          .set('Authorization', store.token)
          .send(data)
          .expect(status.BadRequest)
          .end(function (err, res) {
            if (err) return done(err)
            expect(res.body.message).toMatch(messages.English.must_alpha_num)
            done()
          })
      })
    })
  })

  describe('get a details of one subadmin', () => {
    it('should be a get details of subadmin', (done) => {
      request(server)
        .get(`/api/admin/sub-admin/${store.ID}/v1`)
        .set('Authorization', store.token)
        .expect(status.OK)
        .end(function (err, res) {
          if (err) return done(err)
          expect(res.body.data).toBeA('object')
          expect(res.body.message).toMatch(messages.English.success.replace('##', messages.English.subAdmin))
          done()
        })
    })

    it('should not be a get details of subadmin', (done) => {
      request(server)
        .get(`/api/admin/sub-admin/${store.wID}/v1`)
        .set('Authorization', store.token)
        .expect(status.NotFound)
        .end(function (err, res) {
          if (err) return done(err)
          expect(res.body.message).toMatch(messages.English.not_exist.replace('##', messages.English.subAdmin))
          done()
        })
    })
  })

  describe('sub admin ids', () => {
    it('fetch all the sub admin', (done) => {
      request(server)
        .get('/api/admin/sub-admin-ids/v1')
        .set('Authorization', store.token)
        .expect(status.OK)
        .end(function (err, res) {
          if (err) return done(err)
          expect(res.body.message).toMatch(messages.English.success.replace('##', messages.English.subAdmin))
          done()
        })
    })
  })

  // Necessary routes for getting dynamic values for different search values of admin logs <!--
  describe('/GET Admin settings', () => {
    it('Should be list settings in user', (done) => {
      request(server)
        .get('/api/admin/setting/list/v1?start=5&limit=5')
        .set('Authorization', store.token)
        .expect(status.OK)
        .end(function (err, res) {
          if (err) return done(err)
          expect(res.body.data).toBeA('array')
          expect(res.body.message).toMatch(messages.English.success.replace('##', messages.English.csetting))
          store.sTitle = res.body.data[0].results[0].sTitle
          store.sKey = res.body.data[0].results[0].sKey
          done()
        })
    })
  })

  describe('/GET A list of common rules', () => {
    it('Should be a get list of Common rules', (done) => {
      request(server)
        .get('/api/admin/rules/v1')
        .set('Authorization', store.token)
        .expect(status.OK)
        .end(function (err, res) {
          if (err) { return done(err) }
          expect(res.body.message).toMatch(messages.English.success.replace('##', messages.English.rule))
          store.eRule = res.body.data[0].eRule
          store.sRuleName = res.body.data[0].sRuleName
          done()
        })
    })
  })
  describe('/GET admin side promocode list', () => {
    it('Should be fetch promocode list', (done) => {
      request(server)
        .get('/api/admin/promocode/list/v1')
        .set('Authorization', store.token)
        .expect(status.OK)
        .end(function (err, res) {
          if (err) return done(err)
          expect(res.body.message).toMatch(messages.English.success.replace('##', messages.English.cpromocode))
          store.sPromocodeName = res.body.data[0].results[0].sName
          store.sPromoCode = res.body.data[0].results[0].sName
          done()
        })
    })
  })

  describe('/GET All list of leagues V2 ', () => {
    it('should be a list of leagues', (done) => {
      request(server)
        .get('/api/admin/league/full-list/v2')
        .set('Authorization', store.token)
        .expect(status.OK)
        .end((err, res) => {
          if (err) return done(err)
          expect(res.body.data).toBeA('object')
          expect(res.body.message).toMatch(messages.English.success.replace('##', messages.English.cleague))
          store.iLeagueId = res.body.data.results[0]._id
          store.LeagueName = res.body.data.results[0].sName
          store.sLeagueCategory = res.body.data.results[0].sLeagueCategory
          store.sFilterCategory = res.body.data.results[0].sFilterCategory
          done()
        })
    })
  })

  describe('/POST MatchLeague add', () => {
    it('Should be add MatchLeague', (done) => {
      request(server)
        .post('/api/admin/match-league/v1')
        .set('Authorization', store.token)
        .send({
          iMatchId: globalStore.matchID,
          iLeagueId: [{
            _id: store.iLeagueId
          }]
        })
        .expect(status.OK)
        .end(function (err, res) {
          if (err) return done(err)
          expect(res.body.message).toMatch(messages.English.add_success.replace('##', messages.English.cnewMatchLeague))
          done()
        })
    })
  })
  describe('/GET MatchLeague list', () => {
    it('Should be get League list', (done) => {
      request(server)
        .get(`/api/admin/match-league/${globalStore.matchID}/list/v1?sportsType=cricket`)
        .set('Authorization', store.token)
        .expect(status.OK)
        .end((err, res) => {
          if (err) return done(err)
          expect(res.body.data).toBeA('array')
          expect(res.body.message).toMatch(messages.English.success.replace('##', messages.English.cmatchLeague))
          store.sMatchLeagueName = res.body.data[0].results[0].sName
          done()
        })
    })
  })
  // -->
  describe('/GET sub admin logs', () => {
    it('fetch all the logs', (done) => {
      request(server)
        .get('/api/admin/sub-admin-logs/v1?order=desc&iAdminId=62d54911d4e50a25e8c44b69')
        .set('Authorization', store.token)
        .expect(status.OK)
        .end(getAdminLog(done))
    })

    it('fetch all the logs V2', (done) => {
      request(server)
        .get('/api/admin/sub-admin-logs/v2')
        .set('Authorization', store.token)
        .expect(status.OK)
        .end(getAdminLog(done))
    })
    it('fetch all the logs V2 of Match with given sName', (done) => {
      const query = {
        operation: 'M',
        search: globalStore.MatchData.sName
      }
      request(server)
        .get(`/api/admin/sub-admin-logs/v2?search=${query.search}&opearation=${query.operation}&nStart=0&nLimit=20`)
        .set('Authorization', store.token)
        .expect(status.OK)
        .end(getAdminLog(done))
    })

    it('fetch all the logs V2 of Setting-> sTitle', (done) => {
      const query = {
        operation: 'S',
        search: store.sTitle
      }
      request(server)
        .get(`/api/admin/sub-admin-logs/v2?search=${query.search}&opearation=${query.operation}&nStart=0&nLimit=20`)
        .set('Authorization', store.token)
        .expect(status.OK)
        .end(getAdminLog(done))
    })
    it('fetch all the logs V2 of Setting-> sKey', (done) => {
      const query = {
        operation: 'S',
        search: store.sKey
      }
      request(server)
        .get(`/api/admin/sub-admin-logs/v2?search=${query.search}&opearation=${query.operation}&nStart=0&nLimit=20`)
        .set('Authorization', store.token)
        .expect(status.OK)
        .end(getAdminLog(done))
    })

    it('fetch all the logs V2  with given Commonrules-> eRule', (done) => {
      const query = {
        operation: 'CR',
        search: store.eRule
      }
      request(server)
        .get(`/api/admin/sub-admin-logs/v2?search=${query.search}&opearation=${query.operation}&nStart=0&nLimit=20`)
        .set('Authorization', store.token)
        .expect(status.OK)
        .end(getAdminLog(done))
    })
    it('fetch all the logs V2  with given Commonrules->sRulename', (done) => {
      const query = {
        operation: 'CR',
        search: store.sRuleName
      }
      request(server)
        .get(`/api/admin/sub-admin-logs/v2?search=${query.search}&opearation=${query.operation}&nStart=0&nLimit=20`)
        .set('Authorization', store.token)
        .expect(status.OK)
        .end(getAdminLog(done))
    })

    it('fetch all the logs V2 of Promocode with given promocode value', (done) => {
      const query = {
        operation: 'PC',
        search: store.sPromoCode
      }
      request(server)
        .get(`/api/admin/sub-admin-logs/v2?search=${query.search}&opearation=${query.operation}&nStart=0&nLimit=20`)
        .set('Authorization', store.token)
        .expect(status.OK)
        .end(getAdminLog(done))
    })
    it('fetch all the logs V2 of Promocode with given name', (done) => {
      const query = {
        operation: 'PC',
        search: store.sPromocodeName
      }
      request(server)
        .get(`/api/admin/sub-admin-logs/v2?search=${query.search}&opearation=${query.operation}&nStart=0&nLimit=20`)
        .set('Authorization', store.token)
        .expect(status.OK)
        .end(getAdminLog(done))
    })

    it('fetch all the logs V2 of League with given name', (done) => {
      const query = {
        operation: 'L',
        search: store.LeagueName
      }
      request(server)
        .get(`/api/admin/sub-admin-logs/v2?search=${query.search}&opearation=${query.operation}&nStart=0&nLimit=20`)
        .set('Authorization', store.token)
        .expect(status.OK)
        .end(getAdminLog(done))
    })
    it('fetch all the logs V2 of League with given league category', (done) => {
      const query = {
        operation: 'L',
        search: store.sLeagueCategory
      }
      request(server)
        .get(`/api/admin/sub-admin-logs/v2?search=${query.search}&opearation=${query.operation}&nStart=0&nLimit=20`)
        .set('Authorization', store.token)
        .expect(status.OK)
        .end(getAdminLog(done))
    })
    it('fetch all the logs V2 of League with given filter category', (done) => {
      const query = {
        operation: 'L',
        search: store.sFilterCategory
      }
      request(server)
        .get(`/api/admin/sub-admin-logs/v2?search=${query.search}&opearation=${query.operation}&nStart=0&nLimit=20`)
        .set('Authorization', store.token)
        .expect(status.OK)
        .end(getAdminLog(done))
    })

    it('fetch all the logs V2 of MatchLeague with given name', (done) => {
      const query = {
        opration: 'ML',
        search: store.sMatchLeagueName
      }
      request(server)
        .get(`/api/admin/sub-admin-logs/v2?search=${query.search}&opearation=${query.operation}&nStart=0&nLimit=20`)
        .set('Authorization', store.token)
        .expect(status.OK)
        .end(getAdminLog(done))
    })

    it('fetch all the logs V2 of Deposit with given userId', (done) => {
      const query = {
        opration: 'AD',
        search: globalStore.userID
      }
      request(server)
        .get(`/api/admin/sub-admin-logs/v2?search=${query.search}&opearation=${query.operation}&nStart=0&nLimit=20`)
        .set('Authorization', store.token)
        .expect(status.OK)
        .end(getAdminLog(done))
    })
    it('fetch all the logs V2 of Withdraw with given userId', (done) => {
      const query = {
        opration: 'AW',
        search: globalStore.userID
      }
      request(server)
        .get(`/api/admin/sub-admin-logs/v2?search=${query.search}&opearation=${query.operation}&nStart=0&nLimit=20`)
        .set('Authorization', store.token)
        .expect(status.OK)
        .end(getAdminLog(done))
    })
    it('fetch all the logs V2 of Process Deposit with given userId', (done) => {
      const query = {
        opration: 'D',
        search: globalStore.userID
      }
      request(server)
        .get(`/api/admin/sub-admin-logs/v2?search=${query.search}&opearation=${query.operation}&nStart=0&nLimit=20`)
        .set('Authorization', store.token)
        .expect(status.OK)
        .end(getAdminLog(done))
    })
    it('fetch all the logs V2 of ProcessWithdraw with given userId', (done) => {
      const query = {
        opration: 'W',
        search: globalStore.userID
      }
      request(server)
        .get(`/api/admin/sub-admin-logs/v2?search=${query.search}&opearation=${query.operation}&nStart=0&nLimit=20`)
        .set('Authorization', store.token)
        .expect(status.OK)
        .end(getAdminLog(done))
    })
    it('fetch all the logs V2 of BankDetails with given userId', (done) => {
      const query = {
        opration: 'BD',
        search: globalStore.userID
      }
      request(server)
        .get(`/api/admin/sub-admin-logs/v2?search=${query.search}&opearation=${query.operation}&nStart=0&nLimit=20`)
        .set('Authorization', store.token)
        .expect(status.OK)
        .end(getAdminLog(done))
    })
    it('fetch all the logs V2 of KYC with given userId', (done) => {
      const query = {
        opration: 'KYC',
        search: globalStore.userID
      }
      request(server)
        .get(`/api/admin/sub-admin-logs/v2?search=${query.search}&opearation=${query.operation}&nStart=0&nLimit=20`)
        .set('Authorization', store.token)
        .expect(status.OK)
        .end(getAdminLog(done))
    })
    it('fetch all the logs V2 of Profile with given userId', (done) => {
      const query = {
        opration: 'P',
        search: globalStore.userID
      }
      request(server)
        .get(`/api/admin/sub-admin-logs/v2?search=${query.search}&opearation=${query.operation}&nStart=0&nLimit=20`)
        .set('Authorization', store.token)
        .expect(status.OK)
        .end(getAdminLog(done))
    })
  })

  describe('/PUT Update subadmin v3', () => {
    it('should update subadmin', (done) => {
      data.sName = `testName${randomNumber}u`
      data.sUsername = store.username
      data.sEmail = store.email
      data.sMobNum = store.mobile
      data.iRoleId = store.iRoleId
      data.sPassword = '{"v":"hybrid-crypto-js_0.2.4","iv":"PYXxZgqmM/o6NRRjJoXVj7S83nr5lQlQiSK0rNCuMkA=","keys":{"7d:36:3b:2f:b6:86:7f:f8:dc:5d:e2:82:3b:85:bc:63:a1:c0:b8:e0":"vLtUmPh2c831dOA8Y8B3ljUzIuO5IOO/MimWDcTnonA7Efpew2UQ46A6Z/nYfzDO4cJ7Vb6FHD84Hael8/ci4NMcQF6OvupEOMaUKdIBaBKy1v9zv99tAK+v/Cht1gemPVHbQAWmZZ5rUpYvJUw3XJDR87I2rdOHdMsn7S5kum8="},"cipher":"GVyy6/RKR+UJlmYeTQG0yg=="}'
      request(server)
        .put(`/api/admin/sub-admin/${store.ID}/v3`)
        .set('Authorization', store.token)
        .send(data)
        .expect(status.OK)
        .end(function (err, res) {
          if (err) return done(err)
          expect(res.body.message).toMatch(messages.English.update_success.replace('##', messages.English.subAdmin))
          done()
        })
    })

    it('should not update subadmin mobile', (done) => {
      data.sMobNum = '7878787878'
      data.sPassword = '{"v":"hybrid-crypto-js_0.2.4","iv":"QYXxZgqmM/o6NRRjJoXVj7S83nr5lQlQiSK0rNCuMkA=","keys":{"7d:36:3b:2f:b6:86:7f:f8:dc:5d:e2:82:3b:85:bc:63:a1:c0:b8:e0":"vLtUmPh2c831dOA8Y8B3ljUzIuO5IOO/MimWDcTnonA7Efpew2UQ46A6Z/nYfzDO4cJ7Vb6FHD84Hael8/ci4NMcQF6OvupEOMaUKdIBaBKy1v9zv99tAK+v/Cht1gemPVHbQAWmZZ5rUpYvJUw3XJDR87I2rdOHdMsn7S5kum8="},"cipher":"GVyy6/RKR+UJlmYeTQG0yg=="}'
      request(server)
        .put(`/api/admin/sub-admin/${store.ID}/v3`)
        .set('Authorization', store.token)
        .send(data)
        .expect(status.ResourceExist)
        .end(function (err, res) {
          if (err) return done(err)
          expect(res.body.message).toMatch(messages.English.already_exist.replace('##', messages.English.mobileNumber))
          done()
        })
    })

    it('should not update subadmin email', (done) => {
      data.sMobNum = `${randomPhone}`
      data.sEmail = 'superman@gmail.com'
      data.sPassword = '{"v":"hybrid-crypto-js_0.2.4","iv":"RYXxZgqmM/o6NRRjJoXVj7S83nr5lQlQiSK0rNCuMkA=","keys":{"7d:36:3b:2f:b6:86:7f:f8:dc:5d:e2:82:3b:85:bc:63:a1:c0:b8:e0":"vLtUmPh2c831dOA8Y8B3ljUzIuO5IOO/MimWDcTnonA7Efpew2UQ46A6Z/nYfzDO4cJ7Vb6FHD84Hael8/ci4NMcQF6OvupEOMaUKdIBaBKy1v9zv99tAK+v/Cht1gemPVHbQAWmZZ5rUpYvJUw3XJDR87I2rdOHdMsn7S5kum8="},"cipher":"GVyy6/RKR+UJlmYeTQG0yg=="}'

      request(server)
        .put(`/api/admin/sub-admin/${store.ID}/v3`)
        .set('Authorization', store.token)
        .send(data)
        .expect(status.ResourceExist)
        .end(function (err, res) {
          if (err) return done(err)
          expect(res.body.message).toMatch(messages.English.already_exist.replace('##', messages.English.email))
          done()
        })
    })

    it('should update subadmin username', (done) => {
      data.sUsername = 'superadmin'
      data.sPassword = '{"v":"hybrid-crypto-js_0.2.4","iv":"SYXxZgqmM/o6NRRjJoXVj7S83nr5lQlQiSK0rNCuMkA=","keys":{"7d:36:3b:2f:b6:86:7f:f8:dc:5d:e2:82:3b:85:bc:63:a1:c0:b8:e0":"vLtUmPh2c831dOA8Y8B3ljUzIuO5IOO/MimWDcTnonA7Efpew2UQ46A6Z/nYfzDO4cJ7Vb6FHD84Hael8/ci4NMcQF6OvupEOMaUKdIBaBKy1v9zv99tAK+v/Cht1gemPVHbQAWmZZ5rUpYvJUw3XJDR87I2rdOHdMsn7S5kum8="},"cipher":"GVyy6/RKR+UJlmYeTQG0yg=="}'

      request(server)
        .put(`/api/admin/sub-admin/${store.ID}/v3`)
        .set('Authorization', store.token)
        .send(data)
        .expect(status.ResourceExist)
        .end(function (err, res) {
          if (err) return done(err)
          expect(res.body.message).toMatch(messages.English.already_exist.replace('##', messages.English.username))
          done()
        })
    })
  })
})
