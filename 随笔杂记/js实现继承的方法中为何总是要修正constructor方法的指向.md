# 问题引入
最近看了许多关于js继承实现的相关文章，许多实现方式中都会存在这么一行代码：
```javascript
A.prototype.constructor = A
```
于是感到好奇，这行代码的实际意义是什么？如果没有的话，还能达到继承的目的吗？
# 前置知识
为了熟悉javascript中与原型相关的几个基本概念，可以参看这篇文章[JavaScript深入之从原型到原型链][1]，作者写的十分简明易懂。
![摘自原文中的总结图片](https://github.com/mqyqingfeng/Blog/raw/master/Images/prototype5.png)

读了文章以后可以知道，在方法（构造函数）上存在一个叫做prototype的属性，这个属性是一个对象；方法结合new关键字可以生成实例，生成的每一份实例上都会有一个叫做__proto__的属性，这个属性也是指向生成该实例的方法上的prototype属性；原型对象（即prototype这个对象）上也存在一个特别的属性，即constructor，这个属性指向的方法本身。

# 回到问题本身
我们先来回答第二个问题：如果没有这行代码，还能到达继承的目的吗？
看一个常见的组合继承的实现方式，代码如下：
```javascript
function Animal(name) {
    this.name = name || '';
    console.log('Animal called.');
}
Animal.prototype.showName = function() {
    console.log('Name is: ', this.name);
}
function Cat(name, age) {
    Animal.call(this, name);
    this.age = age || 1;
    console.log('Cat called.');
}
Cat.prototype = new Animal();
// Cat.prototype.constructor = Cat;    // 注释掉修正constructor方法的指向的这一行
Cat.prototype.showAge = function() {
    console.log('Age is: ', this.age);
}

var cat = new Cat('meow', 3);
console.log(cat.name);    // meow
cat.showName();          // Name is: meow
console.log(cat.age);    // 3
cat.showAge();           // Age is: 3
```

可以看到，继承的效果依然是达到了。所以，我觉得答案应该是能。

------
我们再来看第一个问题，注释掉的这行代码的意义是什么呢？为什么大部分的实现方式中都建议我们修正这个constructor的指向呢？
网上搜索后找到这篇文章： [为什么要做A.prototype.constructor=A这样的修正？][2]， 并由此进一步的查看了Stack Overflow上的这篇问答： [What it the significance of the Javascript constructor property?][3]
所以，最重要的修正意义应该还是针对显示调用的时候。
接着刚刚的代码来看：
```
cat.__proto__.constructor  // 这个属性指向的应该是 Animal 构造函数，如果我们之前修正了constructor的指向的话，那么这里才会真的指向到 Cat 的构造函数

// 假设我们想要构造一个新的实例cat2，并且我们不知道对应的构造函数的名称是什么，不过好在我们刚刚已经有一个实例cat了（好吧，我知道这种假设比较2 -_-|||）
var cat2 = new cat.__proto__.constructor();  // Animal called （这里只有Animal的构造函数被调用了）
cat2.age;    // undefined  （因为在Animal构造函数中不存在age属性）

```

好吧，我承认这种场景比较少见。但是，万一有呢？所以我的建议是，我们应该保留这种修正constructor的写法。

------

## 后记
在知乎的一篇问答中看到一种说法

> constructor其实没有什么用处，只是JavaScript语言设计的历史遗留物。由于constructor属性是可以变更的，所以未必真的指向对象的构造函数，只是一个提示。不过，从编程习惯上，我们应该尽量让对象的constructor指向其构造函数，以维持这个惯例。

作者：贺师俊
链接：https://www.zhihu.com/question/19951896/answer/13457869
来源：知乎
著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。

# 参考文章

 1. [JavaScript深入之从原型到原型链](https://segmentfault.com/a/1190000008959943)
 2. [为什么要做A.prototype.constructor=A这样的修正？](https://www.cnblogs.com/SheilaSun/p/4397918.html)
 3. [What it the significance of the Javascript constructor property?](https://stackoverflow.com/questions/4012998/what-it-the-significance-of-the-javascript-constructor-property/4013295#4013141)

  [1]: https://segmentfault.com/a/1190000008959943
  [2]: https://www.cnblogs.com/SheilaSun/p/4397918.html
  [3]: https://stackoverflow.com/questions/4012998/what-it-the-significance-of-the-javascript-constructor-property/4013295#4013141