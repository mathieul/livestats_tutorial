
function LiveStatsClients() {
    if (! (this instanceof arguments.callee)) {
        return new arguments.callee(arguments);
    }

    var self = this;

    this.init = function () {
        self.setupBayeuxHandlers();
    };

    this.setupBayeuxHandlers = function() {
        self.client = new Faye.Client('http://localhost:8080/faye', {
            timeout: 120
        });

        self.client.subscribe('/stat', function(message) {
            console.log('MESSAGE', message);
        });
    };

    this.init();
}

var liveStatsClient;

$(function() {
    liveStatsClient = new LiveStatsClients();
});