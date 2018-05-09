var http = require('http');
var ws = require('nodejs-websocket');
var clientui = require('fs').readFileSync("wschatclient.html");

var httpserver = new http.Server();

httpserver.on("request", function (request, response) {
	if(request.url == "/") {
		response.writeHead(200, {"Content-Type": "text/html"});
		response.write(clientui);
		response.end();
	}else{
		console.log('request.url is: ', request.url);
		response.writeHead(404);
		response.end();
	}
});
httpserver.listen(3001);
console.log("httpserver listen on 3001");


var wsserver = ws.createServer(function (conn) {
	console.log("New connection");
	conn.on("text", function (str) {
		console.log("Received "+str);
		broadcast(str.toUpperCase() + "!!!");
	})
	conn.on("close", function (code, reason) {
		console.log("Connection closed");
	})
});
wsserver.listen(8000);
console.log("Websocket listen on 8000");

function broadcast(str) {
    console.log('str', str);
    // 取到server下面的所有连接
    wsserver.connections.forEach(function(connection) {
        connection.sendText(str);
    })
}
