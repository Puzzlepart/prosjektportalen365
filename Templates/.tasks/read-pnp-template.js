const path = require('path')
const fs = require('fs')
const xml2js = require('xml2js')

const template = 'Portfolio'
const templatePath = path.resolve(__dirname, `../${template}`)

async function process() {
    const clientSidePages = fs.readdirSync(templatePath + '/Objects/ClientSidePages')
    const processedClientSidePages = []

    for (let i = 0; i < clientSidePages.length; i++) {
        const filePath = path.join(templatePath, 'Objects/ClientSidePages', clientSidePages[i])
        const stats = fs.statSync(filePath)
        const parser = new xml2js.Parser()
        const fileContent = fs.readFileSync(filePath, 'utf8')
        const json = await parser.parseStringPromise(fileContent)
        if(!json['pnp:ClientSidePage']) {
            continue;
        }
        processedClientSidePages[i] = {
            name: clientSidePages[i],
            size: stats.size,
            json: JSON.stringify(json['pnp:ClientSidePage']),
        }
    }
    console.table(processedClientSidePages, ['name', 'size', 'json'])
}


process()