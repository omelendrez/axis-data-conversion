function formatConsole(msg) {
  const bold = '\033[1;97m'
  const reset = '\033[0m'
  const result = bold + msg + reset
  return result
}

module.exports = { formatConsole }
