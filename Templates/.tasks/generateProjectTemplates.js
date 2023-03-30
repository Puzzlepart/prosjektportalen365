/**
 * @fileoverview Generate JSON templates for Portfolio and Project sites
 * @author Puzzlepart
 */
const fs = require('fs')
const path = require('path')
const pkg = require('../../package.json')
const JsonTokenReplace = require('@ptkdev/json-token-replace')
const jsonTokenReplace = new JsonTokenReplace()


/**
 * Get file content for the given file path in JSON format. If the file 
 * does not exist or the JSON is invalid, the fallback value is returned.
 * 
 * By default the function goes up one folder from the current folder.
 * 
 * @param {*} file File path 
 * @param {*} fallbackValue Fallback value if file does not exist
 * 
 * @returns File contents as JSON
 */
function getFileContent(file, fallbackValue = {}) {
    try {
        const fileContent = fs.readFileSync(path.resolve(__dirname, '..', file), 'UTF-8')
        const fileContentJson = JSON.parse(fileContent)
        return fileContentJson
    } catch (error) {
        return fallbackValue
    }
}

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

// Resources in JSON format
const resourcesJson = getFileContent('Resources.json')

// JSON templates
const jsonMasterTemplates = fs.readdirSync(path.resolve(__dirname, '../JsonTemplates'))

// Get the main channel config
const mainChannelConfig = getFileContent('../channels/main.json')

// Get the current channel config with fallback to main channel config
const currentChannelConfig = getFileContent('../.current-channel-config.json', mainChannelConfig)

// Generate the channel replace values
const channelReplaceValue = Object.keys(currentChannelConfig.spfx.solutions).reduce((acc, key) => {
    const solution = currentChannelConfig.spfx.solutions[key]
    return Object.keys(solution.components).reduce((acc, componentKey) => {
        acc[`ControlId_${componentKey}`] = solution.components[componentKey]
        return acc
    }, acc)
}, {})

// For each JSON template, replace the tokens and write the output to the correct folder.
jsonMasterTemplates.forEach(templateFile => {
    const templateJson = getFileContent(`JsonTemplates/${templateFile}`)
    const templateType = templateFile.substring('_JsonTemplate'.length).replace((/\.[^.]+/), '')
    const outputPaths = Object.keys(templateNames).reduce((acc, lng) => {
        acc[lng] = path.resolve(__dirname, `../Content/Portfolio_content.${lng}/ProjectTemplates/${templateNames[lng][templateType]}.txt`)
        return acc
    }, {})


    Object.keys(resourcesJson).forEach(lng => {
        const jsonTokens = { ...resourcesJson[lng], ...channelReplaceValue }
        let content = jsonTokenReplace.replace(
            jsonTokens,
            templateJson,
            '{{',
            '}}'
        )

        content = jsonTokenReplace.replace(
            pkg,
            content,
            '{',
            '}'
        )

        fs.writeFile(
            outputPaths[lng],
            JSON.stringify(content, null, 4),
            () => {
            })
    })
})