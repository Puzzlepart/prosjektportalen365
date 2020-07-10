// generateResxJson.js

const resxConverter = require('resx-json-typescript-converter')

resxConverter.convertResx([
    './Portfolio/Resources.no-NB.resx',
    './Portfolio/Resources.en-US.resx'
],
    './',
    {
        defaultResxCulture: 'no-NB',
        mergeCulturesToSingleFile: true,
        generateTypeScriptResourceManager: false,
        searchRecursive: true,
    }
)