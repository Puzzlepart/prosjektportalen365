const fs = require('fs')
const path = require('path')

// Environment file template specific to the project
const environmentFileTemplate = path.join(process.cwd(), `.env.template`)

// Environment file template shared between all projects
const environmentFileTemplateShared = path.join(__dirname, `.env.template`)

// Environment file
const environmentFile = path.join(process.cwd(), `.env`)

/**
 * Read bundle names from config/config.json in the current project.
 * Returns an array of bundle name strings, or an empty array if
 * the config file doesn't exist or has no bundles.
 */
function getBundleNames() {
    const configPath = path.join(process.cwd(), 'config', 'config.json')
    if (!fs.existsSync(configPath)) return []
    try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
        return Object.keys(config.bundles || {})
    } catch {
        return []
    }
}

if (!fs.existsSync(environmentFile) && fs.existsSync(environmentFileTemplateShared)) {
    let template
    if (fs.existsSync(environmentFileTemplate)) {
        template = fs.readFileSync(environmentFileTemplate, 'utf8')
    } else {
        template = fs.readFileSync(environmentFileTemplateShared, 'utf8')
    }

    const bundles = getBundleNames()
    if (bundles.length > 0) {
        template += '\n# Tilgjengelige bundle regex-verdier:\n'
        template += bundles.map((b) => `##  ${b}`).join('\n') + '\n'
    }

    fs.writeFileSync(environmentFile, template, 'utf8')
}