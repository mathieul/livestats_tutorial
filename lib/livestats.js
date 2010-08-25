var http = require('http'),
    sys  = require('sys'),
    nodeStatic = require('node-static/lib/node-static'),
    faye = require('faye-0.5.2/faye-node'),
    url = require('url');

var LiveStats = function(options) {

    if (! (this instanceof arguments.callee)) {
        return new arguments.callee(arguments);
    }

    var self = this;

    self.settings = {
        port: options.port
      , geoipServer: {
          hostname: options.geoipServer.hostname
        , port:     options.geoipServer.port || 80  
      }
    };

    self.init();

    return true;
};

LiveStats.prototype.init = function() {
    var self = this;

    self.bayeux = self.createBayeuxServer();
    self.httpServer = self.createHTTPServer();

    self.bayeux.attach(self.httpServer);
    self.httpServer.listen(self.settings.port);
    sys.log('Server started on PORT ' + self.settings.port);
};

LiveStats.prototype.createHTTPServer = function() {
    var self = this;

    var server = http.createServer(function(request, response) {
        var file = new nodeStatic.Server('./public', {
            cache: false
        });

        request.addListener('end', function() {
            var location = url.parse(request.url, true),
                params = (location.query || request.headers);

            if (location.pathname === '/config.json' && request.method === 'GET') {
                response.writeHead(200, {
                    'Content-Type': 'application/x-javascript'
                });
                var jsonString = JSON.stringify({
                    port: self.settings.port
                });
                response.end(jsonString);
            }
            else if (location.pathname === '/stat' && request.method === 'GET') {
                self.ipToPosition(params.ip, function (latitude, longitude, city) {
                    self.bayeux.getClient().publish('/stat', {
                        title: params.title
                      , latitude: latitude
                      , longitude: longitude
                      , city: city
                      , ip: params.ip
                    });

                    response.writeHead(200, {
                        'Content-Type': 'application/x-javascript'
                    });
                    response.end('OK');
                });
            }
            else {
                file.serve(request, response);
            }
        });
    });

    return server;
};

LiveStats.prototype.createBayeuxServer = function () {
    var self = this;

    var bayeux = new faye.NodeAdapter({
        mount: '/faye',
        timeout: 45
    });

    return bayeux;
};

LiveStats.prototype.ipToPosition = function(ip, callback) {
    // TODO
};

module.exports = LiveStats;
