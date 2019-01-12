import { isPromise } from '@universal/helpers'

const servicesContainer = new Map()

function get(serviceName) {
  return servicesContainer.get(serviceName)
}

function call(serviceName, callback) {
  const obj = callback(get(serviceName))
  if (isPromise(obj)) return obj
  else return Promise.resolve()
}
function set(serviceName, instance) {
  if (typeof get(serviceName) !== 'undefined')
    throw `"${serviceName}" service exists!`
  servicesContainer.set(serviceName, instance)
  console.log(`service "${serviceName}" has been successfully registered`)
}

const ServiceContainers = {
  call,
  get,
  set
}

export default ServiceContainers
