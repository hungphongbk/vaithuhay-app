<style lang="scss" scoped>
  @import "./header.scss";

  .bold {
    font-weight: 700;
  }
</style>
<template lang="pug" src="./page__AboutUs.pug"></template>
<script>
  import Upload from '../components/upload-img.vue'

  import {multiLang, d} from "../helpers/mixins"
  import {get, post} from '../plugins/jquery-ajax'
  import pick from 'lodash/pick'
  import extend from 'lodash/extend'
  import fill from 'lodash/fill'
  import {promiseSerial, defaultI18n} from '../plugins/helpers'

  const newSlide = () => ({
    image: d(() => ({
      url: "",
      thumbnails: []
    })),
    url: ""
  });
  const newClient = () => ({
    image: "",
    url: ""
  });
  const newAgency = () => ({
    title: d(() => ""),
    email: "",
    address: d(() => ""),
    phone: "",
    products: d(() => ""),
    image: {
      url: '',
      thumbnails: []
    }
  });

  export default {
    page: 'aboutUs',
    mixins: [multiLang],
    components: {Upload},
    data() {
      return {
        slides: [],
        aboutUs: d(() => []),
        mission: d(() => ({
          title: '',
          content: '',
          image: ''
        })),
        member: d(() => []),
        join: d(() => ''),
        clients: [],
        agencies: [],

        newSlide: newSlide(),
        slideMode: 'new',
        newClient,
        newAgency
      }
    },
    computed: {
      tabs() {
        const hash = this.$store.getters.hash;
        return hash.tab || '';
      }
    },
    methods: {
      addSlide() {
        if (this.slideMode === 'new') {
          this.slides.push(this.newSlide);
        } else this.slideMode = 'new';
        this.newSlide = newSlide();
      },
      addClient() {
        if (this.client.mode === 'new') {
          this.clients.push(this.client.new);
        } else this.client.mode = 'new';
        this.client.new = newClient();
      },
      addAgency() {
        if (this.agency.mode === 'new') {
          this.agencies.push(this.agency.new);
        } else this.agency.mode = 'new';
        this.agency.new = newAgency();
      },
      async get() {
        let self = this,
          {slides, aboutUs, mission, member, join, clients, agencies} = await get('/meta?key=aboutUs');
        //patch slides
        await promiseSerial(slides.map(item => () => new Promise(async resolve => {
          const [vi, en] = await Promise.all([
            self.patchImage(item.image.vi),
            self.patchImage(item.image.en)
          ]);
          item.image.vi = vi;
          item.image.en = en;
          resolve()
        })));
        this.slides = slides || [];

        //
        this.aboutUs = defaultI18n(aboutUs, () => fill(Array(3), {
          title: '',
          content: '',
          image: null
        }));

        mission = defaultI18n(mission, () => ({
          title: '',
          content: '',
          image: null
        }));
        if (!mission.en.image) mission.en.image = null;
        if (!mission.vi.image) mission.vi.image = null;
        this.mission = mission;

        //fix & patch member image
        const add = async obj => {
          obj.facebook = obj.facebook || "";
          obj.email = obj.email || "";
          obj.image = await self.patchImage(obj.image);
        };
        member = defaultI18n(member, () => fill(Array(3), {
          name: '',
          image: null,
          position: '',
          desc: ''
        }))
        member.en.forEach(add);
        member.vi.forEach(add);
        this.member = member;

        this.clients = clients;
        if (!clients)
          this.clients = [];

        if (agencies) {
          for (const i of agencies) {
            if (!i.image) {
              i.image = {
                url: '',
                thumbnails: []
              }
            }
          }
          this.agencies = agencies;
        }
        if (join) this.join = join;
      },
      async save() {
        await post('/meta?key=aboutUs', pick(this, ['slides', 'aboutUs', 'mission', 'member', 'join', 'clients', 'agencies']))
      }
    },
    async mounted() {
      await this.get();
    }
  }
</script>
