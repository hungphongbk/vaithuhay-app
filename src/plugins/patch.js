import {post} from './jquery-ajax';
import store from '../store/index';

export async function patchImage(url, _options = {}) {
  const options = Object.assign((this ? this.$options : {}) || {}, _options),
    {page} = options,
    extractUrl = () => {
      const $url = (typeof url === 'object') ? url.url : url;
      return $url.length > 0 ? $url.slice($url.lastIndexOf('/') + 1) : $url;
    };
  if (page && store.state.appConfig.patchImage[page])
    return await post('/images/patch', {
      filename: extractUrl()
    });
  else return url;
}

export async function patchProduct() {

}

export default {
  methods: {
    patchImage,
    patchProduct
  }
};
