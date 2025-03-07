const api = require('../../../utils/api.js')
const util = require('../../../utils/util.js')

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

function onLoad(options) {
  if(replyHook()){
    return
  }
  var userInfo = wx.getStorageSync('user')
  api.getMessageList('favor', userInfo.user_id, 0, 20).then(resp => {
    var resp_data = resp.data
    var unpacked = unpackMsgContent(resp_data.data)
    view.setData({ messages: unpacked })
    console.log("get favor message list:", resp_data.data)
  }).catch(err => {
    console.log(err)
  })
}

function onPullDownRefresh() {
  if (view.data.loader.ing) {
    return
  }
  if(replyHook()){
    return
  }
  var userInfo = wx.getStorageSync('user')
  view.setData({loader:{ing: true}})
  api.getMessageList('favor', userInfo.user_id, 0, 20).then(resp => {
    var resp_data = resp.data
    wx.stopPullDownRefresh()
    var loader = { ing: false, more: true }
    var unpacked = unpackMsgContent(resp_data.data)
    if (unpacked && unpacked.length < 20) {
      loader.more = false
    }
    view.setData({ loader: loader })
    view.setData({ messages: unpacked })
  }).catch(err => {
    wx.stopPullDownRefresh()
    console.log(err)
    view.setData({ loader: { ing: false } })
    wx.showToast({
      title: '刷新失败', icon: 'none'
    })
  })
}

function onReachBottom() {
  if (view.data.loader.ing || !view.data.loader.more) {
    return
  }
  var userInfo = wx.getStorageSync('user')
  var messages = view.data.messages
  var since = 0
  var limit = 20
  if (messages && messages.length > 0) {
    since = messages[messages.length - 1].id
  }
  view.setData({ loader: { ing: true } })
  api.getMessageList('favor', userInfo.user_id, since, limit).then(resp => {
    var resp_data = resp.data
    var loader = { ing: false, more: true }
    if (resp_data.data.length < limit) {
      loader.more = false
    }
    var unpacked = unpackMsgContent(resp_data.data)
    view.setData({ loader: loader })
    view.setData({ messages: messages.concat(unpacked) })
  }).catch( err => {
    console.log(err)
    view.setData({ loader: { ing: false } })
    wx.showToast({
      title: '加载失败', icon: 'none'
    })
  })
}

function onClickItem(e) {
  var idx = e.currentTarget.dataset.idx
  var msg = view.data.messages[idx]
  var key = 'messages[' + idx + '].status'
  // 跳转到帖子，并设置为已读
  view.setData({
    [key]: 1,
  })
  api.setMessageRead(msg.id, 'favor').catch(err => {
    console.log(err)
  })
  // fetch post and goto thread page
  wx.navigateTo({
    url: '/pages/thread/thread?pid=' + msg.post_id,
  })
}

function unpackMsgContent(msgs) {
  var i = 0
  var n = msgs.length
  for (; i < n; i++) {
    var json = util.jsonParse(msgs[i].content)
    if (json.ok) {
      msgs[i].post_id = json.object.post_id
      msgs[i].subject = json.object.subject
    } else {
      msgs[i].subject = msgs[i].content
    }
    msgs[i].time = util.formatTime(new Date(msgs[i].created_at))
  }
  return msgs
}

module.exports = {
  setup: setup,
  onLoad: onLoad,
  onPullDownRefresh: onPullDownRefresh,
  onReachBottom: onReachBottom,
  onClickItem: onClickItem,
}