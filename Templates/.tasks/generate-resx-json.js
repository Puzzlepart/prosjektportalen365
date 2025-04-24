// generate-resx-json.js

const path = require('path')
const { convertResx } = require('resx-json-typescript-converter')

convertResx([
    path.resolve(__dirname, '../Portfolio/Resources.no-NB.resx'),
    path.resolve(__dirname, '../Portfolio/Resources.en-US.resx')
],
    path.resolve(__dirname, '../'),
    {
        defaultResxCulture: 'no-NB',
        mergeCulturesToSingleFile: true,
        generateTypeScriptResourceManager: false,
        searchRecursive: true,
    }
)