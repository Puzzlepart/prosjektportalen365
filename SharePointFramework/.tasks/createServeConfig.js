const fs = require('fs')
const colors = require('colors/safe')
const path = require('path')
const { log } = require('./util')

const serveSampleSrc = path.join(process.cwd(), 'config/serve.sample.json')
const serveSrc = path.join(process.cwd(), 'config/serve.json')

try {
    if (!fs.existsSync(serveSrc)) {
        fs.copyFile(serveSampleSrc, serveSrc, (err) => {
            if (!err) log(`${colors.magenta(path.relative(process.cwd(), serveSrc))} was generated from ${colors.magenta(path.relative(process.cwd(), serveSampleSrc))}`, 'createServeConfig')
        });
    }
} catch (err) { }