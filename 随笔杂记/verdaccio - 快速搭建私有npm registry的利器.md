# 写在前面
本文更多的是记录使用过程中的坑，关于具体的搭建方式，参考文章中写得很详细了，本文就不再过多的赘述了。

# verdaccio 是什么
[what is verdaccio?](https://verdaccio.org/docs/zh-CN/what-is-verdaccio) 这个是官方介绍的网址，权威且全面。
> Verdaccio 是一个 Node.js创建的轻量的私有npm proxy registry
> 它forked于sinopia@1.4.0并且100% 向后兼容。
> Verdaccio 表示意大利中世纪晚期fresco 绘画中流行的一种绿色的意思。

[sinopia](https://github.com/rlidwka/sinopia)是最初的搭建私有npm的选择，不过已经好多年不维护了，而verdaccio则是从`sinopia`衍生出来并且一直在维护中的，所以现在看来，verdaccio是一个更好的选择。

# 如何使用verdaccio来搭建私有npm registry
[搭建教程](http://www.cnblogs.com/tugenhua0707/p/9163167.html)
[搭建教程2](http://www.cnblogs.com/HCJJ/p/9222826.html)
关于搭建方式，上面两篇文章已经写的非常清楚了，这里只是简单的记录一下大体流程，方便以后快速查阅：
* npm install -g verdaccio `#当前版本是3.8.6`
* verdaccio `#首次执行会打印出配置文件config.yaml的位置`
* 修改config.yaml文件，新增`listen: 0.0.0.0:4873`内容，方便其他人可以通过IP:PORT的方式访问到你的私有NPM
* 再次启动 verdaccio 让新的配置文件内容生效

好了，一个私有的NPM就已经搭建完成了，是不是很快。

# 使用过程中的经验记录
1. 如何向私有NPM中发布包？
 > npm config set registry=http://IP:PORT/ `#配置文件中的listen字段`
 > npm login `#在config.yaml的默认配置中，登陆用户才可以进行publish操作`
 > npm publish `#到你需要发布的包的package.json文件的同级目录下执行`
 
 * `npm login`和`npm adduser`命令是等效的，如果是第一次登陆，且用户名不存在冲突，那么登陆信息会在进行加密处理后，存入和config.yaml文件同级的`htpasswd`文件中。

2. 如何设置特定用户才能拥有发布权限？
 上面提到，用户需要先登陆，才可以执行publish操作，可以利用这个默认规则，配合配置文件中的`max_users`来达到目的。htpasswd文件中每一行内容都会记录一个登陆用户的信息，当我们将max_users设置为1的时候，如果再有其他的用户使用npm login命令是无法登陆成功的，会报错:
 ```
 npm ERR! code E403
 npm ERR! Registry returned 403 for PUT on 
 http://0.0.0.0:4873/-/user/org.couchdb.user:msa: maximum amount of users 
 reached
 ```
 这样，就只有第一个登陆进来的用户才可以执行发布操作，也就等同于限定了publish权限，只被一个用户占有。而且，这个用户是可以在多台机器上同时登陆的，也就是说你和你的同事都可以使用这个账号在同一时间/不同机器进行publish操作。
3. 如何保证自己的私有包不会被发布到外部仓库中去？
 利用package.json文件的配置项目，我们有两个方式可以做到：
 * 设置 `"private": true`，这个设置可以保证这个包不会被发布，不过如果这样做的话，它既不能发布到外部仓库，也不能发布到你指定的仓库中去了。
 * 设置`publishConfig`，这个设置可以指定发布路径，当你使用npm publish命令进行发布操作的时候，这个字段中的配置项会覆盖掉你本地设置的registry地址，强制将你的包发布到你指定的私有仓储中去。
 ```
 "publishConfig": {
    "registry": "http://IP:4873/"
  },
 ```
4. 是否可以手动修改私有NPM包的内容？
 `不可以`
 * 实际案例： 有一次为了快速验证一个bug，又不想重新上传，就手动修改了私有NPM仓库中包里的文件内容，结果其他同事通过npm install 去安装这个包的时候报错，说是shasum的值不相等，无法安装。
 * 原理解析： 私有NPM仓库中所有包的实际存储路径在config.yaml文件的storage字段中配置，到这个路径下可以看到所有的私用包，这些包都是被做出了.tgz的压缩包，和这些同级目录下的package.json文件中记录了所有的这些包的信息，包括名称，版本号，上传时间等等，其中有一个 `shasum`的字段，记录了一个上传的时候生成的根据包里面的文件内容而计算出来的序列号，如果手动修改了文件内容，但是没有修改对应的`shasum`字段内容就会导致不匹配报错，无法install。我觉得这个应该也是npm出于安全考虑的一个手段吧。
 
5. 利用pm2工具运行verdaccio
 [pm2](https://github.com/Unitech/pm2) 是一个nodejs的进程管理工具，内置了负载均衡的功能，很好很强大，but，windows直接执行`pm2 start verdaccio`是没法成功将verdaccio跑起来的，应该是执行脚本没法正常解析的锅，以前就有人给verdaccio提了[issues](https://github.com/verdaccio/verdaccio/issues/987)，不过似乎还没有结论。

6. 利用 nrm 快速切换本机使用的npm仓库地址
 [nrm](https://github.com/Pana/nrm) 是一个npm registry的管理工具，可以帮助我们快速的切换本机npm仓库地址，我们可以通过 `nrm add local http://ip:port`为我们本地的私有仓库添加别名，然后就可以使用`nrm use local`进行快速切换，而再也不用去记录IP和端口了。

#参考文章

[what is verdaccio?](https://verdaccio.org/docs/zh-CN/what-is-verdaccio)
[使用verdaccio 搭建npm私有仓库](http://www.cnblogs.com/tugenhua0707/p/9163167.html)
[NodeJS学习：搭建私有NPM](http://www.cnblogs.com/HCJJ/p/9222826.html)
