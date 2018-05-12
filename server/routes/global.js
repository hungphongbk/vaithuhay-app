import {apiClear, apiDel, apiGet, apiPost, apiPut, log} from "../utils/index";
import {Router}                                         from 'express';
import {SettingsWrapper}                                from "@server/components";
import Log                                              from '../models/Logs';
import apiCache                                         from 'apicache';
import pick                                             from 'lodash/pick';
import middlewares                                      from './middlewares';
import moment                                           from 'moment-timezone';
import qs                                               from 'query-string';
import zip                                              from "lodash/zip";
import {admin as adminMiddleware}                       from "@server/routes/middlewares";

moment.tz.setDefault('Asia/Ho_Chi_Minh');
moment.locale('vi');
const router = Router(),
  clientCache = apiCache.middleware,
  cache4hours = clientCache('4 hours');
const flex = obj => {
  let rs;
  try {
    rs = JSON.parse(obj);
  } catch (e) {
    rs = obj;
  }
  return rs;
};

function search(metafields, meta) {
  return metafields.find(m => m.key === meta);
}

router.post('/c/reset', (req, res) => {
  apiClear();
  res.json({status: 'ok'});
});
router.get('/c/stat', (req, res) => {
  res.json({size: cache.length});
});
router.get('/logs', adminMiddleware, async (req, res) => {
  const {
    page = 1,
    limit = 20,
    sortBy = ['updatedAt'],
    sortVal = ['desc']
  } = req.query;

  // example: '-date'
  const sortString = zip(sortBy, sortVal)
    .map(([by, val]) => {
      if (['asc', 'ascending', '1'].indexOf(val) >= 0) return by;
      return '-' + by;
    }).join(' ');

  const {
    docs: logs,
    total,
    pages
  } = await Log.paginate({}, {page, limit, sort: sortString});
  res.json({logs, total, pages, page});
});
router.get('/products/:id/wholesale', middlewares.allProducts, async (req, res) => {
  res.apicacheGroup = 'products/wholesale';
  const {i = null} = req.query;
  const {data: wholesales} = await SettingsWrapper.get('products', 'wholesale'),
    rs = wholesales.filter(cs => {
      return (cs.apply && cs.apply.findIndex(id => ((id * 1) === (req.params.id * 1))) >= 0);
    });
  // console.log(rs);
  rs.forEach(({rules: [rule]}) => {
    rule.applyToProduct = req.findHandleFromId(req.params.id);
    if (rule.additional && rule.additional.length > 0)
      rule.additionalProduct = req.findHandleFromId(rule.additional[0]);
  });
  res.json(i ? [rs.find(({rules: [rule]}) => rule.id === i)] : rs);
});
router.post('/products/:id/ask', async (req, res) => {
  // try{
  const {id} = req.params,
    url = (metafieldId = null) => `/admin/products/${id}/metafields${metafieldId ? ('/' + metafieldId) : ''}.json`,
    {metafields} = await apiGet(url()),
    metafield = search(metafields, 'vaithuhay-faq');
  // console.log(url());
  // console.log(metafields);
  let {faq} = flex(metafield.value);
  if (!Array.isArray(faq))
    faq = [];
  faq.push({
    en: req.body,
    vi: req.body
  });
  await apiPut(url(metafield.id), {
    metafield: {
      value: JSON.stringify({faq})
    }
  });
  apiClear(url());
  if (metafield)
    apiClear(url(metafield.id));
  res.json({status: 'ok'});
  // }
});
//================================================================================
router.get('/articles', async (req, res) => {
  const {blogs} = await apiGet('/admin/blogs.json'),
    blog = blogs.find(({handle}) => handle === 'news');
  // console.log(blogs);
  const data = await apiGet(`/admin/blogs/${blog.id}/articles.json?limit=250`),
    id = req.query.id;
  req.apicacheGroup = 'article' + (id ? id : '');
  if (!id) res.json(data);
  else res.json(data.articles.find(p => p.id * 1 === id * 1));
});
router.get('/articles/:id/related', cache4hours, async (req, res) => {
  const {blogs} = await apiGet('/admin/blogs.json');
  const id = req.params.id,
    {metafields} = await apiGet(`/admin/blogs/${blogs[0].id}/articles/${id}/metafields.json?namespace=vaithuhay&key=relatedProduct`);
  req.apicacheGroup = 'article' + id;
  res.json(metafields.length === 0 ? {} : JSON.parse(metafields[0].value));
});
router.get('/order-tracking', async (req, res) => {
  const fields = ['order_number', 'created_at', 'line_items'].join(','),
    optimizeOrder = order => {
      for (const key of Object.keys(order)) {
        if (/_at$/.test(key)) {
          order[key] = moment(order[key]).format('dddd DD/MM/YYYY');
        }
        order.line_items = order.line_items.map(i => {
          const rs = pick(i, ['product_id', 'name', 'type', 'price', 'price_original', 'image']);
          // rs.image = rs.image.src.replace('http:/', 'https:/')
          return rs;
        });
      }
      return order;
    };

  const {customerId, kw} = req.query;
  if (customerId) {
    const {orders} = await apiGet(`/admin/orders.json?customer_id=${customerId}&fields=${fields}`, false);
    res.json(orders.map(optimizeOrder));
  } else if (kw) {
    if (kw[0] === '#') {
      //kw is an valid order number
      const {orders} = await apiGet(`/admin/orders/search.json?${qs.stringify({fields, name: kw.substr(1)})}`, false);
      res.json(orders.map(optimizeOrder));
    }
  }
  else
    res.json([]);
});


const getSettings = async (req, res) => {
  const {namespace, key} = req.params;
  res.json(await SettingsWrapper.get(namespace, key));
};
router.get('/settings/:namespace/:key', getSettings);
router.get('/settings/:namespace', getSettings);
router.post('/settings/:namespace/:key', async (req, res) => {
  try {
    const {namespace, key} = req.params;
    await SettingsWrapper.set(namespace, key, req.body);
    res.json({status: 'ok'});
  } catch (e) {
    res.json({status: 'err', message: e.message});
  }
});

// METAFIELDS
router.get('/meta/:resource/:id', async (req, res) => {
  log.info('/meta/:resource/:id', `get meta from ${req.params.resource} with id = ${req.params.id}`);
  try {
    const {resource, id} = req.params,
      {metafields} = await apiGet(`/admin/${resource}/${id}/metafields.json`);
    res.json(metafields);
  } catch (e) {
    res.json([]);
  }
});
router.get('/meta/:resource/:id/:resource2/:id2', async (req, res) => {
  const {resource, id, resource2, id2} = req.params,
    {metafields} = await apiGet(`/admin/${resource}/${id}/${resource2}/${id2}/metafields.json`);
  res.json(metafields);
});

// Shop metafields
router.get('/meta', async (req, res) => {
  const {key, raw} = req.query,
    {metafields} = await apiGet(`/admin/metafields.json?namespace=vaithuhay&key=${key}`),
    metafield = search(metafields, key);
  res.json(typeof metafield === 'undefined' ? [] : flex(raw ? metafield : metafield.value));
});
router.post('/meta', async (req, res) => {
  try {
    const {key} = req.query,
      url = '/admin/metafields.json?namespace=vaithuhay',
      {metafields} = await apiGet(url + '&key=' + key),
      metafield = search(metafields, key);
    // console.log(req.body);
    if (typeof metafield === 'undefined' || metafield === null)
      await apiPost(url, {
        metafield: {
          namespace: 'vaithuhay',
          key,
          value_type: 'string',
          value: JSON.stringify(req.body)
        }
      });
    else
      await apiPut(`/admin/metafields/${metafield.id}.json`, {
        metafield: {
          value: JSON.stringify(req.body)
        }
      });
    apiClear(url + '&key=' + key);
    res.json({});
  } catch (e) {
    console.log(e.message);
    res.status(500).send(e.message);
  }
});
router.delete('/meta', async (req, res) => {
  try {
    const {key} = req.query,
      url = '/admin/metafields.json?namespace=vaithuhay',
      {metafields} = await apiGet(url + '&key=' + key),
      metafield = search(metafields, key);

    if (typeof metafield !== 'undefined' && metafield !== null) {
      await apiDel(`/admin/metafields/${metafield.id}.json`);
    }
    apiClear(url + '&key=' + key);
    res.json({});
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// General resource metafields
router.get('/:resource/:id/:meta', async (req, res) => {
  const {resource, id, meta} = req.params,
    {metafields} = await apiGet(`/admin/${resource}/${id}/metafields.json`),
    metafield = search(metafields, meta);
  res.json(typeof metafield === 'undefined' ? [] : flex(metafield.value));
});
router.post('/:resource/:id/:meta', async (req, res) => {
  try {
    const {id, meta, resource} = req.params,
      url = `/admin/${resource}/${id}/metafields.json`,
      {metafields} = await apiGet(url),
      metafield = search(metafields, meta);
    if (typeof metafield === 'undefined' || metafield === null)
      await apiPost(`/admin/${resource}/${id}/metafields.json`, {
        metafield: {
          namespace: 'vaithuhay',
          key: meta,
          value_type: 'string',
          value: JSON.stringify(req.body)
        }
      });
    else
      await apiPut(`/admin/${resource}/${id}/metafields/${metafield.id}.json`, {
        metafield: {
          value: JSON.stringify(req.body)
        }
      });
    apiClear(url);
    res.json({});
  } catch (e) {
    console.log(e.message);
  }
});
// General resource metafields
router.get('/:resource/:id/:meta', async (req, res) => {
  const {resource, id, meta} = req.params,
    {metafields} = await apiGet(`/admin/${resource}/${id}/metafields.json`),
    metafield = search(metafields, meta);
  res.json(typeof metafield === 'undefined' ? [] : flex(metafield.value));
});
router.post('/:resource/:id/:meta', async (req, res) => {
  try {
    const {id, meta, resource} = req.params,
      url = `/admin/${resource}/${id}/metafields.json`,
      {metafields} = await apiGet(url),
      metafield = search(metafields, meta);
    if (typeof metafield === 'undefined' || metafield === null)
      await apiPost(`/admin/${resource}/${id}/metafields.json`, {
        metafield: {
          namespace: 'vaithuhay',
          key: meta,
          value_type: 'string',
          value: JSON.stringify(req.body)
        }
      });
    else
      await apiPut(`/admin/${resource}/${id}/metafields/${metafield.id}.json`, {
        metafield: {
          value: JSON.stringify(req.body)
        }
      });
    apiClear(url);
    res.json({});
  } catch (e) {
    console.log(e.message);
  }
});
router.get('/:resource/:id/:resource2/:id2/:meta', async (req, res) => {
  const {resource, id, resource2, id2, meta} = req.params,
    {metafields} = await apiGet(`/admin/${resource}/${id}/${resource2}/${id2}/metafields.json`),
    metafield = search(metafields, meta);
  res.json(typeof metafield === 'undefined' ? [] : flex(metafield.value));
});
router.post('/:resource/:id/:resource2/:id2/:meta', async (req, res) => {
  try {
    const {resource, id, resource2, id2, meta} = req.params,
      url = `/admin/${resource}/${id}/${resource2}/${id2}/metafields.json`,
      {metafields} = await apiGet(url),
      metafield = search(metafields, meta);
    if (typeof metafield === 'undefined' || metafield === null)
      await apiPost(`/admin/${resource}/${id}/${resource2}/${id2}/metafields.json`, {
        metafield: {
          namespace: 'vaithuhay',
          key: meta,
          value_type: 'string',
          value: JSON.stringify(req.body)
        }
      });
    else
      await apiPut(`/admin/${resource}/${id}/${resource2}/${id2}/metafields/${metafield.id}.json`, {
        metafield: {
          value: JSON.stringify(req.body)
        }
      });
    apiClear(url);
    res.json({});

    //if resource2 is article
    if (resource2 === 'articles') {
      apiCache.clear('articles');
      apiCache.clear('articles' + id2);
    }
  } catch (e) {
    console.log(e.message);
  }
});

export default router;
