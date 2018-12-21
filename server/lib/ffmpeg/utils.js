import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import errors from './errors'

/**
 * Exec the list of commands and call the callback function at the end of the process
 */
export function ffmpegExec(commands, settings, callback) {
  // Create final command line
  const finalCommand = commands.join(' ')
  // Create the timeoutId for stop the timeout at the end the process
  let timeoutID = null
  // Exec the command
  const process = exec(finalCommand, settings, (error, stdout, stderr) => {
    // Clear timeout if 'timeoutID' are setted
    if (timeoutID !== null) clearTimeout(timeoutID)
    // Call the callback function
    callback(error, stdout, stderr)
  })
  // Verify if the timeout are setting
  if (settings.timeout > 0) {
    // Set the timeout
    timeoutID = setTimeout(() => {
      process.kill()
    }, 100)
  }
}

/**
 * Check if object is empty
 */
export function isEmptyObj(obj) {
  // Scan all properties
  // Check if obj has a property
  for (const prop in obj)
    if (obj.hasOwnProperty(prop))
      // The object is not empty
      return false
  // The object is empty
  return true
}

/**
 * Merge obj1 into obj
 */
export function mergeObject(obj, obj1) {
  // Check if there are options set
  if (!module.exports.isEmptyObj(obj1)) {
    // Scan all settings
    for (const key in obj1) {
      // Check if the option is valid
      if (!obj.hasOwnProperty(key))
        throw errors.renderError('invalid_option_name', key)
      // Set new option value
      obj[key] = obj1[key]
    }
  }
}

/**
 * Calculate the duration in seconds from the string retrieved by the ffmpeg info
 */
export function durationToSeconds(duration) {
  const parts = duration.substr(0, 8).split(':')
  return (
    parseInt(parts[0], 10) * 3600 +
    parseInt(parts[1], 10) * 60 +
    parseInt(parts[2], 10)
  )
}

/**
 * Calculate the greatest common divisor
 */
export function gcd(a, b) {
  if (b === 0) return a
  return module.exports.gcd(b, a % b)
}

/**
 * Offers functionality similar to mkdir -p
 */
export function mkdir(dirpath, mode, callback, position) {
  // Split all directories
  let parts = path.normalize(dirpath).split('/')
  // If the first part is empty then remove this part
  if (parts[0] == '') parts = parts.slice(1)

  // Set the initial configuration
  mode = mode || 0x0777
  position = position || 0

  // Check se current position is greater than the list of folders
  if (position > parts.length) {
    // If isset the callback then it will be invoked
    if (callback) callback()
    // Exit and return a positive value
    return true
  }

  // Build the directory path
  const directory =
    (dirpath.charAt(0) == '/' ? '/' : '') +
    parts.slice(0, position + 1).join('/')

  // Check if directory exists
  if (fs.existsSync(directory)) {
    module.exports.mkdir(dirpath, mode, callback, position + 1)
  } else {
    if (fs.mkdirSync(directory, mode)) {
      // If isset the callback then it will be invoked
      if (callback) callback(errors.renderError('mkdir', directory))
      // Send the new exception
      throw errors.renderError('mkdir', directory)
    } else {
      module.exports.mkdir(dirpath, mode, callback, position + 1)
    }
  }
}

/**
 * Check if a value is present inside an array
 */
export function in_array(value, array) {
  // Scan all element
  // Check if value exists
  for (const i in array)
    if (array[i] == value)
      // Return the position of value
      return i
  // The value not exists
  return false
}

/**
 * Ensure command line parameters containing spaces don't break
 * e.g. (input file)
 */
export function addQuotes(filename) {
  // Add quotes
  if (filename[0] === "'" && filename[filename.length - 1] === "'")
    return filename
  return JSON.stringify(filename)
}
