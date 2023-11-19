const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

const {
  AMOUNT_CURRENT,
  AMOUNT_AVAILABLE,
  AMOUNT_CASH,
  MONTH_CARD,
  MONTH_REPAY,
  MONTH_LOSS,
  previewList,
  infoTip,
  fetch,
  sum,
  add,
  minus
} = require('../../utils')

const app = getApp();
Page({
  data: {
    modalHidden: true,
    time: `${(new Date()).getFullYear()}年${(new Date()).getMonth()+1}月`,
    avatarUrl: app.globalData.avatarUrl || defaultAvatarUrl,
    errorMsg: '',
    msg: '',
    showId: '',
    login: !!app.globalData.appInfo?.openid,
    payable: '0.00',
    previewList,
    infoTip,
    buttons: [{
        extClass: 'edit-class',
        data: 'edit',
        text: "编辑"
      },
      {
        type: 'warn',
        text: "删除",
        data: 'remove'
      }
    ],
    cards: [],
  },

  onShow() {
    if (app.globalData.accountChange.account) {
      this.getCards();
    }
    if(app.globalData.recordChange.account){
      this.getMonth();
    }
  },

  onChooseAvatar(e) {
    const {
      avatarUrl
    } = e.detail;
    this.getOpenId(avatarUrl);
  },

  getOpenId(avatarUrl) {
    const app = getApp();
    fetch({
      type: 'getOpenId'
    }).then((resp) => {
      if (resp.result) {
        app.globalData.appInfo = resp.result;
        app.globalData.avatarUrl = avatarUrl;

        // 刷新视图
        this.setData({
          avatarUrl,
          login: true,
        })
        this.getCards();
        this.getMonth();
      } else {
        this.setData({
          errorMsg: '登录失败，请重新登录'
        });
      }
    }).catch((e) => {
      this.setData({
        errorMsg: e.message || '登录失败，请重新登录'
      });
    });
  },

  getCards() {
    const openid = app.globalData.appInfo?.openid;
    if (!openid) return;
    wx.showLoading({
      title: '加载中',
    })
    fetch({
      type: 'cardGet',
      query: {
        openid,
      },
    }).then(res => {
      if (res.result.success) {
        const cards = res.result.data.sort((a, b) => a.accountTypeCode - b.accountTypeCode);

        // 信用卡
        const cardList = cards.filter(it => it.accountTypeCode === 1);
        const { amountCurrent, amountAvailable } = sum(cardList, ['amountCurrent', 'amountAvailable']);
        // 现金账户
        const cashList = cards.filter(it => it.accountTypeCode !== 1);
        const cashInfo = sum(cashList, ['amountAvailable']);
        const amountCash = cashInfo.amountAvailable;
        // 剩余欠款 = 当前额度 - 可用额度
        const payable = minus(amountCurrent, amountAvailable).toFixed(2);
        const accountInfo = {
          [AMOUNT_CURRENT]: amountCurrent?.toFixed(2) || (0).toFixed(2),
          [AMOUNT_AVAILABLE]: amountAvailable?.toFixed(2) || (0).toFixed(2),
          [AMOUNT_CASH]: amountCash?.toFixed(2) || (0).toFixed(2)
        };
        previewList.forEach(item => item.value = accountInfo[item.code]);

        // 保存全局，明细中保存当前数据
        app.globalData.accountChange.account = false;
        app.globalData.cards = cards;

        const result = cards.map(item => {
          item.amountAvailable = item.amountAvailable?.toFixed(2);
          return item;
        });

        this.setData({
          cards: result,
          previewList,
          payable
        })
      }
      wx.hideLoading();
    }).catch(() => {
      wx.hideLoading();
    })
  },

  getMonth() {
    const openid = app.globalData.appInfo?.openid;
    if (!openid) return;
    wx.showLoading({
      title: '加载中',
    })
    fetch({
      type: 'recordGetMonth',
      query: {
        openid,
      },
    }).then(res => {
      if (res.result.success) {
        const info = res.result.data;
        const loss = add(info.cardLoss, info.cashLoss); // 损益 = 刷卡损益 + 提现损益
        const monthInfo = {
          [MONTH_CARD]: info.cardPay?.toFixed(2) || (0).toFixed(2),
          [MONTH_REPAY]: info.repay?.toFixed(2) || (0).toFixed(2),
          [MONTH_LOSS]: loss?.toFixed(2) || (0).toFixed(2),
        }
        infoTip.forEach(item => item.value = monthInfo[item.code])
        this.setData({
          infoTip
        })
        app.globalData.recordChange.account = false;
      }
      wx.hideLoading();
    }).catch((err) => {
      wx.hideLoading();
    })
  },

  add(e) {
    const id = e.target.dataset.id;
    if (!app.globalData.appInfo?.openid) {
      this.setData({
        errorMsg: '请先登录'
      });
    } else {
      let url = `../add/index${id ? `?id=${id}` : ''}`
      wx.navigateTo({
        url
      })
    }
  },

  bindshow(e) {
    const showId = e.currentTarget.dataset.id;
    this.setData({
      showId
    })
  },

  toDetail(e) {
    const id = e.currentTarget.dataset.id;
    const showId = this.data.showId;
    if (!showId) {
      wx.navigateTo({
        url: `../accountDetail/index?id=${id}`
      })
    }
  },


  clickPage(){
    setTimeout(() => {
      this.setData({
        showId: ''
      })
    })
  },

  addRecord(){
    if (!app.globalData.appInfo?.openid) {
      this.setData({
        errorMsg: '请先登录'
      });
    } else {
      if(!this.data.cards.length){
        this.setData({
          errorMsg: '请先新增账户'
        });
      }else{
        wx.navigateTo({
          url: '../create/index'
        })
      }
    }
  },

  bindbuttontap(e) {
    const type = e.detail.data;
    const id = e.target.dataset.id;

    if(type === 'edit'){
      wx.navigateTo({
        url: `../add/index?id=${id}`
      })
    }

    if(type === 'remove'){
      wx.showModal({
        title: '提示',
        content: '确认删除该账户吗？',
        success: (res) => {
          if (res.confirm) {
            this.onRemove(id)
          } else if (res.cancel) {}
        }
      })
    }
  },

  onRemove(id) {
    wx.showLoading({
      title: '加载中',
    })
    fetch({
      type: 'cardRemove',
      query: {
        _id: id
      },
    }).then(res => {
      if (res.result.success) {
        this.getCards();
        this.setData({
          msg: '删除成功',
        })

        app.globalData.accountChange.record = true;
      } else {
        this.setData({
          errorMsg: res.result.message,
        })
      }
      wx.hideLoading()
    }).catch(err => {
      wx.hideLoading()
    })
  },

  callOwner() {
    this.setData({
      modalHidden: false
    })
  },

  modalCandel() {
    this.setData({
      modalHidden: true
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