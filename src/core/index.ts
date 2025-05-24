import raf, { cancel as cancelRaf } from 'raf'
import { doesStringContainHTMLTag, getDOMElementFromString, getRandomInteger, addStyles } from '../utils'
import { EVENT_NAMES, VISIBLE_NODE_TYPES, STYLES } from './constants'

export type IEventName = keyof typeof EVENT_NAMES
export type IEventArgs = Record<string, any>

export interface IEventQueue {
  eventName: IEventName
  eventArgs: IEventArgs
}

export type ISpeed = 'natural' | number

export interface IState {
  cursorAnimation: null
  lastFrameTime: null | number
  pauseUntil: null | number
  eventQueue: IEventQueue[]
  eventLoop: null | number
  eventLoopPaused: boolean
  reverseCalledEvents: IEventQueue[]
  calledEvents: IEventQueue[]
  visibleNodes: any[]
  initialOptions: null | IOptions
  elements: {
    container: null | HTMLElement
    wrapper: HTMLElement
    cursor: HTMLElement
  }
}

type IFn = (...args: any[]) => any

export interface TypewriteState {
  elements: {
    container: HTMLDivElement
    cursor: HTMLSpanElement
    wrapper: HTMLSpanElement
  }
}

export type IMessage = {
  currentEvent: IEventQueue
  state: IState
  delay: number
}

interface IOptions {
  strings?: string | string[]
  cursor?: string
  delay?: ISpeed
  pauseFor?: number
  deleteSpeed?: ISpeed
  loop?: boolean
  autoStart?: boolean
  devMode?: boolean
  skipAddStyles?: boolean
  wrapperClassName?: string
  cursorClassName?: string
  stringSplitter?: null | IFn
  onCreateTextNode?: null | IFn
  onRemoveNode?: null | IFn
  onStep?: null | ((currentEvent: IEventQueue) => any)
}

class Typewrite {
  state: IState = {
    cursorAnimation: null,
    lastFrameTime: null,
    pauseUntil: null,
    eventQueue: [],
    eventLoop: null,
    eventLoopPaused: false,
    reverseCalledEvents: [],
    calledEvents: [],
    visibleNodes: [],
    initialOptions: null,
    elements: {
      container: null,
      wrapper: document.createElement('span'),
      cursor: document.createElement('span')
    }
  }

  options: IOptions = {
    strings: '',
    cursor: '|',
    delay: 'natural',
    pauseFor: 1500,
    deleteSpeed: 'natural',
    loop: false,
    autoStart: false,
    devMode: false,
    skipAddStyles: false,
    wrapperClassName: 'Typewrite__wrapper',
    cursorClassName: 'Typewrite__cursor',
    stringSplitter: null,
    onCreateTextNode: null,
    onRemoveNode: null,
    onStep: null
  }

  constructor(container: string | HTMLElement, options: IOptions) {
    if (container) {
      if (typeof container === 'string') {
        const containerElement = document.querySelector(container) as HTMLElement

        if (!containerElement) {
          throw new Error('Could not find container element')
        }

        this.state.elements.container = containerElement
      } else {
        this.state.elements.container = container
      }
    }

    if (options) {
      this.options = {
        ...this.options,
        ...options
      }
    }

    // Make a copy of the options used to reset options when looping
    this.state.initialOptions = { ...this.options }

    this.init()
  }

  init() {
    this.setupWrapperElement()
    this.addEventToQueue(EVENT_NAMES.CHANGE_CURSOR, { cursor: this.options.cursor }, true)
    this.addEventToQueue(EVENT_NAMES.REMOVE_ALL, null, true)

    if (window && !window.___TYPEWRITE_JS_STYLES_ADDED___ && !this.options.skipAddStyles) {
      addStyles(STYLES)
      window.___TYPEWRITE_JS_STYLES_ADDED___ = true
    }

    if (this.options.autoStart === true && this.options.strings) {
      this.typeOutAllStrings().start()
    }
  }

  /**
   * Replace all child nodes of provided element with
   * state wrapper element used for typewrite effect
   */
  setupWrapperElement = () => {
    if (!this.state.elements.container) {
      return
    }

    this.state.elements.wrapper.className = this.options.wrapperClassName!
    this.state.elements.cursor.className = this.options.cursorClassName!

    this.state.elements.cursor.innerHTML = this.options.cursor!
    this.state.elements.container.innerHTML = ''

    this.state.elements.container.appendChild(this.state.elements.wrapper)
    this.state.elements.container.appendChild(this.state.elements.cursor)
  }

  /**
   * Start typewrite effect
   */
  start = (): Typewrite => {
    this.state.eventLoopPaused = false
    this.runEventLoop()

    return this
  }

  /**
   * Pause the event loop
   */
  pause = (): Typewrite => {
    this.state.eventLoopPaused = true

    return this
  }

  /**
   * Destroy current running instance
   */
  stop = (): Typewrite => {
    if (this.state.eventLoop) {
      cancelRaf(this.state.eventLoop)
      this.state.eventLoop = null
    }

    return this
  }

  /**
   * Add pause event to queue for ms provided
   *
   * @param {Number} ms Time in ms to pause for
   * @return {Typewrite}
   */
  pauseFor = (ms: number): Typewrite => {
    this.addEventToQueue(EVENT_NAMES.PAUSE_FOR, { ms })

    return this
  }

  /**
   * Start typewrite effect by typing
   * out all strings provided
   *
   * @return {Typewrite}
   */
  typeOutAllStrings = (): Typewrite => {
    if (typeof this.options.strings === 'string') {
      this.typeString(this.options.strings).pauseFor(this.options.pauseFor!)
      return this
    }

    this.options.strings!.forEach((string) => {
      this.typeString(string).pauseFor(this.options.pauseFor!).deleteAll(this.options.deleteSpeed!)
    })

    return this
  }

  /**
   * Adds string characters to event queue for typing
   *
   * @param {String} string String to type
   * @param {HTMLElement} node Node to add character inside of
   * @return {Typewrite}
   */
  typeString = (string: string, node: null | HTMLElement = null): Typewrite => {
    if (doesStringContainHTMLTag(string)) {
      return this.typeOutHTMLString(string, node)
    }

    if (string) {
      const { stringSplitter } = this.options || {}
      const characters = typeof stringSplitter === 'function' ? stringSplitter(string) : string.split('')
      this.typeCharacters(characters, node)
    }

    return this
  }

  /**
   * Adds entire strings to event queue for paste effect
   *
   * @param {String} string String to paste
   * @param {HTMLElement} node Node to add string inside of
   * @return {Typewrite}
   */
  pasteString = (string: string, node: null | HTMLElement = null): Typewrite => {
    if (doesStringContainHTMLTag(string)) {
      return this.typeOutHTMLString(string, node, true)
    }

    if (string) {
      this.addEventToQueue(EVENT_NAMES.PASTE_STRING, {
        character: string,
        node
      })
    }

    return this
  }

  /**
   * Type out a string which is wrapper around HTML tag
   *
   * @param {String} string String to type
   * @param {HTMLElement} parentNode Node to add inner nodes to
   * @return {Typewrite}
   */
  typeOutHTMLString = (string: string, parentNode: null | HTMLElement = null, pasteEffect?: boolean): Typewrite => {
    const childNodes = getDOMElementFromString(string)

    if (childNodes.length > 0) {
      for (let i = 0; i < childNodes.length; i++) {
        const node = childNodes[i] as HTMLElement
        const nodeHTML = node.innerHTML

        if (node && node.nodeType !== 3) {
          // Reset innerText of HTML element
          node.innerHTML = ''

          // Add event queue item to insert HTML tag before typing characters
          this.addEventToQueue(EVENT_NAMES.ADD_HTML_TAG_ELEMENT, {
            node,
            parentNode
          })

          pasteEffect ? this.pasteString(nodeHTML, node) : this.typeString(nodeHTML, node)
        } else {
          if (node.textContent) {
            pasteEffect ? this.pasteString(node.textContent, parentNode) : this.typeString(node.textContent, parentNode)
          }
        }
      }
    }

    return this
  }

  /**
   * Add delete all characters to event queue
   * @param {ISpeed} speed to delete all visibles nodes, can be number or 'natural'
   * @return {Typewrite}
   */
  deleteAll = (speed: ISpeed = 'natural'): Typewrite => {
    this.addEventToQueue(EVENT_NAMES.REMOVE_ALL, { speed })
    return this
  }

  /**
   * Change delete speed
   *
   * @param {Number} speed Speed to use for deleting characters
   * @return {Typewrite}
   */
  changeDeleteSpeed = (speed: number): Typewrite => {
    if (!speed) {
      throw new Error('Must provide new delete speed')
    }

    this.addEventToQueue(EVENT_NAMES.CHANGE_DELETE_SPEED, { speed })

    return this
  }

  /**
   * Change delay when typing
   *
   * @param {Number} delay Delay when typing out characters
   * @return {Typewrite}
   */
  changeDelay = (delay: number): Typewrite => {
    if (!delay) {
      throw new Error('Must provide new delay')
    }

    this.addEventToQueue(EVENT_NAMES.CHANGE_DELAY, { delay })

    return this
  }

  /**
   * Change cursor
   * @param {String} cursor /string to represent as cursor
   * @return {Typewrite}
   */
  changeCursor = (cursor: string): Typewrite => {
    if (!cursor) {
      throw new Error('Must provide new cursor')
    }

    this.addEventToQueue(EVENT_NAMES.CHANGE_CURSOR, { cursor })

    return this
  }

  /**
   * Add delete character to event queue for amount of characters provided
   *
   * @param {Number} amount Number of characters to remove
   * @return {Typewrite}
   */
  deleteChars = (amount: number): Typewrite => {
    if (!amount) {
      throw new Error('Must provide amount of characters to delete')
    }

    for (let i = 0; i < amount; i++) {
      this.addEventToQueue(EVENT_NAMES.REMOVE_CHARACTER)
    }

    return this
  }

  /**
   * Add an event item to call a callback function
   *
   * @param {cb}      cb        Callback function to call
   * @param {Object}  thisArg   thisArg to use when calling function
   * @return {Typewrite}
   */
  callFunction = (cb: (state: TypewriteState) => void, thisArg?: Record<string, any>): Typewrite => {
    if (!cb || typeof cb !== 'function') {
      throw new Error('Callback must be a function')
    }

    this.addEventToQueue(EVENT_NAMES.CALL_FUNCTION, { cb, thisArg })

    return this
  }

  /**
   * Add type character event for each character
   *
   * @param {Array} characters Array of characters
   * @param {HTMLElement} node Node to add character inside of
   * @return {Typewrite}
   */
  typeCharacters = (characters: string[], node: null | HTMLElement = null): Typewrite => {
    if (!characters || !Array.isArray(characters)) {
      throw new Error('Characters must be an array')
    }

    characters.forEach((character) => {
      this.addEventToQueue(EVENT_NAMES.TYPE_CHARACTER, { character, node })
    })

    return this
  }

  /**
   * Add remove character event for each character
   *
   * @param {Array} characters Array of characters
   * @return {Typewrite}
   */
  removeCharacters = (characters: string[]): Typewrite => {
    if (!characters || !Array.isArray(characters)) {
      throw new Error('Characters must be an array')
    }

    characters.forEach(() => {
      this.addEventToQueue(EVENT_NAMES.REMOVE_CHARACTER)
    })

    return this
  }

  /**
   * Add an event to the event queue
   *
   * @param {String}  eventName Name of the event
   * @param {Object}  eventArgs Arguments to pass to event callback
   * @param {Boolean} prepend   Prepend to begining of event queue
   * @return {Typewrite}
   */
  addEventToQueue = (eventName: IEventName, eventArgs?: null | IEventArgs, prepend?: boolean): Typewrite => {
    return this.addEventToStateProperty(eventName, eventArgs, prepend, 'eventQueue')
  }

  /**
   * Add an event to reverse called events used for looping
   *
   * @param {String}  eventName Name of the event
   * @param {Object}  eventArgs Arguments to pass to event callback
   * @param {Boolean} prepend   Prepend to begining of event queue
   * @return {Typewrite}
   */
  addReverseCalledEvent = (eventName: IEventName, eventArgs: IEventArgs, prepend: boolean = false): Typewrite => {
    const { loop } = this.options

    if (!loop) {
      return this
    }

    return this.addEventToStateProperty(eventName, eventArgs, prepend, 'reverseCalledEvents')
  }

  /**
   * Add an event to correct state property
   *
   * @param {String}  eventName Name of the event
   * @param {Object}  eventArgs Arguments to pass to event callback
   * @param {Boolean} prepend   Prepend to begining of event queue
   * @param {String}  property  Property name of state object
   * @return {Typewrite}
   */
  addEventToStateProperty = (
    eventName: IEventName,
    eventArgs?: null | IEventArgs,
    prepend?: boolean,
    property?: 'eventQueue' | 'reverseCalledEvents'
  ): Typewrite => {
    const eventItem = {
      eventName,
      eventArgs: eventArgs || {}
    }

    if (prepend) {
      // @ts-ignore
      this.state[property] = [eventItem, ...this.state[property]]
    } else {
      // @ts-ignore
      this.state[property] = [...this.state[property], eventItem]
    }

    return this
  }

  /**
   * Run the event loop and do anything inside of the queue
   */
  runEventLoop = () => {
    if (!this.state.lastFrameTime) {
      this.state.lastFrameTime = Date.now()
    }

    // Setup variables to calculate if this frame should run
    const nowTime = Date.now()
    const delta = nowTime - this.state.lastFrameTime

    if (!this.state.eventQueue.length) {
      if (!this.options.loop) {
        return
      }

      // Reset event queue if we are looping
      this.state.eventQueue = [...this.state.calledEvents]
      this.state.calledEvents = []
      this.options = { ...this.state.initialOptions! }
    }

    // Request next frame
    this.state.eventLoop = raf(this.runEventLoop)

    // Check if event loop is paused
    if (this.state.eventLoopPaused) {
      return
    }

    // Check if state has pause until time
    if (this.state.pauseUntil) {
      // Check if event loop should be paused
      if (nowTime < this.state.pauseUntil) {
        return
      }

      // Reset pause time
      this.state.pauseUntil = null
    }

    // Make a clone of event queue
    const eventQueue = [...this.state.eventQueue]

    // Get first event from queue
    const currentEvent = eventQueue.shift()!

    // Setup delay variable
    let delay = 0

    // Check if frame should run or be
    // skipped based on fps interval
    if (
      currentEvent.eventName === EVENT_NAMES.REMOVE_LAST_VISIBLE_NODE ||
      currentEvent.eventName === EVENT_NAMES.REMOVE_CHARACTER
    ) {
      delay = this.options.deleteSpeed === 'natural' ? getRandomInteger(40, 80) : this.options.deleteSpeed!
    } else {
      delay = this.options.delay === 'natural' ? getRandomInteger(120, 160) : this.options.delay!
    }

    if (delta <= delay) {
      return
    }

    // Get current event args
    const { eventName, eventArgs } = currentEvent

    this.logInDevMode({ currentEvent, state: this.state, delay })
    this.options.onStep?.(currentEvent)

    // Run item from event loop
    switch (eventName) {
      case EVENT_NAMES.PASTE_STRING:
      case EVENT_NAMES.TYPE_CHARACTER: {
        const { character, node } = eventArgs
        const textNode = document.createTextNode(character)

        let textNodeToUse = textNode

        if (this.options.onCreateTextNode && typeof this.options.onCreateTextNode === 'function') {
          textNodeToUse = this.options.onCreateTextNode(character, textNode)
        }

        if (textNodeToUse) {
          if (node) {
            node.appendChild(textNodeToUse)
          } else {
            this.state.elements.wrapper.appendChild(textNodeToUse)
          }
        }

        this.state.visibleNodes = [
          ...this.state.visibleNodes,
          {
            type: VISIBLE_NODE_TYPES.TEXT_NODE,
            character,
            node: textNodeToUse
          }
        ]

        break
      }

      case EVENT_NAMES.REMOVE_CHARACTER: {
        eventQueue.unshift({
          eventName: EVENT_NAMES.REMOVE_LAST_VISIBLE_NODE,
          eventArgs: { removingCharacterNode: true }
        })
        break
      }

      case EVENT_NAMES.PAUSE_FOR: {
        const { ms } = currentEvent.eventArgs
        this.state.pauseUntil = Date.now() + parseInt(ms)
        break
      }

      case EVENT_NAMES.CALL_FUNCTION: {
        const { cb, thisArg } = currentEvent.eventArgs

        cb.call(thisArg, {
          elements: this.state.elements
        })

        break
      }

      case EVENT_NAMES.ADD_HTML_TAG_ELEMENT: {
        const { node, parentNode } = currentEvent.eventArgs

        if (!parentNode) {
          this.state.elements.wrapper.appendChild(node)
        } else {
          parentNode.appendChild(node)
        }

        this.state.visibleNodes = [
          ...this.state.visibleNodes,
          {
            type: VISIBLE_NODE_TYPES.HTML_TAG,
            node,
            parentNode: parentNode || this.state.elements.wrapper
          }
        ]
        break
      }

      case EVENT_NAMES.REMOVE_ALL: {
        const { visibleNodes } = this.state
        const { speed } = eventArgs
        const removeAllEventItems = []

        // Change speed before deleteing
        if (speed) {
          removeAllEventItems.push({
            eventName: EVENT_NAMES.CHANGE_DELETE_SPEED,
            eventArgs: { speed, temp: true }
          })
        }

        for (let i = 0, length = visibleNodes.length; i < length; i++) {
          removeAllEventItems.push({
            eventName: EVENT_NAMES.REMOVE_LAST_VISIBLE_NODE,
            eventArgs: { removingCharacterNode: false }
          })
        }

        // Change speed back to normal after deleteing
        if (speed) {
          removeAllEventItems.push({
            eventName: EVENT_NAMES.CHANGE_DELETE_SPEED,
            eventArgs: { speed: this.options.deleteSpeed, temp: true }
          })
        }

        eventQueue.unshift(...removeAllEventItems)

        break
      }

      case EVENT_NAMES.REMOVE_LAST_VISIBLE_NODE: {
        const { removingCharacterNode } = currentEvent.eventArgs

        if (this.state.visibleNodes.length) {
          const { type, node, character } = this.state.visibleNodes.pop()

          if (this.options.onRemoveNode && typeof this.options.onRemoveNode === 'function') {
            this.options.onRemoveNode({
              node,
              character
            })
          }

          if (node) {
            node.parentNode.removeChild(node)
          }

          // Remove extra node as current deleted one is just an empty wrapper node
          if (type === VISIBLE_NODE_TYPES.HTML_TAG && removingCharacterNode) {
            eventQueue.unshift({
              eventName: EVENT_NAMES.REMOVE_LAST_VISIBLE_NODE,
              eventArgs: {}
            })
          }
        }
        break
      }

      case EVENT_NAMES.CHANGE_DELETE_SPEED: {
        this.options.deleteSpeed = currentEvent.eventArgs.speed
        break
      }

      case EVENT_NAMES.CHANGE_DELAY: {
        this.options.delay = currentEvent.eventArgs.delay
        break
      }

      case EVENT_NAMES.CHANGE_CURSOR: {
        this.options.cursor = currentEvent.eventArgs.cursor
        this.state.elements.cursor.innerHTML = currentEvent.eventArgs.cursor
        break
      }

      default: {
        break
      }
    }

    // Add que item to called queue if we are looping
    if (this.options.loop) {
      if (
        currentEvent.eventName !== EVENT_NAMES.REMOVE_LAST_VISIBLE_NODE &&
        !(currentEvent.eventArgs && currentEvent.eventArgs.temp)
      ) {
        this.state.calledEvents = [...this.state.calledEvents, currentEvent]
      }
    }

    // Replace state event queue with cloned queue
    this.state.eventQueue = eventQueue

    // Set last frame time so it can be used to calculate next frame
    this.state.lastFrameTime = nowTime
  }

  /**
   * Log a message in development mode
   *
   * @param {IMessage} message Message or item to console.log
   */
  logInDevMode(message: IMessage) {
    if (this.options.devMode) {
      console.log(message)
    }
  }
  /**
   * Clear all characters to event queue
   *
   * @return {Typewrite}
   */
  clearEventQueue = (): Typewrite => {
    this.state.eventQueue = []
    return this
  }
}

export default Typewrite
