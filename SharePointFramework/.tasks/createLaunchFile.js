require('dotenv').config()
const fs = require('fs')
const path = require('path')

const launchSampleSrc = path.join(process.cwd(), '.vscode/launch.sample.json')
const launchSrc = path.join(process.cwd(), '.vscode/launch.json')

const baseConfiguration = {
    "name": "",
    "type": "chrome",
    "request": "launch",
    "url": "",
    "webRoot": "${workspaceRoot}",
    "sourceMaps": true,
    "sourceMapPathOverrides": {
        "webpack:///.././src/*": "${webRoot}/src/*",
        "webpack:///../../../src/*": "${webRoot}/src/*",
        "webpack:///../../../../src/*": "${webRoot}/src/*",
        "webpack:///../../../../../src/*": "${webRoot}/src/*"
    },
    "runtimeArgs": [
        "--remote-debugging-port=9222",
        "--user-data-dir=${workspaceFolder}/.vscode/chrome-debug-user-data"
    ]
}

function getLaunchConfigurations() {
    const configurations = []
    process.env.LAUNCH_CONFIGURATIONS.split(';').forEach(configuration => {
        const [name, url] = configuration.split(',')
        if (!name || !url || url.indexOf('https://') !== 0) return
        configurations.push(Object.assign({}, baseConfiguration, { name, url }))
    })
    return configurations.filter(Boolean)
}

try {
    const launchConfigurations = getLaunchConfigurations()
    if (!fs.existsSync(launchSrc) && launchConfigurations.length > 0) {
        const launchSample = JSON.parse(fs.readFileSync(launchSampleSrc, { encoding: 'utf8' }))
        launchSample.configurations = launchConfigurations
        fs.writeFileSync(launchSrc, JSON.stringify(launchSample, null, 2), { encoding: 'utf8', overwrite: true })
    }
} catch (err) { }