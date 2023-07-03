const fs = require('fs')
const path = require('path')
const configSrc = path.join(process.cwd(), 'config/config.json')
const configTempSrc = path.join(process.cwd(), 'config/config.json.bak')
require('dotenv').config()

const isRevert = process.argv[2] === '--revert' || process.env.npm_lifecycle_event === 'postwatch'

try {
    if (process.argv[2] === '--revert' || process.env.npm_lifecycle_event === 'postwatch') {
        if (!fs.existsSync(configTempSrc)) return
        fs.copyFile(configTempSrc, configSrc, () => {
            fs.rm(configTempSrc, () => { })
        })
    } else {
        if (!process.env.SERVE_BUNDLE_REGEX) return
        fs.copyFile(configSrc, configTempSrc, (err) => {
            if (err) throw err;
            fs.readFile(configSrc, 'utf-8', (_, data) => {
                const json = JSON.parse(data)
                json.bundles = Object.keys(json.bundles)
                    .filter(b => new RegExp(process.env.SERVE_BUNDLE_REGEX).test(b))
                    .reduce((_bundles, b) => {
                        _bundles[b] = json.bundles[b]
                        return _bundles
                    }, {})
                fs.writeFile(configSrc, JSON.stringify(json, null, 2), () => {
                    console.log(`config.json now only includes the bundles matching the regex ${process.env.SERVE_BUNDLE_REGEX}`)
                })
            })
        })
    }
} catch (err) { }