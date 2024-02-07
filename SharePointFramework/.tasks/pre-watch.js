const fs = require('fs')
const colors = require('colors/safe')
const path = require('path')
const { getFileContent } = require('./util')
const { log } = require('./util')
require('dotenv').config()


// Solution
const solution = process.cwd().split(path.sep).pop()

// Config folder path
const configFolder = path.join(process.cwd(), `config`)

// Generated solution config file path
const solutionConfigFile = path.join(configFolder, `.generated-solution-config.json`)

if (process.env.SERVE_CHANNEL && process.env.SERVE_CHANNEL !== 'main') {
    log(`Preparing solution for channel ${colors.magenta(process.env.SERVE_CHANNEL)}`, 'pre-watch')
    const channelConfig = getFileContent(`../channels/${process.env.SERVE_CHANNEL}.json`)

    fs.writeFileSync(solutionConfigFile, JSON.stringify(channelConfig.spfx.solutions[solution], null, 2), { encoding: 'utf8', overwrite: true })

    require('./modifySolutionFiles')
}

require('./createServeConfig')
require('./createEnviromentFile')
require('./createLaunchFile')
require('./setBundleConfig')