import api from '../../utils/api.js'
import util from '../../utils/util.js'
const app = getApp()

var view = undefined
function setup(v) {
  view = v
}

function onLoad(options) {
  var topic = app.globalData.topics
  console.log("topic.....", topic);
  view.setData({ topic: { items: topic, selected: -1}})
}

function refreshTopics() {

}

function onClickImage(e) {
  var index = e.currentTarget.dataset.idx
  var images = view.data.images
  wx.previewImage({
    urls: images,
    current: images[index],
  })
}

function onDeleteImage(e) {
  var index = e.currentTarget.dataset.idx
  var images = view.data.images
  images.splice(index, 1)
  view.setData({images: images})
}

function onChooseImage(e) {
  var left = 9 - view.data.images.length
  wx.chooseImage({
    count: left,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: function(res) {
      if (res.tempFilePaths.length > 0) {
        addNewImage(res.tempFilePaths)
      }
    },
  })
}

function addNewImage(images) {
  var array = view.data.images
  array = array.concat(images)
  view.setData({images: array})
}

function replyHook() {
  console.log(app.globalData.userInfo, "====writer...")
  var userInfo = wx.getStorageSync('user')
  if (!userInfo) {
    wx.switchTab({
      url: '/pages/me/me',
    })
    setTimeout(function () {
      wx.showToast({
        title: '需要先绑定微信昵称才能发帖', icon: 'none', duration: 2000
      })
    }, 500);
    return true
  }
  return false
}


function onClickSubmit() {
  if (util.isWhiteSpace(view.data.content) && (view.data.images.length == 0)) {
    return
  }
  if (replyHook()) {
    return
  }

  // 文本内容
  var selected = view.data.topic.selected;
  var userInfo = wx.getStorageSync('user')

  console.log(view.data.topic, "====topic ")
  var data = {
    title: view.data.title || "标题",
    content: view.data.content,
    author_id: userInfo.user_id,  // 用户id
  }

  // 地理位置
  if (view.data.location) {
    data.location = JSON.stringify(view.data.location)
  }
  // attach topic  关联话题
  var topic = view.data.topic
  var tag = undefined
  if (topic.selected >= 0 && topic.selected < topic.items.length) {
    tag = topic.items[topic.selected].name
    data.content = '#' + tag + '# ' + data.content
    data.topic_id = view.data.topic.items[selected].id
  }

  // 上传图文
  var handler = undefined
  if (view.data.images.length > 0) {
    handler = uploadImages(data, view.data.images)
  } else {
    handler = uploadText(data)
  }
  // handle result
  wx.showLoading({
    title: '正在发送...',
  })

  handler.then((resp) => {
    wx.hideLoading()

    // refresh list
    util.setResult({
      req: 'newpost',
      ok: resp.statusCode == 200,
      data: resp.data
    })
    
    if (resp.data && resp.data.errcode == 0) {
      wx.navigateBack({ delta: 1 });
      console.log("show toast...")
      setTimeout(function () {
        wx.showToast({
          title: '已发布等待审核', icon: 'success',
        })
      }, 2000);
    }else{
      throw Error(resp.data.errmsg)
    }

  }).catch((err) => {
    // 发布失败
    console.log("write:", err)
    wx.hideLoading()
    wx.showToast({
      title: '发送失败', icon: 'none'
    })
  })
}

function uploadText(data) {
  return api.createPost(data)
}

function uploadImages(data, images) {
  return new Promise((res, rej) => {
    var array = []
    for (var i = 0; i < images.length; i++) {
      array.push(uploadFile(images[i]))
    }
    Promise.all(array).then(results => {
      var path = results;
      data.media = {
        path: path,
        type: 1,  // 1: image 2: audio 3: video
      }
      api.createPost(data).then((resp) => {
        res(resp)
      }).catch(err => {
        rej(err)
      })
    }).catch(err => {
      rej(err)
    })
  })
}

// 貌似多图片上传很麻烦而且很容易出错...
// TODO....
function uploadFile(file) {
  return new Promise((res, rej) => {
    wx.uploadFile({
      url: 'https://kawaapp.com/x/api/images',
      filePath: file,
      name: 'file',
      success: function (resp) {
        if (resp.statusCode == 200) {
          res(resp.data)
        } else {
          rej({ code: resp.statusCode, msg: resp.data})
        }
      },
      fail: function (resp) {
        rej({ code: -1, msg: resp})
      }
    })
  })
}


function onClickTag(e) {
  var idx = e.target.dataset.idx;
  var topic = view.data.topic
  if (topic.selected == idx) {
    topic.selected = -1
  } else {
    topic.selected = idx
  }
  view.setData({ topic: topic })
}

function onClickLocation(e) {
  wx.chooseLocation({
    success: function(res) {
      var showname = res.name
      var city = util.getCityName(res.address)
      if (city) {
        showname = city + '·' + res.name
      }
      var location = {
        name: showname,
        address: res.address,
        lat: res.latitude,
        lng: res.longitude,
      }
      view.setData({ location: location})
    },
  })
}

function onDeleteLocation(e) {
  console.log("delete location...")
  view.setData({location: {}})
}

module.exports = {
  setup: setup,
  onLoad: onLoad,
  onClickImage: onClickImage,
  onDeleteImage: onDeleteImage,
  onChooseImage: onChooseImage,
  onClickSubmit: onClickSubmit,
  onClickTag: onClickTag,
  onClickLocation: onClickLocation,
  onDeleteLocation: onDeleteLocation,
}