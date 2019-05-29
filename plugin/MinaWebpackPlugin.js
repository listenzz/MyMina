const SingleEntryPlugin = require("webpack/lib/SingleEntryPlugin");
const MultiEntryPlugin = require("webpack/lib/MultiEntryPlugin");
const path = require("path");
const fs = require("fs");
const replaceExt = require("replace-ext");

const pluginName = "MinaWebpackPlugin";

function itemToPlugin(context, item, name) {
  if (Array.isArray(item)) {
    return new MultiEntryPlugin(context, item, name);
  }
  return new SingleEntryPlugin(context, item, name);
}

function existingEntry(entry) {
  const extensions = [".ts", ".js"];
  for (const ext of extensions) {
    const file = replaceExt(entry, ext);
    if (fs.existsSync(file)) {
      return file;
    }
  }
  return null;
}

function entryToItems(items = [], context, entry) {
  entry = path.resolve(context, entry);
  console.log(entry);
  if (!items.includes(entry)) {
    items.push(entry);
  }

  const configFile = replaceExt(entry, ".json");
  const content = fs.readFileSync(configFile, "utf8");
  const config = JSON.parse(content);
  console.log(config);
  ["pages"].forEach(key => {
    const requests = config[key];
    if (Array.isArray(requests)) {
      requests.forEach(request => {
        request = path.resolve(context, request);
        request = existingEntry(request);
        if (request != null) {
          items.push(request);
        }
      });
    }
  });
}

function applyEntry(compiler, done) {
  const { context, entry } = compiler.options;
  const items = [];
  entryToItems(items, context, entry);
  console.log(items);
  items.forEach(item => {
    item = path.relative(context, item);
    itemToPlugin(context, "./" + item, replaceExt(item, "")).apply(compiler);
  });

  if (done) {
    done();
  }
}

class MinaWebpackPlugin {
  apply(compiler) {
    compiler.hooks.entryOption.tap(pluginName, () => {
      applyEntry(compiler);
      return true;
    });

    compiler.hooks.watchRun.tap(pluginName, (compiler, done) => {
      applyEntry(compiler, done);
    });
  }
}

module.exports = MinaWebpackPlugin;
