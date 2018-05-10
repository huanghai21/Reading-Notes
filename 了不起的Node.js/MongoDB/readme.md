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

6、MongoDB shell 常用操作命令
https://blog.csdn.net/lgddb00000/article/details/78809328
help		// 显示帮助信息
db.help()	// 显示当前db下所能执行的命令的相关帮助信息
show dbs	// 显示所有dbName
use dbName	// 切换到某个dbName的db下
db.getCollectionNames()	// 查看当前db下所有的集合名称，即数据表的表名
db.dbName.find()	// 查询dbName集合中的所有数据
db.dbName.find(query)	// 查询dbName集合中满足query（查询条件）的所有数据
db.dbName.remove(query)	// 将dbName集合中满足query（查询条件）的所有数据移除掉

7、关于node中使用mongodb的注意点
{$oid: req.session.loginId} 的方式已经无法继续使用
findOne 返回的是可以直接使用的文档对象
find 返回的是cursor(游标)，需要使用toArray转换之后才是可以使用的文档对象数组
