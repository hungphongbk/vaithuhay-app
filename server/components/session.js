import session from 'express-session'
import connectRedis from 'connect-redis'

const RedisStore = connectRedis(session)

export default app => {
  app.set('trust proxy', 1)
  app.use(
    session({
      secret: 'vaithuhay-app',
      resave: true,
      saveUninitialized: true,
      cookie: {
        maxAge: 2628000,
        domain:
          process.env.NODE_ENV === 'production'
            ? 'static.vaithuhay.com'
            : 'localhost',
        secure: true
      },
      proxy: true,
      store: new RedisStore()
    })
  )
}
