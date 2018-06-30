import uuid from 'uuid/v4';

class NotificationItem {
  label;
  title;
  message;
  callback;

  constructor(context, obj) {
    this.context = context;
    this.id = uuid();
    Object.assign(this, obj);

    if (!this.callback) {
      setTimeout(() => {
        this.remove();
      }, 3000);
    } else {
      this.callback(this).then(() => {
        setTimeout(() => {
          this.remove();
        }, 1500);
      });
    }
  }

  remove() {
    this.context.commit('removeNoti', this.id);
  }

  updateMessage(message) {
    const obj = {
      id: this.id,
      message
    };
    this.context.commit('update', obj);
  }
}

export default {
  namespaced: true,
  state: () => ({
    list: []
  }),
  mutations: {
    pushNoti(state, noti) {
      state.list.unshift(noti);
    },
    removeNoti({list}, id) {
      const index = list.findIndex(item => item.id === id);
      list.splice(index, 1);
    },
    update({list}, obj) {
      const index = list.findIndex(item => item.id === obj.id);
      list[index] = obj;
    }
  },
  actions: {
    pushNoti({commit}, noti) {
      commit('pushNoti', noti);
    },
    pushDanger(context, obj) {
      obj.title = obj.title || '';
      context.dispatch('pushNoti', new NotificationItem(context, {
        label: 'danger',
        ...obj
      }));
    },
    pushSuccess(context, obj) {
      obj.title = obj.title || '';
      context.dispatch('pushNoti', new NotificationItem(context, {
        label: 'success',
        ...obj
      }));
    },
    pushInfo(context, obj) {
      obj.title = obj.title || '';
      context.dispatch('pushNoti', new NotificationItem(context, {
        label: 'info',
        ...obj
      }));
    }
  }
};
