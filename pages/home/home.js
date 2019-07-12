//logs.js
const ctr = require('./controller.js')
const util = require('../../utils/util.js')
const kawa = require('../../kawa.js')

// topics:[
// {
//   author: {
//     name: '小虾米',
//     avatar: '',
//     ts: 1548571746979,
//   },
//   stats: {
//     favored: 0,
//     favors: 1,
//     comment: 1
//   },
//   text: '小虾米 啦啦啦',
//   styledText: ['123', '#hashtag#', 'abc']
//   imgs: [],
// },....]
Page({
  data: {
    theme: kawa.Theme.Image,
    color: kawa.Theme.MainColor,
    tabColor: kawa.Theme.TabSelectedColor || kawa.Theme.MainColor,
    favroColor: kawa.Theme.FavorColor || kawa.Theme.MainColor,
    speaker: {
      title: "公告标题title",
      link: "公告链接",
    },
    tops: [
      {'title': '标题1'}, {'title': '标题2'},
      {'title': '标题3'}, {'title': '标题4'}
    ],
    posts: [
      {
        'author': {'avatar': '', 'nickname': 'nickname123'},
        'agoTime': '2019-01-05',
        'styled': [{'tag': '123'}, {'tag': '', 'text': '内容1111111'}],
        'images': ['https://res.wx.qq.com/wxdoc/dist/assets/img/8Font.color.03f7bed7.png']
      }, {
        'author': {'avatar': '', 'nickname': '昵称啊'},
        'agoTime': '2019-05-05',
        'styled': [{'tag': 'abc', 'text': '只是内容嗷嗷！'}, {'tag': '123', 'text': '内容12222'}],
        'images': []
      }, {}
    ],
    loader: {
      ing: false, // 是否正在加载
      more: true, // 是否有更多数据
    },
    menu: {
      show: false,
    },
    meta: {
      app_cover: "../../images/very-easy.jpg",  // 背景图
      app_logo: "https://ss3.bdstatic.com/70cFv8Sh_Q1YnxGkpoWK1HF6hhy/it/u=3029109722,2485459817&fm=27&gp=0.jpg",
      app_name: "卡哇微社区",
      pv: "1055",
      users: "100"
    },
    tab: {
      current: 0, //预设默认选中的栏目
      scrollLeft: 0, //tab滚动条距离左侧距离
      items: ["全部", "精华", "热门"],
    },
    topic: {
      items: [],
      selected: -1,
    }
  },
  clickTab: function(e) {
    var idx = e.target.dataset.idx;
    var tab = this.data.tab
    if (tab.current != idx) {
      tab.current = idx
      this.setData({ tab: tab })
      ctr.onTabChanged(idx)
    }
  },
  onLoad: function (opt) {
    applyTheme(kawa.Theme)
    ctr.setup(this)
    ctr.onLoad(opt)
  },
  // 从其它页面返回数据
  onResult: function(data) {
    ctr.onResult(data)
  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    ctr.onPullDownRefresh()
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    ctr.onReachBottom()
  },

  // 发新贴
  newTopic: function(e) {
    ctr.onClickNewPost(e)
  },

  // 点击公告
  clickSpeaker: function(e) {
    var url = this.data.speaker.link
    if (url) {
      wx.navigateTo({
        url: '/pages/webview/webview?q=' + encodeURI(url),
      })
    }
  },

  // 点击置顶帖
  clickTopList: function(e) {
    var idx = e.currentTarget.dataset.idx
    var post = this.data.tops[idx]
    util.sendRequest('post', {
      idx: idx,
      post: post,
      viewonly: true,
    })
    wx.navigateTo({
      url: '/pages/thread/thread',
    })
  },

  // 点击帖子
  topicClick: function(e) {
    console.log(e, "=====点击帖子了");
    var idx = e.currentTarget.dataset.idx
    var post = this.data.posts[idx]
    util.sendRequest('post', {  // 传递帖子数据
      idx: idx,
      post: post
    })
    wx.navigateTo({
      url: '/pages/thread/thread',
    })
  },

  // 点击图片 
  clickImage: function(e) {
    ctr.onClickImage(e)
  },

  // 点击评论
  commentClick: function(e) {
    var idx = e.currentTarget.dataset.idx
    var post = this.data.posts[idx]
    util.sendRequest('post', {
      idx: idx,
      post: post
    })
    wx.navigateTo({
      url: '/pages/thread/thread',
    })
  },

  // 点击点赞
  favorClick: function(e) {
    ctr.onClickFavor(e)
  },

  // 点击菜单
  clickMenu: function(e) {
    ctr.onClickMenu(e)
  },

  // 点击话题标签
  clickTopic: function(e) {
    ctr.onClickTopic(e)
  },

  // 点击分享
  onShareAppMessage: function (res) {
    ctr.onClickShare(res)
  },

  // 点击位置标签
  clickLocation: function(e) {
    ctr.onClickLocation(e)
  },
})

function applyTheme(theme) {
  var imgDir = theme.Image
  wx.setTabBarItem({
    index: 0,
    iconPath: imgDir + "/home.png",
    selectedIconPath: imgDir + "/home_focus.png",
  })
  wx.setTabBarItem({
    index: 1,
    iconPath: imgDir + "/msg.png",
    selectedIconPath: imgDir + "/msg_focus.png",
  })
  wx.setTabBarItem({
    index: 2,
    iconPath: imgDir + "/me.png",
    selectedIconPath: imgDir + "/me_focus.png",
  })

  wx.setTabBarStyle({
    color: "#b5b5b5",
    selectedColor: theme.TabSelectedColor || theme.MainColor,
  })
}