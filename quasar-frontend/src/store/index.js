import Vue from 'vue'
import Vuex from 'vuex'

// import example from './module-example'

import { urlApp, token } from 'src/data/constants'
import { rest } from './helpers/rest'

Vue.use(Vuex)

/*
 * If not building with SSR mode, you can
 * directly export the Store instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Store instance.
 */

export default function (/* { ssrContext } */) {
  const Store = new Vuex.Store({
    modules: {
      // example
    },
    state: {
      baseUrl: urlApp,
      token
    },

    getters: {
      baseUrl: (state) => state.baseUrl,
      restUrl: (state) => state.baseUrl
    },

    actions: {
      ...rest.actions
    },

    // enable strict mode (adds overhead!)
    // for dev mode only
    strict: process.env.DEBUGGING
  })

  return Store
}
