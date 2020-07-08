const fs = require('fs')
const path = require('path')
const Jtr = require('@ptkdev/json-token-replace')
const jtr = new Jtr()
const resources = require('./Resources.json')
const output = {
    'en-US': 'DefaultTemplate.txt',
    'no-NB': 'Standardmal.txt'
}

Object.keys(resources).forEach(key => {
    console.log('Generating template for ' + key)
    let content = jtr.replace(
        resources[key],
        require('./Prosjektmaler/Template.json'),
        '{resource:', '}'
    )

    fs.writeFile(path.join(__dirname, 'Prosjektmaler', output[key]), JSON.stringify(content, null, 4), () => {

    })
})