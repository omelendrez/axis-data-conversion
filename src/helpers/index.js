const readline = require('readline')

function formatConsole(msg) {
  const bold = '\033[1;97m'
  const reset = '\033[0m'
  const result = bold + msg + reset
  return result
}

function writePercent(p) {
  readline.cursorTo(process.stdout, 0)
  process.stdout.write(`- Processing ... ${p}%`)
}

module.exports = { formatConsole, writePercent }
