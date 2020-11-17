# axios.js

axios是一款当下及其流行的、支持Promise API方式调用的、同时封装了浏览器端和node.js端HTTP请求的工具库函数。

所有的关键函数都是在.\lib\文件夹下，总共有大概1500+行代码

## [Features](https://github.com/axios/axios#features)

* [浏览器中使用 new XMLHttpRequest() 发送请求](#Make XMLHttpRequests from the browser)
* node.js中使用 原生(或者‘follow-redirects’)http/https模块的request() 发送请求
* 支持Promise的API
* 提供拦截器，可以拦截 request & response
* 提供转换器，可以对请求数据和响应数据中的data字段内容进行自定义转换
* 提供取消功能，可以主动取消请求
* 自动转化JSON数据
* 客户端提供了 XSRF 的防护功能

## Make XMLHttpRequests from the browser

源码地址： lib\adapters\xhr.js

1. 构造一个立即执行的Promise对象包裹，因此可以支持Promise API的调用方式

   ``` javascript
   module.exports = function xhrAdapter(config) {
     return new Promise(function dispatchXhrRequest(resolve, reject) {});
   }
   ```

2. 预处理

   ``` javascript
      var requestData = config.data;
      var requestHeaders = config.headers;
      if (utils.isFormData(requestData)) { // 针对 FormData 需要删除请求headers中的 Content-Type 字段
        delete requestHeaders['Content-Type']; // Let the browser set it
      }
      // HTTP basic authentication
      if (config.auth) {
        var username = config.auth.username || '';
        var password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
        requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password); // btoa() 方法用于创建一个 base-64 编码的字符串 在window全局对象上
      }
   ```

3. 构造 XMLHttpRequest 请求对象

   ``` javascript
       var request = new XMLHttpRequest();
   		// 构造url
       var fullPath = buildFullPath(config.baseURL, config.url);
       var url = buildURL(fullPath, config.params, config.paramsSerializer);
   		// 打开异步请求对象
   		request.open(config.method.toUpperCase(), url, /* async */ true);
       // Set the request timeout in MS
       request.timeout = config.timeout;
   ```

4. 监听 readystatechange

   ``` javascript
   request.onreadystatechange = function handleLoad() {
     // 如果request已经置空 或者当前request的状态不是DONE(4) 直接返回
     if (!request || request.readyState !== 4) {
       return;
     }
   
     // The request errored out and we didn't get a response, this will be
     // handled by onerror instead
     // With one exception: request that using file: protocol, most browsers
     // will return status as 0 even though it's a successful request
     if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
       return;
     }
   
     // Prepare the response
     var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
     // responseType 为空字符串或者'text'时，返回值是默认类型 DOMString，放置在responseText中；否则在response中
     var responseData = (config.responseType === '' || config.responseType === 'text') ? request.responseText : request.response;
     var response = {
       data: responseData,
       status: request.status,
       statusText: request.statusText,
       headers: responseHeaders,
       config: config,
       request: request
     };
   
     settle(resolve, reject, response);
   
     // Clean up request
     request = null;
   };
   ```
   
   从源码中得知，readystatechange 这个监听事件中主要做5个事情
   
   * 判定request对象是否置空，或者 readyState !== 4 (即未达到DONE的状态)，直接返回
   * 判定 file: protocol 的特殊场景，直接返回
   * 构造 axios 自定义的 response 对象
   * 调用 settle(resolve, reject, response) 方法将 response 传递出去
   * request 对象置空 
   
   后续的大部分场景最后都需要将request对象置空，一个是方便其他地方判定当前request是否已经中止/终止，另一个也是方便垃圾回收机制将request对象回收。
   
   关于settle再多说一句，功能如下，依据返回对象的 status 来决定是 resolve 还是reject返回值。
   
   ``` javascript
   /**
    * Resolve or reject a Promise based on response status.
    *
    * @param {Function} resolve A function that resolves the promise.
    * @param {Function} reject A function that rejects the promise.
    * @param {object} response The response.
    */
   module.exports = function settle(resolve, reject, response) {
     var validateStatus = response.config.validateStatus;
     if (!response.status || !validateStatus || validateStatus(response.status)) {
       resolve(response);
     } else {
       reject(createError(
         'Request failed with status code ' + response.status,
         response.config,
         null,
         response.request,
         response
       ));
     }
   };
   ```

   校验方法可以自定义，没有配置自定义则使用默认值
   ``` javascript
   validateStatus: function validateStatus(status) {
     return status >= 200 && status < 300;
   }
   ```

5. 监听abort终止事件

   ``` javascript
   // Handle browser request cancellation (as opposed to a manual cancellation)
   request.onabort = function handleAbort() {
     if (!request) {
       return;
     }
     
     reject(createError('Request aborted', config, 'ECONNABORTED', request));
   
     // Clean up request
     request = null;
   };
   ```

6. 监听error事件

   ```javascript
   // Handle low level network errors
   request.onerror = function handleError() {
     // Real errors are hidden from us by the browser
     // onerror should only fire if it's a network error
     reject(createError('Network Error', config, null, request));
     // Clean up request
     request = null;
   };
   ```

   

7. 监听timeout事件

   ```javascript
   // Handle timeout
   request.ontimeout = function handleTimeout() {
     var timeoutErrorMessage = 'timeout of ' + config.timeout + 'ms exceeded';
     if (config.timeoutErrorMessage) {
       timeoutErrorMessage = config.timeoutErrorMessage;
     }
     reject(createError(timeoutErrorMessage, config, 'ECONNABORTED',
       request));
     // Clean up request
     request = null;
   };
   ```

8. 客户端防止XSRF攻击 - 跨站请求伪造(Cross-Site Request Forgery)

   ```javascript
   // Add xsrf header
   // This is only done if running in a standard browser environment.
   // Specifically not if we're in a web worker, or react-native.
   if (utils.isStandardBrowserEnv()) {
     // Add xsrf header
     var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
       cookies.read(config.xsrfCookieName) :
       undefined;
     if (xsrfValue) {
       requestHeaders[config.xsrfHeaderName] = xsrfValue;
     }
   }
   ```

   有以下使用限制条件

   * 只在标准的浏览器环境中使用(web worker 或者 react-native 不会生效)
   * 在config设置了 withCredentials 或者 是同域名下的请求路径
   * 并且在config设置了 xsrfCookieName 字段

   然后才会在请求的header中新增一个 [xsrfHeaderName] = xsrfValue 的键值对，其中 xsrfValue 来源于 cookies， 也就是服务端设置的。所以为了防止跨站请求伪造，还是需要前后端共同处理。

   * 后端通过 set-cookie 将一个特定的xsrfValue设置在浏览器的 cookie 中
   * 浏览器下次发送请求的时候需要在请求头里面带上这个 xsrfHeaderName:xsrfValue 键值对。

9. 将 config 中的header 键值对实际设置到 request 对象的headers属性上

   ```javascript
   // Add headers to the request
   if ('setRequestHeader' in request) {
     utils.forEach(requestHeaders, function setRequestHeader(val, key) {
       if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
         // Remove Content-Type if data is undefined
         delete requestHeaders[key];
       } else {
         // Otherwise add header to the request
         request.setRequestHeader(key, val);
       }
     });
   }
   ```

10. 将 withCredentials 添加到 request 对象上

    ```javas
    // Add withCredentials to request if needed
    if (!utils.isUndefined(config.withCredentials)) {
      request.withCredentials = !!config.withCredentials;
    }
    ```

    request.withCredentials 是一个布尔值，用来指定跨域 Access-Control 请求是否应当带有授权信息，如 cookie 或授权 header 头.

11. 处理上传下载进度

    ```javas
        // Handle progress if needed
        if (typeof config.onDownloadProgress === 'function') {
          request.addEventListener('progress', config.onDownloadProgress);
        }
    
        // Not all browsers support upload events
        if (typeof config.onUploadProgress === 'function' && request.upload) {
          request.upload.addEventListener('progress', config.onUploadProgress);
        }
    ```

    

12. 处理[主动取消](#Cancel requests)

    ```javascript
        if (config.cancelToken) { // 获取config上的cancelToken实例对象，这个对象可以被多个请求共用
          // Handle cancellation
          config.cancelToken.promise
            .then(function onCanceled(cancel) { // 这里的cancel是一个Cancel(message)对象， Cancel.prototype.__CANCEL__ = true
            if (!request) { // 如果request === null 说明当前请求已经因为其他原因(超时/报错等)被置空了，直接返回
              return;
            }
    
            request.abort(); // 主动调用当前请求的abort方法，终止当前请求
            reject(cancel); // reject 一个Cancel(message)对象
            // Clean up request
            request = null;
          });
        }
    ```

    关于取消

    * > Note: you can cancel several requests with the same cancel token.

      * 当cancelToken实例对象，被多个requests共用时，

13. 如果请求数据(var requestData = config.data)为空(undefined), 将其赋值为null，避免send的过程中将undefined转换为字符串下发

    ```javascript
        if (!requestData) {
          requestData = null;
        }
    ```

14. 发送请求

    ```javascript
        // Send the request
        request.send(requestData);
    ```

    

## Make http requests from node.js
## Supports the Promise API

请求都被封装在了adapter这个方法中了

Browser 浏览器端 lib\adapters\xhr.js

```javascript
module.exports = function xhrAdapter(config) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {});
};
```

Node.js 服务器端 lib\adapters\http.js

```javascript
module.exports = function httpAdapter(config) {
  return new Promise(function dispatchHttpRequest(resolvePromise, rejectPromise) {});
};
```

都是用Promise对请求进行了内部封装，返回的都是Promise对象，自然能够支持Promise API

## Intercept request and response

### 使用方式

查看Axios的构造函数得知，每一个axios实例都有自己interceptors对象，对象属性{request, response}分别对应着请求拦截器和响应拦截器

```javascript
function Axios(instanceConfig) {
  this.defaults = instanceConfig;
  this.interceptors = {
    request: new InterceptorManager(),
    response: new InterceptorManager()
  };
}
```

在Axios的原型上有一个通用的发送请求的方法 request

```javascript
var dispatchRequest = require('./dispatchRequest');

Axios.prototype.request = function request(config) {
  /* 省略部分代码 */
  
  // Hook up interceptors middleware
  var chain = [dispatchRequest, undefined]; // 构造promise数组链
  var promise = Promise.resolve(config); // 将config配置对象作为首个resolve对象传递给下一个promise对象处理

  this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
    // 将请求拦截器放入promise数组链头部 顺序和use的注册顺序相反
    chain.unshift(interceptor.fulfilled, interceptor.rejected);
  });

  this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
    // 将响应拦截器放入promise数组链尾部 顺序和use的注册顺序一致
    chain.push(interceptor.fulfilled, interceptor.rejected);
  });

  while (chain.length) {
    promise = promise.then(chain.shift(), chain.shift());
  }

  return promise;
}
```

构造了一个promise数组链，将请求步骤放在中间，头部插入请求拦截器，尾部插入响应拦截器，依次循环整个promise数组链，巧妙地利用了promise.then方法的向后传递性。

### 源码分析

关键代码实现 lib\core\InterceptorManager.js

构造函数: 非常简单，就是声明了一个handlers属性的数组，用来存储{fulfilled, rejected}对象

```javascript
function InterceptorManager() {
  this.handlers = [];
}
```

原型上的通用方法有3个

use(fulfilled, reject)： 将{fulfilled, rejected}对象放入到数组中

```javascript
/**
 * Add a new interceptor to the stack
 * @param {Function} fulfilled The function to handle `then` for a `Promise`
 * @param {Function} rejected The function to handle `reject` for a `Promise`
 * @return {Number} An ID used to remove interceptor later
 */
InterceptorManager.prototype.use = function use(fulfilled, rejected) {
  this.handlers.push({
    fulfilled: fulfilled,
    rejected: rejected
  });
  return this.handlers.length - 1;
};
```

eject(id): 弹出方法就是直接把对应数组位置的内容置为null

```javascript
/**
 * Remove an interceptor from the stack
 * @param {Number} id The ID that was returned by `use`
 */
InterceptorManager.prototype.eject = function eject(id) {
  if (this.handlers[id]) {
    this.handlers[id] = null;
  }
};
```

forEach(fn)： loop整个handlers数组，并忽略掉eject置空的对象

```javascript
/**
 * Iterate over all the registered interceptors
 * This method is particularly useful for skipping over any
 * interceptors that may have become `null` calling `eject`.
 * @param {Function} fn The function to call for each interceptor
 */
InterceptorManager.prototype.forEach = function forEach(fn) {
  utils.forEach(this.handlers, function forEachHandler(h) {
    if (h !== null) {
      fn(h);
    }
  });
};
```

### 使用场景

请求拦截器主要负责处理config对象，也可以对错误信息进行自定义封装

```javascript
// Add a request interceptor
axios.interceptors.request.use(function (config) {
    // Do something before request is sent
    // 处理config.header，新增cookie、token之类的
    return config;
  }, function (error) {
    // Do something with request error
    return Promise.reject(error);
  });
```

而响应拦截器主要负责处理response对象，也可以对错误信息进行自定义封装

```javascript
// Add a response interceptor
axios.interceptors.response.use(function (response) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    return response;
  }, function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    // 比如 status code === 401的时候将用户页面重定向到登陆页面之类的
    return Promise.reject(error);
  });
```

## Transform request and response data

### config关键字段

* config.transformRequest // 转换请求数据的方法或者方法数组
* config.transformResponse // 转换响应数据的方法或者方法数组

> A single function or Array of functions

### 调用时机

所有的调用都发生在lib\core\dispatchRequest.js中

请求发送前，主要是转换config.data

```javascript
  // Transform request data
  config.data = transformData(
    config.data,
    config.headers,
    config.transformRequest // 转换请求数据的方法数组
  );
```

监听请求结果，主要是转换 response.data 或者 reason.response.data

```javascript
  function onAdapterResolution(response) {
    throwIfCancellationRequested(config);
    // Transform response data
    response.data = transformData(
      response.data,
      response.headers,
      config.transformResponse // 转换响应数据的方法数组
    );
    return response;
  }

  function onAdapterRejection(reason) {
    if (!isCancel(reason)) {
      throwIfCancellationRequested(config);
      // Transform response data
      if (reason && reason.response) {
        reason.response.data = transformData(
          reason.response.data,
          reason.response.headers,
          config.transformResponse // 转换响应数据的方法数组
        );
      }
    }
    return Promise.reject(reason);
  }
```

### transformData方法实现

在lib\core\transformData.js文件中，内容非常少，就是将data,headers作为函数实参传入，依次执行数组中的每一个方法

```javascript
/**
 * Transform the data for a request or a response
 *
 * @param {Object|String} data The data to be transformed
 * @param {Array} headers The headers for the request or response
 * @param {Array|Function} fns A single function or Array of functions
 * @returns {*} The resulting transformed data
 */
module.exports = function transformData(data, headers, fns) {
  /*eslint no-param-reassign:0*/
  utils.forEach(fns, function transform(fn) {
    data = fn(data, headers);
  });
  return data;
};
```



## Cancel requests

### 设计思路

> The axios cancel token API is based on the withdrawn [cancelable promises proposal](https://github.com/tc39/proposal-cancelable-promises)

axios取消令牌对象API的设计思路就是基于已经撤销的一个提案 - TC39：可取消的promises提案。提案具体内容先不说，来看axios的实现思路。

* 构建一个cancelToken对象
  * 构造函数中传入executor，类似于Promise的构造函数，这个executor方法会构造函数的最后被立即执行
  * 对象的promise属性上挂载一个promise对象，并且把这个promise对象的resolve方法暴露出来
  * 执行executor，并将一个cancel方法暴露到外部，这个cancel方法可以调用上一步中暴露出来的resolve方法
* 在请求下发之前，通过cancelToken.promise.then方法注册监听函数，一旦promise对象的状态变为onFulfilled，就调用当前请求的abort方法
* 记录暴露出来的cancel方法，一旦调用这个方法，就可以将promise的状态从pending改为onFulfilled，从而触发上一步.then注册的监听函数

### 源码分析

取消请求的相关逻辑都在 lib\cancel\CancelToken.js 和 lib\cancel\Cancel.js中

#### Cancel.js

先看Cancel.js的描述

> A `Cancel` is an object that is thrown when an operation is canceled.

构造函数非常简单，只有一个字符串类型的message属性

```javascript
function Cancel(message) {
  this.message = message;
}
```

它的原型对象上也只有两个属性

```javascript
// 创建自己的 toString 方法，方便打印显示
Cancel.prototype.toString = function toString() {
  return 'Cancel' + (this.message ? ': ' + this.message : '');
};
// 特殊字段 __CANCEL__ 设置为true
Cancel.prototype.__CANCEL__ = true;
// 导出这个对象类
module.exports = Cancel;
```

#### CancelToken.js

先看CancelToken.js的描述

> A `CancelToken` is an object that can be used to request cancellation of an operation.

它是一个可以用来取消请求操作的对象。

构造函数

```javascript
/**
 * @class
 * @param {Function} executor The executor function.
 */
function CancelToken(executor) {
  if (typeof executor !== 'function') {
    throw new TypeError('executor must be a function.');
  }

  var resolvePromise; // 用来记录新建的promise对象的执行器里面的resolve回调函数
  // 新建的promise对象被挂载到了当前CancelToken的实例对象的promise属性上，后续 new CancelToken(fn).promise.then 就可以直接注册执行事件了
  this.promise = new Promise(function promiseExecutor(resolve/*, reject (用不到，所以忽略第二个参数)*/) {
    // promise本身会被立即执行，赋值语句生效
    resolvePromise = resolve; // 在resolvePromise被调用之前，promise对象一直处于pending状态
  });

  var token = this; // 利用闭包，token记录当前CancelToken的实例对象
  function cancel(message) {
    if (token.reason) {
      // Cancellation has already been requested
      return;
    }

    // 构造Cancel对象记录message，并挂载到token实例的reason属性上(和Promise的reject中的reason没有关系)
    token.reason = new Cancel(message); 
    // 调用promise resolve，将记录了message信息的cancel对象作为最终结果放入promise.value中，并且状态值fulfilled
    resolvePromise(token.reason);
  }
  executor(cancel); // 将cancel方法作为一个实体参数传入，立即执行executor方法
}
```

CancelToken原型对象上的方法

```javascript
/**
 * Throws a `Cancel` if cancellation has been requested.
 */
CancelToken.prototype.throwIfRequested = function throwIfRequested() {
  if (this.reason) { // 如果reason有赋值，证明cancel方法已经被调用过了，将reason属性对应的 *记录了message信息的cancel对象* 抛出
    throw this.reason;
  }
};
```

关键点在第二个方法: CancelToken的静态方法 source，这是一个工厂函数，可以快速的构造cancelToken实例以及指向这个实例内部cancel方法的引用

```javascript
/**
 * Returns an object that contains a new `CancelToken` and a function that, when called,
 * cancels the `CancelToken`.
 */
CancelToken.source = function source() {
  var cancel; // 利用闭包记录 真正执行的 cancel 方法
  var token = new CancelToken(function executor(c) {
    cancel = c;
  });
  return {
    token: token,
    cancel: cancel
  };
};
```

### 流程图

请求调用的执行流程图

![axios-cancel-workflow](.\axios-cancel-workflow.png)

* 下发请求
  * 浏览器 or node.js  => 获取对应的adapter
  * 注册监听请求promise对象的返回值
    * onFulfilled
    * onRejected(reason)
      * 返回的的reason对象是否是一个Cancel对象(`reason.__CANCEL__` === true)
  * 检查是否配置了 config.cancelToken 对象
    * 调用 config.cancelToken.throwIfRequested()
      * 判定cancelToken.reason 是否有值
        * yes? 说明已经调用了cancel方法，并且`cancelToken.reason = new Cancel(message)`已经执行过了，抛出reason对象
        * no? 说明没有调用cancel方法，直接返回

### 使用方式

1. 利用`CancelToken.source`工厂函数之间生成一个 {token, cancel} 对象，token作为config.cancelToken传入，而调用cancel方法则可以终止(abort)当前请求。

   ```javascript
   const CancelToken = axios.CancelToken;
   const source = CancelToken.source();
   
   axios.get('/user/12345', {
     cancelToken: source.token // token作为config.cancelToken传入
   }).catch(function (thrown) {
     if (axios.isCancel(thrown)) { // 判定reject出来的是否是一个 Cancel 对象(thrown.__CANCEL__ === true ??)
       console.log('Request canceled', thrown.message);
     } else {
       // handle error
     }
   });
   
   axios.post('/user/12345', {
     name: 'new name'
   }, {
     cancelToken: source.token // token作为config.cancelToken传入
   })
   
   // cancel the request (the message parameter is optional)
   source.cancel('Operation canceled by the user.'); // 持有这个引用可以随时取消关联的所有请求
   ```

2. 利用CancelToken构造函数自己新建实例，传入executor来获取对应的cancel方法引用

   ```javascript
   const CancelToken = axios.CancelToken;
   let cancel; // 记录对应的CancelToken的取消函数引用
   
   axios.get('/user/12345', {
     cancelToken: new CancelToken(function executor(c) {
       // An executor function receives a cancel function as a parameter
       cancel = c; // 一定要将这个取消函数c的引用暴露到外部
     })
   });
   
   // cancel the request
   cancel();
   ```

### 关键点总结

* > Note: you can cancel several requests with the same cancel token.

  * 比如批量生成很多个axios.request请求，都使用同一个cancelToken，那么就可以通过调用关联的一个cancel函数，把所有的请求都中断掉

* cancelToken.promise属性是在token构造函数初始化的时候生成的，初始状态为pending

* cancelToken中内部cancel()必须通过executor的时候暴露到外部

  * cancel是一个固定的内部函数，两个关键点

    * 构造Cancel对象记录message
    * 调用promise resolve，切换状态 pending => onFulfilled

    ```javascript
      function cancel(message) {
        if (token.reason) {
          // Cancellation has already been requested
          return;
        }
        // 1. 构造Cancel对象记录message，并挂载到token实例的reason属性上(和Promise的reject中的reason没有关系)
        token.reason = new Cancel(message); 
        // 2. 调用promise resolve，将记录了message信息的cancel对象作为最终结果放入promise.value中，并且状态值fulfilled
        resolvePromise(token.reason);
      }
    ```

* 当cancel()被调用后，cancelToken.promise状态为onFulfilled并且不再发生变化
  
* 调用axios.request的时候，不要在config里传入一个promise状态已经为onFulfilled的cancelToken对象，否则所有的请求都会在发出之后就被abort掉。
  
* 对照dispatchRequest方法中的 `throwIfCancellationRequested`调用场景
  * 请求发送前：首次进入dispatchRequest方法中
  * 请求发送后：
    * onFulfilled
    * onRejected

## Automatic transforms for JSON data
## Client side support for protecting against XSRF

### What is XSRF?

跨站请求伪造 (Cross-site Request Forgery)
> 它利用了web中用户身份验证的一个漏洞：简单的身份验证只能保证请求发自某个用户的浏览器，却不能保证请求本身是用户自愿发出的。

攻击场景如下

* 用户刚刚登陆了银行网站A，浏览器记录下用户的登录token信息
  * 银行转账的API请求：`http://www.examplebank.com/withdraw?account=AccoutName&amount=1000&for=PayeeName`
* 攻击者构造攻击数据(比如发送邮件，或者在独立构造一个攻击站点B)，然后引导用户在点击访问
  * 攻击者构造如下转账攻击数据：`<img src="http://www.examplebank.com/withdraw?account=Alice&amount=1000&for=Badman">`

由于浏览器的图片src解析属性，会直接发出该HTTP请求，由于请求是从用户的浏览器中发出，并且用户还刚刚登录了A站点，所以请求的cookies信息中会带有登录的token信息，A站点的服务端收到后认为是用户主动发起的转账请求，钱就被转到攻击者的账户里了。

一般有两种常用手段可以防范XSRF 跨站请求伪造 

* 检查Referer字段

  > HTTP头中有一个Referer字段，这个字段用以标明请求来源于哪个地址。在处理敏感数据请求时，通常来说，Referer字段应和请求的地址位于同一域名下。以银行转账为例，Referer字段地址通常应该是转账按钮所在的网页地址，应该也位于A站点之下。而如果是CSRF攻击传来的请求，Referer字段会是包含恶意网址的地址(比如B站点地址)，不会位于A站点之下，这时候服务器就能识别出恶意的访问

* 添加校验token

  > 针对用户的登录访问，服务器生成一个伪随机数token返回给浏览器，浏览器在随后的所有请求中都带上这个伪随机数，服务器每次都校验token的值是否一致。通过CSRF传来的欺骗性攻击中，攻击者无从事先得知这个伪随机数的值，服务端就会因为校验token的值为空或者错误，拒绝这个可疑请求。

  * 服务端可以硬编码(hard code)，也可以针对每个不同的用户首次登录访问，生成一个不同的token(伪随机数)存储在SESSION中
  * 服务端将token返回，可以将这个token生成到页面上，或者以某个特殊字段写入用户浏览器的cookies中
  * 客户端的每次请求都带上token值，可以放在headers里的某个字段，也可以放在请求数据中，需要和后端协商好具体传送方式
  * 服务端每次都校验token值，不存在或者不一致则报错，拒绝后续执行步骤

  由于跨站请求伪造只是利用了用户的登录状态，模拟用户发送请求，攻击者无法事先获取我们前后端约定的token存放方式，和具体的存放key，也就没有办法获取到对应token的value，也没办法轻易地模拟用户发送请求了。后端可以通过token的校验快速识别出跨站请求伪造攻击。

axios就是利用的第二种防御手段 - 在标准浏览器发送的每一次请求中，都可以在通过config的配置，在headers中添加一个特殊的字段名，服务端就可以校验这个字段内容了。

### 源码分析

config中的默认值设置在 lib\defaults.js

```javascript
  // lib\defaults.js
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
```

关于 XMLHttpRequest.withCredentials 的知识扩展

> **XMLHttpRequest.withCredentials**  属性是一个[`Boolean`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Boolean)类型，它指示了是否该使用类似cookies,authorization headers(头部授权)或者TLS客户端证书这一类资格证书来创建一个跨站点访问控制（cross-site `Access-Control`）请求。在同一个站点下使用`withCredentials属性是无效的`

* 在同一个站点下使用`withCredentials属性是无效的`，即 **永远不会影响到同源请求**

代码位置 lib\adapters\xhr.js， 只针对标准浏览器生效，不针对web worker和react-native

```javascript
    // Add xsrf header
    // This is only done if running in a standard browser environment.
    // Specifically not if we're in a web worker, or react-native.
    if (utils.isStandardBrowserEnv()) {
      // Add xsrf header
      var needReadCookieName = (config.withCredentials || isURLSameOrigin(fullPath));
      var xsrfValue = needReadCookieName && config.xsrfCookieName ? /* 我们可以自定义这个字段名，如果没有，则使用默认值['XSRF-TOKEN'] */
        cookies.read(config.xsrfCookieName) :
        undefined;

      if (xsrfValue) {
        // 如果从cookies中读取到了对应的值，那么就将它放置在请求的headers字段中
        // 我们可以自定义这个字段名，如果没有，则使用默认值['X-XSRF-TOKEN']
        requestHeaders[config.xsrfHeaderName] = xsrfValue;
      }
    }
```

如果 config.withCredentials === true 或者是同源站点的请求，并且 config.xsrfCookieName 设置了值，那么就从cookies中读取这个值，并将它放置在请求的headers字段中，跟随这个请求一并发送到服务端，那么服务端就可以校验头部字段里这个特殊字段名['X-XSRF-TOKEN']是否是之前设置的随机值。

所以axios只是提供了一种方式，可以在需要的情况下，每一次的请求中都从cookies中读取一个约定好的字段内容，并将它放入到headers的一个约定好的字段中，随每一次的请求发送出去。

前端实现没有难点，难点在于前后端约定交互的关键key，需要保持一致。axios默认需要将服务端的校验token存入到cookies中，而不能使用写入页面的方式（比如服务端渲染，直接在页面上添加 {% csrf_token %}之类的标签，将内容写入HTML页面）