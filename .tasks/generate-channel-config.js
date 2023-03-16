/**
 * @fileoverview Generates channel config for the current channel
 */
const globMod = require('glob')
const util = require('util')
const glob = util.promisify(globMod)
const path = require('path')
const fs = require('fs')
const { v4: uuidv4 } = require('uuid');
const argv = require('yargs').argv

// Default channel name
const default_channel_name = 'main'

// Get the channel name from the command line
const name = argv._[0] ?? default_channel_name

/**
 * Get file content for the given file path in JSON format
 * 
 * @param {*} file File path 
 * @returns File contents as JSON
 */
function getFileContent(file) {
    const fileContent = fs.readFileSync(path.resolve(__dirname, "..", file), 'UTF-8')
    const fileContentJson = JSON.parse(fileContent)
    return fileContentJson
}

/**
 * Save the channel config to a file in the /channels folder
 * 
 * @param {*} channel_config Channel config object
 * @param {*} filePath Path to the file to save the file to
 */
function saveToFile(channel_config, filePath) {
    fs.writeFileSync(path.resolve(__dirname, "..", filePath), JSON.stringify(channel_config, null, 2), { encoding: 'utf8', overwrite: true })
}

let channel_config = {
    name,
    spfx: {
        solutions: {}
    }
}
let replace_map_config = {

}

/**
 * Main entry point for the task. If the --replaceMap flag is set, the task will only generate the replace map config file,
 * and will not generate the channel config file. This is useful when you want to update the replace map config file only.
 */
const _ = async () => {
    await addSpfxComponents()
    saveToFile(replace_map_config, '.channel-replace-map.json')
    console.log('Replace map config file generated at .channel-replace-map.json')
    if (!argv.replaceMap) {
        saveToFile(channel_config, `./channels/${channel_config.name}.json`)
        console.log(`Channel config file generated for channel '${channel_config.name}'`)
    }
}

_()

/**
 * Add SPFx components to the channel config object and replace map config object.
 */
async function addSpfxComponents() {
    const isDefaultChannel = channel_config.name === default_channel_name
    let packageSolutionFiles = await glob('SharePointFramework/*/config/package-solution.json')
    for (let i = 0; i < packageSolutionFiles.length; i++) {
        let pkgSolutionContent = getFileContent(packageSolutionFiles[i])
        const [, solution] = packageSolutionFiles[i].split('/')
        const solution_id = isDefaultChannel ? pkgSolutionContent.solution.id : uuidv4()
        const solution_name = isDefaultChannel ? pkgSolutionContent.solution.name : `${pkgSolutionContent.solution.name} - ${channel_config.name}`
        const solution_zipped_package = isDefaultChannel ? pkgSolutionContent.paths.zippedPackage : `${pkgSolutionContent.paths.zippedPackage.replace('.sppkg', '')}-${channel_config.name}.sppkg`
        channel_config.spfx.solutions[solution] = channel_config.spfx.solutions[solution] || {}
        channel_config.spfx.solutions[solution].id = solution_id
        channel_config.spfx.solutions[solution].name = solution_name
        channel_config.spfx.solutions[solution].zippedPackage = solution_zipped_package
        channel_config.spfx.solutions[solution].components = {}
    }

    let manifestFiles = await glob('SharePointFramework/*/src/**/manifest.json')
    for (let i = 0; i < manifestFiles.length; i++) {
        let manifestContent = getFileContent(manifestFiles[i])

        // Get the solution name from the manifest file path
        const [, solution] = manifestFiles[i].split('/')

        // If the channel is the default channel, use the component ID from the manifest, otherwise generate a new one
        // using the UUID v4 generator. This is to ensure that the component ID is the same for the default channel.
        const component_id = isDefaultChannel ? manifestContent.id : uuidv4()
        channel_config.spfx.solutions[solution].components[manifestContent.alias] = component_id
        replace_map_config[component_id] = `ControlId_${manifestContent.alias}`
    }
}
