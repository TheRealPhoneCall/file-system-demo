import { errorNotif, sanitize } from "src/utils/utils"
import axios from "axios"
import Vue from "vue"

// set notif defaults
errorNotif.setDefaults()

const limitText = function (text, limit = 150) {
  if (text.length <= limit) return text
  return `${text.slice(0, limit)}...`
}

export const catchError = function (error) {
  const { name, message } = error
  let data = error.response ? error.response.data : null
  data = typeof data === 'object' ? JSON.stringify(data) : data

  const err = {
    name,
    message: limitText(sanitize(data || message))
  }

  errorNotif.notify(err)
}

export const rest = {
  actions: {
    sessionEnded ({ commit }) {
      commit('resetState', null, { root: true })

      const error = new Error('Session has ended. Authenticate first to continue')
      error.name = 'Session Error'

      throw error
    },

    async getRequest ({ commit, dispatch, state, rootGetters }, payload) {
      const { url } = payload

      try {
        const response = await axios.get(url)
        return response
      } catch (error) {
        catchError(error)
        throw error
      }
    },
    async postRequest ({ commit, dispatch, state, rootGetters }, payload) {
      const { url, body, headers } = payload

      try {
        const response = await axios.post(url, body, headers)
        return response
      } catch (error) {
        catchError(error)
        throw error
      }
    },
    async putRequest ({ commit, dispatch, state, rootGetters }, payload) {
      const { url, body, headers } = payload

      try {
        const response = await axios.put(url, body)
        return response
      } catch (error) {
        catchError(error)
        throw error
      }
    },
    async patchRequest ({ commit, dispatch, state, rootGetters }, payload) {
      const { url, body, headers } = payload

      try {
        const response = await axios.patch(url, body)
        return response
      } catch (error) {
        catchError(error)
        throw error
      }
    },
    async deleteRequest ({ commit, dispatch, state, rootGetters }, payload) {
      const { url, headers } = payload

      try {
        const response = await axios.delete(url)
        return response
      } catch (error) {
        catchError(error)
        throw error
      }
    }
  }
}
