![Demo][demo/gif]

# Introduction
Imagine you create a form and you want visitors to fill them with correct input, for example, *username* must be a string whose length is between 8 and 16, only letters (a-z), numbers (0-9) are allowed. How would you guide your visitors?

Yeah, of course, there are at least three options such as label, "help text" above/below input and placeholder inside input. These options are great and simple, but if the text is long, your form may be verbose and *...boring*.

***Naughty Placeholder*** is a small library to make your form a lot more fun. Animated, describe many and many sentences by typing effect. Just relax and give it a try!

# Features

1. **Easy to use**. You can create placeholder manually by JS or just add conventional markup to static HTML.
2. **Typing effect**.
    - Speed controllable by many delay types.
    - Backspace animation.
    - Multi-lines animation in textarea.
    - Lifecycle controllable: create, start, pause, resume, stop, destroy and loop.
    - Many trigger types for actions on input: focus, lose focus (blur), clear.
    - Many event types.
3. **No dependencies**. No required libraries. Just add `<script>` tag and enjoy.
4. **Cross-browser**. Support all modern browsers.
5. **Small**. Minification version < 7KB, gzip < 3KB.

# Demo
You can self exploration this library via [demo pages][demo/index].

# Usage

## Integrate library to your HTML page
    
    <script src="/path/to/naughty-placeholder.js"></script>
    ...OR
    <script src="/path/to/naughty-placeholder.min.js"></script>

Normally, javascript files are distributed at `naughty-placeholder/naughty-placeholder/js/` directory.

## Create placeholder manually

*I will tell you how to create placeholder automatically in later section.*

Before using any operations, you must create a placeholder instance. It looks like:

    var placeholder = NaughtyPlaceholder.create({
        // input or textarea element
        element: document.getElementById('id'),
        
        // cursor character
        // if you don't want to show it, provide empty string
        cursor: '|',
        
        // start immediately when it's created
        autoStart: false,
        
        // list of strings you want to show
        // PRO tips:
        //   - '\b' (backspace) character can be used to simulate deletion
        //   - '\n' (new line) character can be used to simulate 'enter' if target element is a textarea
        strings: [
            'You can write any sentence',
            'Followed by others',
            'Fake deletion\b\b\bed',
            'Multi-lines\nwill work perfectly\nin textarea'
        ],
        
        // delay time between characters
        charDelay: 100,
        
        // delay time between strings
        stringDelay: 1000,
        
        // delay time between lines
        newlineDelay: 1000,
        
        // delay time to type '\b' (backspace) character
        backspaceDelay: 100,
    
        // customizable manual delay pattern
        manualDelayRegex: /\^(\d+)/,
        
        // number of loops, 0 is forver
        loop: 0,
        
        // action on input focus
        // support: 'start', 'resume', 'pause', 'stop'
        // see below to get more details about 'NaughtyPlaceholder.ActionType'
        focusAction: 'resume',
        
        // action on input blur (lose focus)
        // support: 'pause', 'stop'
        // see below to get more details about 'NaughtyPlaceholder.ActionType'
        blurAction: 'pause',
    
        // action on input clear (empty)
        // support: 'start', 'resume', 'pause', 'stop'
        // see below to get more details about 'NaughtyPlaceholder.ActionType'
        clearAction: 'start',
    });

Options in details:

- `element` Element (required).
    
    Target element to deploy placeholder animation. It should be an `<input>` or `<textarea>`.

- `charDelay` Integer (optional). Default: `50`
    
    Delay time between characters.

- `stringDelay` Integer (optional). Default: `1000`
    
    Delay time between strings.

- `backspaceDelay` Integer (optional). Default: `300`
    
    Delay time to type `'\b'` (backspace) character (fake deletion effect).

- `newlineDelay` Integer (optional). Default: `1000`
    
    Delay time between lines in a string (multi-lines in textarea).

- `strings` Array<String> (required).
    
    List of strings to typing. Each string can be a single line of text (both for `<input>` and `<textarea>`) or a multi-lines of text (works correctly with `<textarea>`).

    **Tips & tricks:**

    - `Fake deletion effect`: use `'\b'` character to specify number of deletion characters. 
    
        For example, statement below can be used to type `I like`, then delete whole `like` word then type `love` to become `I love`:
    
            {
                strings: ['I like\b\b\b\blove'],
                ...
            }

    - `Manual delay`: in most cases, same delay between characters is convenient and good enough. But how would you do if you want to break the *normal*? Easy! Use `^delayTime` at any position in a string.
        
        For example, statement below can be used to type `I think ` in normal speed (100 ms delay), wait in 3 seconds, then type `it's good` to become `I think it's good`:

            {
                strings: ["I think ^3000it's good"],
                ...
            }

        You can change `^delayTime` pattern to detect manual delay time if you want. See `manualDelayRegex` option below.

- `manualDelayRegex` RegExp (optional). Default: `/\^(\d+)/`
    
    Regular expression to detect manual delay time. It must contain digits group `(\d+)`.

- `cursor` String (optional). Default: `|`
    
    Cursor character to show. If you want to hide it while typing, just use empty string.

- `autoStart` Boolean (optional). Default: `false`
    
    Start animation immediately when placeholder instance is created or not.

- `loop` Integer (optional). Default: `0`
    
    Number of animation loops. If you pass 0, animation runs forever.

- `focusAction` String (optional). Default: `start`
    
    Trigger action when input has been focused. See `NaughtyPlaceholder.ActionType` below to get more details.

    Supported actions: `start`, `resume`, `stop`, `pause`.

- `blurAction` String (optional). Default: `stop`
    
    Trigger action when input has been lost focus. See `NaughtyPlaceholder.ActionType` below to get more details.

    Supported actions: `stop`, `pause`.

- `clearAction` String (optional). Default: `start`
    
    Trigger action when input has been empty. See `NaughtyPlaceholder.ActionType` below to get more details.

    Supported actions: `start`, `resume`, `stop`, `pause`.

## Basic workflow
After creating a placeholder, you can use it to start/stop/pause/resume placeholder animation.

### Start animation

    placeholder.start(forceRestart);

Note:

- `forceRestart` Boolean.
    + If it's omitted, or false, placeholder tries to ***resume*** animation if it's been paused before.
    + If it's true, placeholder restarts animation.

- If `autoStart = true`, the placeholder animation will be started immediately after creation without any calls.

### Stop animation

    placeholder.stop();

### Pause animation

    placeholder.pause();

You can resume later:

    placeholder.start();

Hmmm, why don't create `resume()` method? Yeah, I could. But sometimes, you create an UI and don't need to know current placeholder state, you just need only two buttons: play and pause. `start()` works for both resume and totally restart.

### Destroy placeholder

If you don't want to use this placeholder anymore, you can destroy it, release all event listeners on target element, restore default placeholder:

    placeholder.destroy();

## Actions

***Naughty Placeholder*** supports actions on focus, blur and clear input event.

You can use `NaughtyPlaceholder.ActionType` to view constants:

- `'start'` start animation
- `'resume'` resume animation
- `'pause'` pause animation
- `'stop'` stop animation

## Events

***Naughty Placeholder*** supports a number of events too.

You can use `NaughtyPlaceholder.EventType` to view constants:

- `'start'` when start animation
- `'stop'` when stop animation
- `'pause'` when pause animation
- `'resume'` when resume animation
- `'begin-string'` when begin typing string
- `'end-string'` when end of typing string
- `'begin-loop'` when start a loop
- `'end-loop'` when end of a loop
- `'destroy'` when destroy placeholder

For example, if you want to listen `begin-loop (NaughtyPlaceholder.EventType.BEGIN_LOOP)` event:

    placeholder.addEventListener('begin-loop', function (args) {
        // do something
    });

`args` is an object:

- `str` next string to type
- `strings` all of strings
- `index` next index of string in strings
- `loop` current loop number
- `delay` next delay to type

When you don't want to listen an event anymore, you must call:
    
    placeholder.removeEventListener(eventName, eventHandler);

    // Note: "eventHandler" must be same reference as second argument when you had called before:
    placeholder.addEventListener(eventName, eventHanlder)

## Create placeholder automatically

Just add an element with conventional to static HTML:

- Required class name: `np` (can be changed, see below)
- Add prefix `np-` to option as an attribute, for example, `cursor` becomes `np-cursor`

Example:

    <input class="np" type="text" placeholder="Username" np-autoStart="false" np-strings='["Your username contains at least 8 and maximum 16 characters", "Only letters (a-z), numbers(0-9) are allowed", "You can use your phone number as username", "You can\b\b\bCANNOT change it later"]'>

If your element is dynamically added to HTML, you have to call:

    NaughtyPlaceholder.autoDetect();

to re-detect placeholders in your HTML page. Or you can call:

    var placeholder = NaughtyPlaceholder.createFromElement(element);

## Get placeholder instance from element

Placeholder instance is attacted to DOM element via `$np` attribute.

    var element = document.getElementById('your-id'),
        placeholder = element.$np;

    if (placeholder) {
        placeholder.start();
    }    

## Change app endpoint

Currently, my library endpoint is `NaughtyPlaceholder`. But if you want to use an other name, it's quite simple.

Locate `naughty-placeholder.js` file, then replace line:

    var APP_NAME = 'NaughtyPlaceholder'

by any name making you feel comfortable, such as `YourPlaceholder`:

    var APP_NAME = 'YourPlaceholder'

Now you can use `YourPlaceholder.create(options)`, `YourPlaceholder.ActionType`, `YourPlaceholder.EventType` in your application.

For minification version, you can use same technique in `naughty-placeholder.min.js` file or build it using above `naughty-placeholder.js` file by any javascript minifier tool.

## Change required class name for automatically detection

Same as **Change app endpoint**, find section:

    CLASS_NAME = 'np'

then replace `np` to whatever you want.

Note that this class name will be used as attribute prefix, for example, if class name is `something`, `np-cursor` becomes `something-cursor`.

# Feedback

Please feel free to send me feedback to my personal email: `vincejonesjunior@gmail.com`. Thank you all, you guys!

[demo/gif]: img/demo.gif "Demo"
[demo/index]: ../naughty-placeholder/demo/index.html
