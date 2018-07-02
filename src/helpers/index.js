export {default as functions} from './functions';

export const retry = (fn, params, count) => new Promise(async (resolve, reject) => {
  while (--count >= 0) {
    try {
      const rs = await fn(...params);
      resolve(rs);
      break;
    } catch (e) {
    }
  }
  if (count < 0) resolve(null);
});
