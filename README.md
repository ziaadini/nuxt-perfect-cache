## usage 

```
npm i nuxt-perfect-cache
```
first of all config redis to your machine
if you are using ubuntu there is a good video here is the link:
https://www.youtube.com/watch?v=gNPgaBugCWk
```javascript
// nuxt.config.js

modules: [
    [
        'nuxt-perfect-cache',
        {
          disable: false,
          appendHost: true,
          ignoreConnectionErrors:false, //it's better to be true in production
          prefix: 'r-',
          url: 'redis://127.0.0.1:6379',
          getCacheData(route, context) {          
            if (route !== '/') {
              return false
            }
            return { key: 'my-home-page', expire: 60 * 60 }//1hour
          }
        }
      ]
]

```

## options

| Property | Type | Required? | Description 
|:---|:---|:---|:---|
| disable | boolean | no | default is `true` you can disable all module features
| appendHost | boolean | no | default is `true` append host to the key
| ignoreConnectionErrors | boolean | no | default is `false` ignore connection errors and render data as normal
| prefix | string | no | default is `r-` it's redis prefix key
| url | string | no | default is `redis://127.0.0.1:6379` url for redis connection
| getCacheData | function | yes | should return an object include key and expire if return false page will not cache

#### note
 ignoreConnectionErrors added in 1.0.4 version
## caveat
**important security warning** : don't load secret keys such as user credential on the server for cached pages.
 _this is because they will cache for all users!_
 
### side note
if during test process in your local machine your page start rerender over and over it is not a big deal that is because package changed nuxt render function
to solve that open a route not include cache in your browser **until build process done**
## api request caching
```javascript
asyncData(ctx) {
    return ctx.$cacheFetch({ key: 'myApiKey', expire: 60 * 2 }, () => {
      console.log('my callback called*******')
      return ctx.$axios.$get('https://jsonplaceholder.typicode.com/todos/1')
    })
  }
```
ok let me explain what is happening: 
nuxt-perfect-cache inject a plugin `cacheFetch` this is a function with two parameters
the first one get an object include `key` and `expire` for redis
second parameter is a callback function should return your normal request as a promise
`cacheFetch` method will check if the process is in the server then check key in redis
if key exist return data from redis if not call your callback as normal
this method useful for consistent requests such as menu

## caveat
then callback function should return a valid json for `JSON.stringify` method

## features
- easy to use
- cache whole page in the redis
- separate expire time for each page
- api request cache

## more control
to save a page to another redis server just return 
`{key:string,expire:number,url:"my new url"}`
inside `getCacheData` method

also, it is possible for `catcheFetch` method here is full object you can pass
`{ key,expire,disable,url,prefix,ignoreConnectionErrors}`

for write and read directly you can use two injected methods:

`const data = await $cacheRead({ key:'youtKey' })`

data is null if key is not exist

`const flag = await $cacheWrite({ key, expire: 60*60*24 }, 'yout content')`

flag is false if can not write

_note that you have to make sure process is in the server for `cacheRead` and `cacheWrite` methods_

## security warning
 just note that you should use private redis server, if you are using a public redis server with a password be aware your password will bundle in client and leaks