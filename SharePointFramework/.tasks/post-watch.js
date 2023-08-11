const { log } = require('./util')

log(`Cleaning up solution files and bundle config`, 'post-watch')

require('./modifySolutionFiles')
require('./setBundleConfig')