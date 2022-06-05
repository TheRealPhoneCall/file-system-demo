const clone = require("lodash.clone")
const clonedeep = require("lodash.clonedeep")
const sanitizeHtml = require('sanitize-html')

import { snakeCase } from 'lodash'

import { Notify, scroll } from "quasar"
const { getScrollTarget, setScrollPosition } = scroll

export const MAX_QUERY = 20

// source: https://stackoverflow.com/a/18650828
export const formatBytes = function (bytes, decimals) {
  if (bytes === 0) return "0 Bytes"
  var k = 1024,
    dm = decimals <= 0 ? 0 : decimals || 2,
    sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
    i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

export const copy = (deep, source) => {
  if (deep) return clonedeep(source)
  else return clone(source)
}

export const copy2 = source => {
  return JSON.parse(JSON.stringify(source))
}

export function convertCamelToSnakeCase (payload) {
  return snakeCase(payload)
}

export function fixedTwoDecimalPlaces (num) {
  return (Math.round(num * 100) / 100).toFixed(2)
}

export const errorNotif = {
  setDefaults () {
    Notify.setDefaults({
      color: "negative",
      icon: "report_problem",
      textColor: "white",
      position: "bottom-left",
      actions: [
        { label: 'Dismiss', color: 'white', handler: () => { /* ... */ } }
      ]
    })
  },
  // param --> object | created from throw new Error(<msg>)
  notify (error) {
    if (!process.env.DEV_) return

    const { name, message, position } = error
    let msg = `<b>${name.toUpperCase()}</b><br>
               ${message}`
    let payload = { message: msg, html: true, timeout: 5000, progress: true }
    if (position) {
      payload.position = position
    }
    Notify.create(payload)
  },

  // param --> object
  rest (error) {
    if (!process.env.DEV_) return

    const { method, url } = error.config
    const { statusText, status, data } = error.response
    console.log("errs: ", method, url, statusText, status)
    let message = `REST request error<br>
                   Type: ${method.toUpperCase()}<br>
                   URL: ${url}<br>
                   Response: ${statusText} (${status})
                   Message: ${data}
                  `
    Notify.create({
      message,
      html: true
    })
  }
}

// takes an element object
export const scrollToElement = function (el) {
  const target = getScrollTarget(el)
  const offset = el.offsetTop
  const duration = 500
  setScrollPosition(target, offset, duration)
}

export const scrollTo = function (el, valign) {
  console.log('scrollTo: ', el)
  const pos = el.style.position
  const top = el.style.top
  el.style.position = 'relative'
  el.style.top = '-60px'

  el.scrollIntoView({
    block: valign,
    inline: "nearest",
    behavior: 'smooth'
  })

  el.style.top = top
  el.style.position = pos
}

export const sanitize = dirty => sanitizeHtml(dirty, {
  allowedTags: [],
  allowedAttributes: {},
  allowedSchemes: [],
  allowedSchemesAppliedToAttributes: []
})
