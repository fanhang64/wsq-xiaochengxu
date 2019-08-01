const api = require('../../utils/api.js')
const biz = require('../../utils/biz.js')
const app = getApp()

var view = undefined
function setup(_view) {
  view = _view
}

function onLoad(options) {
  const user = wx.getStorageSync('user')
  console.log(user)
  if (user) {
    view.setData({ user: user })
    return 
  }
}

// refresh page
function onResult(data) {
  const user = app.globalData.userInfo
  if (user) {
    view.setData({ user: user })
  }
}

function bindUserInfo(e) {
  api.auth().then((resp) => {
    console.log(resp, "=======")
    console.log("授权成功")
    var userInfo = {
      'avatar': resp.avatar,
      'nickName': resp.nickName,
      'is_admin': resp.is_admin,
      'user_id': resp.user_id
    }
    app.globalData.userInfo = userInfo

    view.setData({ user: userInfo })
    wx.switchTab({
      url: '/pages/me/me',
    })
  }).catch ((err) => {
    wx.showToast({
      title: '登录失败:' + err.code, icon: 'none', duration: 2000,
    })
  })
  console.log(e.detail)
}


function onExit(e){
  console.log("exit....")
  wx.removeStorageSync('user');
  app.globalData.userInfo = {}
  view.setData({ user: {} })
  // 重新加载
  wx.switchTab({
    url: '/pages/me/me',
  })
}

module.exports =  {
  setup: setup,
  onLoad: onLoad,
  bindUserInfo: bindUserInfo,
  onResult: onResult,
  exit: onExit
}