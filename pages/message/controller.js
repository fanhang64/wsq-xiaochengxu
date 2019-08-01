const api = require('../../utils/api.js')
const app = getApp()

var view = undefined
function setup(_view) {
  view = _view
}

function replyHook() {
  var userInfo = wx.getStorageSync('user')
  if (!userInfo) {
    wx.switchTab({
      url: '/pages/me/me',
    })
    setTimeout(function () {
      wx.showToast({
        title: '需要先绑定微信昵称', icon: 'none', duration: 2000
      })
    }, 500);
    return true
  }
  return false
}

function refreshMessage() {
  if(replyHook()){
    return
  }
  var userInfo = wx.getStorageSync('user')
  api.getMessageCount(userInfo.user_id).then((resp) => {
    console.log("message...", resp)
    var resp_data = resp.data
    view.setData({ count: resp_data.data })
    console.log("get message count:", resp_data)
  }).catch(err => {
    console.log(err)
  })
}

module.exports = {
  setup: setup,
  refreshMessage: refreshMessage,
}