import Vue from 'vue'
import { Notify } from "quasar"

Vue.mixin({
  methods: {
    mixinNotify (message, type, caption) {
      this.$q.notify({
        message,
        type,
        caption
      })
    }
  },
  created () {
    Notify.setDefaults({
      progress: true,
      multiLine: true,
      textColor: "white",
      position: "bottom",
      badgeColor: 'primary',
      actions: [
        { label: 'Dismiss', color: 'white', handler: () => { /* ... */ } }
      ]
    })
  }
})