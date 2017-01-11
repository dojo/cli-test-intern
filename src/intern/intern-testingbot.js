define([
    './intern'
], function (intern) {

    intern.capabilities = {
        project: '<%- appName %>',
        name: '<%- appName %>'
    };

    intern.environments = [
        { browserName: 'internet explorer', version: [ '10', '11' ], platform: 'WIN8' },
        // { browserName: 'microsoftedge', platform: 'WIN10' },
        { browserName: 'firefox', version: '49', platform: 'WIN10' },
        { browserName: 'chrome', platform: 'WIN10' },
        // { browserName: 'safari', version: '9', platform: 'CAPITAN' },
        // { browserName: 'chrome', version: '55', platform: 'SIERRA' },
        // { browserName: 'browser', platform: 'ANDROID', version: '6.0', deviceName: 'Galaxy S6', platformName: 'Android' }// ,
        // { browserName: 'safari', platform: 'CAPITAN', version: '9.3', deviceName: 'iPhone 6s Plus', platformName: 'iOS' }
    ];

    /* Testingbot supports more max concurrency */
    intern.maxConcurrency = 3;
    intern.tunnel = 'TestingBotTunnel';
    intern.webdriver = {
        host: 'http://hub.testingbot.com/wd/hub',
        username: 'key',
        accessKey: 'secret'
    };

    intern.tunnelOptions = {
        verbose: true,
        apiKey: 'key',
        apiSecret: 'secret'
    };
    intern.useSauceConnect = false;

    return intern;
});
