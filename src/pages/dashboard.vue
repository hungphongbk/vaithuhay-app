<style lang="scss" scoped>
  @import "./header.scss";
</style>
<template lang="pug">
  div
    div.clearfix.header
      h1.page-title Dashboard
    hr
    .card-columns
      dashboard-section(title="Vaithuhay.com development status")
        template(v-if="assetHash.value")
          p.card-text
            i.fa.fa-hashtag.mr-2
            | Mã phát triển:&nbsp;
            strong {{assetHash.value}}
          p.card-text
            i.fa.fa-clock-o.mr-2
            | Cập nhật lần cuối:&nbsp;
            strong {{assetHash.updatedAt | moment("from")}}
          hr
          p.card-text
            i.small Sử dụng mã phát triển để kiểm tra cache của vaithuhay.com bằng cách View HTML và tìm
          p
            .btn.btn-secondary(@click="updateHash") Cập nhật mã phát triển
</template>
<script>
  import {get, post} from '../plugins/jquery-ajax';
  import uuid from 'uuid/v4';

  export default {
    components: {
      DashboardSection: {
        functional: true,
        render(h, {props, children}) {
          return <div class="card">
            <h6 class="card-header">{props.title}</h6>
            <div class="card-body">
              {children}
            </div>
          </div>;
        }
      }
    },
    data() {
      return {
        assetHash: {
          value: null,
          updatedAt: null
        }
      };
    },
    methods: {
      async fetch() {
        const {value, updated_at} = await get('/meta?key=assetHash&raw=true');
        this.assetHash.value = value;
        this.assetHash.updatedAt = updated_at;
      },
      async updateHash() {
        const asset = {};
        for (const key of Object.keys(JSON.parse(this.assetHash.value)))
          if (typeof key === 'string') {
            asset[key] = uuid();
          }
        await post('/meta?key=assetHash', asset);
        await this.fetch();
      }
    },
    async mounted() {
      await this.fetch();
    }
  };
</script>
