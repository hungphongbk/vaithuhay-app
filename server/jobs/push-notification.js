import {Log, PushNotiMessage, PushNotiToken} from "@server/models";
import {FirebaseAdmin as admin} from "@server/components";
import omit from 'lodash/omit';
import mapKeys from 'lodash/mapKeys';
import zip from 'lodash/zip';
import qs from 'query-string';

const topicList = {
  ALL: '/topics/all',
  DEV: '/topics/dev'
};
export {topicList};

function _definePayload(notification, _id = null) {
  let payload = {notification};
  if (typeof _id === 'string' && _id.length > 0) {
    payload.notification.tag = _id;
    payload = Object.assign({}, {
      data: {
        _id
      }
    }, payload);
  }
  console.log(payload);
  return payload;
}

class Wrapper {
  constructor() {
    this.messaging = admin.messaging();
    this.topics = topicList;

    if (process.env.NODE_ENV === 'production')
    // noinspection JSIgnoredPromiseFromCall
      this.init();
  }

  async init() {
    const list = await PushNotiToken.find({}),
      register = ({token, topics}) => this.messaging.subscribeToTopic(token, topics[0]);
    await Promise.all(list.map(register));
    console.log('[jobs/push-notifications] re-init completed with ' + list.length + ' tokens');
  }

  async _mergingAnalyticsParameter(message) {
    if (!message.options) message.options = {};
    let click_action = message.click_action;
    if (typeof click_action === 'undefined' || click_action === null || (typeof click_action === 'string' && click_action.length === 0)) return message;

    const parameters = Object.assign({}, {
        utm_source: 'browser',
        utm_medium: 'push_notification'
      }, mapKeys(message.options.utmParams || {}, (_, key) => 'utm_' + key)),
      concat = qs.extract(click_action).length === 0 ? '?' : '&';

    //remove "empty string" value
    Object.keys(parameters).forEach(key => {
      if (typeof parameters[key] !== 'string') delete parameters[key];
      if (parameters[key].length === 0) delete parameters[key];
    });

    click_action += concat + qs.stringify(parameters);
    message.click_action = click_action;

    return message;
  }

  async _preprocessMessage(message, methods) {
    let rs = message;
    for (const method of methods) {
      rs = await this['_' + method](rs);
    }
    return rs;
  }

  async subscribe(token, topic) {
    await this.messaging.subscribeToTopic(token, topic);
  }

  async log(type, identifier, notification) {
    await Log.create({
      category: 'pushnoti'
    });
  }

  async sendToDevice(token, notification, _id = null) {
    const payload = _definePayload(notification, _id);
    await this.messaging.sendToDevice(token, payload);
  }

  async sendToTopic(topic, notification, _id = null) {
    const payload = _definePayload(notification, _id);
    await this.messaging.sendToTopic(topic, payload);
  }

  /**
   * Send a push notification to specific device/topic
   *
   * @param {string} type "device" (Registration Token) or "topic"
   * @param {string} identifier
   * @param rawNotification
   * @param {boolean} save Whether to save notification to database
   * @returns {Promise<PushNotiMessage|void>}
   */
  async sendNotification(type, identifier, rawNotification, save = true) {
    const sender = {
      device: this.sendToDevice,
      topic: this.sendToTopic
    };

    const processedNotification = await this._preprocessMessage(rawNotification, [
        'mergingAnalyticsParameter'
      ]),
      notification = omit(processedNotification, ['options']);

    //before successfully, save message into database
    let msg = {};
    if (save) {
      msg = await this.storeNotification(null, type, identifier, rawNotification, 'delivered');
    }

    //remove "options" parameter when send message to FCM
    await sender[type].call(this, identifier, notification, msg._id);

    //if send success & have returned message, increase sendCount
    if (msg._id) {
      msg.sendCount = 1;
      await msg.save();
      return msg;
    }
  }

  /**
   * Store a push notification to send later, or get a push notification from DB for re-sending
   *
   * @param _id
   * @param type
   * @param identifier
   * @param rawNotification
   * @param status
   * @returns {Promise<PushNotiMessage>}
   */
  async storeNotification(_id = null, type, identifier, rawNotification, status = 'stored') {

    let msg;
    const processedNotification = await this._preprocessMessage(rawNotification, [
        'mergingAnalyticsParameter'
      ]),
      options = processedNotification.options,
      notification = omit(processedNotification, ['options']);

    const body = {
      sendFrom: 'server',
      sendType: type,
      sendTo: identifier,
      message: notification,
      options,
      status
    };

    if (_id === null) {
      //create new message
      msg = new PushNotiMessage(body);
    } else {
      //find existing message by id
      msg = await PushNotiMessage.findById(_id);
      Object.assign(msg, body);
    }

    // ... then update
    await msg.save();
    return msg;
  }

  /**
   * Resend a push notification, specific by its ID
   *
   * @param {string} _id
   * @param {boolean} forceDev
   * @returns {Promise<PushNotiMessage>}
   */
  async resendNotification(_id, forceDev = false) {
    const sender = {
      device: this.sendToDevice,
      topic: this.sendToTopic
    };
    const msg = await PushNotiMessage.findById(_id),
      {
        sendType: type,
        sendTo: $identifier,
        message: notification
      } = msg;

    const identifier = forceDev ? topicList.DEV : $identifier;

    await sender[type].call(this, identifier, notification, _id);
    msg.status = 'delivered';
    msg.sendCount++;
    await msg.save();
    return msg;
  }

  async registerNewToken(token, topics = [], debug = false) {
    //add ALL as default
    topics.push(topicList.ALL);
    const obj = await PushNotiToken.findOrCreate({token}, {topics});
    obj.topics = topics;
    await obj.save();
    const sub = topic => this.subscribe(token, topic);
    await Promise.all(topics.map(sub));
  }

  //stat include
  //  1. Number of token in DB
  async stat() {
    const stat = {};

    const getTokenCount = async () => {
      stat.tokenCount = await PushNotiToken.count({});
    };

    await Promise.all([getTokenCount()]);
    return stat;
  }

  async listAllMessages() {
    return await PushNotiMessage.find({});
  }

  async deleteMessage(_id) {
    await PushNotiMessage.findByIdAndRemove(_id);
  }

  /**
   * [MIDDLEWARE] for querying messages
   *
   * @param req
   * @param res
   * @param next
   * @returns {Promise<void>}
   */
  async paginateMiddleware(req, res, next) {
    const {
      page = 1,
      limit = 10,
      sortBy = ['updatedAt'],
      sortVal = ['desc']
    } = req.query;
    if (!req.pushNoti) req.pushNoti = {};

    // example: '-date'
    const sortString = zip(sortBy, sortVal)
      .map(([by, val]) => {
        if (['asc', 'ascending', '1'].indexOf(val) >= 0) return by;
        return '-' + by;
      }).join(' ');

    const {
      docs: messages,
      total,
      pages
    } = await PushNotiMessage.paginate({}, {page, limit, sort: sortString});
    req.pushNoti = Object.assign({}, req.pushNoti, {
      messages,
      total,
      pages
    });
    next();
  }
}

export default new Wrapper();
