//app.js
App({
  onLaunch: function () {
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
    var that = this;

  },
  globalData: {
    transit: {
      post: null
    },
    // App data
    posts: [],
    meta: {},
    userInfo: {},
    topics: []
  }
})