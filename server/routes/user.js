import {Router} from 'express'
import AppUser from '../models/AppUsers'
import RecruitRegistration from '../models/RecruitRegistration'
import google from 'googleapis'

const router = Router();

router.get('/', async (req, res) => {
  res.json(await AppUser.find({}))
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
})
router.post('/verify', async (req, res) => {
  const {email, name, avatar} = req.body;
  const user = AppUser.findOne({email})
  if (user) {
    await user.update({
      name,
      avatar
    });
    res.json({})
  } else {
    res.status(403).send()
  }
})
router.patch('/', async (req, res) => {
  const {email} = req.body;
  const user = AppUser.findOne({email})
  if (user) {
    await user.update(req.body)
    res.json({})
  } else {
    res.status(403).send()
  }
})

export default router;
