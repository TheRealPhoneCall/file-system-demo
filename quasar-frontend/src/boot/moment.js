import Vue from 'vue'
import moment from 'moment-timezone'

Vue.filter('formatDate', (value) => {
  if (value) {
    return moment(value).tz('Australia/Lindeman').format('MMMM D, YYYY HH:mm z')
  }
})

Vue.filter('shortDate', (value) => {
  if (value) {
    return moment(value).tz('Australia/Lindeman').format('MM/DD/YY HH:mm z')
  }
})

Vue.filter('dateAEST', (value) => {
  return moment(value).tz('Australia/Lindeman').format('lll z')
})

Vue.filter('timeLapsed', (value) => {
  // console.log('using timeLapsed filter', value)
  if (value) {
    const timeStamp = moment(value)
    const now = moment()
    // console.log('now-ts: ', now.format(), timeStamp.format())
    const daysLapsed = now.diff(timeStamp, 'days')
    const hrsLapsed = now.diff(timeStamp, 'hours')
    const timeLapsed = now.diff(timeStamp, 'minutes')
    if (daysLapsed) {
      return daysLapsed > 1 ? `${daysLapsed} days ago` : `yesterday`
    }
    if (hrsLapsed) {
      return hrsLapsed > 1 ? `${hrsLapsed} hrs ago` : `an hour ago`
    }

    // return timeLapsed if difference is not days
    return timeLapsed > 1 ? `${timeLapsed} mins ago` : `now`
  }
})

Vue.prototype.moment = moment
Vue.use(require('vue-moment'))
