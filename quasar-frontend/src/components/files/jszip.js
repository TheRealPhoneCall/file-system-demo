var JSZip = require("jszip")
import { saveAs } from "file-saver"
import store from "src/store"

function urlToPromise (url) {
  return new Promise(function (resolve, reject) {
    window.JSZipUtils.getBinaryContent(url, function (err, data) {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

export default function jszip (files, zipFilename, callback) {
  const zip = new JSZip()

  files.map(file => {
    const filename = file.fileName
    const url = `${
      store().getters.baseUrl
    }/clouddrive/clouddownloadfile?fileid=${file.id}`

    // loading a file and add it in a zip file
    zip.file(filename, urlToPromise(url), { binary: true })
  })

  zip.generateAsync({ type: "blob" }).then(function (content) {
    saveAs(content, zipFilename)
    callback()
  })
}
