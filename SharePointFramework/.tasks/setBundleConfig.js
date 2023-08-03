const fs = require('fs')
const path = require('path')
const colors = require('colors/safe')
const { log } = require('./util')
require('dotenv').config()


// Bundle config file (config/config.json) path
const bundleConfigFile = path.join(process.cwd(), 'config/config.json')

// Backup bundle config file (config/config.json) path
const bundleConfigFileCopy = path.join(process.cwd(), 'config/config.json.bak')

// Running as part of post watch script
const isPostWatch = process.env.npm_lifecycle_event === 'postwatch'

// If the script is run with --revert or as a postwatch script, revert the config.json file
const isRevert = process.argv[2] === '--revert' || isPostWatch

try {
    if (isRevert) {
        if (!fs.existsSync(bundleConfigFileCopy)) return
        fs.copyFile(bundleConfigFileCopy, bundleConfigFile, () => {
            fs.rm(bundleConfigFileCopy, () => { 
                log(`${colors.cyan('config.json')} was reverted to its original state`, 'setBundleConfig')
            })
        })
    } else {
        if (!process.env.SERVE_BUNDLE_REGEX) return
        fs.copyFile(bundleConfigFile, bundleConfigFileCopy, (err) => {
            if (err) throw err;
            fs.readFile(bundleConfigFile, 'utf-8', (_, data) => {
                const json = JSON.parse(data)
                json.bundles = Object.keys(json.bundles)
                    .filter(b => new RegExp(process.env.SERVE_BUNDLE_REGEX).test(b))
                    .reduce((_bundles, b) => ({
                        ..._bundles,
                        [b]: json.bundles[b]
                    }), {})
                fs.writeFile(bundleConfigFile, JSON.stringify(json, null, 2), () => {
                    log(`${colors.cyan('config.json')} now only includes the bundles matching the regex ${colors.magenta(process.env.SERVE_BUNDLE_REGEX)}`, 'setBundleConfig')
                })
            })
        })
    }
} catch (err) { }