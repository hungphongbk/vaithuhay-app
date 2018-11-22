import passport from 'passport'
import config from '../config.json'
import FacebookTokenStrategy from 'passport-facebook-token'
import User from '../models/Users'

passport.use(
  new FacebookTokenStrategy(
    {
      ...config.social.facebook
    },
    async (accessToken, refreshToken, profile, cb) => {
      User.createFbUser(accessToken, refreshToken, profile, (err, user) =>
        cb(err, user)
      )
    }
  )
)
