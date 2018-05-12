import $ from 'jquery'
import store from '../store'

window.$ = $;

const api = (url, forceCloud = false) => (
  (process.env.NODE_ENV === 'production' || forceCloud) ?
    'https://server.vaithuhay.com/b' :
    'https://localhost:8089'
) + url;
store.subscribe(({type, payload}) => {
  if (type === 'auth/updateUserStatus' && payload.isLoggedIn === true) {
    $.ajaxSetup({
      beforeSend(xhr) {
        xhr.setRequestHeader('X-User-Token', payload.token)
      }
    })
  }
});

export const get = (url, forceCloud = false) => $.get(api(url, forceCloud));

export const getXhr = (url) => $.ajax({
  type: 'GET',
  url: api(url),
  xhrFields: {
    withCredentials: true
  },
  crossDomain: true
});

export const post = (url, data) => $.post(api(url), data);

export const postForm = (url, data) => $.ajax({
  type: 'POST',
  url: api(url),
  data,
  contentType: false,
  processData: false
});

export const postText = (url, data) => $.ajax({
  type: 'POST',
  url: api(url),
  data,
  contentType: 'text/plain'
});

export const postXhr = (url, data) => $.ajax({
  type: 'POST',
  url: api(url),
  data,
  contentType: 'text/plain',
  xhrFields: {
    withCredentials: true
  },
  crossDomain: true
});

export const patch = (url, data) => $.ajax({
  type: 'PATCH',
  url: api(url),
  data
})

export const del = (url) => $.ajax({
  type: 'DELETE',
  url: api(url)
})
