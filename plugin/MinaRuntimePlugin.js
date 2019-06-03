/*
 * forked from https://github.com/Cap32/wxapp-webpack-plugin/
 */
const fs = require('fs')
const path = require('path')
const ensurePosix = require('ensure-posix-path')
const { ConcatSource } = require('webpack-sources')
const requiredPath = require('required-path')

function isRuntimeExtracted(compilation) {
  return compilation.chunks.some(chunk => chunk.isOnlyInitial() && chunk.hasRuntime() && !chunk.hasEntryModule())
}

function script({ dependencies }) {
  return ';' + dependencies.map(file => `require('${requiredPath(file)}');`).join('')
}

module.exports = class MinaRuntimeWebpackPlugin {
  constructor(options = {}) {
    this.runtime = options.runtime || ''
  }

  apply(compiler) {
    compiler.hooks.compilation.tap('MinaRuntimePlugin', compilation => {
      for (let template of [
        //compilation.mainTemplate,
        compilation.chunkTemplate,
      ]) {
        template.hooks.renderWithEntry.tap('MinaRuntimePlugin', (source, entry) => {
          if (!isRuntimeExtracted(compilation)) {
            throw new Error(
              [
                'Please reuse the runtime chunk to avoid duplicate loading of javascript files.',
                "Simple solution: set `optimization.runtimeChunk` to `{ name: 'runtime.js' }` .",
                'Detail of `optimization.runtimeChunk`: https://webpack.js.org/configuration/optimization/#optimization-runtimechunk .',
              ].join('\n'),
            )
          }
          console.log('-----------------------------------------------')
          console.log(`entry name:${entry.name} entry id:${entry.id}`)

          if (!entry.hasEntryModule()) {
            return source
          }

          let dependencies = []

          entry.groupsIterable.forEach(group => {
            console.log(`group name:${group.name}`)
            group.chunks.forEach(chunk => {
              /**
               * assume output.filename is chunk.name here
               */
              let filename = ensurePosix(path.relative(path.dirname(entry.name), chunk.name))

              console.log(`chunk name:${chunk.name} chunk id:${chunk.id}`)

              if (chunk === entry || ~dependencies.indexOf(filename)) {
                return
              }
              dependencies.push(filename)
            })
          })
          console.log(`dependencies of ${entry.name}:`, dependencies)
          source = new ConcatSource(script({ dependencies }), source)
          return source
        })
      }

      compilation.mainTemplate.hooks.bootstrap.tap('MinaRuntimePlugin', (source, chunk) => {
        //console.log("bootstrap chunk name", chunk.name);
        //console.log(source);
        return source
      })
    })
  }
}
