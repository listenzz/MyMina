const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin')
const MultiEntryPlugin = require('webpack/lib/MultiEntryPlugin')
const path = require('path')
const fs = require('fs')
const replaceExt = require('replace-ext')
const ensurePosix = require('ensure-posix-path')
const requiredPath = require('required-path')

const pluginName = 'MinaWebpackPlugin'
const assetsChunkName = '__assets_chunk_name__'

function itemToPlugin(context, item, name) {
  if (Array.isArray(item)) {
    return new MultiEntryPlugin(context, item, name)
  }
  return new SingleEntryPlugin(context, item, name)
}

function inflateEntryResources(resources = [], context, entry) {
  entry = path.resolve(context, replaceExt(entry, ''))
  if (!resources.includes(entry)) {
    resources.push(entry)
  }

  const configFile = replaceExt(entry, '.json')
  const content = fs.readFileSync(configFile, 'utf8')
  const config = JSON.parse(content)

  ;['pages', 'usingComponents'].forEach(key => {
    const requests = config[key]
    if (Array.isArray(requests)) {
      requests.forEach(request => {
        inflate(resources, context, request)
      })
    } else if (typeof requests === 'object') {
      Object.values(requests).forEach(request => {
        inflate(resources, context, request)
      })
    }
  })
}

function inflate(resources, context, request) {
  request = path.resolve(context, request)
  if (request != null && !resources.includes(request)) {
    resources.push(request)
    inflateEntryResources(resources, path.dirname(request), request)
  }
}

class MinaWebpackPlugin {
  constructor(options = {}) {
    this.scriptExtensions = options.scriptExtensions || ['.ts', '.js']
    this.assetExtensions = options.assetExtensions || []
    this.entryResources = []
  }

  existingScriptEntry(entry) {
    for (const ext of this.scriptExtensions) {
      const file = replaceExt(entry, ext)
      if (fs.existsSync(file)) {
        return file
      }
    }
    return null
  }

  scriptEntryToItems() {
    const items = []
    this.entryResources.forEach(res => {
      const file = this.existingScriptEntry(res)
      if (file) {
        items.push(file)
      }
    })
    return items
  }

  assetEntryToItems() {
    const items = []
    this.entryResources.forEach(res => {
      this.assetExtensions.forEach(ext => {
        const file = replaceExt(res, ext)
        if (fs.existsSync(file)) {
          items.push(file)
        }
      })
    })
    return items
  }

  applyEntry(compiler, done) {
    const { context } = compiler.options

    const scriptItems = this.scriptEntryToItems()
    console.log('-----------------------------------------------')
    console.log(scriptItems)
    scriptItems
      .map(item => requiredPath(ensurePosix(path.relative(context, item))))
      .forEach(item => {
        itemToPlugin(context, item, replaceExt(item, '')).apply(compiler)
      })

    const assetItems = this.assetEntryToItems()
    console.log(assetItems)
    assetItems.map(item => requiredPath(ensurePosix(path.relative(context, item))))
    itemToPlugin(context, assetItems, assetsChunkName).apply(compiler)

    if (done) {
      done()
    }
  }

  apply(compiler) {
    const { context, entry } = compiler.options
    this.entryResources.length = 0
    inflateEntryResources(this.entryResources, context, entry)

    compiler.hooks.entryOption.tap(pluginName, () => {
      this.applyEntry(compiler)
      return true
    })

    compiler.hooks.watchRun.tap(pluginName, (compiler, done) => {
      this.applyEntry(compiler, done)
    })

    compiler.hooks.compilation.tap(pluginName, compilation => {
      compilation.hooks.beforeChunkAssets.tap(pluginName, () => {
        const assetsChunkIndex = compilation.chunks.findIndex(({ name }) => name === assetsChunkName)
        if (assetsChunkIndex > -1) {
          compilation.chunks.splice(assetsChunkIndex, 1)
        }
      })
    })
  }
}

module.exports = MinaWebpackPlugin
