import { Request, Response, Router } from 'express'
import AppUser from '../models/AppUsers'
import { apiDel, apiGet, apiPut } from '@server/utils'
import { CLIENT_USER_COOKIE_KEY } from '@server/utils/const'
import pick from 'lodash/pick'

declare global {
  namespace Express {
    interface Request {
      customer: HaravanCustomer
    }
  }
}
const router = Router()

const UserMiddleware = async (req: Request, res: Response, next) => {
    const userCookieKey =
      req.headers[CLIENT_USER_COOKIE_KEY] ||
      req.headers[CLIENT_USER_COOKIE_KEY.toLowerCase()]
    if (!userCookieKey) {
      res
        .status(403)
        .json({ status: 'err', message: 'Authentication required' })
    }
    const { customer } = await apiGet(`/admin/customers/${userCookieKey}.json`)
    // console.log(customer);
    req.customer = customer
    next()
  },
  customerToJSON = async customer => {
    const rs = pick(customer, [
      'id',
      'email',
      'first_name',
      'last_name',
      'birthday',
      'gender',
      'addresses',
      'default_address'
    ])

    //transform name
    rs.name = rs.first_name + ' ' + rs.last_name
    delete rs.first_name
    delete rs.last_name

    //transform addresses
    rs.address = {
      list: rs.addresses
    }
    delete rs.addresses

    const metafields = (await apiGet(
      `/admin/customers/${customer.id}/metafields.json`
    )).metafields.filter(metafield => metafield.namespace === 'hrvloyalty')
    rs.loyalty = metafields.reduce((acc, metafield) => {
      acc[metafield.key] = metafield.value
      return acc
    }, {})
    return rs
  }

router.get('/', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'development' && false) {
    res.json([
      {
        name: 'Trương Hùng Phong',
        email: 'programmingd32@gmail.com',
        avatar:
          'https://lh3.googleusercontent.com/-d36CQB_94IM/AAAAAAAAAAI/AAAAAAAAAjw/vqUetnviJ1M/s96-c/photo.jpg',
        permissions: 'page.index,page.about-us,page.users,cat,product.promo'.split(
          ','
        )
      }
    ])
    return
  }
  res.json(await AppUser.find({}))
})
router.post('/', async (req: Request, res: Response) => {
  const { email } = req.body
  const user = new AppUser({ email })
  try {
    await user.save()
    res.json({})
  } catch (e) {
    res.status(500).send(e.message)
  }
})
router.post('/verify', async (req: Request, res: Response) => {
  const { email, name, avatar } = req.body
  console.log(email)
  const user = AppUser.findOne({ email })
  if (user) {
    await user.update({
      name,
      avatar
    })
    res.json({})
  } else {
    res.status(403).send()
  }
})
router.delete('/:_id', async (req: Request, res: Response) => {
  const { _id } = req.params,
    user = await AppUser.findOne({ _id })
  if (user) {
    await user.remove()
    res.json({})
  } else {
    res.status(403).send()
  }
})

router.post('/login', async (req: Request, res: Response) => {
  //search customer by email
  const email = req.body.email,
    query = /^[a-z0-9](\.?[a-z0-9]){5,}/.exec(email)[0]

  const { customers } = await apiGet(
    `/admin/customers/search.json?query=${query}`,
    false
  )
  if (customers.length === 0)
    res.status(500).json({ message: `user ${email} not exists` })
  else {
    const customer = customers.find(c => c.email === email)
    res.json(await customerToJSON(customer))
  }
})
router.put(
  '/address/:id',
  UserMiddleware,
  async (req: Request, res: Response) => {
    try {
      await apiPut(
        `/admin/customers/${req.customer.id}/addresses/${req.params.id}.json`,
        {
          address: {
            ...req.body
          }
        }
      )
      res.json({ status: 'ok' })
    } catch (e) {
      res.status(500).json({ status: 'err', message: e.message })
    } finally {
    }
  }
)
router.delete(
  '/address/:id',
  UserMiddleware,
  async (req: Request, res: Response) => {
    try {
      await apiDel(
        `/admin/customers/${req.customer.id}/addresses/${req.params.id}.json`
      )
      res.json({ status: 'ok' })
    } catch (e) {
      res.status(500).json({ status: 'err', message: e.message })
    } finally {
    }
  }
)
router.post('/update', UserMiddleware, async (req: Request, res: Response) => {
  const { id } = req.customer
  try {
    await apiPut(`/admin/customers/${id}.json`, {
      customer: {
        id,
        ...req.body
      }
    })
    res.json({ status: 'ok' })
  } catch (e) {
    res.status(500).json({ status: 'err', message: e.message })
  }
})
router.patch('/', async (req: Request, res: Response) => {
  const { email } = req.body
  const user = AppUser.findOne({ email })
  if (user) {
    await user.update(req.body)
    res.json({})
  } else {
    res.status(403).send()
  }
})

export default router
