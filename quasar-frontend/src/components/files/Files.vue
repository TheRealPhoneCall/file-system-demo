<template>
  <div>
    <div v-for="type in fileTypes" :key="type.id">
      <q-table
        :key="`${type.id} - ${files[type.id].length}`"
        :data="files[type.id]"
        :columns="columns"
        :loading="loading[type.id]"
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
                :disable="
                  !permissions.includes('upload') || loading[type.id]
                "
                flat
                :dense="!$q.screen.gt.xs"
                no-caps
              />
              <q-btn
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
              />
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
                props.row.iconLink
                  ? `img:${props.row.iconLink}`
                  : 'broken_image'
              "
              size="0.95rem"
              flat
              dense
            />
          </q-td>
        </template>
        <template v-slot:body-cell-fileName="props">
          <q-td :props="props" :class="selectedClass(props.row.id)">
            {{props.row.fileName}}
          </q-td>
        </template>
        <template v-slot:body-cell-fileCreated="props">
          <q-td :props="props" :class="selectedClass(props.row.id)">
            {{props.row.fileCreated}}
          </q-td>
        </template>
        <template v-slot:body-cell-fileUpdated="props">
          <q-td :props="props" :class="selectedClass(props.row.id)">
            {{props.row.fileUpdated}}
          </q-td>
        </template>
        <template v-slot:body-cell-fileSize="props">
          <q-td :props="props" :class="selectedClass(props.row.id)">
            {{props.row.fileSize}}
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
                  @click="openURL(props.row.webContentLink)"
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
      :factory="factoryFn"
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

    btnLoading: false,
    active: null,
    percent: 0,
    config: {},
    // loading: false,
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
        name: 'fileUpdated',
        align: 'center',
        label: 'Updated',
        field: 'fileUpdated',
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
    ...mapActions(['postRequest', 'getRequest']),
    openURL,
    jszip,
    typeName2Id (name) {
      const match = this.fileTypes.find((t) => t.name.includes(name))
      if (match) return match.id
      console.log(this.fileTypes)
      console.error("[typeName2Id] can't find match for ", name, '; using A_1')
      return 'A_1'
    },
    async factoryFn (files) {
      console.log('files: ', files)
      this.uploadingFiles = files
      this.uploading = true
      // let counter = 0

      this.setLoading(this.active, true)

      for (const file of files) {
        const fd = new FormData()
        fd.append('files_upload', file)

        const url = `${this.restUrl}/soamgr/files/create/`
        const headers = { 'X-Requested-With': 'XMLHttpRequest' }
        const formFields = [
          { name: 'data', value: '---' }
        ]
        // const fieldName = 'files_upload'

        formFields.map((fld) => {
          fd.append(fld.name, fld.value)
        })

        const payload = {
          url,
          headers,
          body: fd
        }

        await this.postRequest(payload)
          .then((res) => {
            file.done = true
          })
          .catch((err) => {
            // this.onFailed(err)
            console.error('fileupload: ', err)
            file.failed = true
            file.error = err.response.data || err.message
          })
          .finally(() => {
            this.uploadingFiles = [...files]
          })
      }
      await this.transformFiles()
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
      await this.transformFiles()
      this.stop()
    },
    async onFailed (info) {
      this.$q.dialog({
        title: 'File Upload Error',
        message: (info.response ? info.response.data : null) || info.message,
        persistent: true
      })
      await this.transformFiles()
      this.stop()
    },
    onUpload (type) {
      console.log('onUpload for ', type)
      // const csrftoken = this.$cookies.get('X-CSRFToken')
      const csrftoken = "173hskjckllsld"
      this.config = {
        url: `${this.restUrl}/soamgr/files/create/`,
        headers: [
          { name: 'X-CSRFToken', value: csrftoken },
          { name: 'X-Requested-With', value: 'XMLHttpRequest' }
        ],
        formFields: [{ name: 'data', value: '---' }],
        fieldName: 'files_upload'
      }
      this.$refs.uploader.pickFiles()
      this.active = type
    },
    async fetchFiles () {
      // FIXME: replace logic
      // try {
      //   const { gqlUrl, gqlFilesQuery, orderType, orderId } = this
      //   let query
      //   if (this.orderType === 'supportingDocs') {
      //     if (this.show[0] === 'A_1') {
      //       query = gqlFilesQuery
      //         .replace('<adviserId>', `${orderId}`)
      //         .replace('<businessId>', '')
      //         .replace('<dgroupId>', '')
      //     } else if (this.show[0] === 'A_2') {
      //       query = gqlFilesQuery
      //         .replace('<adviserId>', '')
      //         .replace('<businessId>', `${orderId}`)
      //         .replace('<dgroupId>', '')
      //     } else if (this.show[0] === 'A_3') {
      //       query = gqlFilesQuery
      //         .replace('<adviserId>', '')
      //         .replace('<businessId>', '')
      //         .replace('<dgroupId>', `${orderId}`)
      //     }
      //   } else {
      //     query = gqlFilesQuery.replace('[ID_HERE]', `"${orderId}"`)
      //   }
      //   const response = await this.postRequest({
      //     url: gqlUrl,
      //     body: { query }
      //   })

      //   console.log('gql data:', response)
      //   const data = response.data.data
      //   const files =
      //     orderType === 'supportingDocs'
      //       ? data[orderType]
      //       : data[orderType]['orderFiles']
      //   return files
      // } catch (error) {
      //   throw error
      // }
    },
    async transformFiles () {
      // FIXME: replace logic
      // const gqlFiles = await this.fetchFiles()
      // console.log('gqlFiles: ', gqlFiles)

      // if (!gqlFiles) return

      // const { files, loadedFiles } = this

      // for (const file of gqlFiles) {
      //   const meta = JSON.parse(file.meta)
      //   const { gpath, key, id } = meta
      //   const idx = this.orderType === 'supportingDocs' ? 1 : 2
      //   const fileFolder = this.typeName2Id(gpath.split('/')[idx].trim())
      //   if (!this.show.includes(fileFolder)) continue // skip files accordingly
      //   if (this.loadedFiles.includes(key || id)) continue // skip files accordingly

      //   const {
      //     name,
      //     createdTime,
      //     modifiedTime,
      //     size,
      //     thumbnailLink,
      //     webContentLink,
      //     iconLink
      //   } = meta

      //   files[fileFolder].push({
      //     id,
      //     webContentLink,
      //     thumbnailLink,
      //     iconLink,
      //     fileName: name,
      //     fileCreated: moment(createdTime).format('ll'),
      //     fileUpdated: moment(modifiedTime).format('ll'),
      //     fileSize: formatBytes(size),
      //     meta
      //   })

      //   loadedFiles.push(key || id)
      // }
    },
    async deleteFile (row, type) {
      // FIXME: replace logic
      // this.$q
      //   .dialog({
      //     title: 'Confirm',
      //     message: `Are you sure you want to delete this document from the folder?`,
      //     cancel: true,
      //     persistent: true
      //   })
      //   .onOk(async () => {
      //     try {
      //       const response = await this.postRequest({
      //         url: `${this.restUrl}/soamgr/files/delete/`,
      //         body: qs.stringify({ file_meta: JSON.stringify(row.meta) }),
      //         headers: { 'X-Requested-With': 'XMLHttpRequest' }
      //       })
      //       console.log('deletefile res: ', response)
      //       this.$q.dialog({ title: 'Info', message: response.data })
      //       const fileId = row.id
      //       this.loadedFiles = this.loadedFiles.filter((t) => t !== fileId)
      //       this.files = {
      //         ...this.files,
      //         [type]: this.files[type].filter((t) => t.id !== fileId)
      //       }
      //     } catch (error) {
      //       console.log('deletefile err: ', error)
      //       this.$q.dialog({
      //         title: 'Error',
      //         message: error.response.data
      //       })
      //     }
      //   })
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

    await this.transformFiles()
    this.ensureUnloading()
    // FIXME: replace logic
    // try {
    //   this.selectedFiles = this.$bus.routes.soaView.uid || this.$bus.routes.drView.uid || null
    //   this.selectedFiles = this.selectedFiles.split(',')
    // } catch {}

    console.log('selectedFiles', this.selectedFiles)
  }
}
</script>
