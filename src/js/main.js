// Change app name to anything to use as global entry point
var APP_NAME = 'Placeholder';

function EventDispatcher() {
    this.events = {};
}

EventDispatcher.prototype.addEventListener = function (event, listener) {
    if (typeof event === 'string' && typeof listener === 'function') {
        if (!(event in this.events)) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    }
};

EventDispatcher.prototype.removeEventListener = function (event, listener) {
    if (typeof event === 'string' && typeof listener === 'function') {
        var events = this.events[event] || [],
            i;
        for (i = 0; i < events.length; i += 1) {
            if (events[i] === listener) {
                events.splice(i, 1);
                return;
            }
        }
    }
};

EventDispatcher.prototype.dispatchEvent = function (event, params) {
    if (typeof event === 'string') {
        var events = this.events[event] || [],
            i;
        for (i = 0; i < events.length; i += 1) {
            events[i](params);
        }
    }
};

function Placeholder(options) {
    this.element = options.element;
    if (!(this.element instanceof Element)) {
        throw new Error('"options.element" is not an Element object');
    }
    if (!('placeholder' in this.element)) {
        throw new Error('"placeholder" attribute of passing element is not supported');
    }
    this.elementEventListeners = [];
    this.originalPlaceholder = this.element.getAttribute('placeholder') || '';
    this.strings = this._filterStrings(options.strings || []);
    this.charDelay = options.charDelay >= 0 ? options.charDelay : 100;
    this.stringDelay = options.stringDelay >= 0 ? options.stringDelay : 1000;
    this.loop = options.loop >= 0 ? options.loop : 0;
    this.cursor = typeof options.cursor === 'string' ? options.cursor : '|';
    this.autoStart = options.autoStart;
    this.focusAction = options.focusAction;
    if ([Placeholder.ActionType.STOP, Placeholder.ActionType.PAUSE].indexOf(options.blurAction) >= 0) {
        this.blurAction = options.blurAction;
    }
    this.clearAction = options.clearAction;
    this.dispatcher = new EventDispatcher();
    this._initState();
    this._bootstrap();
}

Placeholder.ActionType = {
    START: 'start',
    STOP: 'stop',
    PAUSE: 'pause',
    RESUME: 'resume',
};

Placeholder.EventType = {
    START: 'start',
    STOP: 'stop',
    PAUSE: 'pause',
    RESUME: 'resume',
    DESTROY: 'destroy',
    BEGIN_STRING: 'begin-string',
    END_STRING: 'end-string',
    BEGIN_LOOP: 'begin-loop',
    END_LOOP: 'end-loop',
};

Placeholder.State = {
    STOPPED: 0,
    PLAYING: 1,
    PAUSED: 2
};

Placeholder.prototype.start = function (forceRestart) {
    if (this.element.value) {
        return;
    }

    switch (this.state.id) {
    case Placeholder.State.STOPPED:
        this._start();
        break;

    case Placeholder.State.PAUSED:
        if (forceRestart) {
            this.stop();
            this._start();
        }
        else {
            this._resume();
        }
        break;

    default:
        break;
    }
};

Placeholder.prototype._start = function () {
    this._next();
    this._dispatchEvent(Placeholder.EventType.START);
};

Placeholder.prototype.stop = function () {
    if (this.state.id !== Placeholder.State.STOPPED) {
        this._clearTimeout();
        this._initState();
        this._dispatchEvent(Placeholder.EventType.STOP);
    }
};

Placeholder.prototype.destroy = function () {
    this.stop();

    var elementEventListener,
        event, listener, i;
    for (i = 0; i < this.elementEventListeners.length; i += 1) {
        elementEventListener = this.elementEventListeners[i];
        event = elementEventListener[0];
        listener = elementEventListener[1];
        this.element.removeEventListener(event, listener);
    }

    this.element.setAttribute('placeholder', this.originalPlaceholder);
    this._dispatchEvent(Placeholder.EventType.DESTROY);
};

Placeholder.prototype.pause = function () {
    if (this.state.id === Placeholder.State.PLAYING) {
        this._clearTimeout();
        this.state.id = Placeholder.State.PAUSED;
        this._dispatchEvent(Placeholder.EventType.PAUSE);
    }
};

Placeholder.prototype._resume = function () {
    this._next();
    this._dispatchEvent(Placeholder.EventType.RESUME);
};

Placeholder.prototype.addEventListener = function (event, listener) {
    this.dispatcher.addEventListener(event, listener);
};

Placeholder.prototype.removeEventListener = function (event, listener) {
    this.dispatcher.removeEventListener(event, listener);
};

Placeholder.prototype._initState = function () {
    this.state = {
        id: Placeholder.State.STOPPED,
        charIndex: 0,
        stringIndex: 0,
        loop: 0,
        timeoutId: null,
        next: null
    };
};

Placeholder.prototype._extractDispatchingParams = function () {
    var next = this.state.next;
    return next ? {
        str: next.str,
        strings: next.strings,
        index: next.index,
        loop: next.loop,
        delay: next.delay,
    } : {};
};

Placeholder.prototype._doAction = function (action) {
    var didAnything = true;

    switch (action) {
    case Placeholder.ActionType.START:
        this.start(true);
        break;

    case Placeholder.ActionType.RESUME:
        this.start();
        break;

    case Placeholder.ActionType.STOP:
        this.stop();
        break;

    case Placeholder.ActionType.PAUSE:
        this.pause();
        break;

    default:
        didAnything = false;
        break;
    }

    return didAnything;
};

Placeholder.prototype._bootstrap = function () {
    var self = this;
    this._addEventListenerToElement('input', function () {
        if (self.element.value) {
            self.pause();
        }
        else {
            self.element.setAttribute('placeholder', self.originalPlaceholder);
            self._doAction(self.clearAction);
        }
    });

    this._addEventListenerToElement('focus', function () {
        self._doAction(self.focusAction);
    });

    this._addEventListenerToElement('blur', function () {
        if (self._doAction(self.blurAction)) {
            self.element.setAttribute('placeholder', self.originalPlaceholder);
        }
    });

    if (this.autoStart) {
        this.start();
    }
};

Placeholder.prototype._addEventListenerToElement = function (event, listener) {
    if (typeof this.element.addEventListener === 'function') {
        this.element.addEventListener(event, listener);
        this.elementEventListeners.push([event, listener]);
    }
};

Placeholder.prototype._clearTimeout = function () {
    if (this.state.timeoutId) {
        clearTimeout(this.state.timeoutId);
        this.state.timeoutId = null;
    }
};

Placeholder.prototype._filterStrings = function (strings) {
    var r = [],
        s, i;
    for (i = 0; i < strings.length; i += 1) {
        s = strings[i];
        if (s && s.length) {
            r.push(s);
        }
    }
    return r;
};

Placeholder.prototype._transformString = function (s) {
    var r = '',
        c, i;
    for (i = 0; i < s.length; i += 1) {
        c = s[i];
        if (c === '\b' && r.length) {
            r = r.substring(0, r.length - 1);
        }
        else {
            r += c;
        }
    }
    return r;
};

Placeholder.prototype._dispatchEvent = function (event) {
    this.dispatcher.dispatchEvent(event, this._extractDispatchingParams());
};

Placeholder.prototype._next = function () {
    if (this.strings.length <= 0) {
        return this.stop();
    }
    this._clearTimeout();

    var self = this,
        isEndLoop = false,
        isEndString = false,
        state = self.state;

    if (!state.next) {
        var events = [],
            delay = this.charDelay,
            str = this.strings[state.stringIndex];
        if (state.charIndex === 0) {
            if (state.stringIndex === 0) {
                events.push(Placeholder.EventType.BEGIN_LOOP);
                if (this.loop > 0 && state.loop >= this.loop) {
                    return this.stop();
                }
            }
            if (state.stringIndex > 0 || state.loop >= 1) {
                delay = this.stringDelay;
            }
            events.push(Placeholder.EventType.BEGIN_STRING);
        }
        else if (state.charIndex === str.length - 1) {
            isEndString = true;
            events.push(Placeholder.EventType.END_STRING);
            if (state.stringIndex === this.strings.length - 1) {
                events.push(Placeholder.EventType.END_LOOP);
                isEndLoop = true;
            }
        }

        state.next = {
            str: this._transformString(str.substring(0, state.charIndex + 1) + (isEndString ? '' : this.cursor)),
            events: events,
            strings: this.strings,
            index: state.stringIndex,
            loop: state.loop,
            delay: delay
        };
        state.charIndex += 1;
        if (state.charIndex >= str.length) {
            state.charIndex = 0;
            state.stringIndex += 1;
            if (state.stringIndex >= this.strings.length) {
                state.stringIndex = 0;
            }
        }
    }

    state.id = Placeholder.State.PLAYING;
    state.timeoutId = setTimeout(function () {
        var next = state.next;
        if (next) {
            if (next.events.length > 0) {
                var i;
                for (i = 0; i < next.events.length; i += 1) {
                    self._dispatchEvent(next.events[i]);
                }
            }
            if (isEndLoop) {
                state.loop += 1;
            }
            self.element.setAttribute('placeholder', next.str);
            state.next = null;
            self._next();
        }
    }, state.next.delay);
};

var app = {
    create: function (options) {
        return new Placeholder(options);
    }
};

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
