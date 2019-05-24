const api = require('../../utils/api.js')
const app = getApp()

var view = undefined
function setup(_view) {
  view = _view
}

function onLoad(options) {
  const user = app.globalData.userInfo
  if (user) {
    view.setData({ user: user })
  }
  const meta = app.globalData.meta
  if (meta && meta.app_copyright) {
    view.setData({ copyright: meta.app_copyright })
  }
  if (meta && (meta.app_support === 'false')) {
    view.setData({ support: false })
  }
  // update 
  api.getSelf().then((resp) => {
    app.globalData.userInfo = resp.data
    view.setData({ user: resp.data })
    console.log("get user data:", resp.data)
  })
}

function bindUserInfo(e) {
  var user = e.detail.userInfo
  if (user) {
    var data = {
      avatar: user.avatarUrl,
      city: user.city,
      gender: user.gender,
      language: user.language,
      nickname: user.nickName
    }
    api.updateUser(data).then((resp) => {
      console.log("授权成功")
      app.globalData.userInfo = resp.data
      view.setData({ user: resp.data })
    })

    // save in localStorage, and refresh when lauch
    wx.setStorage({
      key: 'user',
      data: data,
    })
  }
  console.log(e.detail)
}

module.exports =  {
  setup: setup,
  onLoad: onLoad,
  bindUserInfo: bindUserInfo,
}