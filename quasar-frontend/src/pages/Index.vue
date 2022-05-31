<template>
  <q-page padding>
    <div class="col">
      <files
        :file-types="[
          { name: 'Files', id: 'A_1' }
        ]"
      />
    </div>
  </q-page>
</template>

<script>
import Files from 'src/components/files/Files'
export default {
  name: 'PageIndex',
  components: { Files }
}
</script>
