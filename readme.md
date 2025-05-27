# TypewriteJS

![](preview.gif)

[NPM 仓库链接](https://npmjs.org/typewrite-simple)

## 安装

```shell
# 使用 npm
npm i typewrite-simple

# 使用 yarn
yarn add typewrite-simple

# 使用 pnpm
pnpm add typewrite-simple
```

```js
import Typewrite from 'typewrite-simple';

new Typewrite('#typewrite', {
  strings: ['Hello', 'World'],
  autoStart: true,
});
```

## 配置项（Options）

| 名称 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| strings | String \| Array | null | 在使用 ``autoStart`` 选项时需要提供要打字显示的字符串 |
| cursor | String | 竖线字符 | 显示光标的字符 |
| delay | 'natural' \| Number | 'natural' | 打字时每个字符之间的延迟时间 |
| deleteSpeed | 'natural' \| Number | 'natural' | 删除字符时的延迟时间 |
| loop | Boolean | false | 是否循环播放 |
| autoStart | Boolean | false | 是否自动开始打字。需要提供 ``strings`` 配置项 |
| pauseFor | Number | 1500 | 自动模式下，字符串输入完成后的暂停时间 |
| devMode | Boolean | false | 是否在控制台输出日志 |
| skipAddStyles | Boolean | false | 是否跳过添加默认的 CSS 样式 |
| wrapperClassName | String | 'Typewrite__wrapper' | 包裹元素的类名 |
| cursorClassName | String | 'Typewrite__cursor' | 光标元素的类名 |
| stringSplitter | Function | null | 字符串拆分函数 |
| onCreateTextNode | Function | null | 创建文本节点的回调函数。如果你返回 null，则不会将节点添加到 DOM 中，你需要自己处理 |
| onRemoveNode | Function | null | 当某个节点即将被移除时触发的回调函数。第一个参数是 `{ node: HTMLNode, charater: string }` |
| onStep | Function | null | 步骤执行时触发的回调函数。第一个参数是 `{ eventName: IEventName, eventArgs: IEventArgs }` |

## 方法（Methods）

所有方法都可以链式调用。

| 名称 | 参数 | 描述 |
| --- | --- | --- |
| start | - | 开始打字效果 |
| stop | - | 停止打字效果 |
| pauseFor | ``ms`` 暂停时间（毫秒） | 暂停指定时间 |
| typeString | ``string`` 要打字显示的字符串，可以包含 HTML 标签 | 以打字效果显示字符串 |
| pasteString | ``string`` 要粘贴显示的字符串，可以包含 HTML 标签 | 直接显示字符串 |
| deleteAll | ``speed`` 删除速度，可以是数字或 'natural' | 删除容器内所有可见的内容 |
| deleteChars | ``amount`` 要删除的字符数 | 从末尾开始删除指定数量的字符 |
| callFunction | ``cb`` 回调函数，``thisArg`` 绑定 this 的对象 | 调用回调函数。回调的第一个参数是包含所有 DOM 节点的对象 |
| changeDeleteSpeed | ``speed`` 删除速度，可以是数字或 'natural' | 改变删除字符的速度，数值越小越快 |
| changeDelay | ``delay`` 延迟时间，可以是数字或 'natural' | 改变每个字符输入的延迟时间 |
| clearEventQueue | - | 清空事件队列 |

## 示例（Examples）

### 基础示例

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

### 自定义文本节点创建器

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

### 使用 `onStep` 控制打字过程

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

### 自定义文本插入：输入框占位符示例

```js
var input = document.getElementById('input')

var customNodeCreator = function(character) {
  // 添加字符到输入框的 placeholder
  input.placeholder = input.placeholder + character;

  // 返回 null 表示不进行内部 DOM 节点添加
  return null;
}

var onRemoveNode = function({ character }) {
  if(input.placeholder) {
    // 移除占位符中的最后一个字符
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