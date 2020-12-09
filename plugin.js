import RedisStore from 'nuxt-perfect-cache/lib/RedisStore'
const options=<%= JSON.stringify(options,null,2) %>
// const options = { url: '', prefix: '', appendHost: true, disable: false }
export default ({ req }, inject) => {
  inject(
    'cacheFetch',
    (
      {
        key,
        expire,
        disable = options.disable,
        url = options.url,
        prefix = options.prefix,
        ignoreConnectionErrors=options.ignoreConnectionErrors
      },
      requestCallback
    ) => {
      if (disable) {
        return requestCallback()
      }
      const host = req && req.headers ? req.headers.host : ''
      key = options.appendHost ? key + '-' + host : key
      const redis = new RedisStore(url, true, prefix,process && process.server,ignoreConnectionErrors)
      return redis.fetch(key, expire, requestCallback, true)
    }
  )
}
