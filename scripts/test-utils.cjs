const fs = require('fs')
const path = require('path')
const assert = require('assert')
const babel = require('@babel/core')
const compiler = require('vue-template-compiler')

function read(file) {
  return fs.readFileSync(path.join(__dirname, '..', file), 'utf8')
}

function load(source, imports) {
  const module = { exports: {} }
  const { code } = babel.transformSync(source, {
    babelrc: false,
    configFile: false,
    presets: [['@babel/preset-env', { targets: { node: 'current' } }]]
  })
  new Function('require', 'module', 'exports', code)(imports, module, module.exports)
  return module.exports
}

function loadFile(file, imports) {
  return load(read(file), imports)
}

function loadComponent(file, imports) {
  const { script, template } = compiler.parseComponent(read(file))
  assert.deepStrictEqual(compiler.compile(template.content).errors, [], file)
  return { component: load(script.content, imports).default, template }
}

module.exports = { loadFile, loadComponent }
