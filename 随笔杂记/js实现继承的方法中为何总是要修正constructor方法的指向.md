# ��������
�������������js�̳�ʵ�ֵ�������£����ʵ�ַ�ʽ�ж��������ôһ�д��룺
```javascript
A.prototype.constructor = A
```
���Ǹе����棬���д����ʵ��������ʲô�����û�еĻ������ܴﵽ�̳е�Ŀ����
# ǰ��֪ʶ
Ϊ����Ϥjavascript����ԭ����صļ�������������Բο���ƪ����[JavaScript����֮��ԭ�͵�ԭ����][1]������д��ʮ�ּ����׶���
![ժ��ԭ���е��ܽ�ͼƬ](https://github.com/mqyqingfeng/Blog/raw/master/Images/prototype5.png)

���������Ժ����֪�����ڷ��������캯�����ϴ���һ������prototype�����ԣ����������һ�����󣻷������new�ؼ��ֿ�������ʵ�������ɵ�ÿһ��ʵ���϶�����һ������__proto__�����ԣ��������Ҳ��ָ�����ɸ�ʵ���ķ����ϵ�prototype���ԣ�ԭ�Ͷ��󣨼�prototype���������Ҳ����һ���ر�����ԣ���constructor���������ָ��ķ�������

# �ص����Ȿ��
���������ش�ڶ������⣺���û�����д��룬���ܵ���̳е�Ŀ����
��һ����������ϼ̳е�ʵ�ַ�ʽ���������£�
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
// Cat.prototype.constructor = Cat;    // ע�͵�����constructor������ָ�����һ��
Cat.prototype.showAge = function() {
    console.log('Age is: ', this.age);
}

var cat = new Cat('meow', 3);
console.log(cat.name);    // meow
cat.showName();          // Name is: meow
console.log(cat.age);    // 3
cat.showAge();           // Age is: 3
```

���Կ������̳е�Ч����Ȼ�Ǵﵽ�ˡ����ԣ��Ҿ��ô�Ӧ�����ܡ�

------
������������һ�����⣬ע�͵������д����������ʲô�أ�Ϊʲô�󲿷ֵ�ʵ�ַ�ʽ�ж����������������constructor��ָ���أ�
�����������ҵ���ƪ���£� [ΪʲôҪ��A.prototype.constructor=A������������][2]�� ���ɴ˽�һ���Ĳ鿴��Stack Overflow�ϵ���ƪ�ʴ� [What it the significance of the Javascript constructor property?][3]
���ԣ�����Ҫ����������Ӧ�û��������ʾ���õ�ʱ��
���ŸոյĴ���������
```
cat.__proto__.constructor  // �������ָ���Ӧ���� Animal ���캯�����������֮ǰ������constructor��ָ��Ļ�����ô����Ż����ָ�� Cat �Ĺ��캯��

// ����������Ҫ����һ���µ�ʵ��cat2���������ǲ�֪����Ӧ�Ĺ��캯����������ʲô�������������Ǹո��Ѿ���һ��ʵ��cat�ˣ��ðɣ���֪�����ּ���Ƚ�2 -_-|||��
var cat2 = new cat.__proto__.constructor();  // Animal called ������ֻ��Animal�Ĺ��캯���������ˣ�
cat2.age;    // undefined  ����Ϊ��Animal���캯���в�����age���ԣ�

```

�ðɣ��ҳ������ֳ����Ƚ��ټ������ǣ���һ���أ������ҵĽ����ǣ�����Ӧ�ñ�����������constructor��д����

------

## ���
��֪����һƪ�ʴ��п���һ��˵��

> constructor��ʵû��ʲô�ô���ֻ��JavaScript������Ƶ���ʷ���������constructor�����ǿ��Ա���ģ�����δ�����ָ�����Ĺ��캯����ֻ��һ����ʾ���������ӱ��ϰ���ϣ�����Ӧ�þ����ö����constructorָ���乹�캯������ά�����������

���ߣ���ʦ��
���ӣ�https://www.zhihu.com/question/19951896/answer/13457869
��Դ��֪��
����Ȩ���������С���ҵת������ϵ���߻����Ȩ������ҵת����ע��������

# �ο�����

 1. [JavaScript����֮��ԭ�͵�ԭ����](https://segmentfault.com/a/1190000008959943)
 2. [ΪʲôҪ��A.prototype.constructor=A������������](https://www.cnblogs.com/SheilaSun/p/4397918.html)
 3. [What it the significance of the Javascript constructor property?](https://stackoverflow.com/questions/4012998/what-it-the-significance-of-the-javascript-constructor-property/4013295#4013141)

  [1]: https://segmentfault.com/a/1190000008959943
  [2]: https://www.cnblogs.com/SheilaSun/p/4397918.html
  [3]: https://stackoverflow.com/questions/4012998/what-it-the-significance-of-the-javascript-constructor-property/4013295#4013141