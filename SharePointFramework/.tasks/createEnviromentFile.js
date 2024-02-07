const fs = require('fs')
const path = require('path')

// Environment file template specific to the project
const environmentFileTemplate = path.join(process.cwd(), `.env.template`)

// Environment file template shared between all projects
const environmentFileTemplateShared = path.join(__dirname, `.env.template`)

// Environment file
const environmentFile = path.join(process.cwd(), `.env`)

if (!fs.existsSync(environmentFile) && fs.existsSync(environmentFileTemplateShared)) {
    if (fs.existsSync(environmentFileTemplate)) {
        fs.copyFileSync(environmentFileTemplate, environmentFile)
    } else {
        fs.copyFileSync(environmentFileTemplateShared, environmentFile)
    }
}