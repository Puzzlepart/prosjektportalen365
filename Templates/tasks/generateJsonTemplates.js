// generateJsonTemplates.js

const fs = require('fs')
const path = require('path')
const pkg = require('../../package.json')
const Jtr = require('@ptkdev/json-token-replace')
const jtr = new Jtr()

const RESOURCES_JSON = require('../Resources.json')
const TEMPLATE_JSON = require('../_JsonTemplate.json')
const OUTPUT_PATHS = {
    'en-US': path.resolve(__dirname, '../Content/Portfolio_content.en-US/ProjectTemplates/DefaultTemplate.txt'),
    'no-NB': path.resolve(__dirname, '../Content/Portfolio_content.no-NB/ProjectTemplates/Standardmal.txt')
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