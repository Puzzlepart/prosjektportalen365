// generate-resx-ts.js

const fs = require('fs')
const path = require('path')
const xml2js = require('xml2js')

const RESX_FILES = [
  { path: path.resolve(__dirname, '../Portfolio/Resources.en-US.resx'), locale: 'en-us' },
  { path: path.resolve(__dirname, '../Portfolio/Resources.no-NB.resx'), locale: 'nb-no' },
]
const OUTPUT_PATHS = [
  path.resolve(__dirname, '../../SharePointFramework/shared-library/src/loc'),
  path.resolve(__dirname, '../../SharePointFramework/ProgramWebParts/src/loc'),
  path.resolve(__dirname, '../../SharePointFramework/PortfolioWebParts/src/loc'),
  path.resolve(__dirname, '../../SharePointFramework/PortfolioExtensions/src/loc'),
  path.resolve(__dirname, '../../SharePointFramework/ProjectWebParts/src/loc'),
  path.resolve(__dirname, '../../SharePointFramework/ProjectExtensions/src/loc'),
]

/**
 * Parses a .resx file and extracts string resources
 * 
 * @param {*} resxFilePath - Path to the .resx file
 * 
 * @returns {*} Object containing the extracted strings
 */
async function parseResxFile(resxFilePath) {
  const parser = new xml2js.Parser()
  const fileContent = fs.readFileSync(resxFilePath, 'utf8')
  const result = await parser.parseStringPromise(fileContent)

  const strings = {}

  if (result.root && result.root.data) {
    result.root.data.forEach(item => {
      if (item.$ && item.$.name && item.value) {
        const key = item.$.name
        const value = item.value[0]
        strings[key] = value
      }
    })
  }

  return strings
}

/**
 * Generates the TypeScript interface definition file with JSDoc comments showing values for all languages
 
 * @param {*} allStrings - Combined strings from all locales
 * @param {*} localeStrings - Object with locale codes as keys and their string values as values

 * @returns {*} TypeScript interface definition content
 */
function generateTypescriptDefinition(allStrings, localeStrings = {}) {
  const interfaceContent = Object.keys(allStrings).map(key => {
    // Generate JSDoc comment with values from all locales
    const localeValues = Object.entries(localeStrings)
      .map(([locale, strings]) => `   * - \`${locale}\`: "${strings[key] ? strings[key].replace(/"/g, '\\"') : 'undefined'}"`)
      .join('\n');

    return `  /**
${localeValues}
   */
  ${key}: string`;
  }).join('\n\n');

  return `declare interface ISharedResources {
${interfaceContent}
}

declare module 'SharedResources' {
  const strings: ISharedResources
  export = strings
}
`
}

/**
 * Generates a locale file for a specific language
 * @param {Object} strings - Strings for this locale
 * @returns {string} JavaScript content for the locale file
 */
function generateLocaleFile(strings) {
  const stringEntries = Object.entries(strings)
    .filter(([, value]) => Boolean(value?.trim()))
    .map(([key, value]) => `  ${key}: "${value.replace(/"/g, '\\"')}"`)
    .join(',\n')

  return `define([], function() {
  return {
${stringEntries}
  }
})
`
}

/**
 * Main function to convert .resx files to TypeScript
 */
async function convertResxToTypescript() {
  try {
    // Create output directories if they don't exist
    for (const dir of OUTPUT_PATHS) {
      const outputDir = path.resolve(dir, 'shared')
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }
    }

    // Parse all .resx files
    const allStrings = {}
    const localeStrings = {}

    // First pass: collect all strings from all locales
    for (const resxFile of RESX_FILES) {
      console.log(`Processing ${resxFile.path}...`)
      const strings = await parseResxFile(resxFile.path)

      // Store strings for this locale
      localeStrings[resxFile.locale] = strings

      // Add all keys to the combined strings object
      Object.keys(strings).forEach(key => {
        allStrings[key] = strings[key]
      })
    }

    // Second pass: generate locale files and ensure all locales have all keys
    for (const resxFile of RESX_FILES) {
      const currentLocaleStrings = localeStrings[resxFile.locale]

      // Make sure this locale has all keys (even if undefined)
      Object.keys(allStrings).forEach(key => {
        if (!currentLocaleStrings[key]) {
          currentLocaleStrings[key] = ''
        }
      })

      // Generate locale file
      const localeContent = generateLocaleFile(currentLocaleStrings)

      // Write to all output directories
      for (const dir of OUTPUT_PATHS) {
        fs.writeFileSync(path.join(dir, 'shared', `${resxFile.locale}.js`), localeContent)
      }
      console.log(`Generated ${resxFile.locale}.js in all output directories`)
    }

    // Generate TypeScript definition file with JSDoc comments including all locale values
    const definitionContent = generateTypescriptDefinition(allStrings, localeStrings)

    // Write to all output directories
    for (const dir of OUTPUT_PATHS) {
      fs.writeFileSync(path.join(dir, 'shared', 'shared.d.ts'), definitionContent)
    }
    console.log('Generated shared.d.ts in all output directories')

    console.log('Conversion completed successfully!')
  } catch (error) {
    console.error('Error converting .resx files:', error)
  }
}

// Execute the conversion
convertResxToTypescript()