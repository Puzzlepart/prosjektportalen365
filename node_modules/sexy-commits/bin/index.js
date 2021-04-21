#!/usr/bin/env node
"use strict"
const inquirer = require('inquirer')
inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'))
const util = require('util')
const { cyan, white, red } = require('chalk')
const log = console.log
const fs = require('fs')
const path = require('path')
const packageJson = require(process.env.PWD + '/package.json')
const { gitmoji: default_config } = require('./default_config.json')
const child_process = require('child_process')
const exec = util.promisify(child_process.exec)
const writeFileAsync = util.promisify(fs.writeFile)
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv

/**
 * Parse args using `argv`
 * 
 * @param gitmoji - Gitmoji config
 * 
 * @returns `add_pattern`, `commit_type` and `message`
 */
function parseArgs(gitmoji) {
    try {
        const types = Object.keys(gitmoji)
        const [
            add_pattern,
            commit_type,
            ...message_
        ] = argv._
        const message = message_.join(' ')
        if (!commit_type || types.indexOf(commit_type) !== -1) {
            return {
                add_pattern,
                commit_type,
                message
            }
        } else {
            const [_commit_type] = types.filter(key => {
                const [, , alias] = gitmoji[key]
                return alias && alias.length && !!(alias.indexOf(commit_type) !== -1)
            })
            if (!_commit_type) {
                log(cyan.yellow(`Commit type ${cyan(commit_type)} not found in your ${cyan('gitmoji')} config 😞`))
                process.exit(0)
            }
            return {
                add_pattern,
                commit_type: _commit_type,
                message
            }
        }
    } catch {
        log(cyan.yellow('We couldn\'t parse your arguments 😞'))
        return {}
    }
}

/**
 * Commit changes using arguments and prompts
 */
async function commit_changes() {
    let { gitmoji } = packageJson
    if (!gitmoji) {
        const { add_defaults } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'add_defaults',
                message: `You don\'t have ${cyan('gitmoji')} config in your package.json. Add defaults? 🤝`,
                default: true
            }
        ])
        if (!add_defaults) {
            process.exit(0)
        }
        const newPackageJson = {
            ...packageJson,
            gitmoji: default_config
        }
        await writeFileAsync(
            path.resolve(process.env.PWD, 'package.json'),
            JSON.stringify(newPackageJson, null, 2)
        )
        gitmoji = default_config
    }
    const types = Object.keys(gitmoji)
    const args = parseArgs(gitmoji)
    const prompts = await inquirer.prompt([
        {
            type: 'input',
            name: 'add_pattern',
            message: 'What changes do you want to include?',
            default: 'all',
            when: !args.add_pattern
        },
        {
            type: 'autocomplete',
            name: 'commit_type',
            message: 'What did you do?',
            source: async (_a, input) => {
                return types
                    .filter(
                        (type) =>
                            type.toLowerCase().indexOf((input || '').toLowerCase()) !== -1
                    )
                    .map((type) => ({
                        value: type,
                        name: gitmoji[type].join('\t')
                    }))
            },
            when: !args.commit_type
        },
        {
            type: 'input',
            name: 'message',
            message: 'A short summary of what you changed:',
            when: !args.message
        },
        {
            type: 'confirm',
            name: 'push',
            message: 'Do you want to push the changes right away?',
            default: true
        }
    ])
    const input = Object.assign(args, prompts)
    let commit_message = `${input.commit_type}: ${input.message.toLowerCase()}`
    try {
        if (input.add_pattern === 'all') await exec('git add --all')
        else await exec(`git add "*${input.add_pattern}*"`)
        if (gitmoji[input.commit_type]) {
            commit_message += ` ${gitmoji[input.commit_type][0]}`
        }
        await exec(`git commit -m "${commit_message}" --no-verify`)
        if (input.push) {
            await exec('git pull')
            await exec('git push')
        }
        log(cyan(`\nSuccesfully commited changes with message:\n\n${white(commit_message)}\n`))
    } catch (error) {
        log(red('An error occured commiting your changes.'))
    } finally {
        process.exit(0)
    }
}

commit_changes()