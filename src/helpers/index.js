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
  NEW: 1,
  ADMIN_DONE: 2,
  FRONTDESK_DONE: 3,
  MEDICAL_DONE: 4,
  TRAINING_COORDINATOR_DONE: 5,
  ACCOUNTS_DONE: 6,
  QA_DONE: 7,
  MD_DONE: 8,
  CERT_PRINT_DONE: 9,
  ID_CARD_PRINT_DONE: 10,
  COMPLETED: 11,
  CANCELLED: 12,
  REJECTED: 13
}

module.exports = { formatConsole, writePercent, STATUS }
