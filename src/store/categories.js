import {get, post}     from '../plugins/jquery-ajax';
import flatten         from 'lodash/flatten';
import flattenDeep     from 'lodash/flattenDeep';
import chunk           from 'lodash/chunk';
import remove          from 'lodash/remove';
import {patchImage}    from '../plugins/patch';
import {promiseSerial} from "../plugins/helpers";

export default {
  namespaced: true,
  state() {
    return {
      categories: []
    };
  },
  getters: {
    current({categories}, {}, {route}) {
      const r = () => ({
        title: '',
        meta: {
          trans: {},
          slides: {list: []}
        }
      });
      if (route.name !== 'cat.detail') return r();
      return categories.find(c => c.id === route.params.id * 1) || r();
    }
  },
  mutations: {
    fetch(state, categories) {
      //refine category
      categories.forEach((cat, index) => {
        let slides = cat.meta.slides.list;
        remove(slides, ({image}) => {
          return typeof image.vi === "string"
        });
        categories[index].meta.slides.list = slides;
      });

      state.categories = categories;
    }
  },
  actions: {
    async fetch({commit}) {
      const categories = await get('/collections'),
        metaList = await Promise.all(categories.map(c => get(`/meta/collections/${c.id}`)));
      const anotherPromises = [];
      categories.forEach((c, i) => {
        const meta = {};
        if (!Array.isArray(metaList[i])) {
          console.log(`something unexpected with collection ${c.id}:${c.title}`);
          metaList[i] = [];
        }
        metaList[i].forEach(m => meta[m.key] = (()=>{
          try{
            return JSON.parse(m.value)
          } catch(e){
            console.error('error expected with JSON from '+m.key);
            return null;
          }
        })());

        //check & patch slides
        if (typeof meta.slides === 'undefined' || typeof meta.slides.list === 'undefined')
          meta.slides = {
            list: []
          };
        const patchOptions = {
          page: 'categories'
        };
        // push patch requests to queue and execute them later
        anotherPromises.push(...meta.slides.list.map(slide => () => new Promise(async resolve => {
          const [vi, en] = await Promise.all([
            patchImage(slide.image.vi, patchOptions),
            patchImage(slide.image.en, patchOptions)
          ]);
          slide.image.vi = vi;
          slide.image.en = en;
          resolve();
        })));

        //refine meta.settings value
        if (typeof meta.settings === 'undefined')
          meta.settings = {};
        meta.settings = Object.assign({}, {
          enable: true
        }, meta.settings);
        if (typeof meta.settings.enable === 'string')
          meta.settings.enable = (meta.settings.enable === 'true');
        c.meta = meta;
      });
      // await Promise.all(flattenDeep(anotherPromises));
      await promiseSerial(chunk(flattenDeep(anotherPromises), 4)
        .map(chunk$1 => () => Promise.all(chunk$1.map(chunk$2 => chunk$2()))));
      commit('fetch', categories);
    },
    async save({getters}) {
      const {id, meta} = getters.current;
      if (meta) {
        await Promise.all(Object.entries(meta).map(([key, value]) => post(`/collections/${id}/${key}`, value)));
      }
    },
    async saveAll({state}) {
      const promises = flatten(state.categories.map(cat => {
        const {id, meta} = cat;
        return Object.entries(meta).map(([key, value]) => post(`/collections/${id}/${key}`, value));
      }));
      await Promise.all(promises);
    }
  }
};
