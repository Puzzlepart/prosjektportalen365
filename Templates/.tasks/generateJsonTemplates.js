/**
 * @fileoverview Generate JSON templates for Portfolio and Project sites
 * @author Puzzlepart
 */
const fs = require('fs')
const path = require('path')
const pkg = require('../../package.json')
const JsonTokenReplace = require('@ptkdev/json-token-replace')
const jsonTokenReplace = new JsonTokenReplace()
const argv = require('yargs').argv

// Run replace in silent mode if the --silent flag is set
const silent = argv.silent || false

// Template names for the different languages
const templateNames = {
    "nb-NO": {
        "Project": "Standardmal",
        "Program": "Programmal",
        "Parent": "Overordnet"
    },
    "en-US": {
        "Project": "DefaultTemplate",
        "Program": "ProgramTemplate",
        "Parent": "ParentTemplate"
    }
}

// Resources in JSON format
const resourcesJson = require('../Resources.json')

// JSON templates
const jsonTemplates = fs.readdirSync(path.resolve(__dirname, '../JsonTemplates'))

// Get the current channel config
const currentChannelConfig = require('../../.current-channel-config.json')

// Get the channel replace map
const channelReplaceMap = require('../../.channel-replace-map.json')

// Generate the channel replace values
const channelReplaceValue = Object.keys(currentChannelConfig.spfx.solutions).reduce((acc, key) => {
    const solution = currentChannelConfig.spfx.solutions[key]
    return Object.keys(solution.components).reduce((acc, componentKey) => {
        acc[`ControlId_${componentKey}`] = solution.components[componentKey]
        return acc
    }, acc)
}, {})

// For each JSON template, replace the tokens and write the output to the correct folder.
jsonTemplates.forEach(templateFile => {
    const templateJson = require(`../JsonTemplates/${templateFile}`)
    const templateType = templateFile.substring("_JsonTemplate".length).replace((/\.[^.]+/), '')
    const outputPaths = {
        'en-US': path.resolve(__dirname, `../Content/Portfolio_content.en-US/ProjectTemplates/${templateNames['en-US'][templateType]}.txt`),
        'no-NB': path.resolve(__dirname, `../Content/Portfolio_content.no-NB/ProjectTemplates/${templateNames['nb-NO'][templateType]}.txt`)
    }

    Object.keys(resourcesJson).forEach(key => {
        const jsonTokens = { ...resourcesJson[key], ...channelReplaceValue }
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
            outputPaths[key],
            JSON.stringify(content, null, 4),
            () => {

            })
    })
})