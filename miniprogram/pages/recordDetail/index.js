const {
  fetch,
  formaterDate,
  formaterTime,
  BILL_CARD,
  BILL_CASH,
  BILL_LOAN,
  BILL_PAY,
  minus
} = require('../../utils');
const app = getApp();

Page({
  data: {
    info: {},
    src: '',
  },
  onLoad(options) {
    this.getInfo(options.id);
  },

  getInfo(id) {
    wx.showLoading({
      title: '',
    })
    fetch({
      type: 'recordGetList',
      query: {
        _id: id,
      },
    }).then(res => {
      if (res.result.success) {
        try {
          const info = res.result.data[0] || {};
          if(info.incomeAmount){
            info.incomeAmount = `+${info.incomeAmount}`;
            info.incomeLoss = minus(info.incomeAmount, info.payAmount).toFixed(2)
          }
          if ([BILL_CARD, BILL_CASH, BILL_LOAN, BILL_PAY].includes(info.billTypeCode)) {
            info.payAmount = `-${info.payAmount}`
          } else {
            info.payAmount = `+${info.payAmount}`
          }
          
          info.time = `${formaterDate(info.gmtCreate)} ${formaterTime(info.gmtCreate, 1)}`;
          this.setData({
            info,
            src: `../../images/${info.billTypeCode}.png`
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