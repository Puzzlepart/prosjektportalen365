/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */
'use strict'
const fs = require('fs')
const path = require('path')
const find = require('find')
const gulp = require('gulp')
const build = require('@microsoft/sp-build-web')
const tsConfig = require('./tsconfig.json')
const argv = require('yargs').argv
const log = require('@microsoft/gulp-core-build').log
const colors = require('colors')

build.addSuppression('Warning - [sass] The local CSS class \'ms-Grid\' is not camelCase and will not be type-safe.')
build.addSuppression('Warning - [sass] The local CSS class \'-webkit-filter\' is not camelCase and will not be type-safe.')


gulp.task('setHiddenToolbox', (done) => {
  const skipAliases = ['RiskMatrixWebPart', 'ProjectNewsWebPart']
  find.file(/\manifest.json$/, path.join(__dirname, 'src'), (files) => {
    for (let i = 0; i < files.length; i++) {
      let manifest = require(files[i])
      if (skipAliases.indexOf(manifest.alias) !== -1) {
        log(`[${colors.cyan('setHiddenToolbox')}] Skipping ${colors.cyan('hiddenFromToolbox')} for ${colors.cyan(manifest.alias)}...`)
      } else if (manifest.hiddenFromToolbox !== !!argv.ship) {
        log(`[${colors.cyan('setHiddenToolbox')}] Setting ${colors.cyan('hiddenFromToolbox')} to ${colors.cyan(!!argv.ship)} for ${colors.cyan(manifest.alias)}...`)
        manifest.hiddenFromToolbox = !!argv.ship
        fs.writeFile(files[i], JSON.stringify(manifest, null, 4), (_error) => { /* handle error */ })
      }
    }
    done()
  })
})

build.configureWebpack.mergeConfig({
    additionalConfiguration: (webpack) => {
        let { paths, outDir } = JSON.parse(JSON.stringify(tsConfig.compilerOptions).replace(/\/\*"/gm, '"'))
        webpack.resolve.alias = Object.keys(paths).reduce((alias, key) => {
            let _path = path.join(__dirname, outDir, paths[key][0])
            return { ...alias, [key]: _path }
        }, webpack.resolve.alias)
        webpack.externals = Object.assign(webpack.externals || {}, { 'XLSX': 'XLSX' })
        return webpack
    }
})

build.tslintCmd.enabled = false
build.lintCmd.enabled = false

build.initialize(gulp)
