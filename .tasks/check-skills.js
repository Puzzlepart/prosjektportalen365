/**
 * @fileoverview Checks that `.claude/skills` is the only folder with agent skills.
 *
 * Claude Code reads project skills only from `.claude/skills`. GitHub Copilot (VS Code, Visual
 * Studio, JetBrains, Copilot CLI, cloud agent) reads `.claude/skills` as well as `.github/skills`
 * and `.agents/skills`. A skill in one of those two folders is therefore invisible to Claude Code,
 * and a copy of `.claude/skills` there shows every skill twice in Copilot and drifts.
 *
 * Copilot also holds `SKILL.md` to the Agent Skills specification (https://agentskills.io/specification),
 * which is stricter than Claude Code: `name` is required and must equal the folder name, and
 * `description` must have 1 to 1024 characters. Each skill is checked against those rules.
 *
 * Usage, from the repo root: `npm run check-skills`. Exits with 1 when a check fails.
 */
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const SOURCE = '.claude/skills'
const OTHER_FOLDERS = ['.github/skills', '.agents/skills']
// Finder metadata; ignored by the root .gitignore, so it never reaches git
const IGNORED_FILES = ['.DS_Store']
// Agent Skills specification: 1-64 lowercase letters and digits, single hyphens between them
const NAME_PATTERN = /^(?=.{1,64}$)[a-z0-9]+(-[a-z0-9]+)*$/
const MAX_DESCRIPTION = 1024

/**
 * Lists the files below a folder of the repo.
 *
 * @param {string} folder Folder relative to the repo root, with forward slashes
 * @returns {string[]} Paths relative to the folder, with forward slashes; empty when the folder is missing
 */
function listFiles(folder) {
    const start = path.join(root, ...folder.split('/'))
    if (!fs.existsSync(start)) return []
    const files = []
    const walk = (dir, prefix) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            if (IGNORED_FILES.includes(entry.name)) continue
            if (entry.isDirectory()) walk(path.join(dir, entry.name), `${prefix}${entry.name}/`)
            else files.push(`${prefix}${entry.name}`)
        }
    }
    walk(start, '')
    return files.sort()
}

/**
 * Reads the top-level fields of a `SKILL.md` frontmatter: plain, quoted and block (`|`, `>`) values.
 *
 * @param {string} text Content of the `SKILL.md`
 * @returns {Record<string, string> | null} The fields, or `null` when the file has no frontmatter
 */
function readFrontmatter(text) {
    const match = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(text)
    if (!match) return null
    const fields = {}
    const lines = match[1].split(/\r?\n/)
    for (let i = 0; i < lines.length; i++) {
        const field = /^([A-Za-z][\w-]*):(?:[ \t]+(.*))?$/.exec(lines[i])
        if (!field) continue
        let value = (field[2] || '').trim()
        const continued = []
        while (i + 1 < lines.length && /^(\s|$)/.test(lines[i + 1])) continued.push(lines[++i].trim())
        if (/^[|>][+-]?\d?[+-]?$/.test(value)) {
            value = value[0] === '|' ? continued.join('\n').trim() : continued.filter(Boolean).join(' ')
        } else {
            value = [value, ...continued.filter(Boolean)].join(' ')
            const single = /^'((?:[^']|'')*)'\s*(?:#.*)?$/.exec(value)
            const double = /^"((?:[^"\\]|\\.)*)"\s*(?:#.*)?$/.exec(value)
            if (single) value = single[1].replace(/''/g, "'")
            else if (double) value = double[1].replace(/\\(.)/g, '$1')
            else value = value.replace(/\s+#.*$/, '')
        }
        fields[field[1]] = value
    }
    return fields
}

/**
 * Checks one skill folder in `.claude/skills` against the rules both assistants share.
 *
 * @param {string} name Folder name of the skill
 * @returns {string[]} The problems found
 */
function checkSkill(name) {
    const file = `${SOURCE}/${name}/SKILL.md`
    const fullPath = path.join(root, ...file.split('/'))
    if (!fs.existsSync(fullPath)) return [`${SOURCE}/${name}: no SKILL.md, so neither assistant loads the skill`]
    const fields = readFrontmatter(fs.readFileSync(fullPath, 'utf8'))
    if (!fields) return [`${file}: no YAML frontmatter (a --- block at the top with name and description)`]
    const problems = []
    if (fields.name !== name) {
        problems.push(`${file}: name is ${fields.name ? `"${fields.name}"` : 'missing'}; Copilot requires it to equal the folder name "${name}"`)
    }
    if (!NAME_PATTERN.test(name)) {
        problems.push(`${file}: the folder name "${name}" must be 1-64 lowercase letters and digits with single hyphens between them`)
    }
    const length = [...(fields.description || '')].length
    if (length === 0) problems.push(`${file}: description is missing or empty`)
    else if (length > MAX_DESCRIPTION) {
        problems.push(`${file}: description has ${length} characters; Copilot accepts at most ${MAX_DESCRIPTION}`)
    }
    return problems
}

/**
 * Checks a folder that must not hold skills, and sorts its files by how they relate to `.claude/skills`.
 *
 * @param {string} folder Folder relative to the repo root
 * @returns {string[]} The problems found
 */
function checkOtherFolder(folder) {
    const files = listFiles(folder)
    if (files.length === 0) return []
    const identical = []
    const different = []
    const onlyHere = []
    for (const file of files) {
        const own = path.join(root, ...folder.split('/'), ...file.split('/'))
        const source = path.join(root, ...SOURCE.split('/'), ...file.split('/'))
        if (!fs.existsSync(source) || !fs.statSync(source).isFile()) onlyHere.push(file)
        else if (fs.readFileSync(own).equals(fs.readFileSync(source))) identical.push(file)
        else different.push(file)
    }
    return [
        [
            `${folder} holds ${files.length} file(s). Skills live only in ${SOURCE}: Claude Code reads nothing else,`,
            `and GitHub Copilot reads ${SOURCE} too, so a copy in ${folder} shows every skill twice in Copilot and drifts.`,
            `  identical to ${SOURCE}: ${identical.length}`,
            `  different from ${SOURCE} (compare before deleting): ${different.length}`,
            ...different.map((file) => `    ${file}`),
            `  only in ${folder} (move to ${SOURCE}, then delete): ${onlyHere.length}`,
            ...onlyHere.map((file) => `    ${file}`),
            `Delete ${folder} once nothing in it is missing from ${SOURCE}.`
        ].join('\n')
    ]
}

/**
 * Main entry point for the task
 */
function main() {
    const sourcePath = path.join(root, ...SOURCE.split('/'))
    if (!fs.existsSync(sourcePath)) throw new Error(`${SOURCE} does not exist`)
    const skills = fs
        .readdirSync(sourcePath)
        .filter((name) => fs.statSync(path.join(sourcePath, name)).isDirectory())
        .sort()
    const problems = [...skills.flatMap(checkSkill), ...OTHER_FOLDERS.flatMap(checkOtherFolder)]
    if (problems.length > 0) {
        console.error(`check-skills: ${problems.length} problem(s)\n`)
        console.error(problems.join('\n\n'))
        process.exitCode = 1
        return
    }
    console.log(`check-skills: OK, ${skills.length} skills in ${SOURCE} (${skills.join(', ')}); no ${OTHER_FOLDERS.join(' or ')}`)
}

try {
    main()
} catch (error) {
    console.error(`check-skills: ${error.message}`)
    process.exitCode = 1
}
