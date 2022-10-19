// generateResxJson.js

const path = require('path')
const resxConverter = require('resx-json-typescript-converter')

resxConverter.convertResx([
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