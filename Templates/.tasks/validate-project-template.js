// validateProjectTemplate.js
const fs = require('fs')
const path = require('path')

// Example of token {{SiteFields_Project_Group}}
const tokenRegex = /{{(.*?)}}/g

// Directory containing the content templates
const contentTemplatesDir = path.resolve(__dirname, '../Content')

// Get all content template directories
const contentTemplates = fs.readdirSync(contentTemplatesDir)

// Create an array to hold the paths of the templates
const templates = []

// Iterate over each content template directory
for (const contentTemplate of contentTemplates) {
    // Check if the directory is a valid content template
    const contentTemplatePath = path.join(contentTemplatesDir, contentTemplate, 'ProjectTemplates')
    if (fs.existsSync(contentTemplatePath) && fs.statSync(contentTemplatePath).isDirectory()) {
        // Get all project template files in the directory
        const projectTemplates = fs.readdirSync(contentTemplatePath).filter(file => file.endsWith('.txt'))

        // Add the paths of the project templates to the templates array
        for (const projectTemplate of projectTemplates) {
            templates.push(path.join(contentTemplatePath, projectTemplate))
        }
    }
}

for (const path of templates) {
    const templateContent = fs.readFileSync(path, 'utf-8')
    let tokens = new Set()
    let match
    while ((match = tokenRegex.exec(templateContent)) !== null) {
        tokens.add(match[1].trim())
    }

    // Sort tokens alphabetically and remove duplicates
    tokens = new Set(Array.from(tokens).sort())

    let markdownContent = `_The template was validated ${new Date().toLocaleString()}_\n\n`
    markdownContent += `The template contains the following tokens that has not been found in the .resx files:\n\n`
    if (tokens.size === 0) {
        markdownContent += '_No tokens with missing translations or replacement values found._'
    }
    else {
        markdownContent += Array.from(tokens).map(t => `- ${t}`).join('\n')
    }

    markdownContent += '\n\n---\n\n'
    markdownContent += '## Template Content\n\n'
    markdownContent += '```txt\n'
    markdownContent += templateContent
    markdownContent += '\n```\n\n'
    markdownContent += '## Template Path\n\n'
    markdownContent += '```txt\n'
    markdownContent += path
    markdownContent += '\n```\n\n'

    const filePath = path.replace(/\.txt$/, '-validation.md')

    fs.writeFileSync(filePath, markdownContent, { flag: 'w' })
}
