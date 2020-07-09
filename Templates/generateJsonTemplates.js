const fs = require('fs')
const path = require('path')
const pkg = require('../package.json')
const Jtr = require('@ptkdev/json-token-replace')
const jtr = new Jtr()
const resources = require('./Resources.json')
const template = require('./_JsonTemplate.json')
const output = {
    'en-US': path.join(__dirname, 'Content', `Portfolio_content.en-US/ProjectTemplates`, 'DefaultTemplate.txt'),
    'no-NB': path.join(__dirname, 'Content', `Portfolio_content.no-NB/ProjectTemplates`, 'Standardmal.txt')
}

Object.keys(resources).forEach(key => {
    let content = jtr.replace(
        resources[key],
        template,
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
        output[key],
        JSON.stringify(content, null, 4),
        () => {

        })
})