var http = require('http');
var ws = require('node-websocket-server');
var clientui = require('fs').readFileSync("wschatclient.html");

var httpserver = new http.Server();

httpserver.on("request", function (request, response) {
	if(request.url == "/") {
		response.writeHead(200, {"Content-Type": "text/html"});
		response.write(clientui);
		response.end();
	}else{
		response.writeHead(404);
		response.end();
	}
});

var wsserver = ws.createServer({server: httpserver});

wsserver.on("Connection", function(socket){
	socket.send("Welcome to the chat room.");
	socket.on("message", function(msg){
		wsserver.broadcast(msg);
	});
	socket.on("close", function (code, reason) {
        console.log("Connection closed")
    });
});

wsserver.listen(8000);