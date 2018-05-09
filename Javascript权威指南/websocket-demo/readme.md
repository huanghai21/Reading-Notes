使用node-inspector进行node程序调试的方法：

1、全局安装node-inspector
npm install -g node-inspector

2、新开一个cmd窗口运行node-inspector
node-inspector

3、在浏览器中访问上一步骤执行结果的路径，打开调试页面
http://127.0.0.1:8080/debug?port=5858

4、再另开一个cmd窗口，以debug的方式运行node.js的程序
node --debug index.js