const {
  fetch,
  formaterDate,
  formaterTime,
} = require('../../utils');

Page({
  data: {
    src: '',
    info: {},
  },
  onLoad(options) {
    this.getInfo(options.id);
  },

  getInfo(id) {
    wx.showLoading({
      title: '',
    })
    fetch({
      type: 'cardGet',
      query: {
        _id: id,
      },
    }).then(res => {
      if (res.result.success) {
        try {
          const info = res.result.data[0] || {};
          const logos = ['card', 'card', 'card', 'zfb', 'wx', 'other'];
          info.time = `${formaterDate(info.gmtCreate)} ${formaterTime(info.gmtCreate, 1)}`;
          console.log(info, '==info==')
          this.setData({
            info,
            src: `../../images/${logos[info.accountTypeCode]}.png`
          })
        } catch (err) {
          console.log(err, '=err')
        }

      }
      wx.hideLoading();
    }).catch(() => {
      wx.hideLoading();
    })
  },


  onShareAppMessage() {
    return {
      title: '了账',
      path: 'pages/account/index'
    }
  },

  onShareTimeline() {
    return {
      title: '了账',
      path: 'pages/account/index'
    }
  }
});