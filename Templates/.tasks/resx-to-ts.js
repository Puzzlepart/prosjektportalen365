const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

const RESX_FILES = [
  { path: path.resolve(__dirname, '../Portfolio/Resources.en-US.resx'), locale: 'en-us' },
  { path: path.resolve(__dirname, '../Portfolio/Resources.no-NB.resx'), locale: 'no-nb' },
];
const OUTPUT_PATH = path.resolve(__dirname, '../../SharePointFramework/ProgramWebParts/src/loc');

/**
 * Parses a .resx file and extracts string resources
 * @param {string} resxFilePath - Path to the .resx file
 * @returns {Promise<Object>} Object containing the extracted strings
 */
async function parseResxFile(resxFilePath) {
  const parser = new xml2js.Parser();
  const fileContent = fs.readFileSync(resxFilePath, 'utf8');
  const result = await parser.parseStringPromise(fileContent);

  const strings = {};

  if (result.root && result.root.data) {
    result.root.data.forEach(item => {
      if (item.$ && item.$.name && item.value) {
        const key = item.$.name;
        const value = item.value[0];
        strings[key] = value;
      }
    });
  }

  return strings;
}

/**
 * Generates the TypeScript interface definition file
 * @param {Object} strings - Combined strings from all locales
 * @returns {string} TypeScript interface definition content
 */
function generateTypescriptDefinition(strings) {
  const interfaceContent = Object.keys(strings).map(key => `  ${key}: string;`).join('\n');

  return `declare interface IStrings {
${interfaceContent}
}

declare module 'SharedLibraryStrings' {
  const strings: IStrings;
  export = strings;
}
`;
}

/**
 * Generates a locale file for a specific language
 * @param {Object} strings - Strings for this locale
 * @param {string} locale - Locale code (e.g., 'en-us')
 * @returns {string} JavaScript content for the locale file
 */
function generateLocaleFile(strings, locale) {
  const stringEntries = Object.entries(strings)
    .map(([key, value]) => `  ${key}: "${value.replace(/"/g, '\\"')}"`)
    .join(',\n');

  return `define([], function() {
  return {
${stringEntries}
  }
});
`;
}

/**
 * Main function to convert .resx files to TypeScript
 */
async function convertResxToTypescript() {
  try {
    // Create output directory if it doesn't exist
    const outputDir = path.resolve(__dirname, OUTPUT_PATH, 'resx');

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Parse all .resx files
    const allStrings = {};
    for (const resxFile of RESX_FILES) {
      console.log(`Processing ${resxFile.path}...`);
      const resxPath = path.resolve(__dirname, resxFile.path);
      const strings = await parseResxFile(resxPath);

      // Generate locale file
      const localeContent = generateLocaleFile(strings, resxFile.locale);
      fs.writeFileSync(path.join(outputDir, `${resxFile.locale}.js`), localeContent);
      console.log(`Generated ${resxFile.locale}.js`);

      // Merge strings for type definition
      Object.assign(allStrings, strings);
    }

    // Generate TypeScript definition file
    const definitionContent = generateTypescriptDefinition(allStrings);
    fs.writeFileSync(path.join(outputDir, 'resx.d.ts'), definitionContent);
    console.log('Generated resx.d.ts');

    console.log('Conversion completed successfully!');
  } catch (error) {
    console.error('Error converting .resx files:', error);
  }
}

// Execute the conversion
convertResxToTypescript();