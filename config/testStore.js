const adminAuthServices = require('../models-routes-services/admin/auth/services')
const userAuthServices = require('../models-routes-services/user/auth/services')

/**
 *  it would be called in first test case
 *  can also be used for individual test case
 * @returns adminToken, userToken
 */
let adminToken, userToken
async function getToken () {
  [adminToken, userToken] = await Promise.all([adminAuthServices.getAdminToken(), userAuthServices.getUserToken()])
  return { adminToken, userToken }
}

module.exports = {
  getToken,
  globalStore: {
    aPermissions: [
      {
        sKey: 'PLAYER',
        eType: 'W'

      },
      {
        sKey: 'MATCHPLAYER',
        eType: 'W'

      },
      {
        sKey: 'SCORE_POINT',
        eType: 'W'

      },
      {
        sKey: 'SEASON',
        eType: 'W'

      },
      {
        sKey: 'MATCH',
        eType: 'W'

      },
      {
        sKey: 'TEAM',
        eType: 'W'

      },
      {
        sKey: 'USERLEAGUE',
        eType: 'W'

      },
      {
        sKey: 'USERTEAM',
        eType: 'W'

      },
      {
        sKey: 'MATCHLEAGUE',
        eType: 'W'

      },
      {
        sKey: 'ROLES',
        eType: 'W'

      },
      {
        sKey: 'BOT_LOG',
        eType: 'W'

      },
      {
        sKey: 'USERS',
        eType: 'W'

      },
      {
        sKey: 'STATISTICS',
        eType: 'W'

      },
      {
        sKey: 'BANKDETAILS',
        eType: 'W'
      },
      {
        sKey: 'BALANCE',
        eType: 'W'

      },
      {
        sKey: 'WITHDRAW',
        eType: 'W'

      },
      {
        sKey: 'DEPOSIT',
        eType: 'W'

      },
      {
        sKey: 'PUSHNOTIFICATION',
        eType: 'W'

      },
      {
        sKey: 'TDS',
        eType: 'W'

      },
      {
        sKey: 'KYC',
        eType: 'W'

      },
      {
        sKey: 'SYSTEM_USERS',
        eType: 'W'

      },
      {
        sKey: 'PASSBOOK',
        eType: 'W'

      },
      {
        sKey: 'PREFERENCES',
        eType: 'W'

      },
      {
        sKey: 'VERSION',
        eType: 'W'

      },
      {
        sKey: 'EMAIL_TEMPLATES',
        eType: 'W'

      },
      {
        sKey: 'PAYOUT_OPTION',
        eType: 'W'

      },
      {
        sKey: 'COMPLAINT',
        eType: 'W'

      },
      {
        sKey: 'SPORT',
        eType: 'W'

      },
      {
        sKey: 'PAYMENT_OPTION',
        eType: 'W'

      },
      {
        sKey: 'SETTING',
        eType: 'W'

      },
      {
        sKey: 'OFFER',
        eType: 'W'

      },
      {
        sKey: 'BANNER',
        eType: 'W'

      },
      {
        sKey: 'LEADERSHIP_BOARD',
        eType: 'W'
      },
      {
        sKey: 'NOTIFICATION',
        eType: 'W'
      },
      {
        sKey: 'PROMO',
        eType: 'W'
      },
      {
        sKey: 'REPORT',
        eType: 'W'
      },
      {
        sKey: 'CMS',
        eType: 'W'
      },
      {
        sKey: 'RULE',
        eType: 'W'
      },
      {
        sKey: 'POPUP_ADS',
        eType: 'W'
      },
      {
        sKey: 'MAINTENANCE',
        eType: 'W'
      },
      {
        sKey: 'SUBADMIN',
        eType: 'W'
      },
      {
        sKey: 'ADMIN_ROLE',
        eType: 'W'
      },
      {
        sKey: 'LEAGUE',
        eType: 'W'
      },
      {
        sKey: 'SERIES_LEADERBOARD',
        eType: 'W'
      },
      {
        sKey: 'DASHBOARD',
        eType: 'N'
      },
      {
        sKey: 'PERMISSION',
        eType: 'W'
      },
      {
        sKey: 'BANNER',
        eType: 'N'
      }

    ],
    updateAPermissions: [

      { sKey: 'ROLES', eType: 'N' },
      { sKey: 'USERTEAM', eType: 'N' },
      { sKey: 'BOT_LOG', eType: 'N' },
      { sKey: 'SEASON', eType: 'N' },
      { sKey: 'DEPOSIT', eType: 'N' },
      { sKey: 'SCORE_POINT', eType: 'N' },
      { sKey: 'PAYOUT_OPTION', eType: 'N' },
      { sKey: 'USERLEAGUE', eType: 'N' },
      { sKey: 'PROMO', eType: 'N' },
      { sKey: 'SYSTEM_USERS', eType: 'N' },
      { sKey: 'SPORT', eType: 'N' },
      { sKey: 'MATCH', eType: 'N' },
      { sKey: 'USERS', eType: 'N' },
      { sKey: 'BANNER', eType: 'N' },
      { sKey: 'BALANCE', eType: 'N' },
      { sKey: 'POPUP_ADS', eType: 'N' },
      { sKey: 'LEADERSHIP_BOARD', eType: 'N' },
      { sKey: 'EMAIL_TEMPLATES', eType: 'N' },
      { sKey: 'PUSHNOTIFICATION', eType: 'N' },
      { sKey: 'MATCHLEAGUE', eType: 'N' },
      { sKey: 'REPORT', eType: 'N' },
      { sKey: 'WITHDRAW', eType: 'N' },
      { sKey: 'PERMISSION', eType: 'N' },
      { sKey: 'VERSION', eType: 'N' },
      { sKey: 'PASSBOOK', eType: 'N' },
      { sKey: 'NOTIFICATION', eType: 'N' },
      { sKey: 'MATCHPLAYER', eType: 'N' },
      { sKey: 'DASHBOARD', eType: 'N' },
      { sKey: 'BANKDETAILS', eType: 'N' },
      { sKey: 'SETTING', eType: 'N' },
      { sKey: 'TEAM', eType: 'N' },
      { sKey: 'KYC', eType: 'N' },
      { sKey: 'SUBADMIN', eType: 'N' },
      { sKey: 'SERIES_LEADERBOARD', eType: 'N' },
      { sKey: 'CMS', eType: 'N' },
      { sKey: 'OFFER', eType: 'N' },
      { sKey: 'PREFERENCES', eType: 'N' },
      { sKey: 'MAINTENANCE', eType: 'N' },
      { sKey: 'ADMIN_ROLE', eType: 'N' },
      { sKey: 'TDS', eType: 'N' },
      { sKey: 'COMPLAINT', eType: 'N' },
      { sKey: 'PLAYER', eType: 'N' },
      { sKey: 'STATISTICS', eType: 'N' },
      { sKey: 'RULE', eType: 'N' },
      { sKey: 'LEAGUE', eType: 'N' },
      { sKey: 'PAYMENT_OPTION', eType: 'N' }

    ]
  }
}
