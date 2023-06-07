const fs = require('fs')
const path = require('path')

// Environment file template
const environmentFileTemplate = __dirname + '/.env.template'

// Environment file
const environmentFile = path.join(process.cwd(), `.env`)

if (!fs.existsSync(environmentFile)) {
    fs.copyFileSync(environmentFileTemplate, environmentFile)
}