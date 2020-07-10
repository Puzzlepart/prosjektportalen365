const CONFIG_PATH = './config/config.json'
const BACKUP_PATH = './config/config.backup.json'

const config = require(CONFIG_PATH)
const argv = require('yargs').argv
const fs = require('fs')

if (argv.reset) {
    try {
        const bk = require(BACKUP_PATH)
        fs.writeFile(CONFIG_PATH, JSON.stringify(bk, null, 4), () => { })
    } catch (err) { }
} else if (argv.filter) {
    fs.exists(BACKUP_PATH, exists => {
        if (!exists) {
            fs.writeFile(BACKUP_PATH, JSON.stringify(config, null, 4), () => {
                createConfig(config, argv.filter)
            })
        } else {
            const bk = require(BACKUP_PATH)
            createConfig(bk, argv.filter)
        }
    })
}

function createConfig(c, filter) {
    c.bundles = Object.keys(c.bundles).reduce((b, key) => {
        if(key.indexOf(filter) !== -1) b[key] = c.bundles[key]
        return b
    }, {})
    fs.writeFile(CONFIG_PATH, JSON.stringify(c, null, 4), () => { })
}