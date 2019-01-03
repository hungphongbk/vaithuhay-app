const io = require('@pm2/io')

const wrapEnv = (dev, prod) =>
  process.env.NODE_ENV === 'development' ? dev : prod

const interfaces = instance => ({
    mark: function() {}
  }),
  productionMetrics = instance =>
    io.meter({
      type: 'meter',
      name: `Haravan API#${instance} Request/sec`
    }),
  HaravanAPIMetrics = {
    first: wrapEnv(interfaces(1), productionMetrics(1)),
    second: wrapEnv(interfaces(2), productionMetrics(2))
  }

export { HaravanAPIMetrics }
