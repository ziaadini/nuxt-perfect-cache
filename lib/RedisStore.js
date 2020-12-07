const environment = process.env
const NODE_ENV = environment.NODE_ENV
const isDevMode = Object.is(NODE_ENV, 'development')

const { promisify } = require('util')
const Redis = require('redis')
const DEFAULT_URL = 'redis://127.0.0.1:6379'
const PREFIX = 'r-'
const DEFAULT_EXPIRES = 60 * 60

export default class RedisStore {
  constructor(
    url = DEFAULT_URL,
    jsonEncode = true,
    prefix = PREFIX,
    active= process && process.server
  ) {
    this.isActive = active
    if (this.isActive) {
      this.jsonEncode = jsonEncode
      isDevMode&&console.log('**create client called**')
      this.store = Redis.createClient({
        url,
        prefix,
      })
      this.client = {
        get: (key) => {
          const start = new Date()
          const getAsync = promisify(this.store.get).bind(this.store)
          return getAsync(key).finally(
            isDevMode && console.log({ action: 'READ', key, start })
          )
        },
        set: (key, val) => {
          const start = new Date()
          const setAsync = promisify(this.store.set).bind(this.store)
          return setAsync(key, val).finally(
            isDevMode && console.log({ action: 'WRITE', key, start })
          )
        },
        setex: (key, expires, val) => {
          const start = new Date()
          const setexAsync = promisify(this.store.setex).bind(this.store)
          return setexAsync(key, expires, val).finally(
            isDevMode && console.log({ action: 'WRITE', key, start, expires })
          )
        },
      }
    }
  }

  disconnect() {
    if (this.isActive) {
      console.log('**disconnect called**')
    } else {
      console.log('disconnect not working********', this.isActive)
    }
    this.isActive && this.store.quit()
  }

  async read(key) {
    const res = await this.client.get(key)
    if (!res) {
      return null
    }
    try {
      return this.decode(res)
    } catch (e) {
      console.error('read from redis json parse error', e)
      return null
    }
  }

  encode(value) {
    return this.jsonEncode ? JSON.stringify(value) : value
  }

  decode(value) {
    return this.jsonEncode ? JSON.parse(value) : value
  }

  async write(key, value, expires = DEFAULT_EXPIRES) {
    await this.client.setex(key, expires, this.encode(value))
  }

  async fetch(key, expires, callback, disconnect = true) {
    if (!this.isActive) {
      return callback()
    }
    let obj
    try {
      obj = await this.read(key)
      // console.log('obj from redis', obj)
      if (obj) {
        return obj
      }

      obj = await callback()
      if (obj) {
        await this.write(key, obj, expires)
      }
    } finally {
      disconnect && this.disconnect()
    }
    return obj
  }
}
