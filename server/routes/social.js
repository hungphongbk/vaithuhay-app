import { Router } from 'express'
import passport from 'passport'

const router = Router()

router.post(
  '/auth/facebook',
  passport.authenticate('facebook-token', { session: false }),
  (req, res) => {
    res.send(req.user)
  }
)

export default router
