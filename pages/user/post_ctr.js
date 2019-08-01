const api = require('../../utils/api.js')
const util = require('../../utils/util.js')

var view = undefined
function setup(v) {
  view = v
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
  if (replyHook()){
    return;
  }
  if (options && options.uid) {
    view.data.user.uid = options.uid
  }else{
    var user = wx.getStorageSync('user')
    view.data.user.uid = user.user_id
  }

  // show loading
  var loader = view.data.loader
  loader.ing = true
  view.setData({loader: loader})

  // fetch data 
  api.getUserPostList(view.data.user.uid, 0, 20).then(resp => {
    var resp_data = resp.data
    loader.ing = false
    if (resp_data.data && resp_data.data.length < 20) {
      loader.more = false
    }
    console.log("user get posts:", resp_data)
    var posts = decorateList(resp_data.data)
    view.setData({ posts: posts })
    view.setData({ loader: loader })
  }).catch( err => {
    console.log(err)
    wx.showToast({
      title: '加载失败', icon: 'none'
    })
    loader.ing = false
    view.setData({loader: loader})
  })
}

function onPullDownRefresh() {
  if (view.data.loader.ing) {
    return
  }

  // show loading
  var loader = view.data.loader
  loader.ing = true
  view.setData({ loader: loader })

  // fetch data
  api.getUserPostList(view.data.user.uid, 0, 20).then(resp => {
    var resp_data = resp.data;
    loader.ing = false
    if (resp_data.data && resp_data.data.length < 20) {
      loader.more = false
    }
    var data = decorateList(resp_data.data)
    view.setData({ posts: data })
    view.setData({ loader: loader })
    wx.stopPullDownRefresh()
    wx.showToast({
      title: '刷新成功',
      icon: 'success',
    })
  }).catch( err => {
    wx.stopPullDownRefresh()
    wx.showToast({ title: '刷新失败', icon: 'none'})
    loader.ing = false
    view.setData({ loader: loader })
  })
}

function onReachBottom() {
  if (view.data.loader.ing || !view.data.loader.more) {
    return
  }
  var posts = view.data.posts
  var since = 0
  var limit = 20
  if (posts && posts.length > 0) {
    since = posts[posts.length - 1].id
  }
  var loader = view.data.loader
  loader.ing = true
  view.setData({loader: loader})
  api.getUserPostList(view.data.user.uid, since, limit).then(resp => {
    var resp_data = resp.data
    loader.ing = false
    if (resp_data.data.length < limit) {
      loader.more = false
    }
    var data = decorateList(resp_data.data)
    view.setData({ loader: loader })
    view.setData({ posts: posts.concat(data) })
  }).catch( err=> {
    loader.ing = false
    view.setData({ loader: loader })
    wx.showToast({ title: '刷新失败', icon: 'none'})
  })
}

function onClickItem(e) {
  var idx = e.currentTarget.dataset.idx
  var post = view.data.posts[idx]
  console.log(post, "=======")
  // 跳转到帖子，并设置为已读
  wx.navigateTo({
    url: '/pages/thread/thread?pid=' + post.id,
  })
}

function onClickImage(e) {
  var index = e.target.dataset.idx
  var array = index.split('-')

  var pid = parseInt(array[0])
  var sub = parseInt(array[1])

  var images = view.data.posts[pid].images
  var current = sub

  wx.previewImage({
    urls: images,
    current: images[current],
  })
}

function decorateList(posts) {
  var i = 0, n = posts.length
  for (; i < n; i++) {
    var time = posts[i].created_at
    posts[i].created_at = util.formatTime(new Date(time))
    if (posts[i].media) {
      posts[i].images = JSON.parse(posts[i].media.path)
    }
    if (posts[i].location) {
      try {
        posts[i].location = JSON.parse(posts[i].location)
      } catch (err) { }
    }
  }
  return posts
}

function onClickLocation(e) {
  var idx = e.currentTarget.dataset.idx
  var item = view.data.posts[idx]
  var location = item.location
  if (location) {
    wx.openLocation({
      latitude: location.lat, longitude: location.lng, name: location.name,
    })
  }
}

module.exports = {
  setup: setup,
  onLoad: onLoad,
  onPullDownRefresh: onPullDownRefresh,
  onReachBottom: onReachBottom,
  onClickItem: onClickItem,
  onClickImage: onClickImage,
  onClickLocation: onClickLocation,
}