/* eslint-disable max-nested-callbacks */
const request = require('supertest')
const { describe, it, before } = require('mocha')
const expect = require('expect')
const server = require('../../../index')
const store = {}
const { status, messages } = require('../../../helper/api.responses')
const { globalStore } = require('../../../config/testStore')
const { generateNumber } = require('../../../helper/utilities.services')
const randomNumber = generateNumber(1, 111111)
const data = {
  sName: `temp-test-role${randomNumber}`,
  aPermissions: globalStore.aPermissions

}

const updateBase = {

  sName: 'test-temp-role',
  eStatus: 'Y',
  aPermissions: globalStore.updateAPermissions

}

function getRoleSucc (done) {
  return (err, res) => {
    if (err) return done(err)
    expect(res.body.message).toMatch(messages.English.success.replace('##', messages.English.roles))
    done()
  }
}

function getRoleNotExist (done) {
  return (err, res) => {
    if (err) return done(err)
    expect(res.body.message).toMatch(messages.English.not_exist.replace('##', messages.English.role))
    done()
  }
}

function getRoleError (done) {
  return (err, res) => {
    if (err) return done(err)
    expect(res.body.message).toMatch(messages.English.error)
    done()
  }
}
describe('Roles Routes', () => {
  before(() => {
    store.token = globalStore.adminToken
    store.ID = undefined
    store.permission = undefined
    store.wID = '5f892aee05b16f154f12b60e'
  })
  describe('/GET Fetch all the roles', () => {
    it('should fetch all the roles where eStatus is Y', (done) => {
      request(server)
        .get('/api/admin/role/v1')
        .set('Authorization', store.token)
        .expect(status.OK)
        .end(getRoleSucc(done))
    })
  })
  describe('/GET Fetch role by searching', () => {
    it('should fetch all the roles as per search params', (done) => {
      request(server)
        .get('/api/admin/role/list/v1?search=Wr')
        .set('Authorization', store.token)
        .expect(status.OK)
        .end(getRoleSucc(done))
    })
  })

  describe('/POST add role', () => {
    // just remove the role from the data object end it will send error (bad request)
    it('should add the new role in roles collection', (done) => {
      request(server)
        .post('/api/admin/role/v1')
        .set('Authorization', store.token)
        .send(data)
        .expect(status.OK)
        .end(function (err, res) {
          if (err) return done(err)
          store.ID = res.body.data._id
          expect(res.body.message).toMatch(messages.English.add_success.replace('##', messages.English.role))
          done()
        })
    })
    it('should not add the role by passing role id in roles collection as permision status: N', (done) => {
      data.aPermissions = [
        {
          sKey: 'AUTH',
          eType: 'N'
        },
        {
          sKey: 'MATCH_LIVE',
          eType: 'W'
        }
      ]
      request(server)
        .post('/api/admin/role/v1')
        .set('Authorization', store.token)
        .send(data)
        .expect(status.BadRequest)
        .end(function (err, res) {
          if (err) return done(err)
          expect(res.body.message).toMatch(messages.English.invalid.replace('##', messages.English.permissions))
          done()
        })
    })
  })
  describe('Fetch specific role', () => {
    it('should fetch the specific role(as per id)', (done) => {
      request(server)
        .get(`/api/admin/role/${store.ID}/v1`)
        .set('Authorization', store.token)
        .expect(status.OK)
        .end(function (err, res) {
          if (err) return done(err)
          expect(res.body.message).toMatch(messages.English.success.replace('##', messages.English.role))
          done()
        })
    })
    it('should not fetch the specific role is not present)', (done) => {
      request(server)
        .get(`/api/admin/role/${store.wID}/v1`)
        .set('Authorization', store.token)
        .expect(status.NotFound)
        .end(getRoleNotExist(done))
    })
    it('should not fetch the specific role as id is undefined', (done) => {
      request(server)
        .get(`/api/admin/role/${store.wId}/v1`)
        .set('Authorization', store.token)
        .expect(status.InternalServerError)
        .end(getRoleError(done))
    })
  })

  describe('/PUT update role', () => {
    it('should not update the role by passing role id in roles collection as role not found ', (done) => {
      request(server)
        .put(`/api/admin/role/${store.wID}/v1`)
        .set('Authorization', store.token)
        .send(updateBase)
        .expect(status.NotFound)
        .end(getRoleNotExist(done))
    })

    // just remove the role from the data object end it will send error (bad request)
    it('should update the role by passing role id in roles collection', (done) => {
      request(server)
        .put(`/api/admin/role/${store.ID}/v1`)
        .set('Authorization', store.token)
        .send(updateBase)
        .expect(status.OK)
        .end(function (err, res) {
          if (err) return done(err)
          expect(res.body.message).toMatch(messages.English.update_success.replace('##', messages.English.role))
          done()
        })
    })

    it('should not update the role by passing role id in roles collection as roles are not valid', (done) => {
      data.aPermissions = [{
        sKey: 'STATISTICS',
        eType: 'N'
      },
      {
        sKey: 'USERTEAM',
        eType: 'N'
      },
      {
        sKey: 'SUBADMIN',
        eType: 'N'
      },
      {
        sKey: 'MATCHLEAGUE',
        eType: 'N'
      },
      {
        sKey: 'BALANCE',
        eType: 'N'
      },
      {
        sKey: 'MATCHPLAYER',
        eType: 'N'
      }]
      request(server)
        .put(`/api/admin/role/${store.ID}/v1`)
        .set('Authorization', store.token)
        .send(data)
        .expect(status.BadRequest)
        .end(function (err, res) {
          if (err) return done(err)
          expect(res.body.message).toMatch(messages.English.invalid.replace('##', messages.English.roles))
          done()
        })
    })
  })
  describe('/DELETE role', () => {
    // just remove the role from the data object end it will send error (bad request)
    data.eStatus = 'Y'
    it('should delete the role by passing role id in roles collection', (done) => {
      request(server)
        .delete(`/api/admin/role/${store.ID}/v1`)
        .set('Authorization', store.token)
        .send(data)
        .expect(status.OK)
        .end(function (err, res) {
          if (err) return done(err)
          expect(res.body.message).toMatch(messages.English.del_success.replace('##', messages.English.role))
          done()
        })
    })
    it('should not delete role as id is not present in the collection', (done) => {
      request(server)
        .delete(`/api/admin/role/${store.wID}/v1`)
        .set('Authorization', store.token)
        .send(data)
        .expect(status.NotFound)
        .end(getRoleNotExist(done))
    })
    it('should not delete role as undefined is present in id', (done) => {
      request(server)
        .delete(`/api/admin/role/${store.wId}/v1`)
        .set('Authorization', store.token)
        .send(data)
        .expect(status.InternalServerError)
        .end(getRoleError(done))
    })
  })
})
