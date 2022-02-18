// generateJsonTemplates.js

const fs = require('fs')
const path = require('path')
const pkg = require('../../package.json')
const Jtr = require('@ptkdev/json-token-replace')
const jtr = new Jtr()

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

const RESOURCES_JSON = require('../Resources.json')

fs.readdirSync(path.resolve(__dirname, '../JsonTemplates')).forEach(file => {
    const TEMPLATE_JSON = require(`../JsonTemplates/${file}`)
    const templateType = file.substring("_JsonTemplate".length).replace((/\.[^.]+/), '')
    const OUTPUT_PATHS = {
        'en-US': path.resolve(__dirname, `../Content/Portfolio_content.en-US/ProjectTemplates/${templateNames['en-US'][templateType]}.txt`),
        'no-NB': path.resolve(__dirname, `../Content/Portfolio_content.no-NB/ProjectTemplates/${templateNames['nb-NO'][templateType]}.txt`)
    }

    Object.keys(RESOURCES_JSON).forEach(key => {
        let content = jtr.replace(
            RESOURCES_JSON[key],
            TEMPLATE_JSON,
            '{{',
            '}}'
        )

        content = jtr.replace(
            pkg,
            content,
            '{',
            '}'
        )

        fs.writeFile(
            OUTPUT_PATHS[key],
            JSON.stringify(content, null, 4),
            () => {

            })
    })
})