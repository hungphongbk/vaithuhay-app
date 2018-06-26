import * as functions            from 'firebase-functions';
import express                   from 'express';
import cors                      from 'cors';
import bodyParser                from 'body-parser';
import {apiGet, apiPost, apiPut} from './utils';
import syncQueue                 from "./sync-spreadsheet-v2";

const app = express();
app.use(cors({origin: true}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.text());
app.use(bodyParser.json());

const ORDER_PROCESS_ADDRESS = 'https:\/\/us-central1-hungphongbk-1812.cloudfunctions.net\/sync\/do';

async function createOrUpdate(topics, address) {
  const {webhooks: $all} = await apiGet('/admin/webhooks.json', false),
    webhooks = $all.filter(h => h.address === address);
  if (!webhooks || webhooks.length === 0) {
    const create = topic => apiPost('/admin/webhooks.json', {
      webhook: {
        topic,
        address,
        format: "json"
      }
    });
    await Promise.all(topics.map(create));
  } else {
    const update = ({id}) => apiPut(`/admin/webhooks/${id}.json`, {
      webhook: {
        id,
        address
      }
    });
    await Promise.all(webhooks.map(update));
  }
}

(async function () {
  await createOrUpdate(['orders\/create', 'orders\/cancelled', 'orders\/updated', 'orders\/delete', 'orders\/fulfilled', 'orders\/paid'], ORDER_PROCESS_ADDRESS);
})();

const orderMiddleware = (req, res, next) => {
  console.info(req.headers['x-haravan-order-id']);
  try {
    req.order = Object.assign({}, {
      _id: req.headers['x-haravan-order-id'],
      status: req.headers['x-haravan-topic'],
      ...req.body
    });
    // console.log(req.order);
    next();
  } catch (e) {
    console.error(e.message);
    res.status(500).send(e.message);
  }
};

app.post('/do', orderMiddleware, (req, res) => {
  if (req.order.status === 'orders/cancelled' && req.order.financial_status === 'pending') {
    req.order.financial_status = 'voided';
  }
  try {
    syncQueue.create('sync', req.order)
      .priority('normal')
      .attempts(3)
      .removeOnComplete(true)
      .save(err => {
        if (err)
          throw err;
      });
    res.json({});
  } catch (e) {
    console.error(e.message);
    res.json({});
  }
});

// export const sync = functions.https.onRequest(app);
