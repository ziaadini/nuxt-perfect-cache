import path from 'path'
import RedisStore from './lib/RedisStore'
import { serialize, deserialize } from './lib/serializer'
export default function index({
                                getCacheData,
                                url = 'redis://127.0.0.1:6379',
                                prefix = 'r-',
                                appendHost = true,
                                disable = false,
                                ignoreConnectionErrors = false,
                              }) {
  const { nuxt } = this

  nuxt.hook('render:before', (renderer) => {
    const renderRoute = renderer.renderRoute.bind(renderer)
    renderer.renderRoute = function (route, context) {
      const host = context.req.headers.host
      const cacheData = getCacheData ? getCacheData(route, context) : null
      if (!cacheData || disable) return renderRoute(route, context)
      // eslint-disable-next-line prefer-const
      let { key, expire } = cacheData
      key = appendHost ? key + '-' + host : key
        const redisStore = new RedisStore(
            cacheData.url || url,
            false,
            prefix,
            true,
            ignoreConnectionErrors
        )

        function renderAndSetCacheKey() {
          return renderRoute(route, context).then(async function (result) {
            if (!result.error && !result.redirected) {
              await redisStore.write(key, serialize(result), expire)
            }
            return result
          })
        }

      return new Promise(async (resolve)=>{
        try{
          const cachedResult=await redisStore.read(key)
          if (cachedResult) {
             resolve(deserialize(cachedResult))
           }else{
             resolve(renderAndSetCacheKey())
           }
        }catch{
          resolve(renderRoute(route, context))
        }
      }).finally(()=>{
          redisStore.disconnect()
      })

      // try {
      //   function renderAndSetCacheKey() {
      //     return renderRoute(route, context).then(async function (result) {
      //       if (!result.error && !result.redirected) {
      //         await redisStore.write(key, serialize(result), expire)
      //       }
      //       return result
      //     })
      //   }
      //   return redisStore.read(key).then(function (cachedResult) {
      //     if (cachedResult) {
      //       return deserialize(cachedResult)
      //     }
      //
      //     return renderAndSetCacheKey()
      //   })
      // } catch {
      //   return renderRoute(route, context)
      // } finally {
      //   redisStore.disconnect()
      // }
    }
  })
  // this.addTemplate({
  //   fileName: 'nuxt-perfect-cache/RedisStore.js',
  //   src: path.resolve(__dirname, 'lib/RedisStore.js'),
  // })
  this.addPlugin({
    fileName: 'nuxt-perfect-cache/plugin.js',
    src: path.resolve(__dirname, 'plugin.js'),
    options: {
      url,
      prefix,
      appendHost,
      disable,
      ignoreConnectionErrors,
    },
  })
}
module.exports.meta = require('./package.json')
