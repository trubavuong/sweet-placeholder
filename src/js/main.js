// Change app name to anything to use as global entry point
var APP_NAME = 'app';

// UMD: AMD + CommonJS + Browser
if (typeof define === 'function' && define.amd) {
    // AMD
    define(function () {
        return app;
    });
}
else if (typeof module === 'object' && module.exports) {
    // CommonJS
    module.exports = app;
}
else {
    // Browser
    if (APP_NAME in window) {
        console.warn('App name "' + APP_NAME + '" exists');
    }
    window[APP_NAME] = app;
}
