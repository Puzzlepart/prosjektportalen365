const fs = require('fs')
const path = require('path')
const serveSampleSrc = path.join(process.cwd(), 'config/serve.sample.json')
const serveSrc = path.join(process.cwd(), 'config/serve.json')

try {
    if (!fs.existsSync(serveSrc)) {
        fs.copyFile(serveSampleSrc, serveSrc, (err) => {
            if (!err) console.log(`${serveSrc} was generated from ${serveSampleSrc}`)
        });
    }
} catch (err) { }