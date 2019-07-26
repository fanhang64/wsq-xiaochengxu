const api = require('../../utils/api.js')

var view = undefined
function setup(_view) {
  view = _view
}

function replyHook() {
  if (!(app.globalData.userInfo && app.globalData.userInfo.nickName)) {
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
  var user_id = wx.getStorageSync('user_id')
  if(!user_id){
    replyHook()
    return
  }

  api.getMessageCount(user_id).then((resp) => {
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