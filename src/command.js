import sketch from 'sketch/dom'
import settings from 'sketch/settings'
import * as UI from './ui.js'
import analytics from './analytics'
import { suffix, getSelection, getOptionList } from './utils'

var selected = sketch.getSelectedDocument().selectedLayers

export function pluginSettings() {
  try {
    let buttons = ['Save', 'Cancel', 'Defaults…']
    let info = 'Please set a truncate symbol.'
    let accessory = UI.textField(suffix)
    let response = UI.dialog(info, accessory, buttons)
    if (response === 1002) {
      settings.setSettingForKey('suffix', undefined)
      analytics('defaults', 1)
      return UI.message('Settings reset to defaults.', 'success')
    }
    if (response === 1000) {
      let result = accessory.stringValue()
      settings.setSettingForKey('suffix', result)
      analytics(result, 1)
      return UI.message('Settings saved.', 'success')
    }
  } catch (e) {
    console.log(e)
    return e
  }
}

export function truncateLastCharacters() {
  let message = 'How many characters do you want to be displayed?'
  return getInput(48, message, truncateLastCharactersFunction)
}

export function truncateLastWords() {
  let message = 'How many words do you want to be displayed?'
  return getInput(8, message, truncateLastWordsFunction)
}

export function truncateLastSpaces() {
  let message = 'How many characters do you want to be displayed?'
  return getInput(48, message, truncateLastSpacesFunction)
}

export function truncateFirstCharacters() {
  let message = 'How many characters do you want to be displayed?'
  return getInput(48, message, truncateFirstCharactersFunction)
}

export function truncateFirstWords() {
  let message = 'How many words do you want to be displayed?'
  return getInput(8, message, truncateFirstWordsFunction)
}

export function truncateFirstSpaces() {
  let message = 'How many characters do you want to be displayed?'
  return getInput(48, message, truncateFirstSpacesFunction)
}

export function truncateMiddleCharacters() {
  let message = 'How many characters do you want to be displayed?'
  return getInput(48, message, truncateMiddleCharactersFunction)
}

export function truncateMiddleWords() {
  let message = 'How many words do you want to be displayed?'
  return getInput(48, message, truncateMiddleWordsFunction)
}

export function truncateMiddleSpaces() {
  let message = 'How many characters do you want to be displayed?'
  return getInput(48, message, truncateMiddleSpacesFunction)
}

function getInput(preset, message, callbackFunction) {
  try {
    let selection = getSelection(selected)
    let buttons = ['Truncate', 'Cancel']
    let accessory = UI.textField(preset)
    let response = UI.dialog(message, accessory, buttons)
    let result = accessory.stringValue()
    if (response === 1000) {
      switch (true) {
        case !result.length() > 0:
          // User clicked "OK" without entering a value.
          // Return dialog until user enters anyting or clicks "Cancel".
          return getInput(preset, message, callbackFunction)
        case !Number(result) || result < 1:
          throw UI.dialog('Please enter a number 1 or more.')
        default:
          return truncateCommand(selection, callbackFunction, result)
      }
    }
  } catch (e) {
    console.log(e)
    return e
  }
}

function truncateCommand(selection, commandFunction, length) {
  let result
  switch (selection.type) {
    case sketch.Types.Text:
      result = truncateLayers(selection.layers, commandFunction, length)
      analytics('Text Layer', result)
      return UI.message(result + ' text layers truncated.', 'success')
    case sketch.Types.SymbolMaster:
      result = truncateSymbols(
        selection.layers[0].getAllInstances(),
        commandFunction,
        length
      )
      analytics('Symbol Master', result)
      return UI.message(
        result + ' overrides in ' + selection.length + ' symbols truncated.',
        'success'
      )
    case sketch.Types.SymbolInstance:
      result = truncateSymbols(selection.layers, commandFunction, length)
      analytics('Symbol Instance', result)
      return UI.message(
        result +
          ' overrides in ' +
          selection.layers.length +
          ' symbols truncated.',
        'success'
      )
    case sketch.Types.Override:
      result = truncateOverrides(selection.layers, commandFunction, length)
      analytics('Symbol Override', result)
      return UI.message(
        result +
          ' overrides in ' +
          selection.layers.length +
          ' symbols truncated.',
        'success'
      )
  }
}

function truncateLayers(layers, commandFunction, length) {
  layers.map(layer => {
    layer.text = commandFunction(layer.text, length, suffix)
  })
  return layers.length
}

function truncateSymbols(symbols, commandFunction, length) {
  let buttons = ['Truncate', 'Cancel', 'Truncate All']
  let info = 'Please select overrides to be truncated.'
  let overrides = symbols[0].overrides.filter(o => {
    return !o.isDefault && o.editable && o.property == 'stringValue'
  })
  if (overrides.length < 1) {
    analytics('No Overrides')
    throw UI.dialog('There are not any editable text overrides.')
  }
  let optionList = UI.optionList(getOptionList(symbols[0], overrides))
  let accessory = UI.scrollView(optionList.view)
  let response = UI.dialog(info, accessory, buttons)

  if (response === 1000 || response === 1002) {
    if (response === 1002) {
      optionList.options.map(option => option.setState(true))
    }
    if (optionList.getSelection().length == 0) {
      analytics('Truncate None')
      throw UI.message('Nothing truncated.')
    }
    let c = 0
    symbols.map(symbol => {
      let symbolOverrides = symbol.overrides.filter(o => {
        return !o.isDefault && o.editable && o.property == 'stringValue'
      })
      optionList.getSelection().map(i => {
        symbol.setOverrideValue(
          overrides[i],
          commandFunction(symbolOverrides[i].value, length, suffix)
        )
        c++
      })
    })
    return c
  }
  analytics('Cancelled')
  throw 'Cancelled'
}

function truncateOverrides(overrides, commandFunction, length) {
  let c = 0
  selected.layers.map(symbol => {
    for (let i = 0; i < overrides.length; i++) {
      let override = symbol.overrides.find(
        o =>
          overrides[i] == symbol.id + '#' + o.id && o.property == 'stringValue'
      )
      if (override) {
        symbol.setOverrideValue(
          override,
          commandFunction(override.value, length, suffix)
        )
        c++
      }
    }
  })
  return c
}

function removePunctationAtEnd(str) {
  return str.replace(/[.,/#!$%^&*;:{}=\-_`~()]$/g, '')
}

function removePunctationAtStart(str) {
  return str.replace(/^[.,/#!$%^&*;:{}=\-_`~()]/g, '')
}

function truncateLastCharactersFunction(text, length, suffix) {
  if (text.length < length) {
    return text
  } else {
    let str = text.substr(0, length - suffix.length).trimEnd()
    return `${removePunctationAtEnd(str)}${suffix}`
  }
}

function truncateLastWordsFunction(text, length, suffix) {
  let words = text.split(' ')
  if (words.length <= length) {
    return text
  } else {
    let str = words.splice(0, length).join(' ')
    return `${removePunctationAtEnd(str)}${suffix}`
  }
}

function truncateLastSpacesFunction(text, length, suffix) {
  let str
  switch (true) {
    case text.length < length:
      return text
    case text.split(' ')[0].length >= length - suffix.length:
      str = text.split(' ')[0]
      break
    default:
      str = text.substr(
        0,
        text.substr(0, length - suffix.length).lastIndexOf(' ')
      )
      break
  }
  return `${removePunctationAtEnd(str)}${suffix}`
}

function truncateFirstCharactersFunction(text, length, suffix) {
  if (text.length < length) {
    return text
  } else {
    let str = text.substr(text.length - length + suffix.length).trimStart()
    return `${suffix}${removePunctationAtStart(str)}`
  }
}

function truncateFirstWordsFunction(text, length, suffix) {
  let words = text.split(' ')
  if (words.length <= length) {
    return text
  } else {
    let str = words.splice(words.length - length).join(' ')
    return `${suffix}${removePunctationAtStart(str)}`
  }
}

function truncateFirstSpacesFunction(text, length, suffix) {
  let str
  switch (true) {
    case text.length < length:
      return text
    case text.substr(text.lastIndexOf(' ')).length >= length - suffix.length:
      str = text.substr(text.lastIndexOf(' '))
      break
    default:
      str = text
        .substr(text.length - length + suffix.length)
        .substr(text.substr(text.length - length + suffix.length).indexOf(' '))
      break
  }
  return `${suffix}${removePunctationAtStart(str.trimStart())}`
}

function truncateMiddleCharactersFunction(text, length, suffix) {
  if (text.length < length) {
    return text
  } else {
    let start = text
      .substr(0, Math.ceil((length - suffix.length) / 2))
      .trimEnd()
    let end = text
      .substr(text.length - Math.floor((length - suffix.length) / 2))
      .trimStart()
    return `${removePunctationAtEnd(start)}${suffix}${removePunctationAtStart(
      end
    )}`
  }
}

function truncateMiddleWordsFunction(text, length, suffix) {
  let words = text.split(' ')
  if (words.length <= length) {
    return text
  } else {
    let start = words.splice(0, Math.ceil(length / 2)).join(' ')
    let end = words.splice(words.length - Math.floor(length / 2)).join(' ')
    return `${removePunctationAtEnd(start)}${suffix}${removePunctationAtStart(
      end
    )}`
  }
}

function truncateMiddleSpacesFunction(text, length, suffix) {
  let start, end
  if (text.length < length || text.split(' ').length < 3) {
    return text
  }
  if (text.split(' ')[0].length >= Math.ceil((length - suffix.length) / 2)) {
    start = text.split(' ')[0]
  } else {
    start = text.substr(
      0,
      text.substr(0, Math.ceil((length - suffix.length) / 2)).lastIndexOf(' ')
    )
  }
  if (
    text.substr(text.lastIndexOf(' ')).length >=
    Math.floor((length - suffix.length) / 2)
  ) {
    end = text.substr(text.lastIndexOf(' ')).trimStart()
  } else {
    end = text
      .substr(text.length - Math.floor((length - suffix.length) / 2))
      .substr(
        text
          .substr(text.length - Math.floor((length - suffix.length) / 2))
          .indexOf(' ')
      )
      .trimStart()
  }
  return `${removePunctationAtEnd(start)}${suffix}${removePunctationAtStart(
    end
  )}`
}
