const enums = {
  platform: ['A', 'I', 'W', 'O', 'AD'], // A = Android, I = iOS, W = Web, O = Other, AD = Admin
  status: ['Y', 'N'],
  adminLogTypes: ['L', 'PC', 'RP'], // L = Login, PC = Password Change, RP = ResetPassword
  adminStatus: ['Y', 'B', 'D'],
  adminType: ['SUPER', 'SUB'],
  adminLogKeys: ['P', 'SUB', 'V', 'R', 'PM'], // P = Profile, SUB = Sub Admin, V = Vendor, R = Role, PM = Permission
  adminPermissionType: ['R', 'W', 'N'], // R = READ, W = WRITE, N = NONE - Access Rights
  adminPermission: [
    'VENDOR',
    'SUBADMIN',
    'PERMISSION',
    'ADMIN_ROLE',
    'USERS_PERSONAL_INFO',
    'EMAIL_TEMPLATES',
    'SYSTEM_USERS',
    'ROLES',
    'USERS',
    'AUTH',
    'MESSAGE_TEMPLATES',
    'REPORT'
  ],
  imageFormat: [{ extension: 'jpeg', type: 'image/jpeg' }, { extension: 'jpg', type: 'image/jpeg' }, { extension: 'png', type: 'image/png' }],
  permissionModule: ['USER', 'SETTINGS', 'SUB-ADMIN', 'OTHER', 'VENDOR', 'REPORT'],
  otpType: ['E', 'M'], // Email | Mobile
  otpAuth: ['L'], // Register | ForgotPass | Verification | Login
  // permissionModule: ['MATCH', 'USER', 'SETTINGS', 'SUB-ADMIN', 'LEAGUE-SERIES', 'OTHER', 'SPORTS'], // admin panel, manage permission
  vendorStatus: ['Y', 'D', 'B'],
  ePlatform: {
    values: ['A', 'I', 'O'], // A = Android, I = IOS, O = Other
    map: { android: 'A', ios: 'I' }
  },
  eAccStatus: ['Y', 'B', 'D']
}

module.exports = enums
