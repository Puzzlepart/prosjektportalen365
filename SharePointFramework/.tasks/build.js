/**
 * Build a channel-specific SPFx package
 *
 * Usage:
 *   node ../.tasks/build.js --channel <name>
 * *
 *   1. Generate `.generated-solution-config.json` from `channels/<name>.json`
 *   2. Spawn `modifySolutionFiles.js` to swap in the channel solution + manifest IDs
 *   3. Spawn `setBundleConfig.js` to honour `SERVE_BUNDLE_REGEX`, if set
 *   4. Run `gulp bundle --ship` and `gulp package-solution --ship`
 *   5. (always) Revert manifests + bundle config so the working tree is clean
 */
const argv = require('yargs').argv
const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')
const colors = require('colors/safe')
const { getFileContent, joinPath, log } = require('./util')
require('dotenv').config()

const channel = argv.channel || process.env.SERVE_CHANNEL
if (!channel) {
  log(`Missing required argument ${colors.red('--channel <name>')}`, 'build')
  process.exit(1)
}
process.env.SERVE_CHANNEL = channel

const solution = process.cwd().split(path.sep).pop()
const tasksDir = __dirname
const solutionConfigFile = joinPath(process.cwd(), 'config', '.generated-solution-config.json')

function run(cmd, args = []) {
  log(`${colors.cyan(cmd)} ${args.join(' ')}`, 'build')
  const result = spawnSync(cmd, args, { stdio: 'inherit', shell: true, env: process.env })
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} exited with code ${result.status}`)
  }
}

let preparedManifests = false
try {
  if (channel !== 'main') {
    log(`Preparing solution ${colors.cyan(solution)} for channel ${colors.magenta(channel)}`, 'build')
    const channelConfig = getFileContent(`../channels/${channel}.json`)
    const solutionConfig = channelConfig?.spfx?.solutions?.[solution]
    if (!solutionConfig) {
      log(
        `No config found for solution ${colors.cyan(solution)} in channel ${colors.magenta(channel)}`,
        'build'
      )
      process.exit(1)
    }
    fs.writeFileSync(solutionConfigFile, JSON.stringify(solutionConfig, null, 2), {
      encoding: 'utf8'
    })
    run('node', [joinPath(tasksDir, 'modifySolutionFiles.js')])
    preparedManifests = true
  }
  run('node', [joinPath(tasksDir, 'setBundleConfig.js')])

  run('gulp', ['bundle', '--ship'])
  run('gulp', ['package-solution', '--ship'])
} catch (err) {
  log(colors.red(err.message || String(err)), 'build')
  process.exitCode = 1
} finally {
  if (preparedManifests) {
    try {
      run('node', [joinPath(tasksDir, 'modifySolutionFiles.js'), '--revert'])
    } catch (err) {
      log(colors.red(`Reverting manifests failed: ${err.message}`), 'build')
    }
  }
  try {
    run('node', [joinPath(tasksDir, 'setBundleConfig.js'), '--revert'])
  } catch (err) {
    // setBundleConfig.js no-ops on revert when SERVE_BUNDLE_REGEX isn't set; ignore.
  }
}
