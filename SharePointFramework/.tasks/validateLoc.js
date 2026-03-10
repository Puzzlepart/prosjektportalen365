/**
 * @fileoverview Validates localization files by comparing TypeScript interface keys
 * against JavaScript resource file keys. Generates JSON or Markdown reports of
 * missing keys.
 *
 * Usage:
 *   node validateLoc.js --path ./src/loc --interface IMyStrings --dts mystrings.d.ts --output ./report.md [--summary] [--filter <regex>]
 *
 * Arguments:
 *   --path        Path to the localization folder (relative to cwd)
 *   --interface   Name of the TypeScript interface to validate against
 *   --dts         Name of the .d.ts file containing the interface
 *   --output      Output file path (.json or .md)
 *   --summary     Include a summary table in the report (flag)
 *   --filter      Optional regex to filter interface keys
 */
const fs = require('fs')
const path = require('path')
const argv = require('yargs').argv
const { set, get } = require('lodash')
const { Project, SyntaxKind } = require('ts-morph')
const colors = require('colors/safe')
const { log } = require('./util')

const taskName = 'validateLoc'

// ── Config from CLI args ──────────────────────────────────────────────

const config = {
    path: argv.path,
    interface: argv.interface,
    dts: argv.dts,
    output: argv.output,
    summary: argv.summary || false,
    filter: argv.filter || null
}

if (!config.path || !config.interface || !config.dts) {
    log('Missing required arguments: --path, --interface, --dts', taskName)
    process.exit(1)
}

// ── Last-run tracking ─────────────────────────────────────────────────

const lastRunFile = path.resolve(__dirname, '__last_run_data.json')
let lastRunData = {}
try {
    if (fs.existsSync(lastRunFile)) {
        lastRunData = JSON.parse(fs.readFileSync(lastRunFile, 'utf8'))
    }
} catch { /* ignore */ }

// ── Parse JS resource files ───────────────────────────────────────────

function getJsKeyValues(filePath) {
    const sourceFile = new Project().addSourceFileAtPath(filePath)
    const defineCall = sourceFile.getFirstDescendantByKind(SyntaxKind.CallExpression)
    if (!defineCall) throw new Error('No define() call found')
    const returnStatement = defineCall.getDescendantsOfKind(SyntaxKind.ReturnStatement)[0]
    if (!returnStatement) throw new Error('No return statement found')
    const returnObj = returnStatement.getExpression()
    if (!returnObj || returnObj.getKind() !== SyntaxKind.ObjectLiteralExpression) {
        throw new Error('Return expression is not an object literal')
    }

    function extractKeys(obj, prefix = '') {
        return obj.getProperties().flatMap((prop) => {
            if (prop.getKind() !== SyntaxKind.PropertyAssignment) return []
            const name = prop.getName().replace(/^['"]|['"]$/g, '')
            const fullKey = prefix ? `${prefix}.${name}` : name
            const initializer = prop.getInitializer()
            if (initializer && initializer.getKind() === SyntaxKind.ObjectLiteralExpression) {
                return extractKeys(initializer, fullKey)
            }
            return [fullKey]
        })
    }

    function extractMap(obj, prefix = '') {
        return obj.getProperties().flatMap((prop) => {
            if (prop.getKind() !== SyntaxKind.PropertyAssignment) return []
            const name = prop.getName().replace(/^['"]|['"]$/g, '')
            const fullKey = prefix ? `${prefix}.${name}` : name
            const initializer = prop.getInitializer()
            if (initializer && initializer.getKind() === SyntaxKind.ObjectLiteralExpression) {
                return extractMap(initializer, fullKey)
            }
            return [{ [fullKey]: initializer?.getText() || '' }]
        })
    }

    const map = extractMap(returnObj).reduce((acc, obj) => {
        const key = Object.keys(obj)[0]
        acc[key] = obj[key]
        return acc
    }, {})

    return [extractKeys(returnObj), map]
}

// ── Parse .d.ts interface ─────────────────────────────────────────────

function getInterfaceKeys(filePath, interfaceName, filter) {
    const sourceFile = new Project().addSourceFileAtPath(filePath)
    const iface = sourceFile.getInterface(interfaceName)
    if (!iface) {
        throw new Error(`Interface ${interfaceName} not found in ${filePath}`)
    }

    function getKeys(members, prefix = '') {
        let keys = []
        for (const member of members) {
            const name = member.getName()
            const typeNode = member.getTypeNode()
            if (typeNode?.getKind() === SyntaxKind.TypeLiteral) {
                const subMembers = typeNode.getMembers()
                keys.push(...getKeys(subMembers, `${prefix}${name}.`))
            } else {
                keys.push(`${prefix}${name}`)
            }
        }
        return keys
    }

    const keys = getKeys(iface.getMembers()).filter((key) => {
        if (filter) {
            return new RegExp(filter).test(key)
        }
        return true
    })

    return keys
}

// ── Report generators ─────────────────────────────────────────────────

function generateJsonReport(missingKeys, jsMaps, interfaceKeys) {
    const jsonContent = {}
    for (const [lng, keys] of Object.entries(missingKeys)) {
        const lastRunDataKey = `${taskName}.missingKeys.${lng}`
        const missingKeysLastRun = get(lastRunData, lastRunDataKey, [])
        let changeString = ''
        if (missingKeysLastRun?.length !== keys.length) {
            const diff = keys.length - missingKeysLastRun.length
            if (diff > 0) {
                changeString = colors.red(` (+${diff} since last run)`)
            } else if (diff < 0) {
                changeString = colors.green(` (-${Math.abs(diff)} since last run)`)
            }
        }
        log(`${keys.length} missing keys in ${lng}${changeString}`, taskName)
        set(lastRunData, lastRunDataKey, keys)
        set(jsonContent, `localization.validation.missingKeys.${lng}`, keys)
    }

    if (config.summary) {
        const jsonSummary = {}
        for (const key of interfaceKeys) {
            const values = []
            for (const [lng, jsMap] of Object.entries(jsMaps)) {
                values.push({ [lng]: jsMap[key]?.trim() })
            }
            set(jsonSummary, key, values)
        }
        if (typeof config.summary === 'string') {
            fs.writeFileSync(config.summary, JSON.stringify(jsonSummary, null, 2))
            log(`JSON summary file generated at ${config.summary}`, taskName)
        } else {
            set(jsonContent, 'localization.validation.summary', jsonSummary)
        }
    }

    fs.writeFileSync(config.output, JSON.stringify(jsonContent, null, 2))
    log(`JSON file generated at ${config.output}`, taskName)
}

function generateMarkdownReport(missingKeys, jsMaps, interfaceKeys) {
    let md = `# Localization validation\n\nValidation of localization files in \`${config.path}\` completed. The following keys are missing in the localization files:`
    md += '\n\n## Missing keys'

    for (const [lng, keys] of Object.entries(missingKeys)) {
        log(`${keys.length} missing keys in ${lng}`, taskName)
        md += `\n\n### ${lng}\n`
        if (keys.length > 0) {
            md += `**${keys.length}** missing keys found in [${lng}](${config.path}/${lng}.js):\n`
            for (const key of keys) {
                md += `- \`${key}\`\n`
            }
        } else {
            md += `_No missing keys found in [${lng}](${config.path}/${lng}.js)_\n`
        }
    }

    if (config.summary) {
        let summaryTable = '| Key | Value |\n'
        summaryTable += '| --- | ----- |\n'
        for (const key of interfaceKeys) {
            const values = []
            for (const [lng, jsMap] of Object.entries(jsMaps)) {
                values.push(`\`${lng}\`: _${jsMap[key]?.trim()}_`)
            }
            summaryTable += `| \`${key}\` | ${values.join('<br/> ')} |\n`
        }
        if (typeof config.summary === 'string') {
            fs.writeFileSync(config.summary, summaryTable)
            log(`Markdown summary file generated at ${config.summary}`, taskName)
        } else {
            md += '\n\n\n\n'
            md += '## Summary\n'
            md += summaryTable
        }
    }

    md += '\n\n---\n\n'
    fs.writeFileSync(config.output, md)
    log(`Markdown file generated at ${config.output}`, taskName)
}

// ── Main ──────────────────────────────────────────────────────────────

try {
    log('Validating localization files', taskName)

    const locPath = path.resolve(config.path)
    const dtsPath = path.resolve(config.path, config.dts)

    const resourceFiles = fs.readdirSync(locPath).filter((file) => file.endsWith('.js'))

    if (resourceFiles.length === 0) {
        log(`No resource files found in ${config.path}`, taskName)
        process.exit(0)
    }
    log(`Found ${resourceFiles.length} resource files (${resourceFiles.join(', ')})`, taskName)

    if (!fs.existsSync(dtsPath)) {
        log(`File ${dtsPath} not found`, taskName)
        process.exit(1)
    }

    const interfaceKeys = getInterfaceKeys(dtsPath, config.interface, config.filter)
    log(`Found ${interfaceKeys.length} keys in interface ${config.interface}`, taskName)

    const missingKeys = {}
    const jsMaps = {}

    for (const file of resourceFiles) {
        const [jsKeys, jsMap] = getJsKeyValues(path.join(locPath, file))
        const lng = file.replace('.js', '')
        missingKeys[lng] = interfaceKeys.filter((key) => !jsKeys.includes(key))
        jsMaps[lng] = jsMap
    }

    if (!config.output) {
        log('No output file specified. Skipping report generation.', taskName)
        process.exit(0)
    }

    if (config.output.endsWith('.json')) {
        generateJsonReport(missingKeys, jsMaps, interfaceKeys)
    } else if (config.output.endsWith('.md')) {
        generateMarkdownReport(missingKeys, jsMaps, interfaceKeys)
    }

    log('Validation completed', taskName)

    // Save last-run data for diff tracking
    fs.writeFileSync(lastRunFile, JSON.stringify(lastRunData, null, 2))
} catch (err) {
    console.error(colors.red(`[${taskName}] Error: ${err.message}`))
    process.exit(1)
}
