const fs = require('fs')
const path = require('path')
const configSrc = path.join(process.cwd(), 'config/config.json')
const configTempSrc = path.join(process.cwd(), 'config/__config__temp.json')
require('dotenv').config(path.join(process.cwd(), '.env'))

try {
    if (process.argv[2] === '--revert') {
        setTimeout(() => {
            fs.copyFile(configTempSrc, configSrc, () => {
                fs.rm(configTempSrc, () => { })
            })
        }, 20000)
    } else {
        if (!process.env.SERVE_BUNDLE) return
        fs.copyFile(configSrc, configTempSrc, (err) => {
            if (err) throw err;
            fs.readFile(configSrc, 'utf-8', (_, data) => {
                const json = JSON.parse(data)
                json.bundles = Object.keys(json.bundles)
                    .filter(b => b.indexOf(process.env.SERVE_BUNDLE) !== -1)
                    .reduce((_bundles, b) => {
                        _bundles[b] = json.bundles[b]
                        return _bundles
                    }, {})
                fs.writeFile(configSrc, JSON.stringify(json), () => {
                    console.log(`config.json now only includes your specified bundles.. You can now run npm run serve.`)
                })
            })
        })
    }
} catch (err) { }