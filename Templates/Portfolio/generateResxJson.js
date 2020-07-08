const resxConverter = require('resx-json-typescript-converter')

resxConverter.convertResx([
    './Resources.no-NB.resx',
    './Resources.en-US.resx'
],
    './',
    {
        defaultResxCulture: 'no-NB',
        mergeCulturesToSingleFile: true,
        generateTypeScriptResourceManager: false,
        searchRecursive: true,
    }
)