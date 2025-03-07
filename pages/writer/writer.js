// pages/writer/writer.js
const ctr = require('./controller.js')
const kawa = require('../../kawa.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    theme: kawa.Theme.Image,
    color: kawa.Theme.MainColor,
    tabColor: kawa.Theme.TabSelectedColor || kawa.Theme.MainColor,
    title: "",
    content: "",
    location: "",
    images: [],
    topic: {
      items: [],
      selected: -1,
    }
  },
  onLoad(options) {
    ctr.setup(this)
    ctr.onLoad(options)
  },

  bindTitle: function(e) {
    this.setData({title: e.detail.value})
  },
  bindContent: function(e) {
    this.setData({content: e.detail.value})
  },
  writerPublish: function() {
    ctr.onClickSubmit()
  },
  chooseImage: function(e) {
    ctr.onChooseImage(e)
  },
  clickImage: function(e) {
    ctr.onClickImage(e)
  },
  clickDelete: function(e) {
    ctr.onDeleteImage(e)
  },
  writerCancel: function() {
    wx.navigateBack({
      delta: 1
    })
  },
  clickTag: function(e) {
    ctr.onClickTag(e)
  }, 
  clickLocation: function(e) {
    ctr.onClickLocation(e)
  },
  clickDeleteLocation: function(e) {
    ctr.onDeleteLocation(e)
  }
})