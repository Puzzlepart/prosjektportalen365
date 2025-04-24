// generate-project-templates.js

const fs = require('fs')
const path = require('path')
const pkg = require('../../package.json')
const { format } = require('util')
const { getFileContent } = require('./util')
const JsonTokenReplace = require('@ptkdev/json-token-replace')
const { replace } = new JsonTokenReplace()

// Template names for the different languages
const templateNames = {
    'no-NB': {
        'Project': 'Standardmal',
        'Program': 'Programmal',
        'Parent': 'Overordnet'
    },
    'en-US': {
        'Project': 'DefaultTemplate',
        'Program': 'ProgramTemplate',
        'Parent': 'ParentTemplate'
    }
}

const RESOURCES_JSON = getFileContent('Resources.json')
const JSON_MASTER_TEMPLATES_DIR = fs.readdirSync(path.resolve(__dirname, '../JsonTemplates'))
const JSON_TEMPLATE_PREFIX = '_JsonTemplate'
const MAIN_CHANNEL_CONFIG = getFileContent('../channels/main.json')
const CURRENT_CHANNEL_CONFIG = getFileContent('../.current-channel-config.json', MAIN_CHANNEL_CONFIG)
const PROJECT_TEMPLATE_DIR = '../Content/Portfolio_content.%s/ProjectTemplates/%s.txt'

// Generate the channel replace values
const channelReplaceValues = Object.keys(CURRENT_CHANNEL_CONFIG.spfx.solutions).reduce((acc, key) => {
    const solution = CURRENT_CHANNEL_CONFIG.spfx.solutions[key]
    return Object.keys(solution.components).reduce((acc, componentKey) => {
        acc[`ControlId_${componentKey}`] = solution.components[componentKey]
        return acc
    }, acc)
}, {})

// For each JSON template, replace the tokens and write the output to the correct folder.
JSON_MASTER_TEMPLATES_DIR.forEach(templateFile => {
    const templateJson = getFileContent(`JsonTemplates/${templateFile}`)
    const templateType = templateFile.substring(JSON_TEMPLATE_PREFIX.length).replace((/\.[^.]+/), '')
    const outputPaths = Object.keys(templateNames).reduce((acc, lng) => {
        acc[lng] = path.resolve(__dirname, format(PROJECT_TEMPLATE_DIR, lng, templateNames[lng][templateType]))
        return acc
    }, {})

    Object.keys(RESOURCES_JSON).forEach(lng => {
        const jsonTokens = { ...RESOURCES_JSON[lng], ...channelReplaceValues }
        let content = replace(
            jsonTokens,
            templateJson,
            '{{',
            '}}'
        )

        content = replace(
            pkg,
            content,
            '{',
            '}'
        )

        fs.writeFile(
            outputPaths[lng],
            JSON.stringify(content, null, 4),
            () => {})
    })
})