// function checkLocationValidity (req, res, sLatitude, sLongitude) {
//   return new Promise(async (resolve, reject) => {
//     try {
//       const defaultSetting = await findSetting({ sKey: 'ALE' }, { eStatus: 1 })
//       const isLocationDetailsInvalid = !sLatitude || !sLongitude
//       const isStatusActive = defaultSetting?.eStatus === 'Y'

//       return resolve(isLocationDetailsInvalid && isStatusActive)
//     } catch (error) {
//       return reject(error)
//     }
//   })
// }

function checkCodeValidity (req, res, sCode) {
  return new Promise(async (resolve, reject) => {
    try {
      const isInvalidCode = (typeof sCode !== 'number')
      return resolve(isInvalidCode)
    } catch (error) {
      return reject(error)
    }
  })
}

module.exports = {
  checkCodeValidity
}
