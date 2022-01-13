/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable prefer-const */
'use strict'
const path = require('path')
const gulp = require('gulp')
const build = require('@microsoft/sp-build-web')
const tsConfig = require('./tsconfig.json')
const WebpackBar = require('webpackbar')
const os = require('os')
const log = require('@microsoft/gulp-core-build').log
const colors = require('colors')
let buildConfig = {
    parallel: os.cpus().length - 1,
    bundleAnalyzerEnabled: false
}
build.addSuppression('Warning - [sass] The local CSS class \'ms-Grid\' is not camelCase and will not be type-safe.')
build.addSuppression('Warning - [sass] The local CSS class \'-webkit-filter\' is not camelCase and will not be type-safe.')

try {
    buildConfig = require('./build.config.json')
} catch (error) {
    log(`Missing '${colors.cyan('./build.config.json')}'. Using defaults...`)
}

build.configureWebpack.mergeConfig({
    additionalConfiguration: (webpack) => {
        let { paths, outDir } = JSON.parse(JSON.stringify(tsConfig.compilerOptions).replace(/\/\*"/gm, '"'))
        webpack.resolve.alias = Object.keys(paths).reduce((alias, key) => {
            let _path = path.join(__dirname, outDir, paths[key][0])
            log(`[${colors.cyan('configure-webpack')}] Added alias ${colors.cyan(key)} pointing to ${colors.cyan(_path)}...`)
            return { ...alias, [key]: _path }
        }, webpack.resolve.alias)
        webpack.externals = Object.assign(webpack.externals || {}, { 'XLSX': 'XLSX' })
        webpack.plugins = webpack.plugins || []
        log(`[${colors.cyan('configure-webpack')}] Adding plugin ${colors.cyan('WebpackBar')}...`)
        webpack.plugins.push(new WebpackBar())
        if (buildConfig.bundleAnalyzerEnabled) {
            log(`[${colors.cyan('configure-webpack')}] Adding plugin ${colors.cyan('BundleAnalyzerPlugin')}...`)
            webpack.plugins.push(new BundleAnalyzerPlugin())
        }
        if (webpack.optimization && webpack.optimization.minimizer) {
            log(`[${colors.cyan('configure-webpack')}] Setting ${colors.cyan('minimizer')} to run ${colors.cyan(buildConfig.parallel)} processes in parallel and enabling cache...`)
            webpack.optimization.minimizer[0].options.parallel = buildConfig.parallel
            webpack.optimization.minimizer[0].options.cache = true
        }
        return webpack
    }
})

build.tslintCmd.enabled = false

build.initialize(gulp)
