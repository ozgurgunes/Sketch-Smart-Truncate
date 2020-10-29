import sketch from 'sketch/dom'
import { errorMessage, alert, textField } from '@ozgurgunes/sketch-plugin-ui'
import analytics from '@ozgurgunes/sketch-plugin-analytics'

const truncationTypes = {
  characters: {
    dialogMessage: 'How many characters do you want to be displayed?',
    presetLength: 48
  },
  words: {
    dialogMessage: 'How many words do you want to be displayed?',
    presetLength: 8
  },
  spaces: {
    dialogMessage:
      'How many characters do you want to be displayed at maximum?',
    presetLength: 48
  }
}

export function getSelection() {
  let selected = sketch.getSelectedDocument().selectedLayers
  let overrides = getSelectedOverrides()
  switch (true) {
    case !selected.layers[0] && !overrides.length:
      analytics('No Selection')
      return errorMessage(
        'Please select a symbol master, symbols or text layers.'
      )
    case overrides.length > 0:
      return {
        type: sketch.Types.Override,
        layers: selected.layers,
        overrides: overrides
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
        return alert('Selected symbols master must be same.').runModal()
      }
      analytics('No Text Layers')
      return errorMessage(
        'Please select a symbol master, symbols or text layers.'
      )
    default:
      return {
        type: sketch.Types.Text,
        layers: selected.layers.filter(layer => layer.type == sketch.Types.Text)
      }
  }
}

function getSelectedOverrides() {
  return sketch
    .getSelectedDocument()
    .sketchObject.documentData()
    .selectedOverrides()
}

function hasTextLayer(selected) {
  return selected.layers.some(layer => layer.type == sketch.Types.Text)
}

function isSymbolMaster(selected) {
  return (
    selected.length == 1 && selected.layers[0].type == sketch.Types.SymbolMaster
  )
}

function isAllSymbol(selected) {
  return selected.layers.every(item => item.type == sketch.Types.SymbolInstance)
}

function isAllSameSymbol(selected) {
  return selected.layers.every(
    item =>
      item.type == sketch.Types.SymbolInstance &&
      item.master.id == selected.layers[0].master.id
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

export function getInput(commandFunction) {
  let truncationType
  switch (true) {
    case commandFunction.name.endsWith('CharactersFunction'):
      truncationType = 'characters'
      break
    case commandFunction.name.endsWith('WordsFunction'):
      truncationType = 'words'
      break
    case commandFunction.name.endsWith('SpacesFunction'):
      truncationType = 'spaces'
      break
  }
  let buttons = ['Truncate', 'Cancel']
  let message = truncationTypes[truncationType].dialogMessage
  let accessory = textField(truncationTypes[truncationType].presetLength)
  let response = alert(message, buttons, accessory).runModal()
  let result = accessory.stringValue()
  if (response === 1000) {
    switch (true) {
      case !result.length() > 0:
        // User clicked "OK" without entering a value.
        // Return dialog until user enters anyting or clicks "Cancel".
        return getInput(commandFunction)
      case !Number(result) || result < 1:
        return alert('Please enter a number 1 or more.').runModal()
      default:
        return result
    }
  }
}
