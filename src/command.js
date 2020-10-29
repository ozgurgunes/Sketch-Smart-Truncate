import sketch from 'sketch/dom'
import settings from 'sketch/settings'
import {
  showMessage,
  successMessage,
  alert,
  textField,
  scrollView,
  optionList
} from '@ozgurgunes/sketch-plugin-ui'
import analytics from '@ozgurgunes/sketch-plugin-analytics'
import { getSelection, getOptionList } from './utils'

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

const suffix = settings.settingForKey('suffix') || '…'

export function pluginSettings() {
  let buttons = ['Save', 'Cancel', 'Defaults…']
  let info = 'Please set a truncate symbol.'
  let accessory = textField(suffix)
  let response = alert(info, buttons, accessory).runModal()
  if (response === 1002) {
    settings.setSettingForKey('suffix', undefined)
    analytics('defaults', 1)
    successMessage('Settings reset to defaults.')
  }
  if (response === 1000) {
    let result = accessory.stringValue()
    settings.setSettingForKey('suffix', result)
    analytics(result, 1)
    successMessage('Settings saved.')
  }
}

export function truncateLastCharacters() {
  return truncateCommand(truncateLastCharactersFunction)
}

export function truncateLastWords() {
  return truncateCommand(truncateLastWordsFunction)
}

export function truncateLastSpaces() {
  return truncateCommand(truncateLastSpacesFunction)
}

export function truncateFirstCharacters() {
  return truncateCommand(truncateFirstCharactersFunction)
}

export function truncateFirstWords() {
  return truncateCommand(truncateFirstWordsFunction)
}

export function truncateFirstSpaces() {
  return truncateCommand(truncateFirstSpacesFunction)
}

export function truncateMiddleCharacters() {
  return truncateCommand(truncateMiddleCharactersFunction)
}

export function truncateMiddleWords() {
  return truncateCommand(truncateMiddleWordsFunction)
}

export function truncateMiddleSpaces() {
  return truncateCommand(truncateMiddleSpacesFunction)
}

function truncateCommand(commandFunction) {
  let selection = getSelection()
  if (!selection) return
  switch (selection.type) {
    // TEXT LAYERS
    case sketch.Types.Text:
      return truncateLayers(selection.layers, commandFunction)
    // SYMBOL MASTER
    case sketch.Types.SymbolMaster:
      return truncateSymbols(
        selection.layers[0].getAllInstances(),
        commandFunction,
        true
      )
    // SYMBOL INSTANCES
    case sketch.Types.SymbolInstance:
      return truncateSymbols(selection.layers, commandFunction)
    // OVERRIDES
    case sketch.Types.Override:
      return truncateOverrides(
        selection.layers,
        selection.overrides,
        commandFunction
      )
  }
}

export function getInput(commandFunction) {
  let truncationType
  switch (true) {
    case [
      truncateLastCharactersFunction,
      truncateMiddleCharactersFunction,
      truncateFirstCharactersFunction
    ].includes(commandFunction):
      truncationType = 'characters'
      break
    case [
      truncateLastWordsFunction,
      truncateMiddleWordsFunction,
      truncateFirstWordsFunction
    ].includes(commandFunction):
      truncationType = 'words'
      break
    case [
      truncateLastSpacesFunction,
      truncateMiddleSpacesFunction,
      truncateFirstSpacesFunction
    ].includes(commandFunction):
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

// TRUNCATE COMMANDS

function truncateLayers(layers, commandFunction) {
  let length = getInput(commandFunction)
  if (!length) return
  layers.map(layer => {
    layer.text = commandFunction(layer.text, length, suffix)
  })
  analytics('Text Layer', layers.length)
  return successMessage(layers.length + ' text layers truncated.')
}

function truncateSymbols(symbols, commandFunction, masterSelected) {
  let buttons = ['Truncate', 'Cancel', 'Truncate All']
  let info = 'Please select overrides to be truncated.'
  let overrides = symbols[0].overrides.filter(o => {
    return !o.isDefault && o.editable && o.property == 'stringValue'
  })
  if (overrides.length < 1) {
    analytics('No Overrides')
    return alert('There are not any editable text overrides.').runModal()
  }
  let overrideOptions = optionList(getOptionList(symbols[0], overrides))
  let accessory = scrollView(overrideOptions.view)
  let response = alert(info, buttons, accessory).runModal()
  if (!response || response === 1001) return
  if (response === 1002) {
    overrideOptions.options.map(option => option.setState(true))
  }
  if (overrideOptions.getSelection().length == 0) {
    analytics('Truncate None')
    return showMessage('Nothing truncated.')
  }
  let length = getInput(commandFunction)
  if (!length) return
  let c = 0
  symbols.map(symbol => {
    let symbolOverrides = symbol.overrides.filter(o => {
      return !o.isDefault && o.editable && o.property == 'stringValue'
    })
    overrideOptions.getSelection().map(i => {
      symbol.setOverrideValue(
        overrides[i],
        commandFunction(symbolOverrides[i].value, length, suffix)
      )
      c++
    })
  })
  if (masterSelected) {
    analytics('Symbol Master', c)
    return successMessage(
      c + ' overrides in ' + symbols.length + ' symbols truncated.'
    )
  } else {
    analytics('Symbol Instance', c)
    return successMessage(
      c + ' overrides in ' + symbols.length + ' symbols truncated.'
    )
  }
}

function truncateOverrides(layers, overrides, commandFunction) {
  let length = getInput(commandFunction)
  if (!length) return
  let c = 0
  layers.map(symbol => {
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
  analytics('Symbol Override', c)
  return successMessage(
    c + ' overrides in ' + layers.length + ' symbols truncated.'
  )
}

// COMMAND FUNCTIONS

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

// REMOVE PUNCTATIONS

function removePunctationAtEnd(str) {
  return str.replace(/[.,/#!$%^&*;:{}=\-_`~()]$/g, '')
}

function removePunctationAtStart(str) {
  return str.replace(/^[.,/#!$%^&*;:{}=\-_`~()]/g, '')
}
