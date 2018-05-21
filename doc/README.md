<center>![Demo][demo/gif]</center>

# Introduction
Imagine you create a form and you want visitors to fill them with correct input, for example, *username* must be a string whose length is between 8 and 16, only letters (a-z), numbers (0-9) are allowed. How would you guide your visitors?

Yeah, of course, there are at least three options such as label, "help text" above/below input and placeholder inside input. These options are great and simple, but if the text is long, your form may be verbose and *...boring*.

***Placeholder Guide*** is a tiny library to make your form a lot more fun. Animated, describe many and many sentences by typing effect. Just relax and give it a try!

# Demo
You can self exploration this library via demo pages.

1. [Placeholder Guide with &lt;input&gt;][demo/page/input]
2. [Placeholder Guide with &lt;textarea&gt;][demo/page/textarea]

# Usage

## Integrate library to your HTML page
    
    <script src="/path/to/sweet-placeholder.js"></script>
    ...OR
    <script src="/path/to/sweet-placeholder.min.js"></script>

Normally, javascript files are distributed at **sweet-placeholder/sweet-placeholder/js/** directory.

## Create placeholder

Before using any operations, you must create a placeholder instance. It looks like:

    var placeholder = Placeholder.create({
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
        
        // number of loops, 0 is forver
        loop: 0,
        
        // action on input focus
        // support: 'start', 'resume', 'pause', 'stop'
        // see below to get more details about 'Placeholder.ActionType'
        focusAction: 'resume',
        
        // action on input blur (lose focus)
        // support: 'pause', 'stop'
        // see below to get more details about 'Placeholder.ActionType'
        blurAction: 'pause',
    
        // action on input clear (empty)
        // support: 'start', 'resume', 'pause', 'stop'
        // see below to get more details about 'Placeholder.ActionType'
        clearAction: 'start',
    });

## Basic workflow
After creating a placeholder, you can use it to start/stop/pause/resume placeholder animation.

### Start animation

    placeholder.start(forceRestart);

Note:

- forceRestart: boolean.
    + If it's omitted, or false, placeholder tries to **resume** animation if it's been paused before.
    + If it's true, placeholder restarts animation.

- If "autoStart" is true, the placeholder animation will be started immediately after creation without any calls.

### Stop animation

    placeholder.stop();

### Pause animation

    placeholder.pause();

You can resume later:

    placeholder.start();

### Destroy placeholder

If you don't want to use this placeholder anymore, you can destroy it, release all event listeners on target element, restore default placeholder:

    placeholder.destroy();

## Action types

***Placeholder Guide*** supports actions on focus, blur and clear input event.

You can use "Placeholder.ActionType" to view constants:

- start: start animation
- resume: resume animation
- pause: pause animation
- stop: stop animation

As easy as a pie!

## Event types

***Placeholder Guide*** supports a number of events too.

You can use "Placeholder.EventType" to view constants:

- start: when start animation
- stop: when stop animation
- pause: when pause animation
- resume: when resume animation
- begin-string: when begin typing string
- end-string: when end of typing string
- begin-loop: when start a loop
- end-loop: when end of a loop
- destroy: when destroy placeholder

For example, if you want to listen "begin-loop" event:

    placeholder.addEventListener('begin-loop', function (args) {
        // do something
    });

"args" is an object:

- str: next string to type
- strings: all of strings
- index: next index of string in strings
- loop: current loop number
- delay: next delay to type

When you don't want to listen events anymore, you must call:
    
    placeholder.removeEventListener(eventName, eventHandler);

    // Note: "eventHandler" must be same reference as second argument when you call:
    //     placeholder.addEventListener(eventName, eventHanlder)

[demo/gif]: img/demo.gif "Demo"
[demo/page/input]: ../sweet-placeholder/demo/text-input.html
[demo/page/textarea]: ../sweet-placeholder/demo/textarea.html