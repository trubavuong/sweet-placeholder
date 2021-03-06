// Change app name to anything to use as global entry point
var APP_NAME = 'NaughtyPlaceholder', // app endpoint
    CLASS_NAME = 'np'; // class name

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

var ActionType = {
        START: 'start',
        STOP: 'stop',
        PAUSE: 'pause',
        RESUME: 'resume',
    },
    EventType = {
        START: 'start',
        STOP: 'stop',
        PAUSE: 'pause',
        RESUME: 'resume',
        DESTROY: 'destroy',
        BEGIN_STRING: 'begin-string',
        END_STRING: 'end-string',
        BEGIN_LOOP: 'begin-loop',
        END_LOOP: 'end-loop',
    },
    State = {
        STOPPED: 0,
        PLAYING: 1,
        PAUSED: 2
    };

function filterStrings(rawStrings, manualDelayRegex, newlineDelay) {
    var strings = [],
        stringSpecs = [],
        stringSpec,
        matches,
        matchIndex,
        tmpString,
        string,
        i,
        j;

    for (i = 0; i < rawStrings.length; i += 1) {
        string = rawStrings[i];
        if (string && string.length > 0) {
            tmpString = string;
            stringSpec = {};
            // detect manual delay
            while ((matches = tmpString.match(manualDelayRegex))) {
                matchIndex = tmpString.search(manualDelayRegex);
                stringSpec[matchIndex] = parseInt(matches[1], 10);
                tmpString = tmpString.replace(matches[0], '');
            }

            // detect new line for delaying
            for (j = 0; j < tmpString.length; j += 1) {
                if (tmpString[j] === '\n') {
                    stringSpec[j] = newlineDelay;
                }
            }

            strings.push(tmpString);
            stringSpecs.push(stringSpec);
        }
    }

    return {
        strings: strings,
        stringSpecs: stringSpecs,
    };
}

function transformString(s) {
    var r = '',
        c, i;
    for (i = 0; i < s.length; i += 1) {
        c = s[i];
        // backspace character -> delete one character
        if (c === '\b' && r.length > 0) {
            r = r.substring(0, r.length - 1);
        }
        else {
            r += c;
        }
    }
    return r;
}

function getNonNegativeNumber(delay, defaultDelay) {
    return (typeof delay === 'number' && delay >= 0) ? delay : defaultDelay;
}

function setPlaceholder(element, string) {
    element.setAttribute('placeholder', string);
}

function Placeholder(options) {
    this.element = options.element;
    if (!(this.element instanceof Element)) {
        throw new Error('"options.element" is not an Element object');
    }

    if (!('placeholder' in this.element)) {
        throw new Error('"placeholder" attribute of passing element is not supported');
    }

    if (this.element.$np) {
        throw new Error('Already be placeholder');
    }

    this.elementEventListeners = [];
    this.originalPlaceholder = this.element.getAttribute('placeholder') || '';

    this.loop = getNonNegativeNumber(options.loop, 0);
    this.charDelay = getNonNegativeNumber(options.charDelay, 50);
    this.stringDelay = getNonNegativeNumber(options.stringDelay, 1000);
    this.newlineDelay = getNonNegativeNumber(options.newlineDelay, 1000);
    this.backspaceDelay = getNonNegativeNumber(options.backspaceDelay, 300);

    this.autoStart = !!options.autoStart;
    this.clearAction = options.clearAction || ActionType.START;
    this.focusAction = options.focusAction || ActionType.START;
    if ([ActionType.STOP, ActionType.PAUSE].indexOf(options.blurAction) >= 0) {
        this.blurAction = options.blurAction;
    }
    else {
        this.blurAction = ActionType.STOP;
    }

    var manualDelayRegex = options.manualDelayRegex instanceof RegExp ? options.manualDelayRegex : /\^(\d+)/,
        filterResult = filterStrings(
            options.strings || [],
            manualDelayRegex,
            this.newlineDelay
        );
    this.strings = filterResult.strings;
    this.stringSpecs = filterResult.stringSpecs;
    this.cursor = typeof options.cursor === 'string' ? options.cursor : '|';

    this.dispatcher = new EventDispatcher();

    this._initState();
    this._bootstrap();

    this.element.$np = this;
}

Placeholder.prototype.addEventListener = function (event, listener) {
    this.dispatcher.addEventListener(event, listener);
};

Placeholder.prototype.removeEventListener = function (event, listener) {
    this.dispatcher.removeEventListener(event, listener);
};

Placeholder.prototype.start = function (forceRestart) {
    if (this.element.value) {
        return;
    }

    switch (this.state.id) {
    case State.STOPPED:
        this._start();
        break;

    case State.PAUSED:
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

Placeholder.prototype.stop = function () {
    this._clearTimeout();
    this._initState();
    this._resetPlaceholder();
    this._dispatchEvent(EventType.STOP);
};

Placeholder.prototype.pause = function () {
    if (this.state.id === State.PLAYING) {
        this._clearTimeout();
        this.state.id = State.PAUSED;
        this._dispatchEvent(EventType.PAUSE);
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

    this._resetPlaceholder();
    this._dispatchEvent(EventType.DESTROY);
    this.element.$np = null;
};

Placeholder.prototype._start = function () {
    this._dispatchEvent(EventType.START);
    this._next();
};

Placeholder.prototype._resume = function () {
    this._dispatchEvent(EventType.RESUME);
    setPlaceholder(this.element, this.state.lastStr || '');
    this._next();
};

Placeholder.prototype._resetPlaceholder = function () {
    setPlaceholder(this.element, this.originalPlaceholder);
};

Placeholder.prototype._initState = function () {
    this.state = {
        id: State.STOPPED,
        charIndex: 0,
        stringIndex: 0,
        loop: 0,
        timeoutId: null,
        next: null
    };
};

Placeholder.prototype._extractNextParams = function () {
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
    case ActionType.START:
        this.start(true);
        break;

    case ActionType.RESUME:
        this.start();
        break;

    case ActionType.STOP:
        this.stop();
        break;

    case ActionType.PAUSE:
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

    this._addEventListenerToElement('keypress', function () {
        if (self.element.value) {
            self.pause();
        }
        else {
            self._resetPlaceholder();
            self._doAction(self.clearAction);
        }
    });

    this._addEventListenerToElement('focus', function () {
        self._doAction(self.focusAction);
    });

    this._addEventListenerToElement('blur', function () {
        if (self._doAction(self.blurAction)) {
            self._resetPlaceholder();
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

Placeholder.prototype._dispatchEvent = function (event) {
    this.dispatcher.dispatchEvent(event, this._extractNextParams());
};

Placeholder.prototype._predictNext = function () {
    var state = this.state;
    if (!state.next) {
        var events = [],
            isStop = false,
            isEndLoop = false,
            isEndString = false,
            loop = state.loop,
            charIndex = state.charIndex,
            stringIndex = state.stringIndex,
            strings = this.strings,
            str = strings[stringIndex],
            specialDelay = this.stringSpecs[stringIndex][charIndex], // manual delay
            appySpecialDelay = specialDelay !== undefined,
            delay = appySpecialDelay ? specialDelay : this.charDelay;

        if (charIndex === 0) { // begin string
            if (stringIndex === 0) { // begin loop
                events.push(EventType.BEGIN_LOOP);
                if (this.loop > 0 && loop >= this.loop) { // stop
                    isStop = true;
                    if (!appySpecialDelay) {
                        delay = this.stringDelay;
                    }
                }
            }

            if (!appySpecialDelay && (stringIndex > 0 || loop >= 1)) {
                delay = this.stringDelay;
            }

            events.push(EventType.BEGIN_STRING);
        }
        else if (charIndex === str.length - 1) { // end string
            isEndString = true;
            events.push(EventType.END_STRING);
            if (stringIndex === strings.length - 1) { // end loop
                events.push(EventType.END_LOOP);
                isEndLoop = true;
            }
        }

        // fake deletion effect
        if (!appySpecialDelay && str[charIndex] === '\b') {
            delay = this.backspaceDelay;
        }

        // next state
        state.next = {
            str: transformString(str.substring(0, charIndex + 1) + (isEndString ? '' : this.cursor)),
            events: events,
            isStop: isStop,
            isEndLoop: isEndLoop,
            strings: strings,
            index: stringIndex,
            loop: loop,
            delay: delay
        };

        state.charIndex += 1;
        if (state.charIndex >= str.length) {
            state.charIndex = 0;
            state.stringIndex += 1;
            if (state.stringIndex >= strings.length) {
                state.stringIndex = 0;
            }
        }
    }
};

Placeholder.prototype._next = function () {
    if (this.strings.length <= 0) {
        return this.stop();
    }
    this._clearTimeout();

    this._predictNext();

    var self = this,
        state = self.state;

    state.id = State.PLAYING;
    state.timeoutId = setTimeout(function () {
        var next = state.next;
        if (next) {
            var events = next.events;

            if (next.isStop) {
                return self.stop();
            }

            if (events.length > 0) {
                var i;
                for (i = 0; i < events.length; i += 1) {
                    self._dispatchEvent(events[i]);
                }
            }

            if (next.isEndLoop) {
                state.loop += 1;
            }

            setPlaceholder(self.element, next.str);
            state.lastStr = next.str;
            state.next = null;
            self._next();
        }
    }, state.next.delay);
};

function parseJsonElementAttribute(element, attribute) {
    return JSON.parse(element.getAttribute(attribute) || '""');
}

function ready(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            callback();
        });
    }
    else {
        callback();
    }
}

var app = {
    EventType: EventType,
    ActionType: ActionType,

    create: function (options) {
        return new Placeholder(options);
    },

    createFromElement: function (element) {
        return app.create({
            element: element,
            cursor: parseJsonElementAttribute(element, CLASS_NAME + '-cursor'),
            autoStart: parseJsonElementAttribute(element, CLASS_NAME + '-autoStart'),
            strings: parseJsonElementAttribute(element, CLASS_NAME + '-strings'),
            charDelay: parseJsonElementAttribute(element, CLASS_NAME + '-charDelay'),
            stringDelay: parseJsonElementAttribute(element, CLASS_NAME + '-stringDelay'),
            backspaceDelay: parseJsonElementAttribute(element, CLASS_NAME + '-backspaceDelay'),
            newlineDelay: parseJsonElementAttribute(element, CLASS_NAME + '-newlineDelay'),
            loop: parseJsonElementAttribute(element, CLASS_NAME + '-loop'),
            focusAction: parseJsonElementAttribute(element, CLASS_NAME + '-focusAction'),
            blurAction: parseJsonElementAttribute(element, CLASS_NAME + '-blurAction'),
            clearAction: parseJsonElementAttribute(element, CLASS_NAME + '-clearAction'),
        });
    },

    autoDetect: function () {
        var elements = document.getElementsByClassName(CLASS_NAME),
            i;
        for (i = 0; i < elements.length; i += 1) {
            app.createFromElement(elements[i]);
        }
    }
};

ready(app.autoDetect);

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
