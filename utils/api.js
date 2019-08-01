const util = require('util.js')
const kawa = require('../kawa.js')

// ALL server-side API
//const Host = "http://127.0.0.1:1323"
const Host = "https://www.5ihouse.cn/minipro"
const app = getApp()

let g = {
  token: "",
  user_id: "",
}

// setup promise
/**
 * promise请求
 * 参数：参考wx.request
 * 返回值：[promise]res
 */
function req(options = {}) {
  const {
    url,
    data,
    method,
    dataType,
    responseType,
    success,
    fail,
    complete
  } = options;

  // inject token
  const header = Object.assign({
    'Authorization': `Bearer ${g.token}`,
  }, options.header);

  return new Promise((res, rej) => {
    wx.request({
      url,
      data,
      header,
      method,
      dataType,
      responseType,
      success(r) {
        if (r.statusCode == 200) {
          res(r);
        } else if (r.statusCode == 401) {
          console.log("去登陆")
          wx.switchTab({
            url: '/pages/me/me',
          })
          setTimeout(function () {
            wx.showToast({
              title: '需要先绑定微信昵称', icon: 'none', duration: 2000
            })
          }, 500);
          rej({ 
            code: r.statusCode, 
            err: r.data
          })
        } else {
          rej({ 
            code: r.statusCode, 
            err: r.data
          })
        }
      },
      fail(err) {
        rej({
          code: -1,
          err: err
        });
      },
      complete
    });
  });
}

/**
 * 判断请求状态是否成功
 * 参数：http状态码
 * 返回值：[Boolen]
 */
function isHttpSuccess(status) {
  return status >= 200 && status < 300 || status === 304;
}

// login
// if login success goto home, then register and login
// 自动授权
function autoAuth() {
  console.log("start auto auth..")
  return new Promise((res, rej) => {
    // check localstorage first
    const value = wx.getStorageSync('token')
    const user = wx.getStorageSync('user')

    if (value && !util.jwtExpire(value)) {
      g.token = value
      g.user_id = user.user_id
      console.log("token not expire...")
      res(value)
      return
    }

    console.log("try login..", value)

    // try to auth
    wx.login({
      success: function (resp) {
        if (resp.code) {
          console.log('get code:', resp)
          req({
            url: `${Host}/auth`,
            method: 'POST',
            data: {
              code: resp.code,
            }
          }).then((resp) => {
            var res_data = resp.data.data; 
            console.log("get auth ....", res_data)
            req({
              url: `${Host}/wx_login`,
              method: 'POST',
              data: {
                openid: res_data.openid,
                nickname: app.globalData.userInfo.nickName,
                avatar_url: app.globalData.userInfo.avatarUrl,
                gender: app.globalData.userInfo.gender
              }
            }).then((resp) => {
                var res_data = resp.data.data;
                var token = res_data.token
                var user_id = res_data.user_id
                // 返回一个本地的 Token
                console.log(resp)
                if (resp.statusCode == 200) {
                  //success, save token
                  g.token = token
                  g.user_id = user_id
                  console.log("get token", token)
                  res(g.token)
                  wx.setStorage({
                    key: 'token',
                    data: g.token
                  })
                  wx.setStorage({
                    key: 'user_id',
                    data: g.user_id
                  })
                } else {
                  rej({ code: -1, err: 'fail:' + resp.statusCode})
                }
            })
          }).catch((err) => {
            console.log(err)
            rej({ code: -1, err: err })
          })
        } else {
          rej({ code: -1, err: 'wx.login return nil code' })
        }
      },
      fail: function(err) {
        rej({ code: -1, err: err })
      },
    })
  })
}


function auth() {
  return new Promise((res, rej) => {
    wx.login({
      success: function(resp) {
        if (resp.code) {
          wx.getUserInfo({
            success: r => {
              req({
                url: `${Host}/wx_login`,
                method: 'POST',
                data: {
                  code: resp.code,
                  userInfo: r.userInfo
                }
              }).then((resp) => {
                console.log("auth....", resp)
                var res_data = resp.data;
                if (res_data.errcode == 0) {
                  var token = res_data.data.token
                  var userInfo = res_data.data.user_info
                  //success, save token
                  g.token = token
                  console.log("get token", token)
                  res(userInfo)
                  wx.setStorage({
                    key: 'token',
                    data: g.token
                  })
                  wx.setStorage({
                    key: 'user',
                    data: userInfo
                  })
                } else {
                  rej({ code: -1, err: 'fail:' + resp.statusCode})
                }
              }).catch((resp) => {
                console.log(err)
                rej({ code: -1, err: err })
              })
            }, fail: function(err) {
              rej({ code: -1, err: err })
            },
          })
        } else {
          rej({ code: -1, err: 'wx.login return nil code' })
        }
      },
      fail: function(err) {
        rej({ code: -1, err: err })
      },
    })
  })
}

// mata-data

function getMetaData() {
  return req({
    url: `${Host}/api/metadata`,
    method: 'GET'
  })
}

// 签到API
function checkin(date) {
  if (date == undefined) {
    date = ""
  }
  return req({
    url: `${Host}/api/activity/sign/${date}`,
    method: 'POST'
  })
}

function checkState(date) {
  if (date == undefined) {
    date = ""
  }
  return req({
    url: `${Host}/api/activity/sign/${date}`,
    method: 'GET'
  })
}


// update user profile
function updateUser(data) {
  return req({
    url: `${Host}/api/users`,
    method: 'PUT',
    data: data,
  })
}

// return self user-info
function getUser() {
  return req({
    url: `${Host}/users/`,
    method: 'GET'
  })
}

function getUserPostList(uid, since, limit) {
  return req({
    url: `${Host}/user/${uid}/posts?since_id=${since}&limit=${limit}`,
    method: 'GET'
  })
}

function getUserCommentList(uid, since, limit) {
  return req({
    url: `${Host}/user/${uid}/posts?since_id=${since}&limit=${limit}&comment=1`,
    method: 'GET'
  })
}

function getUserFavorList(uid, since, limit) {
  return req({
    url: `${Host}/user/${uid}/posts?since_id=${since}&limit=${limit}&favor=1`,
    method: 'GET'
  })
}

// get post list, fitler: top,val,adz, topic
function getPostList(sinceId, limit, filter, topic_id) {
  if (!topic_id) {
    return req({
      url: `${Host}/post/?since_id=${sinceId}&limit=${limit}&filter=${filter}`,
      method: 'GET'
    })
  } else {
    return req({
      url: `${Host}/post/?since_id=${sinceId}&limit=${limit}&topic_id=${topic_id}`,
      method: 'GET'
    })
  }
}

function getPost(id) {
  return req({
    url: `${Host}/post/${id}`,
    method: 'GET'
  })
}

// create post
function createPost(data) {
  return req({
    url: `${Host}/post/`,
    method: 'POST',
    data: data,
  })
}

// update post
function updatePost(id, data) {
  return req({
    url: `${Host}/post/${id}`,
    method: 'PUT',
    data: data
  })
}

// delete post
function deletePost(id) {
  return req({
    url: `${Host}/post/${id}/`,
    method: 'DELETE'
  })
}

// get comment list
function getCommentList(pid, since, limit) {
  return req({
    url: `${Host}/post/${pid}/comments`,
    method: 'GET'
  })
}

function createComment(data) {
  return req({
    url: `${Host}/post/comments`,
    method: 'POST',
    data: data,
  })
}

function updateComment(id, data) {
  return req({
    url: `${Host}/post/comments/${id}`,
    method: 'PUT'
  })
}

function deleteComment(id) {
  return req({
    url: `${Host}/post/comments/${id}`,
    method: 'DELETE'
  })
}

// favors
function getPostFavorList(user_id) {  // 获取某个用户点赞的帖子
  return req({
    url: `${Host}/post/favors?user_id=${user_id}`,
    method: 'GET'
  })
}

function getPostFavorCount(pid) {
  return req({
    url: `${Host}/post/favors/?post_id=${pid}`,
    method: 'GET'
  })
}

function getPostStatCount(pid){
  return req({
    url: `${Host}/post/stats/?post_id=${pid}`,
    method: 'GET'
  })
}

function createPostFavor(pid, from_uid, to_uid) {
  return req({
    url: `${Host}/post/favors/`,
    method: 'POST',
    data: {post_id: pid, from_user_id: from_uid, to_user_id:to_uid}
  })
}

function deletePostFavor(pid, from_uid) {
  return req({
    url: `${Host}/post/favors/${pid}?user_id=${from_uid}`,
    method: 'DELETE'
  })
}

// comment favors
function getCommentFavorList(cid, since, limit) {
  return req({
    url: `${Host}/api/comments/${cid}/favors?since_id=${since}&limit=${limit}`,
    method: 'GET'
  })
}

function getCommentFavorCount(cid) {
  return req({
    url: `${Host}/api/comments/${cid}/favors/count`,
    method: 'GET'
  })
}

function createCommentFavor(cid) {
  return req({
    url: `${Host}/api/comments/favors`,
    method: 'POST',
    data: {cid: cid} 
  })
}

function deleteCommentFavor(cid) {
  return req({
    url: `${Host}/api/comments/${cid}/favors`,
    method: 'DELETE'
  })
}

// topic
function getPostByTopic(topic_id) {
  var encoded = encodeURIComponent(tag)
  return req({
    url: `${Host}/api/tags/${encoded}/posts`,
    method: 'GET'
  })
}

function getTopicList() {
  return req({
    url: `${Host}/post/topic/`,
    method: 'GET'
  })
}

function linkTopicPost(data) {
  return req({
    url: `${Host}/api/tags/posts`,
    method: 'POST',
    data: data,
  })
}

// message
function getMessageList(q, uid, since, limit) {
  return req({
    url: `${Host}/user/${uid}/messages?q=${q}&since_id=${since}&limit=${limit}`,
    method: 'GET'
  })
}

function getMessageCount(uid) {
  return req({
    url: `${Host}/user/${uid}/messages/count`,
    method: 'GET'
  })
}

function setMessageRead(id, msg_type) {
  return req({
    url: `${Host}/messages/${id}/read?msg_type=${msg_type}`,
    method: 'PUT'
  })
}

function setAllMessageRead() {
  return req({
    url: `${Host}/api/messages/read`,
    method: 'PUT'
  })
}

// 举报接口
function createReport(pid) {
  return req({
    url: `${Host}/post/${pid}/report`,
    method: 'POST'
  })
}

// 解密接口
function decrypt(data) {
  return req({
    url: `${Host}/actions/decrypt`,
    method: 'POST',
    data: data,
  })
}

module.exports = {
  autoAuth: autoAuth,
  auth: auth,
  updateUser: updateUser,
  getUser: getUser,
  getUserPostList: getUserPostList,
  getUserCommentList: getUserCommentList,
  getUserFavorList: getUserFavorList,

  // meta
  getMetaData: getMetaData,
  checkin: checkin,
  checkState: checkState,

  // post
  getPostList: getPostList,
  getPost: getPost,
  createPost: createPost,
  deletePost: deletePost,

  // stats
  getPostStatCount: getPostStatCount,

  // comment
  getCommentList: getCommentList,
  createComment: createComment,
  updateComment: updateComment,
  deleteComment: deleteComment,

  // favors
  getPostFavorList: getPostFavorList,
  getPostFavorCount: getPostFavorCount,
  createPostFavor: createPostFavor,
  deletePostFavor: deletePostFavor,

  getCommentList: getCommentList,
  getCommentFavorCount: getCommentFavorCount,
  createCommentFavor: createCommentFavor,
  deleteCommentFavor: deleteCommentFavor,

  // tags
  getPostByTopic: getPostByTopic,
  getTopicList: getTopicList,
  linkTopicPost: linkTopicPost,

  // messages
  getMessageList: getMessageList,
  getMessageCount: getMessageCount,
  setMessageRead: setMessageRead,
  setAllMessageRead: setAllMessageRead,

  // reports
  createReport: createReport,

  // actions
  decrypt: decrypt,
}