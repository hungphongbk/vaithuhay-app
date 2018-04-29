import Vue from 'vue'
import {post} from '../plugins/jquery-ajax'

const $ev = new Vue();

export const multiLang = {
  data() {
    return {
      lang: 'vi'
    }
  },
  methods: {
    switchLang() {
      const self = this;
      self.lang === 'vi' ? (self.lang = 'en') : (self.lang = 'vi');
      $ev.$emit('lang', self.lang);
    }
  },
  mounted() {
    const self = this;
    window.addEventListener('keyup', (e) => {
      if (e.keyCode === 76 && e.shiftKey && e.ctrlKey) {
        self.switchLang();
      }
    })
  }
};
const wrap = obj => typeof obj === 'function' ? obj() : obj;

export const d = obj => {
  const tr = (obj.en && obj.vi) ? obj : {
    en: wrap(obj),
    vi: wrap(obj)
  };
  if (false)
    $ev.$on('lang', async lang => {
      if (lang === 'en') {
        tr.en = await post('/trans/obj', tr)
      }
    });
  return tr;
};