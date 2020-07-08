const fs = require('fs')
const path = require('path')
const pkg = require('../package.json')
const Jtr = require('@ptkdev/json-token-replace')
const jtr = new Jtr()
const resources = require('./Resources.json')
const template = require('./_JsonTemplate.json')
const output = {
    'en-US': 'DefaultTemplate.txt',
    'no-NB': 'Standardmal.txt'
}

Object.keys(resources).forEach(key => {
    let content = jtr.replace(
        resources[key],
        template,
        '{resource:',
        '}'
    )

    content = jtr.replace(
        pkg,
        content,
        '{',
        '}'
    )

    fs.writeFile(
        path.join(__dirname, 'Content', `Portfolio_content.${key}/ProjectTemplates`, output[key]),
        JSON.stringify(content, null, 4),
        () => {

        })
})