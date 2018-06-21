import {Settings} from "../models";

async function _retrieveModel(namespace, key = null, lean = true) {
  if (process.env.NODE_ENV === 'development') {
    console.log('[component/settings] retrieve model with namespace:key=' + namespace + ':' + key);
  }
  const criteria = {namespace},
    findOne = key !== null;
  if (key) criteria.key = key;
  let data = await Settings.find(criteria).lean(lean).exec();
  if ((!lean) && findOne && (typeof data === 'undefined' || data === null || data.length === 0)) {
    data = new Settings({namespace, key});
    await data.save();
    return data;
  }
  return findOne ? data[0] : data;
}

/**
 *
 * @param {string} namespace
 * @param {string|null} key
 * @returns {Promise<{}>}
 */
async function get(namespace, key = null) {
  const data = await _retrieveModel(namespace, key),
    findOne = key !== null;

  if (typeof data === 'undefined' || data === null) return {}
  if (findOne) return data.value;
  else return data.map(item => item.value)
}

/**
 *
 * @param {string} namespace
 * @param {string} key
 * @param value
 * @returns {Promise<void>}
 */
async function set(namespace, key, value) {
  if (typeof key !== 'string') {
    throw 'Key must not be null'
  }
  try {
    const obj = await _retrieveModel(namespace, key, false);
    obj.value = value;
    await obj.save();
  } catch (e) {
    console.log(e.message);
    throw e;
  }
}

export default {
  get,
  set
};
