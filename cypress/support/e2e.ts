// Cypress support file

// Add custom commands here if needed

// Fail test on console error (optional)
Cypress.on('window:before:load', (win) => {
  const origError = win.console.error
  win.console.error = (...args) => {
    origError.apply(win.console, args)
    // You can toggle this to true to fail on any console error
    // throw new Error('Console error: ' + args.join(' '))
  }
})
