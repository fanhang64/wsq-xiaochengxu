const api = require('../../utils/api.js')
const util = require('../../utils/util.js')
const app = getApp()

var view = undefined

// 当前的TAB页面数据
var tabData = []

// Home Controller 
function setup(_view, opt) {
  view = _view

  var i = 0, n = view.data.tab.items.length;
  for (; i < n; i++) {
    tabData.push({ loader: {
      ing: view.data.loader.ing,
      more: view.data.loader.more,
    }, posts: []})
  }

  // bind tab-data to view
  bindTabData(view.data.tab.current)
}

function bindTabData(idx) {
  console.log('bindTabData:', idx, tabData[idx])
  var data = tabData[idx];
  view.setData({posts: data.posts})
  view.setData({loader: data.loader})
}

// First Load
function onLoad(opt) {
  // 加载社区信息
  // api.getMetaData().then(resp => {
  //   var data = {
  //     app_pubtitle: resp.data.app_pubtitle,
  //     app_publink: resp.data.app_publink,
  //     app_copyright: resp.data.app_copyright,
  //     user_mode: 0,
  //   }
  //   if (resp.data.user_mode) {
  //     data.user_mode = parseInt(resp.data.user_mode, 10)
  //   }
  //   view.setData({
  //     meta: data
  //   })
  //   console.log("user_mode:", resp.user_mode, parseInt(resp.user_mode, 10))
  //   app.globalData.meta = data
  //   console.log("get meta:", data)

  //   const pub = {
  //     title: resp.data.app_pubtitle,
  //     link: resp.data.app_publink,
  //   }
  //   view.setData({ speaker: pub })
  // })

  // 加载置顶列表
  api.getPostList(0, 2, "top").then(resp => {
    const res_data = resp.data
    const items = res_data.data;
    if (items) {
      items.map( item => {
        item.title = getTitle(item)
      })
      view.setData({
        tops: items,
      })
      console.log("get top-list:", items)
    }
  })
  
  var user = wx.getStorageSync('user')
  api.getPostFavorList(user.user_id).then( resp => {
    console.log("get favor list ", resp)
    var res_data = resp.data
    wx.setStorage({ key: 'favor_post_id_list', data: res_data.data || [] })
  })

  // 进入第一次加载
  refreshList(view.data.tab.current)

  // 话题列表
  try {
    wx.getStorage({ key: 'topic', success: function(res) {
        showTopic(res.data)
    }})
  } catch(e){}

  api.getTopicList().then( resp => {
    var res_data = resp.data
    app.globalData.topics = res_data.data
    showTopic(res_data.data)
    // refresh local storage
    wx.setStorage({ key: 'topic', data: res_data.data })
  })
}

// show topic
function showTopic(items) {
  if (!items || items.length == 0) {
    return
  }
  var topics = items.slice(0)
  topics.unshift({name: "全部话题"})
  view.setData({ topic: { items: topics, selected: -1}})
}

function getSelectedTopic() {
  var topic = view.data.topic
  if (topic.selected > 0 && topic.selected < topic.items.length) {
    return topic.items[topic.selected].id
  }
}

function getTitle(item) {
  if (!item || !item.content) {
    return ""
  }
  var array = item.content.split("\n")
  if (array.length > 0) {
    return array[0]
  }
  return ""
}

function onClickNewPost(e) {
  if (app.globalData.userInfo && app.globalData.userInfo.nickname) {
    wx.navigateTo({
      url: '/pages/writer/writer',
    })
  } else {
    wx.switchTab({
      url: '/pages/me/me',
    })
    setTimeout(function () {
      wx.showToast({
        title: '需要先绑定微信昵称才能发帖', icon: 'none', duration: 2000
      })
    }, 300); 
  }
}

// 切换 TAB
function onTabChanged(idx) {
  console.log("on tab changed:", idx)
  refreshList(idx)
}

function refreshList(tabIndex, topic_id) {
  var data = tabData[tabIndex]
  if (data.loader.ing) {
    return
  }
  var fitler = ""
  if (tabIndex == 1) {
    fitler = "val"
  }
  var limit = 20
  data.loader.ing = true
  data.loader.more = true
  data.posts = []
  bindTabData(tabIndex)
  console.log("load data for tab:" + tabIndex, "filter:" + fitler)
  api.getPostList(0, limit, fitler, topic_id).then(resp => {
    console.log("get list at home ", resp)
    const res_data = resp.data;
    const items = res_data.data;
    if (items && items.length < limit) {
      data.loader.more = false
    }
    data.posts = decoratePosts(items)
    
    data.posts = items
    data.loader.ing = false
    if (view.data.tab.current == tabIndex) {
      bindTabData(tabIndex)
    }
    wx.stopPullDownRefresh()
  }).catch(err => {
    data.loader.ing = false
    if (view.data.tab.current == tabIndex) {
      bindTabData(tabIndex)
    }
    wx.stopPullDownRefresh()
    wx.showToast({
      title: '加载失败', icon: 'none'
    })
    console.log("topic_id", err)
  })
}

function onResult(data) {
  if (data && data.ok && view.data.tab.current == 0) {
    refreshList(0, getSelectedTopic())
  }
  console.log('home, on result data:' + data)
}

// 下拉事件是全局的，如果页面正在刷新，无论哪个页面都应该
// 直接停掉下拉刷新
function onPullDownRefresh() {
  if (view.data.loader.ing) {
    wx.stopPullDownRefresh()
    return
  }
  var tabIndex = view.data.tab.current
  if (tabIndex == 0) {
    refreshList(tabIndex, getSelectedTopic())
  } else {
    refreshList(tabIndex)
  }
}

function onReachBottom() {
  if (view.data.loader.ing || !view.data.loader.more) {
    return
  }
  var tabIndex = view.data.tab.current
  var filter = ""
  if (tabIndex == 1) {
    filter = "val"
  }
  var topic_id = undefined
  if (tabIndex == 0) {
    topic_id = getSelectedTopic()
  }
  var data = tabData[tabIndex]
  var posts = view.data.posts
  var sinceId = 0
  var limit = 20
  if (posts && posts.length > 0) {
    sinceId = posts[posts.length - 1].id
  }
  var current = view.data.tab.current
  api.getPostList(sinceId, limit, filter, topic_id).then((resp) => {
    var res_data = resp.data;
    data.loader.ing = false
    if (res_data.data) {
      if (res_data.data.length < 20) {
        console.log("no more data..." + sinceId)
        data.loader.more = false
      }
      var styled = decoratePosts(res_data.data)
      data.posts = posts.concat(styled)
      if (current == view.data.tab.current) {
        bindTabData(current)
      }
    }
  }).catch((err) => {
    data.loader.ing = false
    if (current == view.data.tab.current) {
      bindTabData(current)
    }
    wx.showToast({
      title: '加载失败', icon: 'none'
    })
  })
}

function listLoadMore(tabIndex, topic_id) {

}

function onClickFavor(e) {
  var idx = e.currentTarget.dataset.idx
  var item = view.data.posts[idx]
  var key = 'posts[' + idx + '].stats'

  var user = wx.getStorageSync('user')
  var favor_post_id_list = wx.getStorageSync('favor_post_id_list')
  if (item.stats.favored && item.stats.favored > 0) {
    console.log("delete favor")
    api.deletePostFavor(item.id, user.user_id).then(resp => {
      item.stats.favored = false
      item.stats.favors -= 1
      var index = favor_post_id_list.indexOf(item.id)
      favor_post_id_list.splice(index, 1)
      wx.setStorage({key: 'favor_post_id_list', data: favor_post_id_list})
      view.setData({ [key]: item.stats })
      console.log("delete favor:", resp.statusCode)
    })
  } else {
    console.log("create favor")
    api.createPostFavor(item.id, user.user_id, item.user_id).then((resp) => {
      item.stats.favors += 1
      item.stats.favored = true
      favor_post_id_list.push(item.id)
      wx.setStorage({key: 'favor_post_id_list', data: favor_post_id_list})
      view.setData({ [key]: item.stats })
      console.log("favor succ:", resp.statusCode)
    }).catch(err => {
      console.log("favor err:", err)
    })
  }
}

function onClickMenu(e) {
  var idx = e.currentTarget.dataset.idx
  var item = view.data.posts[idx]
  var menu = {
    items: ["举报"],
    actions: [function () {
      report(item)
    }],
  }
  var user = app.globalData.userInfo
  if (user && item.author && user.id == item.author.id && user.is_admin) {
    menu.items.push("删除")
    menu.actions.push(function () {
      deletePost(idx)
    })
  }

  wx.showActionSheet({
    itemList: menu.items,
    success: function (res) {
      console.log(JSON.stringify(res))
      console.log(res.tapIndex) // 用户点击的按钮，从上到下的顺序，从0开始
      var fn = menu.actions[res.tapIndex]
      fn()
    },
    fail: function (res) {
      console.log(res.errMsg)
    }
  })
}

function report(post) {
  api.createReport(post.id).then( resp => {
    var resp_data = resp.data;
    if (resp_data.errcode == 0){
      wx.showToast({
        title: '举报成功',
      })
    }else{
      wx.showToast({
        title: '举报失败：未知错误', icon: 'none',
      })
    }
  }).catch( err => {
    wx.showToast({
      title: '举报失败：网络错误', icon: 'none',
    })
  })
}

function decoratePosts(posts) {
  var result = []
  var author = app.globalData.userInfo
  if(!posts){
    return;
  }

  var favor_post_id_list = wx.getStorageSync('favor_post_id_list')
  for (var i = 0; i < posts.length; i++) {
    var post = posts[i]
    // var hide = (post.status >> 2) & 1

    // // 如是本人的帖子则不隐藏
    // if (post.author && author && post.author.id == author.id) {
    //   hide = false
    // }

    // // 如果是需要审核的帖子，即使本人也不显示直到已审核
    // // 因为微信审核人员会傻缺的以为你没有审核系统...
    // if ((post.status >> 3) & 1) {
    //   hide = true
    // }

    // if (!hide) {
    if (1) {
      result.push(decoratePost(post, favor_post_id_list))
    }
  }
  return result
}

function decoratePost(post, favor_post_id_list) {
  post.styled = util.decorateText(post.content)
  post.created_at = util.agoTime(new Date(post.created_at))
  if(favor_post_id_list.indexOf(post.id) > -1){
    post.stats.favored = true
  }
  return post
}

function deletePost(idx) {
  var posts = view.data.posts
  var post = posts[idx]
  api.deletePost(post.id).then(resp => {
    posts.splice(idx, 1)
    view.setData({ posts: posts })
    wx.showToast({
      title: '删除成功',
    })
    console.log("删除成功")
  }).catch(err => {
    console.log("删除失败")
    wx.showToast({
      title: '删除失败', icon: 'none'
    })
  })
}

function onClickImage(e) {
  var index = e.target.dataset.idx
  console.log(index)

  var array = index.split('-')
  
  var pid = parseInt(array[0])
  var sub = parseInt(array[1])

  console.log("get:" + pid + " image:" + sub)

  var images = view.data.posts[pid].images
  var current = sub

  wx.previewImage({
    urls: images,
    current: images[current],
  })
}

function onClickImageList(e) {
  var index = e.currentTarget.dataset.idx
  var index2 = e.target.dataset.idx
  console.log("get index:" + index + " index2:" + index2)
}

function onClickTopic(e) {
  // 高亮选项
  var idx = e.target.dataset.idx;
  var topic = view.data.topic
  topic.selected = idx
  view.setData({ topic: topic })

  // 刷新列表
  refreshList(0, getSelectedTopic())
}

function onClickShare(res) {
  var meta = app.globalData.meta
  return {
    title: meta.app_name,
    path: '/pages/login/login?q=home'
  }
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
  onTabChanged: onTabChanged,
  onResult: onResult,
  onPullDownRefresh: onPullDownRefresh,
  onReachBottom: onReachBottom,
  onClickFavor: onClickFavor,
  onClickMenu: onClickMenu,
  onClickNewPost: onClickNewPost,
  onClickImage: onClickImage,
  onClickTopic: onClickTopic,
  onClickShare: onClickShare,
  onClickLocation: onClickLocation,
}