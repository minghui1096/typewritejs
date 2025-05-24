export const EVENT_NAMES = {
  TYPE_CHARACTER: 'TYPE_CHARACTER',
  REMOVE_CHARACTER: 'REMOVE_CHARACTER',
  REMOVE_ALL: 'REMOVE_ALL',
  REMOVE_LAST_VISIBLE_NODE: 'REMOVE_LAST_VISIBLE_NODE',
  PAUSE_FOR: 'PAUSE_FOR',
  CALL_FUNCTION: 'CALL_FUNCTION',
  ADD_HTML_TAG_ELEMENT: 'ADD_HTML_TAG_ELEMENT',
  REMOVE_HTML_TAG_ELEMENT: 'REMOVE_HTML_TAG_ELEMENT',
  CHANGE_DELETE_SPEED: 'CHANGE_DELETE_SPEED',
  CHANGE_DELAY: 'CHANGE_DELAY',
  CHANGE_CURSOR: 'CHANGE_CURSOR',
  PASTE_STRING: 'PASTE_STRING'
} as const

export const VISIBLE_NODE_TYPES = {
  HTML_TAG: 'HTML_TAG',
  TEXT_NODE: 'TEXT_NODE'
}

export const STYLES = `.Typewrite__cursor{-webkit-animation:Typewrite-cursor 1s infinite;animation:Typewrite-cursor 1s infinite;margin-left:1px}@-webkit-keyframes Typewrite-cursor{0%{opacity:0}50%{opacity:1}100%{opacity:0}}@keyframes Typewrite-cursor{0%{opacity:0}50%{opacity:1}100%{opacity:0}}`
