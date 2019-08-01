const ctr = require('./controller.js') 
const kawa = require('../../kawa.js')

// pages/me/me.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    theme: kawa.Theme.Image,
    color: kawa.Theme.MainColor,
    user: {
      avatar: '',
      nickname: '',
      summary: '',
    }, 
    copyright: "",
    support: true,
    metadata: {
      user_mode: 0, // 0, 1, 2
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    ctr.setup(this)
    ctr.onLoad(options)
  },
  // 从其它页面返回数据
  onResult: function (data) {
    ctr.onResult(data)
  },
  bindUserInfo: function (e) {
    ctr.bindUserInfo(e)
  },
  getPhoneNumber: function (e) {
    ctr.getPhoneNumber(e)
  },
  postClick: function(e) {
    wx.navigateTo({
      url: '/pages/user/post',
    })
  },
  commentClick: function(e) {
    wx.navigateTo({
      url: '/pages/user/comment',
    })
  },
  favorClick: function(e) {
    wx.navigateTo({
      url: '/pages/user/favor',
    })
  },
  clickBindProfile: function(e) {
    wx.navigateTo({
      url: '/pages/me/bind',
    })
  },
  clickExit: function(e){
    ctr.exit(e)
  }
})