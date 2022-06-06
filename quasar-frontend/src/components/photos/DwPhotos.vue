<template>
  <div class="row">
    <div class="col-xs-12 col-sm-6 col-md-3 q-pa-sm"
      v-for="img in imgs"
      :key="img.url"
    >
      <q-card>
        <q-img
          :src="img.url"
          :ratio="1"
        >
          <div class="row absolute-top-right q-pa-none">
            <q-space />
            <q-btn
              round
              icon="more_vert"
              dense
              class="q-pa-none"
            >
              <q-menu
                auto-close
                :offset="[0, 0]"
              >
                <q-list style="min-width: 150px">
                  <q-item clickable @click="removeImg(img)">
                    <q-item-section>Delete Photo</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>

        </q-img>

      </q-card>
    </div>
  </div>
</template>

<script>
import { removeFbFiles } from '../../store/helpers/removeFbFiles'

export default {
  name: 'DwPhotos',
  props: {
    'label': String,
    'filled': Boolean,
    'value': Array,
    'rules': Array
  },
  data: () => ({
    visible: false,
    imgs: [],
    hovered: null
  }),
  computed: {
    show: {
      get () { return this.visible },
      set (value) { this.visible = value }
    }
  },
  methods: {
    removeFbFiles,
    removeImg (img) {
      this.removeFbFiles([img.id])
      this.imgs = this.imgs.filter(t => t.id !== img.id)
      this.$emit('input', this.imgs)
      this.$emit('removePhoto', img)
    }
  },
  created () {
    console.log('dw-photos created')
    this.imgs = this.value ? this.value : []
  }
}
</script>
