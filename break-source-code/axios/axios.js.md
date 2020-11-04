# axios.js

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

    

12. 

## Make http requests from node.js
## Supports the Promise API
## Intercept request and response
## Transform request and response data
## Cancel requests
## Automatic transforms for JSON data
## Client side support for protecting against XSRF