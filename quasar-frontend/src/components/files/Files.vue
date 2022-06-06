<template>
  <div>
    <div v-for="type in fileTypes" :key="type.id">
      <q-table
        :key="`${type.id} - ${files[type.id].length}`"
        :data="files[type.id]"
        :columns="columns"
        :loading="loading[type.id]"
        :grid="viewMode === 'grid'"
        row-key="name"
        wrap-cells
        style="height: 100%"

      >
        <template #top>
          <div class="column fit">
            <div class="row items-center">
              <div class="text-h6">{{ type.name }}</div>
              <q-space />
              <q-btn
                :label="$q.screen.gt.xs ? 'Upload' : null"
                color="black"
                icon="o_cloud_upload"
                @click="onUpload(type.id)"
                flat
                :dense="!$q.screen.gt.xs"
                no-caps
              />
              <!-- <q-btn
                :label="$q.screen.gt.xs ? 'Download All' : null"
                color="black"
                icon="system_update_alt"
                @click="
                  setLoading(type.id, true)
                  jszip(
                    files[type.id],
                    `${orderId} - ${type.name}.zip`,
                    dlCallback
                  )
                "
                :disable="
                  !permissions.includes('downloadAll') ||
                  !files[type.id].length ||
                  loading[type.id]
                "
                flat
                :dense="!$q.screen.gt.xs"
                no-caps
              /> -->
              <q-menu
                auto-close
                :offset="[0, 0]"
                icon="settings"
                :label="$q.screen.gt.xs ? 'Settings' : null"
              >
                <q-list style="min-width: 150px">
                  <q-item clickable @click="viewMode = 'table'">
                    <q-item-section>Table View</q-item-section>
                  </q-item>
                  <q-item clickable @click="viewMode = 'grid'">
                    <q-item-section>Grid View</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </div>
            <div v-if="status[type.id]" class="row">
              {{ status[type.id] }}
            </div>
          </div>
        </template>

        <template v-slot:body-cell-fileType="props">
          <q-td :props="props" auto-width :class="selectedClass(props.row.id)">
            <q-icon
              :name="
                props.row.link
                  ? `img:${restUrl}/file/download/${props.row.name}`
                  : 'broken_image'
              "
              size="15rem"
              flat
              dense
            />
          </q-td>
        </template>
        <template v-slot:body-cell-fileName="props">
          <q-td :props="props" :class="selectedClass(props.row.id)">
            {{ props.row.name }}
          </q-td>
        </template>
        <template v-slot:body-cell-fileCreated="props">
          <q-td :props="props" :class="selectedClass(props.row.id)">
            {{ props.row.created | formatDate }}
          </q-td>
        </template>
        <template v-slot:body-cell-fileSize="props">
          <q-td :props="props" :class="selectedClass(props.row.id)">
            {{ formatBytes(props.row.size) }}
          </q-td>
        </template>
        <template v-slot:body-cell-fileOp="props">
          <q-td :props="props" auto-width :class="selectedClass(props.row.id)">
            <div class="row no-wrap justify-center">
              <template v-if="!props.row.invalid">
                <q-btn
                  icon="fas fa-download"
                  size="0.55rem"
                  flat
                  dense
                  @click="openURL(`${restUrl}/file/download/${props.row.name}`)"
                  :disable="!permissions.includes('download')"
                />
                <q-btn
                  icon="fas fa-trash-alt"
                  size="0.55rem"
                  flat
                  dense
                  @click="deleteFile(props.row, type.id)"
                  :disable="!permissions.includes('delete')"
                />
              </template>
              <template v-else>
                <q-btn
                  icon="fas fa-exclamation-triangle"
                  color="red"
                  size="0.55rem"
                  flat
                  dense
                >
                  <q-tooltip content-class="bg-grey-10 text-white">
                    Failed to fetch file from cloud store.
                    <br />This may have been deleted or no longer available.
                  </q-tooltip>
                </q-btn>
                <q-btn
                  icon="fas fa-trash-alt"
                  size="0.55rem"
                  flat
                  dense
                  @click="deleteFile(props.row, type.id)"
                />
              </template>
            </div>
          </q-td>
        </template>

      </q-table>
    </div>

    <q-dialog v-model="preview.show">
      <q-img :src="preview.src" :ratio="1" style="width: 30rem; height: 100%" />
    </q-dialog>

    <q-uploader
      v-show="false"
      ref="uploader"
      :factory="addFiles"
      multiple
      batch
      auto-upload
    />

    <file-uploads
      v-model="uploading"
      :files="uploadingFiles"
      @input="(val) => (!val ? stop() : null)"
    />
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { openURL } from 'quasar'
import moment from 'moment-timezone'

import { formatBytes } from 'src/utils/utils'
import jszip from './jszip'
import FileUploads from './FileUploads'

const qs = require('querystring')
const perms =  ['download', 'delete', 'upload', 'downloadAll']

export default {
  name: 'Files',
  components: { FileUploads },
  props: {
    orderId: { type: String },
    jsonDataFn: { type: Function },
    fileTypes: { type: Array },
    gqlFilesQuery: { type: String },
    permissions: {
      type: Array,
      default: () => perms,
      validator: val => val.every(t => perms.includes(t))
    },
    orderType: {
      type: String,
      validator: function (value) {
        // The value must match one of these strings
        return ['soa', 'debtReview', 'supportingDocs'].includes(value)
      }
    }
  },
  data: () => ({
    uploading: false,
    uploadingFiles: [],
    viewMode: 'table',
    btnLoading: false,
    active: null,
    percent: 0,
    config: {},
    activeHash: null,
    activeHover: null,
    metadata: {},
    columns: [
      {
        name: 'fileType',
        align: 'center',
        label: 'Type',
        field: 'fileType',
        sortable: false
      },
      {
        name: 'fileName',
        align: 'left',
        label: 'Name',
        field: 'fileName',
        sortable: false
      },
      {
        name: 'fileCreated',
        align: 'center',
        label: 'Created',
        field: 'fileCreated',
        sortable: false
      },
      {
        name: 'fileSize',
        align: 'center',
        label: 'Size',
        field: 'fileSize',
        sortable: false
      },
      {
        name: 'fileOp',
        align: 'center',
        label: 'Operation',
        field: 'fileOp',
        sortable: false
      }
    ],
    files: null,
    selectedFiles: null,
    status: null,
    loading: null,
    loadedFiles: [],
    preview: {
      src: null,
      show: false
    }
  }),
  computed: {
    ...mapGetters(['baseUrl', 'restUrl'])
  },
  methods: {
    ...mapActions(['postRequest', 'getRequest', 'deleteRequest']),
    openURL,
    jszip,
    formatBytes,
    typeName2Id (name) {
      const match = this.fileTypes.find((t) => t.name.includes(name))
      if (match) return match.id
      console.log(this.fileTypes)
      console.error("[typeName2Id] can't find match for ", name, '; using A_1')
      return 'A_1'
    },
    selectedClass (rowId) {
      return {
        'bg-blue-1': this.selectedFiles ? this.selectedFiles.includes(rowId) : false
      }
    },
    ensureUnloading () {
      this.active = null
      for (const key in this.loading) {
        this.setLoading(key, false)
      }
    },
    dlCallback () {
      this.setLoading(this.active, false)
    },
    setLoading (id, val) {
      if (val) this.active = id
      else this.active = null

      this.loading = {
        ...this.loading,
        [id]: val
      }
    },
    updateProgress (len, percent) {
      if (percent > 100) percent = 100
      this.status = {
        ...this.status,
        [this.active]: `Uploading ${len} file(s) ... ${percent} %`
      }
    },
    onUploading (info) {
      this.setLoading(this.active, true)

      const len = info.files.length
      let percent = 0
      this.updateProgress(info.files.length, percent)

      const self = this
      // need to fake progress loading :(
      const timer = setInterval(() => {
        if (percent <= 100) {
          percent += 1
          self.updateProgress(len, percent)
        }
      }, len * 200)

      info.xhr.onprogress = function (e) {
        percent = (e.loaded / e.total) * 100
        self.updateProgress(len, percent)
        if (percent >= 100) clearInterval(timer)
      }
    },
    stop () {
      this.$refs.uploader.reset()
      const self = this

      setTimeout(() => {
        self.status = {
          ...self.status,
          [self.active]: null
        }
        this.ensureUnloading()
      }, 2000)
    },
    async onUploaded () {
      this.stop()
    },
    async onFailed (info) {
      this.mixinNotify(
        'Error!',
        'negative',
        (info.response ? info.response.data : null) || info.message
      )
      this.stop()
    },
    onUpload (type) {
      console.log('onUpload for ', type)
      this.config = {
        url: `${this.restUrl}/files/create`,
        formFields: [{ name: 'data', value: '---' }],
        fieldName: 'files_upload'
      }
      this.$refs.uploader.pickFiles()
      this.active = type
    },
    async addFiles (files) {
      console.log('files: ', files)
      this.uploadingFiles = files
      this.uploading = true

      for (const file of files) {
        console.log(file)
        const fileData = {
          type: file.type,
          name: file.name,
          created: file.lastModified,
          size: file.size
        }
        const fd = new FormData()
        fd.append('file', file)
        fd.append('data', JSON.stringify(fileData))

        const payload = {
          url: `${this.restUrl}/files`,
          body: fd
        }

        console.log(payload)

        await this.postRequest(payload)
          .then((res) => {
            file.done = true
          })
          .catch((err) => {
            this.onFailed(err.message)
            console.error('fileupload: ', err)
            file.failed = true
            file.error = err.response.data || err.message
          })
          .finally(() => {
            this.uploadingFiles = [...files]
          })
      }
      await this.fetchFiles()
    },
    async downloadFile (filename) {
      await this.getRequest({ url: `${this.restUrl}/file/download/${filename}` })
        .then(res => {
          console.log(res)
        })
        .catch((err) => {
          this.onFailed(err)
          console.error('filedownload: ', err)
        })
    },
    async fetchFiles () {
      const url = `${this.restUrl}/files`
      await this.getRequest({ url })
        .then(res => {
          this.files['A_1'] = res.data
        })
        .catch((err) => {
          this.onFailed(err)
          console.error('filefetch: ', err)
        })
    },
    async deleteFile (row, type) {
      this.$q
        .dialog({
          title: 'Confirm',
          message: `Are you sure you want to delete this file?`,
          cancel: true,
          persistent: true
        })
        .onOk(async () => {
          try {
            const fileId = row.id

            const response = await this.deleteRequest({
              url: `${this.restUrl}/files/${fileId}`
            })
            console.log('deletefile res: ', response)
            this.mixinNotify(
              'File deleted',
              'positive',
              response.data
            )
            // this.loadedFiles = this.loadedFiles.filter((t) => t !== fileId)
            this.files = {
              ...this.files,
              [type]: this.files[type].filter((t) => t.id !== fileId)
            }
          } catch (error) {
            console.log('deletefile err: ', error)
            this.mixinNotify(
              'Error!',
              'negative',
              error.message
            )
          }
        })
    }
  },
  async created () {
    this.files = {}
    this.status = {}
    this.loading = {}

    if (this.fileTypes) {
      this.fileTypes.map((type) => {
        this.files[type.id] = []
        this.status[type.id] = null
        this.loading[type.id] = true
      })
    }

    await this.fetchFiles()
    this.ensureUnloading()
    console.log('selectedFiles', this.selectedFiles)
  }
}
</script>
