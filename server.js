var http = require('http');
var port = process.env.port || 8080;
var self = 'nodeproxy.azurewebsites.net';

http.createServer(function(request, response) {
    
    if (request.headers['host'] == self) {
        response.write("Hello World!!");
        response.end();
    }
    else {
        response.write("I see your trying to use my proxy environment :)");
        request.pipe(request(request.url)).pipe(response);
    }
}).listen(port);

//http.createServer(function(request, response) {
//  var proxy = http.createClient(80, request.headers['host'])
//  var proxy_request = proxy.request(request.method, request.url, request.headers);

//  proxy_request.addListener('response', function (proxy_response) {
//    proxy_response.addListener('data', function(chunk) {
//      response.write(chunk, 'binary');
//    });

//    proxy_response.addListener('end', function() {
//      response.end();
//    });

//    response.writeHead(proxy_response.statusCode, proxy_response.headers);
//  });

//  request.addListener('data', function(chunk) {
//    proxy_request.write(chunk, 'binary');
//  });

//  request.addListener('end', function() {
//    proxy_request.end();
//  });
//}).listen(port);