1、express 4中，废弃了createServer(), 直接使用express()就可以返回一个express实例

2、express4.x版本开始，已经不再依赖Connect。除了express.static，express以前内置的中间件已经全部单独作为模块安装使用了。
http://www.expressjs.com.cn/guide/using-middleware.html

3、jade模板使用的语法
	doctype 5 的这种写法已经被废弃了；
	if else 语句之前需要新增 '-' 符号(中横线), 表示这一行代码在服务端解析运行；
	block sth 的使用，需要在下一行新增两个空格符，而不是平行排列。
http://cnodejs.org/topic/5368adc5cf738dd6090060f2

4、body-parser使用中，需要设置urlencoded的extended属性，默认为true，读取方式是qs的读取方式
app.use(bodyParser.urlencoded({ extended: false })); // 读取键值对
qs相关信息：
https://www.npmjs.com/package/qs#readme

5、MongoDB collection中的insert返回值需要关注，并不是直接返回插入的数据。
https://docs.mongodb.com/manual/reference/method/db.collection.insert/
