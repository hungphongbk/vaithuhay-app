import {Router} from 'express';
import AppUser from '../models/AppUsers';
import {apiGet, apiPut} from "@server/utils";
import {CLIENT_USER_COOKIE_KEY} from "@server/utils/const";
import pick from 'lodash/pick';

const router = Router();

const UserMiddleware = async (req, res, next) => {
    if (!req.session[CLIENT_USER_COOKIE_KEY]) {
      res.status(403).json({status: 'err', message: 'Authentication required'});
    }
    const {customer} = await apiGet(`/admin/customers/${req.session[CLIENT_USER_COOKIE_KEY]}.json`);
    // console.log(customer);
    req.customer = customer;
    next();
  },
  customerToJSON = async customer => {
    const rs = pick(customer, [
      'id', 'email', 'first_name', 'last_name', 'birthday', 'gender', 'addresses', 'default_address'
    ]);

    //transform name
    rs.name = rs.first_name + ' ' + rs.last_name;
    delete rs.first_name;
    delete rs.last_name;

    //transform addresses
    rs.address = {
      list: rs.addresses
    };
    delete rs.addresses;

    const metafields = (await apiGet(`/admin/customers/${customer.id}/metafields.json`))
      .metafields.filter(metafield => metafield.namespace === 'hrvloyalty');
    rs.loyalty = metafields.reduce((acc, metafield) => {
      acc[metafield.key] = metafield.value;
      return acc;
    }, {});
    return rs;
  };

router.get('/', async (req, res) => {
  res.json(await AppUser.find({}));
});
router.post('/', async (req, res) => {
  const {email} = req.body;
  const user = new AppUser({email});
  try {
    await user.save();
    res.json({});
  } catch (e) {
    res.status(500).send(e.message);
  }
});
router.post('/verify', async (req, res) => {
  const {email, name, avatar} = req.body;
  const user = AppUser.findOne({email});
  if (user) {
    await user.update({
      name,
      avatar
    });
    res.json({});
  } else {
    res.status(403).send();
  }
});
router.post('/login', async (req, res) => {
  //search customer by email
  const email = req.body.email,
    query = /^[a-z0-9](\.?[a-z0-9]){5,}/.exec(email)[0];

  const {customers} = await apiGet(`/admin/customers/search.json?query=${query}`, false);
  if (customers.length === 0)
    res.status(500).json({message: `user ${email} not exists`});
  else {
    const customer = customers.find(c => c.email === email);
    req.session[CLIENT_USER_COOKIE_KEY] = customer.id;
    res.json(await customerToJSON(customer));
  }
});
router.post('/update', UserMiddleware, async (req, res) => {
  const {id} = req.customer;
  try {
    await apiPut(`/admin/customers/${id}.json`, {
      customer: {
        id,
        ...req.body
      }
    });
    res.json({status: 'ok'});
  } catch (e) {
    res.status(500).json({status: 'err', message: e.message});
  }
});
router.patch('/', async (req, res) => {
  const {email} = req.body;
  const user = AppUser.findOne({email});
  if (user) {
    await user.update(req.body);
    res.json({});
  } else {
    res.status(403).send();
  }
});

export default router;
