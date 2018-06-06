## 利用js闭包实现防抖和节流功能

### 问题引出
当我们在界面上添加一些高频操作的绑定事件的时候，有可能会在短时间内多次触发该绑定事件，影响前端界面的性能，比如在scroll、resize上去新增一些绑定事件。为了提高性能，减少重复的事件响应，我们可以利用闭包的特性来实现防抖和节流功能。

### 防抖
在某一个时间段之类的所有事件调用，都被合并成一次调用。或者说，在特定时间内，只允许该事件执行一次，其他的调用均被忽略掉。
具体实现如下：

```javascript
<script type="text/javascript">
	function debounce(fn, delay) {
		var timer; // 利用闭包的特性，timer只对函数内部可见
		return function(){ // 之后外部每次使用的都是这个返回的内部匿名函数
			var that = this;
			var arg = arguments;
			console.log('arguments is ', arguments);
			clearTimeout(timer); // 这里timer即为父函数中声明，只在内部匿名函数可见
			timer = setTimeout(()=>{
				fn.apply(that, arg);
			}, delay);
		}
	}

	function foo() {
		console.log('you are scroll-------------------');
	}

	var debounceName = debounce(foo, 2000); // debounce调用后，则持有了对timer的引用
	window.addEventListener('scroll', debounceName);
	// 使用结束，需要释放对闭包中timer的引用
	// window.removeEventListener('scroll', debounceName);
	// debounceName = null; 
</script>

### 节流
在某一个时间段之类的所有事件调用，都被合并处理。或者说，不管这个事件触发的持续时间是多久，到了固定的时间间隔，都会执行一次该事件上绑定的方法。实现方式有两种：
* 时间戳
* 定时器

具体实现如下：
```javascript
<script type="text/javascript">
	// 时间戳
	function throttle(fn, delay) {
		var pre = Date.now();
		return function() {
			var that = this;
			var arg = arguments;
			if(Date.now()-pre > delay){
				fn.apply(that, arg);
				pre = Date.now();
			}
		}
	}
	function foo() {
		console.log('you are scroll-------------------');
	}

	// 首先会触发第一次执行，若持续拖动滚动条，那么每多1秒又会多有一次打印信息
	var throttleName = throttle(foo, 1000); 
	window.addEventListener('scroll', throttleName);

	// 使用结束，需要释放引用
	// window.removeEventListener('scroll', throttleName);
	// throttleName = null; 


	// 定时器
	// function throttleTimer(fn, delay) {
	// 	var timer;
	// 	return function() {
	// 		var that = this;
	// 		var arg = arguments;
	// 		if(!timer){
	// 			timer = setTimeout(()=>{
	// 				fn.apply(that, arg);
	// 				timer = null;
	// 			}, delay);
	// 		}
	// 	}
	// }
</script>