const { handleCatchError } = require('../../helper/utilities.services')
const BackupAdminLogs = require('../admin/adminLogs/backup.logs.model')
const AdminLogModel = require('../admin/adminLogs/logs.model')
const { messages, status, jsonStatus } = require('../../helper/api.responses')

class Cron {
  /**
   * finding old admin logs removing from main db and inserting in backup db
   * @param {*} res
   * @returns backup message
   */
  async backupOldAdminLogs (req, res) {
    try {
      const dRemoveDate = new Date()
      dRemoveDate.setDate(dRemoveDate.getDate() - 60)
      const aBackupLogs = []
      AdminLogModel.find({ dUpdatedAt: { $lt: dRemoveDate } }).lean().cursor()
        .on('data', async (oAdminLog) => {
          try {
            aBackupLogs.push(oAdminLog)
            if (aBackupLogs.length >= 5000) {
              await BackupAdminLogs.insertMany(aBackupLogs.splice(0, 5000))
            }
          } catch (error) {
            handleCatchError(error)
          }
        })
        .on('end', async () => {
          try {
            if (aBackupLogs.length) {
              await BackupAdminLogs.insertMany(aBackupLogs)
            }
            await AdminLogModel.deleteMany({ dUpdatedAt: { $lt: dRemoveDate } })
          } catch (error) {
            handleCatchError(error)
          }
        })
      return res.status(status.OK).jsonp({ status: jsonStatus.OK, message: messages[req.userLanguage].old_admin_logs_backup })
    } catch (error) {
      handleCatchError(error)
    }
  }
}

module.exports = new Cron()
