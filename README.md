#### Installation

```
npm i nuxt-perfect-cache
 // OR
yarn add nuxt-perfect-cache
```

#### Config redis machine

first of all config redis to your machine
if you are using ubuntu there is a good video here is the link:
https://www.youtube.com/watch?v=gNPgaBugCWk

#### Add module into nuxt.config.js modules section

```javascript
// nuxt.config.js file

modules: [
	[
		"nuxt-perfect-cache",
		{
			disable: false,
			appendHost: true,
			ignoreConnectionErrors: false, // it's better to be true in production
			prefix: "r-",
			url: "redis://127.0.0.1:6379",
			getCacheData(route, context) {
				if (route !== "/") {
					return false;
				}
				return { key: "my-home-page", expire: 60 * 60 }; // 1hour
			},
		},
	],
];
```

#### options

| Property               | Type     | Required? | Description                                                                        |
| :--------------------- | :------- | :-------- | :--------------------------------------------------------------------------------- |
| disable                | boolean  | no        | default is `true` you can disable all module features                              |
| appendHost             | boolean  | no        | default is `true` append host to the key                                           |
| ignoreConnectionErrors | boolean  | no        | default is `false` ignore connection errors and render data as normal              |
| prefix                 | string   | no        | default is `r-` it's redis prefix key                                              |
| url                    | string   | no        | default is `redis://127.0.0.1:6379` url for redis connection                       |
| getCacheData           | function | yes       | should return an object include key and expire if return false page will not cache |

#### note

ignoreConnectionErrors added in 1.0.4 version

### side note

- **Loop render issue:** if during test process on local machine page start rerender over and over:
  - it is not a big deal that is because package changed nuxt render function to solve that open a route not include cache in your browser **until build process done**

## api request caching

```javascript
asyncData(ctx) {
    return ctx.$cacheFetch({ key: 'myApiKey', expire: 60 * 2 }, () => {
      console.log('my callback called*******')
      return ctx.$axios.$get('https://jsonplaceholder.typicode.com/todos/1')
    })
  }
```

###### explanation what happend under the module with cacheFetch method:

1. nuxt-perfect-cache inject a plugin `cacheFetch`,
   function with two parameters: - first one get an object include `key` and `expire` for redis - second is a callback function which should return request as a promise
2. `cacheFetch` method will check if the process is in the server, then check the key in redis
   - if key exist: it return data from redis
   - if not it'll call your callback as normal

(_this method useful for consistent requests such as menu_)

## features

- easy to use
- use in **asyncData** or **$fetch** or any server method of Nuxt
- cache API request cache/whole page in the **redis**
- separate expire time for each page / request

## additional features

###### save a page to another redis server instance, just return

- `{key:string,expire:number,url:"my new url"}`
  inside `getCacheData` method

example:

```javascript
// nuxt.config.js file

modules: [
    [
        'nuxt-perfect-cache',
        {
          ...
          getCacheData(route, context) {
            if (route !== '/') {
              return false
            }

            if (route === 'newest-products') {
              return {
              key: 'page-newest-products',
              expire: 60 * 120, // 2hour
              url:"redis://127.0.0.1:6380" // the default instance have port 6379
              }
            }

            return { key: 'my-home-page', expire: 60 * 60 } // 1hour
          }
        }
      ]
]

```

###### also, it is possible for `catcheFetch` method here is full object you can pass

- `{ key,expire,disable,url,prefix,ignoreConnectionErrors}`

###### for write and read directly you can use two injected methods:

- `const data = await $cacheRead({ key:'yourKey' })`
  (data is null if key is not exist)

- `const flag = await $cacheWrite({ key, expire: 60*60*24 }, 'yourContent')`
  (flag is false if can not write)

## caveats

- then callback function should return a valid json for `JSON.stringify` method
- note that you **have to make sure process is in the server** for `cacheRead` and `cacheWrite` methods
  **important security warning** : don't load secret keys such as user credential on the server for cached pages.
  (_this is because they will cache for all users!_)
