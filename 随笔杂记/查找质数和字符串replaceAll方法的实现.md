### 寻找质数

## 什么是质数？
质数又称素数。一个大于1的自然数，除了1和它自身外，不能整除其他自然数的数叫做质数；否则称为合数。

## 解题思路
1、 因为2是质数，所以可以直接从3开始判定；
2、 因为大于2的偶数肯定不是质数（可以被2整除），所以每次递进为2，只考虑奇数就可以了；
3、 终止条件为 num 开平方，这一点可以利用反证法来证明。
假设num不是质数，n = Math.sqrt(num), 并且 num = a*b; 
如果 a > n; b > n; 那么 a*b > n*n, 这是不可能的，因为 a*b 和 n*n应该相等才对；
所以 a, b之间一定有一个小于n；那么我们找到小于n的这个因子就可以了；所以终止条件可以是 num 开平方
具体实现代码如下：

``` javascript
function isPrime(num) {
	if(num === 2) return true;
	var n = Math.sqrt(num);
	for(var i = 3; i <= n; i += 2) {
		if(num % i === 0) return false;
	}
	return true;
}


### 字符串实现replaceAll方法

1、 利用正则表达式 和 replace
2、 利用split 和 join 方法

``` javascript 
String.prototype.replaceAll = function (reg, target) {
	// "gm" 的写法就是正则表达式，全局匹配的一种写法
	return this.replace(new RegExp(reg,"gm"), target);
}
String.prototype.replaceAll2 = function (reg, target) {
	return this.split(reg).join(target);
}
