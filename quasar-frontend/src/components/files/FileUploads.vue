<template>
  <q-dialog ref="dlg" :value="value" @input="val => $emit('input', val)" persistent>
    <q-card class="column no-wrap" style="width: 30rem; height: 25rem">
      <q-card-section class="q-py-sm" style="font-size: 1.05rem">
        <div
          v-if="done+failed !== files.length"
          class="text-weight-medium"
        >Uploading... ( {{done}} / {{ files.length }} )</div>
        <div v-else class="text-weight-medium">Finished Uploading</div>
        <div
          v-if="done+failed === files.length"
          class="text-weight-medium text-caption"
          :class="{'text-primary': !failed, 'text-red': failed}"
        >{{ done }} successful, {{ failed }} failed</div>
      </q-card-section>
      <q-card-section class="col q-py-none">
        <q-scroll-area class="fit">
          <div v-for="(file, id) in files" :key="`file-${id}`" class="row q-py-xs">
            <div class="flex flex-center q-pr-md">
              <q-icon v-if="file.failed" name="fas fa-exclamation" color="red-7" size="xs">
                <q-tooltip content-class="bg-grey-10 text-white">{{ file.error }}</q-tooltip>
              </q-icon>
              <q-spinner v-else-if="!file.done" color="primary" size="sm" />
              <q-icon v-else-if="file.done" name="fas fa-check" color="green" size="xs" />
            </div>
            <div class="col">{{ file.name }}</div>
          </div>
        </q-scroll-area>
      </q-card-section>
      <q-card-actions v-if="done+failed === files.length" align="center">
        <q-btn
          label="Done"
          icon="fas fa-save"
          style="width: 10rem"
          color="primary"
          flat
          no-caps
          v-close-popup
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
export default {
  name: 'FileUploads',
  props: ['value', 'files'],
  computed: {
    done () {
      return this.files.filter(t => t.done).length
    },
    failed () {
      return this.files.filter(t => t.failed).length
    }
  }
}
</script>