// validateProjectTemplate.js
const fs = require('fs')
const path = require('path')

// Example of token {{SiteFields_Project_Group}}
const tokenRegex = /{{(.*?)}}/g
const templates = {
    DefaultTemplate: path.resolve(__dirname, '../Content/Portfolio_content.en-US/ProjectTemplates/DefaultTemplate.txt'),
    Standardmal: path.resolve(__dirname, '../Content/Portfolio_content.no-NB/ProjectTemplates/Standardmal.txt'),
}

for (const key of Object.keys(templates)) {
    const templatePath = templates[key]
    const templateContent = fs.readFileSync(templatePath, 'utf-8')
    let tokens = new Set()
    let match
    while ((match = tokenRegex.exec(templateContent)) !== null) {
        tokens.add(match[1].trim())
    }
    // Sort tokens alphabetically and remove duplicates
    tokens = new Set(Array.from(tokens).sort())


    let markdownContent = `The template ${key} contains the following tokens that has not been found in the .resx files:\n\n`
    if (tokens.size === 0) {
        markdownContent += 'No missing tokens found.'
    }
    else {
        markdownContent += Array.from(tokens).map(t => `- ${t}`).join('\n')
    }

    fs.writeFileSync(`${key}-tokens.md`, markdownContent, { flag: 'w' })
}
