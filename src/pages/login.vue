<style lang="scss" scoped>
  h2 {
    margin-top: 1rem;
    margin-bottom: 3rem;
    display: block;
  }

  .btn {
    position: relative;
    cursor: pointer;
  }

  .fa {
    &:before {
      margin-right: .7rem;
    }
    &:after {
      position: absolute;
      content: '';
      border-left: 2px solid rgba(#fff, .65);
      top: .3rem;
      bottom: .3rem;
    }
  }

  .info {
    width: 40%;
    padding: 1rem;
    border: 1px solid #ccc;
    border-radius: 1rem;
    background: #fafafa;
    img {
      width: 80px;
      margin-right: 1rem;
      float: left;
    }
  }
</style>
<template lang="pug">
  .text-center
    h2 Đăng nhập
    template(v-if="isLoggedIn")
      .clearfix.info.text-left(style="display:inline-block")
        img.rounded-circle(:src="user.avatar")
        div
          h5 {{user.name}}
          p
            i {{user.email}}
      br
      .btn.btn-primary.btn-lg.mt-4(@click="signOut")
        i.fa.fa-google-plus.mr-3
        | Đăng xuất
    template(v-else)
      .btn.btn-primary.btn-lg(@click="signIn")
        i.fa.fa-google-plus.mr-3
        | Sử dụng Google để đăng nhập
</template>
<script>
  export default {
    computed: {
      user() {
        return this.$store.state.auth.user;
      },
      isLoggedIn() {
        return this.user !== null;
      },
      redirect() {
        return this.$route.query.redirect
      }
    },
    watch:{
      isLoggedIn(value){
        if(value && this.redirect){
          this.$router.push(this.redirect)
        }
      }
    },
    methods: {
      async signIn() {
        await this.$store.dispatch('auth/login');
      },
      signOut() {
        return this.$store.dispatch('auth/logout')
      }
    }
  }
</script>
