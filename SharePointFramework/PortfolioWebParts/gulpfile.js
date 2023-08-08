'use strict'
const path = require('path')
const gulp = require('gulp')
const build = require('@microsoft/sp-build-web')
const tsConfig = require('./tsconfig.json')


build.addSuppression(`Warning - [sass] The local CSS class 'ms-Grid' is not camelCase and will not be type-safe.`)
build.addSuppression(`Warning - [sass] The local CSS class '-webkit-filter' is not camelCase and will not be type-safe.`)

build.configureWebpack.mergeConfig({
    additionalConfiguration: (webpack) => {
        let { paths, outDir } = JSON.parse(JSON.stringify(tsConfig.compilerOptions).replace(/\/\*"/gm, '"'))
        webpack.resolve.alias = Object.keys(paths).reduce((alias, key) => {
            let _path = path.join(__dirname, outDir, paths[key][0])
            return { ...alias, [key]: _path }
        }, webpack.resolve.alias)
        webpack.externals = Object.assign(webpack.externals || {}, { 'XLSX': 'XLSX' })
        webpack.plugins = webpack.plugins || []
        return webpack
    }
})

build.tslintCmd.enabled = false
build.lintCmd.enabled = false

build.initialize(gulp)