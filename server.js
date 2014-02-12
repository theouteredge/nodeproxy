var http = require('http');
var net  = require('net');
var urlp = require('url');
var fs   = require('fs');

var port = process.env.port || 1337;
var debug = process.env.debug || false;
var self = 'nodeproxy.azurewebsites.net';
//var self = 'localhost:1337';


var server = http.createServer(function(request, response) {
    if (debug) {
        console.log('connection estabilished');
        console.log('request host is %s', request.headers['host']);
    }

    if (request.headers['host'] == self) {
        var url = urlp.parse(request.url);
        var path = "";
        if (url.pathname === null || url.pathname === "" || url.pathname === "/")
            path = "./content/index.html";
        else
            path = "./content/" + url.pathname;

        console.log(url);
        console.log(path);

        fs.readFile(path, 'utf8', function (err,data) {
            if (err) {
                response.writeHead(500);
                response.write("<h1>500 Error</h1>\r\n" +
                               "<p>Error was <pre>" + err + "</pre></p>\r\n" +
                               "</body></html>\r\n");
            }

            response.writeHead(200);
            response.write(data);
        });

        response.end();
    }
    else {
        var url = urlp.parse(request.url);
        if (debug) console.log(url.href);
       
        var opt = {
            hostname: request.headers.host,
            path: url.path,
            port: url.port || 80,
            method: request.method,
            headers: request.headers
        };

        var proxyRequest = http.request(opt, function(req) {
            if (debug) console.log('  > connecting to %s', opt.hostname);

            req.on('data', function(chunk) {
                    if (debug) console.log('  < writing data from %s to client', url.hostname);
                    response.write(chunk, 'binary');
                });

            req.on('end', function() {
                    if (debug) console.log('  < closing client connection');
                    response.end();
                });

            if (debug) console.log('  < status code: %i', req.statusCode);
            response.writeHead(req.statusCode, req.headers);
        });

        proxyRequest.on('error', function (error) {
                response.writeHead( 500 );
                response.write("<h1>500 Error</h1>\r\n" +
                               "<p>Error was <pre>" + error + "</pre></p>\r\n" +
                               "</body></html>\r\n");
                response.end();
            });

        request.on('data', function(chunk) {
                if (debug) console.log('  > writting data to %s', request.headers['host']);
                proxyRequest.write(chunk, 'binary');
            });
        request.on('end', function() {
                console.log('  > closing proxy connection as client connection has closed');
                proxyRequest.end();
            }); 
    }
}).listen(port);
console.log('server is listening on port %s', port);



server.on('connect', function ( request, socketRequest, bodyhead ) {
    var httpVersion = request['httpVersion'];
    var url = urlp.parse('https://' + request['url']);

    console.log('  = will connect to %s', url.hostname);
    console.log('  = will connect to %s', url.port || 443);
 
    // set up TCP connection
    var proxySocket = new net.Socket();
    proxySocket.connect(url.port || 443, url.hostname, function () {
        console.log( '  < connected to %s/%s', url.hostname, url.port);
        console.log( '  > writing head of length %d', bodyhead.length );
 
        proxySocket.write( bodyhead );
 
        // tell the caller the connection was successfully established
        socketRequest.write( "HTTP/" + httpVersion + " 200 Connection established\r\n\r\n" );
    });
 
    proxySocket.on('data', function (chunk) {
        console.log( '  < data length = %d', chunk.length );
        socketRequest.write( chunk );
    });
 
    proxySocket.on('end', function () {
        console.log( '  < end' );
        socketRequest.end();
    });
 
    socketRequest.on('data', function ( chunk ) {
        console.log( '  > data length = %d', chunk.length ); 
        proxySocket.write( chunk );
    });
 
    socketRequest.on('end', function () {
        console.log( '  > end' );
        proxySocket.end();
    });
 
    proxySocket.on('error', function ( err ) {
        socketRequest.write( "HTTP/" + httpVersion + " 500 Connection error\r\n\r\n" );
        console.log( '  < ERR: %s', err );
      
        socketRequest.end();
    });
 
    socketRequest.on('error', function ( err ) {
        console.log( '  > ERR: %s', err );
        proxySocket.end();
    });
 }); // HTTPS connect listener
