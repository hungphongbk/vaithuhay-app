import {get, patch, post} from '../plugins/jquery-ajax';
import {pages} from '../router';
import {del} from "@client/plugins/jquery-ajax";

let GoogleAuth;
const SCOPE = [
    'https://www.googleapis.com/auth/plus.me',
    'https://www.googleapis.com/auth/analytics'
  ],
  perm = (slug, label) => ({slug, label});

export default {
  namespaced: true,
  state: () => ({
    isLoggedIn: false,
    user: null,
    token: null,
    users: [],
    pages
  }),
  getters: {
    users({users, user, pages}) {
      return users.map(u => ({
        ...u,
        get isMe() {
          if (!user) return false;
          return user.email === u.email;
        }
      }));
    },
    currentUser({users, user}) {
      if (!user) return null;
      return users.find(u => u.email === user.email);
    }
  },
  mutations: {
    fetchUsers(state, users) {
      state.users = users;
    },
    updateUserStatus(state, obj) {
      Object.assign(state, obj);
    }
  },
  actions: {
    async checkUser({commit, dispatch}, _user) {
      console.log(_user.getAuthResponse().access_token);
      let isLoggedIn = false,
        token = _user.getAuthResponse().access_token;
      const user = await (async function (user) {
        if (typeof user === 'undefined') return null;
        isLoggedIn = true;
        try {
          const info = {
            name: user.getName(),
            email: user.getEmail(),
            avatar: user.getImageUrl()
          };
          await post('/u/verify', info);
          const users = await dispatch('fetchUsers');
          if (!users.find(u => u.email === info.email)) return null;
          return info;
        } catch (e) {
          return null;
        }
      })(_user.getBasicProfile());
      if (user === null) {
        isLoggedIn = false;
        token = null;
      }
      commit('updateUserStatus', {isLoggedIn, user, token});
    },
    async checkLogin({commit, dispatch}) {
      return new Promise(resolve => {
        const userChangeStatus = (user) => dispatch('checkUser', user);

        const auth2Loaded = () => {
          GoogleAuth = gapi.auth2.getAuthInstance();
          GoogleAuth.currentUser.listen(userChangeStatus);
          dispatch('checkUser', GoogleAuth.currentUser.get());
          resolve();
        };

        gapi.load('client:auth2', () => {
          gapi.auth2.init({
            client_id: '1926697148-8vofkikihlmnjhpl0m93h3j9cvmirhp3.apps.googleusercontent.com',
            scope: 'profile email'
          }).then(auth2Loaded);
        });
      });
    },
    async login() {
      await GoogleAuth.signIn();
    },
    async logout({dispatch}) {
      await GoogleAuth.signOut();
      window.location.reload(true);
    },
    async fetchUsers({commit}) {
      const users = await get('/u');
      commit('fetchUsers', users);
      return users;
    },
    async createUser({dispatch}, email) {
      await post('/u', {email});
      await dispatch('fetchUsers');
    },
    async updateUser({dispatch}, user) {
      await patch('/u', user);
      await dispatch('fetchUsers');
    },
    async deleteUser({dispatch}, user) {
      await del('/u/' + user._id);
      await dispatch('fetchUsers');
    }
  }
};
