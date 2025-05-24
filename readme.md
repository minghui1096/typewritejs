# TypewriteJS

![](preview.gif)

[NPM Repository](https://npmjs.org/typewrite-simple)

## Installation
You can install Typewritejs with just one command and you're good to go
```shell

# with npm
npm i typewrite-simple

# with yarn
yarn add typewrite-simple

# with pnpm
pnpm add typewrite-simple

```

```js
import Typewrite from 'typewrite-simple';

new Typewrite('#typewrite', {
  strings: ['Hello', 'World'],
  autoStart: true,
});
```

## Options

| Name | Type | Default value | Description |
| --- | --- | --- | --- |
| strings | String or Array | null | Strings to type out when using ``autoStart`` option |
| cursor | String | Pipe character | String value to use as the cursor. |
| delay | 'natural' or Number | 'natural' | The delay between each key when typing. |
| deleteSpeed | 'natural' or Number | 'natural' | The delay between deleting each character. |
| loop | Boolean | false | Whether to keep looping or not. |
| autoStart | Boolean | false | Whether to autostart typing strings or not. You are required to provide ``strings`` option. |
| pauseFor | Number | 1500 | The pause duration after a string is typed when using autostart mode |
| devMode | Boolean | false | Whether or not to display console logs. |
| skipAddStyles | Boolean | Skip adding default typewrite css styles. |
| wrapperClassName | String | 'Typewrite__wrapper' | Class name for the wrapper element. |
| cursorClassName | String | 'Typewrite__cursor' | Class name for the cursor element. |
| stringSplitter | Function | String splitter function |
| onCreateTextNode | Function | null | Callback function to replace the internal method which creates a text node for the character before adding it to the DOM. If you return null, then it will not add anything to the DOM and so it is up to you to handle it. |
| onRemoveNode | Function | null | Callback function when a node is about to be removed. First param will be an object `{ node: HTMLNode, charater: string }` |
| onStep | Function | null | Callback function when step pop queue. First param will be an object `{ eventName: IEventName, eventArgs: IEventArgs }` |

## Methods

All methods can be chained together.

| Name | Params | Description |
| --- | --- | --- |
| start | - | Start the typewrite effect. |
| stop | - | Stop the typewrite effect. |
| pauseFor | ``ms`` Time to pause for in milliseconds | Pause for milliseconds |
| typeString | ``string`` String to type out, it can contain HTML tags | Type out a string using the typewrite effect. |
| pasteString | ``string`` String to paste out, it can contain HTML tags | Paste out a string. |
| deleteAll | ``speed`` Speed to delete all visibles nodes, can be number or 'natural' | Delete everything that is visible inside of the typewrite wrapper element. |
| deleteChars | ``amount`` Number of characters | Delete and amount of characters, starting at the end of the visible string. |
| callFunction | ``cb`` Callback, ``thisArg`` this Object to bind to the callback function | Call a callback function. The first parameter to the callback ``elements`` which contains all DOM nodes used in the typewrite effect. |
| changeDeleteSpeed | ``speed`` Number or 'natural' | The speed at which to delete the characters, lower number is faster. |
| changeDelay | ``delay`` Number or 'natural' | Change the delay when typing out each character |
| clearEventQueue | - | cleaer the eventQueue  |

## Examples

### Basic example

```js
var app = document.getElementById('app');

var typewrite = new Typewrite(app, {
  loop: true,
  delay: 75,
});

typewrite
  .pauseFor(2500)
  .typeString('A simple yet powerful native javascript')
  .pauseFor(300)
  .deleteChars(10)
  .typeString('<strong>JS</strong> plugin for a cool typewrite effect and ')
  .typeString('<strong>only <span style="color: #27ae60;">5kb</span> Gzipped!</strong>')
  .pauseFor(1000)
  .start();
```

### Custom text node creator using callback

```js
var app = document.getElementById('app');

var customNodeCreator = function(character) {
  return document.createTextNode(character);
}

var typewrite = new Typewrite(app, {
  loop: true,
  delay: 75,
  onCreateTextNode: customNodeCreator,
});

typewrite
  .typeString('A simple yet powerful native javascript')
  .pauseFor(300)
  .start();
```

### Customize typing control using onStep

```js
const app = document.getElementById('app')
let recordStr = ''
const typewrite = new Typewrite('', {
  delay: 50,
  onStep: (currentEvent) => {
    const character = currentEvent.eventArgs.character
    const eventName = currentEvent.eventName
    if (eventName === 'TYPE_CHARACTER' && character) {
      recordStr += character
      app.innerHTML = recordStr
    }
  }
})
typewrite.typeCharacters([...'this is customize typing control']).start()
setTimeout(() => {
  typewrite.stop().clearEventQueue()
  recordStr = ''
  app.innerHTML = ''
}, 1000)
setTimeout(() => {
  typewrite.typeCharacters([...'clear the queue']).start()
}, 1500)
```

### Custom handling text insert using input placeholder

```js
var input = document.getElementById('input')

var customNodeCreator = function(character) {
  // Add character to input placeholder
  input.placeholder = input.placeholder + character;

  // Return null to skip internal adding of dom node
  return null;
}

var onRemoveNode = function({ character }) {
  if(input.placeholder) {
    // Remove last character from input placeholder
    input.placeholder = input.placeholder.slice(0, -1)
  }
}

var typewrite = new Typewrite(null, {
  loop: true,
  delay: 75,
  onCreateTextNode: customNodeCreator,
  onRemoveNode: onRemoveNode,
});

typewrite
  .typeString('A simple yet powerful native javascript')
  .pauseFor(300)
  .start();
```

