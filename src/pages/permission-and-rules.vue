<style lang="scss" scoped>
  @import "./header.scss";

  .btn {
    cursor: pointer;
  }

  .unverified {
    color: #888;
    background: #efefef;
  }
</style>
<template lang="pug">
  div
    div.clearfix.header
      h1.page-title Người dùng & phân quyền
      .btn.btn-primary.btn-lg(@click="initNewUser")
        i.fa.fa-plus.mr-2
        | Tạo người dùng mới
    br
    table.table
      thead
        tr
          th(scope="col") #
          th(scope="col") Tên
          th(scope="col") Phân quyền
          th(scope="col")
      tbody
        tr(v-for="(user,index) in users", :class="{'unverified': !user.name, 'table-primary':user.isMe}")
          th(scope="row") {{index}}
          td
            strong {{user.name?user.name:'(unverified)'}} {{user.isMe?'(tôi)':''}}
            br
            | {{user.email}}
          td
            i {{user.permissions.join(', ')}}
          td
            .btn-group(role="group")
              .btn.btn-primary(@click="currentUser=user")
                fa-icon(:icon="faPencilAlt")
              .btn.btn-danger(@click="deleteUser(user)")
                fa-icon(:icon="faTrash")
    modal(v-if="newUser", title="Tạo người dùng mới", @dismiss="newUser=null")
      .modal-body
        form
          label.sr-only Email
          .input-group
            .input-group-addon
              i.fa.fa-envelope-o
            input.form-control(type="email", placeholder="Email", v-model="newUser.email")
      .modal-footer
        save-button.btn.btn-success(:fn="saveNewUser")
    modal.edit-user(v-if="currentUser", :title="`Chỉnh sửa \"${currentUser.name}\"`", @dismiss="currentUser=null")
      .modal-body
        h6 Phân quyền
        .form-check.mr-4.form-check-inline(v-for="(page, permission) in pages")
          label.form-check-label
            input.form-check-input(type="checkbox", :value="permission", v-model="currentUser.permissions")
            | {{page.title}}
        .mb-4
        .btn.btn-secondary.mr-2.btn-sm(@click="checkAll(true)") Đánh dấu tất cả
        .btn.btn-secondary.btn-sm(@click="checkAll(false)") Hủy dấu tất cả
      .modal-footer
        save-button.btn.btn-success(:fn="updateCurrentUser")
</template>
<script>
  import {pages} from '../router'
  import pick from 'lodash/pick'
  import faPencilAlt from '@fortawesome/fontawesome-free-solid/faPencilAlt'
  import faTrash from '@fortawesome/fontawesome-free-solid/faTrash'
  import {ModalManager} from "@client/components/modal-manager";

  const newUser = () => ({email: ''});
  export default {
    data() {
      return {
        newUser: null,
        currentUser: null,
        pages,
        faPencilAlt,
        faTrash,
        isDeleteUser: false
      }
    },
    computed: {
      users() {
        return this.$store.getters['auth/users']
      }
    },
    methods: {
      initNewUser() {
        this.newUser = newUser();
      },
      async saveNewUser() {
        await this.$store.dispatch('auth/createUser', this.newUser.email);
        this.newUser = null;
      },
      checkAll(value) {
        if (value)
          this.currentUser.permissions = Object.keys(this.pages);
        else this.currentUser.permissions = []
      },
      async updateCurrentUser() {
        await this.$store.dispatch('auth/updateUser', pick(this.currentUser, [
          'email', 'permissions'
        ]));
        this.currentUser = null;
      },
      deleteUser(user) {
        return new Promise(resolve => {
          ModalManager({
            title: 'Xóa người dùng',
            body: {
              render(h) {
                return (<div>
                  <div class="modal-body">
                    <p>Bạn có chắc chắn xóa người dùng <strong>{user.name}</strong> khỏi ứng dụng không?</p>
                  </div>
                  <div class="modal-footer">
                    <button class="btn btn-secondary" onClick={() => this.$emit('modal-dismiss')}>Không</button>
                    <save-button class="btn btn-danger" fn={() => this.doRemove()} title="Có"/>
                  </div>
                </div>)
              },
              methods: {
                doRemove() {
                  return this.$store.dispatch('auth/deleteUser', user)
                    .then(() => {
                      this.$emit('modal-dismiss')
                    })
                }
              }
            }
          })
        })
      }
    }
  }
</script>
