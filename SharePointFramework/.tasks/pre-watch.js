const fs = require('fs');
const path = require('path');
const { getFileContent } = require('./util')
require('dotenv').config()

// Solution
const solution = process.cwd().split(path.sep).pop()

// Config folder path
const configFolder = path.join(process.cwd(), `config`);

// Generated solution config file path
const solutionConfigFile = path.join(configFolder, `.generated-solution-config.json`);

if (process.env.SERVE_CHANNEL && process.env.SERVE_CHANNEL !== 'main') {
    console.log('Preparing solution for channel: ' + process.env.SERVE_CHANNEL)
    const channelConfig = getFileContent(`../channels/${process.env.SERVE_CHANNEL}.json`)

    fs.writeFileSync(solutionConfigFile, JSON.stringify(channelConfig.spfx.solutions[solution], null, 2), { encoding: 'utf8', overwrite: true });

    require('./modifySolutionFiles')
}

require('./setBundleConfig')