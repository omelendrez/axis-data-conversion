const readline = require('readline')

function formatConsole(msg) {
  const bold = '\033[1;97m'
  const reset = '\033[0m'
  const result = bold + msg + reset
  return result
}

const writePercent = (percent) => {
  readline.cursorTo(process.stdout, 0)
  process.stdout.write(`- Processing ... ${percent}%`)
}

const STATUS = {
  NEW_RECORD: 1,
  ADMIN_DONE: 2,
  FRONTDESK_DONE: 3,
  MEDIC_DONE: 4,
  TC_DONE: 5,
  ASSESMENT_DONE: 6,
  QAQC_DONE: 7,
  FINANCE_DONE: 8,
  MD_DONE: 9,
  CERTIFICATE_PRINT_DONE: 10,
  ID_PRINT_DONE: 11,
  COMPLETED: 12,
  CANCELLED: 13
}

module.exports = { formatConsole, writePercent, STATUS }
