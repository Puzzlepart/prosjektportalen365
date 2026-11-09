// validate-project-template.js

const fs = require('fs')
const path = require('path')
const { getFileContent } = require('./util')
const { findListReferenceProblems } = require('./list-references')

// Recursively find all files with the given extension in a directory
function findFilesRecursive(dir, extension) {
    const files = []
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const entryPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            files.push(...findFilesRecursive(entryPath, extension))
        } else if (entry.isFile() && entry.name.endsWith(extension)) {
            files.push(entryPath)
        }
    }
    return files
}

// Default token regex for project templates JSON files
const TOKEN_REGEX = /{{(.*?)}}/g

// Token regex for PnP template files
const PNP_TOKEN_REGEX = /{resource:([a-zA-Z0-9_]+)}/g

// Directory containing the content templates
const CONTENT_TEMPLATES_DIR = path.resolve(__dirname, '../Content')

// Directory containing the portfolio template
const PORTFOLIO_TEMPLATE_DIR = path.resolve(__dirname, '../Portfolio')

// Get all content template directories
const contentTemplates = fs.readdirSync(CONTENT_TEMPLATES_DIR)

// Create an array to hold the paths of the templates
const templates = []

// Create an object to keep the missing resource tokens for the Portfolio template
const missingResourceTokens = {}

// Iterate over each content template directory
for (const contentTemplate of contentTemplates) {
    // Check if the directory is a valid content template
    const contentTemplatePath = path.join(CONTENT_TEMPLATES_DIR, contentTemplate, 'ProjectTemplates')
    if (fs.existsSync(contentTemplatePath) && fs.statSync(contentTemplatePath).isDirectory()) {
        // Get all project template files in the directory
        const projectTemplates = fs.readdirSync(contentTemplatePath).filter(file => file.endsWith('.txt'))

        // Add the paths of the project templates to the templates array
        for (const projectTemplate of projectTemplates) {
            templates.push(path.join(contentTemplatePath, projectTemplate))
        }
    }
}

for (const templatePath of templates) {
    const templateContent = fs.readFileSync(templatePath, 'utf-8').replace(/\r\n/g, '\n')
    let tokens = new Set()
    let match
    while ((match = TOKEN_REGEX.exec(templateContent)) !== null) {
        tokens.add(match[1].trim())
    }

    // Sort tokens alphabetically and remove duplicates
    tokens = new Set(Array.from(tokens).sort())

    // List references to lists the template does not have. The content template folder is
    // `Portfolio_content.<lng>`. They are also written to the console, since the run exits with 0.
    const relativeTemplatePath = path.relative(path.resolve(__dirname, '..'), templatePath).split(path.sep).join('/')
    const lng = path.basename(path.dirname(path.dirname(templatePath))).replace(/^Portfolio_content\./, '')
    const problems = findListReferenceProblems(JSON.parse(templateContent), lng)
    for (const token of problems.listIds) {
        console.warn(`[validate-project-template] ${relativeTemplatePath}: ${token} names neither a list of the template nor a list every project site has`)
    }
    for (const node of problems.navigation) {
        console.warn(`[validate-project-template] ${relativeTemplatePath}: ${node} names no list the template creates`)
    }

    // No date and no absolute path: the report is tracked, so it must come out the same on every
    // machine (macOS or Windows, any locale) as long as the template does not change.
    let markdownContent = `The template contains the following tokens that has not been found in the .resx files:\n\n`
    if (tokens.size === 0) {
        markdownContent += '_No tokens with missing translations or replacement values found._'
    }
    else {
        markdownContent += Array.from(tokens).map(t => `- ${t}`).join('\n')
    }

    markdownContent += '\n\nThe template contains the following `{listid:}` tokens that name neither a list of the template nor a list every project site has:\n\n'
    if (problems.listIds.length === 0) {
        markdownContent += '_No `{listid:}` tokens without a list found._'
    }
    else {
        markdownContent += problems.listIds.map(t => `- ${t}`).join('\n')
    }

    markdownContent += '\n\nThe template contains the following navigation nodes whose `Lists/` URL names no list the template creates:\n\n'
    if (problems.navigation.length === 0) {
        markdownContent += '_No navigation nodes without a list found._'
    }
    else {
        markdownContent += problems.navigation.map(n => `- ${n}`).join('\n')
    }

    markdownContent += '\n\n---\n\n'
    markdownContent += '## Template Content\n\n'
    markdownContent += '```txt\n'
    markdownContent += templateContent
    markdownContent += '\n```\n\n'
    markdownContent += '## Template Path\n\n'
    markdownContent += '```txt\n'
    markdownContent += relativeTemplatePath
    markdownContent += '\n```\n\n'

    const filePath = templatePath.replace(/\.txt$/, '-validation.md')

    fs.writeFileSync(filePath, markdownContent, { flag: 'w' })
}


// Get the resources.json file content as JSON
const resources = getFileContent('Resources.json')

function validatePnPFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (PNP_TOKEN_REGEX.test(content)) {
        const matches = content.match(PNP_TOKEN_REGEX);
        const tokens = matches.map(match => match.replace(PNP_TOKEN_REGEX, '$1'));
        const uniqueTokens = Array.from(new Set(tokens));
        Object.keys(resources).forEach((lng) => {
            uniqueTokens.forEach((token) => {
                if (resources[lng][token] === undefined) {
                    missingResourceTokens[lng] = missingResourceTokens[lng] || []
                    if (!missingResourceTokens[lng].includes(token)) {
                        missingResourceTokens[lng].push(token)
                    }
                }
            })
        })
    }
}

// For all files recursively in PORTFOLIO_TEMPLATE_DIR, look for tokens matching the PNP_TOKEN_REGEX
const portfolioTemplateFiles = findFilesRecursive(PORTFOLIO_TEMPLATE_DIR, '.xml')
for (const filePath of portfolioTemplateFiles) {
    validatePnPFile(filePath)
}

// Save the missing resource tokens to a file (pnp-missing-resource-tokens-report.json) which
// is located one level up from the current directory, and should be git ignored.
fs.writeFileSync(
    path.join(path.resolve(__dirname, '..'), 'pnp-missing-resource-tokens-report.json'),
    JSON.stringify(missingResourceTokens, null, 2),
    { flag: 'w' }
)