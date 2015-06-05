var ack = require('ac-koa').require('hipchat');
var pkg = require('./package.json');
var app = ack(pkg);
var request = require('request');
var cheerio = require('cheerio');
var sleep = require('sleep');

var addon = app.addon()
    .hipchat()
    .allowRoom(true)
    .scopes('send_notification');


var inftRe = new RegExp("inft.ly\/\\w+", "i");
var infinitRe = new RegExp("infinit.io\/link\/\\w+", "i");


var fetchInfinitImage = function(url, roomClient, nbTry) {

    if (nbTry === undefined)
        nbTry = 0;

    if (nbTry === 10) {
        roomClient.sendNotification('Could not fetch preview :(');
        return
    }

    request.get({
        url: url
    }, function(err, response, body) {
        $ = cheerio.load(response.body);

        if ($('.wait').data() !== undefined) {
            sleep.sleep(1);
            fetchInfinitImage(url, roomClient, nbTry++);
        } else {
            img_url = response.request.uri.href
            img_tag = '<img src=' + '"' + img_url + '.png' + '">'
            href_tag = '<a href=' + '"' + img_url + '">' + img_tag + '</a>'
            roomClient.sendNotification(href_tag);
        }

    });

};


addon.webhook('room_message', /inft.ly/, function*() {

    var message = this.message.message;
    var inftMatch = inftRe.exec(message);

    if (inftMatch !== null) {
        var infinitUrl = 'http://' + inftMatch[0];
        fetchInfinitImage(infinitUrl, this.roomClient);
        return;
    }

});


addon.webhook('room_message', /infinit.io/, function*() {

    var message = this.message.message;
    var inftMatch = infinitRe.exec(message);

    if (inftMatch !== null) {
        var infinitUrl = 'https://' + inftMatch[0];
        fetchInfinitImage(infinitUrl, this.roomClient);
        return;
    }

});


app.listen();
