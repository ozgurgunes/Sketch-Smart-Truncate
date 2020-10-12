import sketch from 'sketch/dom'
import settings from 'sketch/settings'
import analytics from './analytics'
import * as UI from './ui.js'

function getSuffix() {
  return settings.settingForKey('suffix') || '…'
}

export const suffix = getSuffix()

export function getSelection(selected) {
  let overrides = getSelectedOverrides()
  switch (true) {
    case !selected.layers[0] && !overrides.length:
      analytics('No Selection')
      throw UI.message(
        'Please select a symbol master, symbols or text layers.',
        'error'
      )
    case overrides.length > 0:
      return {
        type: sketch.Types.Override,
        layers: overrides
      }
    case isSymbolMaster(selected):
      return {
        type: sketch.Types.SymbolMaster,
        layers: selected.layers
      }
    case isAllSameSymbol(selected):
      return {
        type: sketch.Types.SymbolInstance,
        layers: selected.layers
      }
    case !hasTextLayer(selected):
      if (isAllSymbol(selected)) {
        analytics('Not Same Symbol')
        throw UI.dialog('Selected symbols master must be same.')
      }
      analytics('No Text Layers')
      throw UI.message(
        'Please select a symbol master, symbols or text layers.',
        'error'
      )
    default:
      return {
        type: sketch.Types.Text,
        layers: selected.layers.filter(
          layer => layer.type == sketch.Types.Text
        )
      }
  }
}

function getSelectedOverrides() {
  return context.document.documentData().selectedOverrides()
}

function hasTextLayer(selected) {
  return selected.layers.some(layer => layer.type == sketch.Types.Text)
}

function isSymbolMaster(selected) {
  return (
    selected.length == 1 &&
    selected.layers[0].type == sketch.Types.SymbolMaster
  )
}

function isAllSymbol(selected) {
  return selected.layers.every(
    item => item.type == sketch.Types.SymbolInstance
  )
}

function isAllSameSymbol(selected) {
  return (
    selected.layers[0].type == sketch.Types.SymbolInstance &&
    selected.layers.every(
      item => item.master.id == selected.layers[0].master.id
    )
  )
}

export function getOptionList(symbol, overrides) {
  return overrides.map(override => {
    let layers = override.path.split('/')
    let list = []
    layers.forEach((layer, i) => {
      list.push(
        symbol.overrides.find(symbolOverride => {
          return symbolOverride.path == layers.slice(0, i + 1).join('/')
        }).affectedLayer.name
      )
    })
    let path = list.join(' > ')
    if (path.length > 40) {
      path = path.slice(0, 18) + ' ... ' + path.slice(-18)
    }
    return path
  })
}
