import {Router} from 'express';
import {google} from 'googleapis';
import key from '../client_secret_1926697148-8vofkikihlmnjhpl0m93h3j9cvmirhp3.apps.googleusercontent.com.json';
import path from 'path';
import {apiDel, apiGet, apiPost, diffArray} from '../utils';
import middlewares from './middlewares';
import Logging from '@server/jobs/Logging';
import {FirebaseAdmin} from "@server/components";

const VTH_TOP_PRODUCTS = 'vaithuhayTopProducts';

const timeout = ms => new Promise(res => setTimeout(res, ms));
const log = (tag, message) => console.log(`[google/${tag}] ` + message);

const router = Router(),
  authFn = () => new google.auth.OAuth2(
    key.web.client_id,
    key.web.client_secret,
    (process.env.NODE_ENV === 'production' ? 'https://server.vaithuhay.com/b/' : 'https://localhost:8089/') + 'g/login/callback'
  ),
  analytics = (req, res, next) => {
    req.analytics = google.analytics({
      version: 'v3',
      auth: req.auth
    });
    next();
  },
  viewId = 'ga:118256072';

const googleAuth = async (req, res, next) => {
  //init req.auth
  const auth = authFn();
  req.auth = auth;
  const token = req.headers['x-user-token'];
  // console.log(req.headers);
  if (token) {
    try {
      auth.credentials = {
        access_token: token
      };
      next();
    } catch (e) {
      await Logging.log(
        Logging.TYPES.ERROR,
        ['analytics'],
        e.toString()
      );
      res.status(500).json({message: e.message});
    }
  } else res.json({
    status: 'login',
    url: auth.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/plus.me',
        'https://www.googleapis.com/auth/analytics'
      ]
    })
  });
};
const updateFeaturedProducts = async (arr, namespace, resources = '') => {
  const {metafields} = await apiGet(`/admin${resources}/metafields.json?namespace=${namespace}`);
  if (metafields.length > 0) {
    await Promise.all(metafields.map(({id, namespace: _namespace}) => new Promise(async resolve => {
      if (namespace === _namespace)
        await apiDel(`/admin${resources}/metafields/${id}.json`);
      resolve();
    })));
  }
  // await timeout(11000);
  await Promise.all(arr.map(([id, handle]) => new Promise(async resolve => {
    try {
      await apiPost(`/admin${resources}/metafields.json`, {
        metafield: {
          namespace,
          key: JSON.stringify(id),
          value_type: 'string',
          value: handle
        }
      });
    } catch (e) {
      throw e;
    }
    resolve();
  })));
};
const getFeaturedProducts = async (namespace, resources = '') => {
  const {metafields} = await apiGet(`/admin${resources}/metafields.json?namespace=${namespace}`);
  if (metafields.length === 0) return [];
  return metafields.map(({key: id, value: handle}) => [id * 1, handle]);
};
const updateLastTime = async ref => {
  const db = FirebaseAdmin.database();
  await db.ref(ref).set(Date.now());
};

router.get('/login/status', googleAuth, (req, res) => {
  res.json({status: 'ok'});
});
router.get('/login/callback', (req, res) => {
  const auth = req.auth || authFn();
  req.auth = auth;
  const {code} = req.query;
  auth.getToken(code, async (err, token) => {
    if (err) console.log(err.message);
    else {
      auth.setCredentials(token);
      req.session['tokens'] = token;
      await req.session.save();
      res.sendFile(path.join(global.APP_PATH, '../server/callback.html'));
    }
  });
});

router.get('/lastUpdated', (req, res) => {
  const db = FirebaseAdmin.database();
  // noinspection JSIgnoredPromiseFromCall
  db.ref(`server/${req.query.q}/lastUpdated`).once('value', snapshot => {
    res.json({
      diff: Date.now() - snapshot.val() * 1
    });
  });
});

router.get('/', googleAuth, (req, res) => {
  res.json({status: 'OK'});
});

router.post('/top', googleAuth, analytics, middlewares.allProducts, async (req, res) => {
  //Get old top products to diff
  const oldTop = await getFeaturedProducts(VTH_TOP_PRODUCTS);

  const yesterday = (d => new Date(d.setDate(d.getDate() - 1)))(new Date);
  const before10days = (d => new Date(d.setDate(d.getDate() - 10)))(new Date);
  const fm = d => d.toISOString().slice(0, 10);
  // log('top', fm(before10days));
  // log('top', fm(yesterday));

  req.analytics.data.ga.get({
    ids: viewId,
    'start-date': fm(before10days),
    'end-date': fm(yesterday),
    // metrics: 'ga:bounces,ga:entrances,ga:pageviews,ga:uniquePageviews,ga:timeOnPage,ga:exits',
    metrics: 'ga:pageviews',
    dimensions: 'ga:pagePath',
    sort: '-ga:pageviews',
    filters: 'ga:pagePath=~^/products/*',
    'max-results': 20
  }, async (err, body) => {
    if (err) {
      await Logging.log(
        Logging.TYPES.ERROR,
        ['analytics', 'top-products'],
        err.toString()
      );
      res.status(500).send(err.message);
    }
    else {
      const products = req.products,
        {rows} = body.data,
        rs = rows
          .map(([path]) => {
            const m = /^\/products\/(.*)/.exec(path);
            if (m === null) return null;
            const product = products.find(p => p.handle === m[1]);
            if (typeof product === 'undefined' || product === null) return null;
            else return [product.id, product.handle];
          })
          .filter(r => r !== null);

      //update last updated time into Firebase database
      await updateLastTime('server/topProduct/lastUpdated');

      //update into vaithuhay shop metafields
      await updateFeaturedProducts(rs, VTH_TOP_PRODUCTS);
      res.json(diffArray(oldTop, rs, (old, current) => old[0] === current[0]));
    }
  });
});

router.post('/relateds', googleAuth, analytics, middlewares.allProducts, async (req, res) => {
  //get product url
  const productUrl = '/products/' + req.findHandleFromId(req.query.id);

  const yesterday = (d => new Date(d.setDate(d.getDate() - 1)))(new Date);
  const before10days = (d => new Date(d.setMonth(d.getMonth() - 1)))(new Date);
  const fm = d => d.toISOString().slice(0, 10);

  req.analytics.data.ga.get({
    ids: viewId,
    'start-date': fm(before10days),
    'end-date': fm(yesterday),
    // metrics: 'ga:bounces,ga:entrances,ga:pageviews,ga:uniquePageviews,ga:timeOnPage,ga:exits',
    metrics: 'ga:pageviews',
    dimensions: 'ga:previousPagePath,ga:pagePath',
    sort: '-ga:pageviews',
    filters: `ga:pagePath=~^/products/*;ga:previousPagePath==${productUrl}`
  }, async (err, body) => {
    if (err) {
      await Logging.log(
        Logging.TYPES.ERROR,
        ['analytics', 'related-products'],
        err.toString()
      );
      res.status(500).send(err.message);
    }
    else {
      try {
        const {products: relateds} = await apiGet('/admin/products.json?limit=250'),
          {rows} = body.data,
          rs = rows.slice(1)
            .map(([, path]) => {
              const m = /^\/products\/(.*)/.exec(path);
              if (m === null) return null;
              const product = relateds.find(p => p.handle === m[1]);
              if (typeof product === 'undefined' || product === null) return null;
              else return [product.id, product.handle];
            })
            .filter(r => r !== null);

        //update into vaithuhay shop metafields
        await updateFeaturedProducts(rs, 'vthRelatedProducts', '/products/' + req.query.id);
        res.json(rows);
      } catch (e) {
        await Logging.log(
          Logging.TYPES.ERROR,
          ['analytics', 'related-products'],
          err.toString()
        );
        res.status(500).send(e.message);
      }
    }
  });
});

export default router;
