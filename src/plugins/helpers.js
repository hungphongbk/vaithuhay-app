import chunk from 'lodash/chunk'
import flatten from 'lodash/flatten'

export const promiseSerial = funcs =>
  funcs.reduce((promise, func) =>
      promise.then(result => func().then(Array.prototype.concat.bind(result))),
    Promise.resolve([]))

// each 'funcs' has type: () => Promise
// split 'funcs' into N 'chunk$1', chunk$1 = [...chunk$2: ()=>Promise]
// return = grouped array, so flatten it
export const promiseSerialChunk = (funcs, chunkCount, fn) => promiseSerial(
  chunk(funcs, chunkCount)
    .map(chunk$1 => () => new Promise(resolve => {
      Promise.all(chunk$1.map(chunk$2 => chunk$2()))
        .then(result => {
          fn(result);
          resolve()
        })
    }))
);
