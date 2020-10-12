import UI from 'sketch/ui'

export function message(message, status) {
  let emoji = ''
  switch (status) {
    case 'error':
      emoji = '⚠️   '
      break
    case 'success':
      emoji = '✅   '
      break
  }
  UI.message(emoji + context.command.name() + ': ' + message)
}

export function dialog(info, accessory, buttons, message) {
  buttons = buttons || ['OK']
  message = message || context.command.name()
  var alert = NSAlert.alloc().init()
  alert.setMessageText(message)
  alert.setInformativeText(info)
  buttons.map(button => alert.addButtonWithTitle(button))
  if (context.plugin.alertIcon()) {
    alert.icon = context.plugin.alertIcon()
  }
  if (accessory) {
    alert.setAccessoryView(accessory)
    if (!accessory.isMemberOfClass(NSTextView)) {
      alert.window().setInitialFirstResponder(accessory)
    }
  }
  return alert.runModal()
}

export function textField(initial) {
  let accessory = NSTextField.alloc().initWithFrame(NSMakeRect(0, 0, 240, 25))
  accessory.setStringValue(initial || '')
  return accessory
}

export function scrollView(view) {
  let accessory = NSView.alloc().initWithFrame(NSMakeRect(0, 0, 300, 120))
  let scrollView = NSScrollView.alloc().initWithFrame(
    NSMakeRect(0, 0, 300, 120)
  )
  scrollView.setHasVerticalScroller(true)
  scrollView.setHasHorizontalScroller(false)
  scrollView.setDocumentView(view)
  accessory.addSubview(scrollView)
  return accessory
}

export function optionList(items) {
  let listView = NSView.alloc().initWithFrame(
    NSMakeRect(0, 0, 300, items.length * 24 + 10)
  )
  let options = []
  items.map((item, i) => {
    options[i] = NSButton.alloc().initWithFrame(
      NSMakeRect(5, 5 + i * 24, 290, 20)
    )
    options[i].setButtonType(NSSwitchButton)
    options[i].setTitle(item)
    options[i].setState(false)
    listView.addSubview(options[i])
    listView.setFlipped(true)
  })
  return {
    options: options,
    view: listView,
    getSelection: () => {
      let selection = []
      options.map((option, i) => {
        if (option.state()) {
          selection.push(i)
        }
      })
      return selection
    }
  }
}
