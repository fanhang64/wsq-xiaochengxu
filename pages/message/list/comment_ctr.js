const api = require('../../../utils/api.js')
const util = require('../../../utils/util.js')

var view = undefined
function setup(_view) {
  view = _view
}

function onLoad(opt) {
  var user = wx.getStorageSync('user')
  api.getMessageList('comment', user.user_id, 0, 20).then(resp => {
    var resp_data = resp.data
    var unpacked = unpackMsgContent(resp_data.data)
    view.setData({ messages: unpacked })
  })
}

function onPullDownRefresh() {
  if (view.data.loader.ing) {
    return
  }
  var user = wx.getStorageSync('user')
  view.setData({ loader: {ing: true} })
  api.getMessageList('comment', user.user_id, 0, 20).then(resp => {
    var resp_data = resp.data
    wx.stopPullDownRefresh()
    var loader = {ing: false}
    var unpacked = unpackMsgContent(resp_data.data)
    if (unpacked && unpacked.length < 20) {
      loader.more = false
    }
    view.setData({ loader: loader })
    view.setData({ messages: unpacked })
    console.log(resp_data)
  }).catch(err => {
    wx.stopPullDownRefresh()
    view.setData({ loader: { ing: false } })
    wx.showToast({
      title: '刷新失败', icon: 'none'
    })
    console.log(err)
  })
}

function onReachBottom() {
  if (view.data.loader.ing || !view.data.loader.more) {
    return
  }
  var user = wx.getStorageSync('user')
  var messages = view.data.messages
  var since = 0
  var limit = 20
  if (messages && messages.length > 0) {
    since = messages[messages.length - 1].id
  }
  view.setData({ loader: { ing: true } })
  api.getMessageList('comment', user.user_id, since, limit).then(resp => {
    var resp_data = resp.data
    var loader = {ing: false}
    if (resp_data.data.length < limit) {
      loader.more = false
    }
    view.setData( {loader: loader })
    var unpacked = unpackMsgContent(resp_data.data)
    view.setData({ messages: messages.concat(unpacked) })
  }).catch( err => {
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
  wx.navigateTo({
    url: '/pages/thread/thread?pid=' + msg.post_id,
  })
  api.setMessageRead(msg.id, 'comment').then(resp => {
    view.setData({
      [key]: 1,
    })
  }).catch(err => {
    console.log(err)
  })
}

function unpackMsgContent(msgs) {
  console.log(msgs)
  var i = 0
  var n = msgs.length
  for (; i < n; i++) {
    var json = util.jsonParse(msgs[i].content)
    if (json.ok) {
      msgs[i].post_id = json.object.post_id
      msgs[i].comment = json.object.comment
    } else {
      msgs[i].comment = msgs[i].content
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
