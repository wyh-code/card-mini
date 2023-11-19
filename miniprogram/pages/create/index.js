const {
  BILL_CASH,
  BILL_PAY,
  BILL_CARD,
  ACCOUNT_CASH,
  ACCOUNT_CARD,
  billTypeArray,
  payTypeArray,
  isNan,
  toNum,
  fetch
} = require('../../utils');

const app = getApp();

Page({
  data: {
    login: false,
    cards: [],
    msg: '',
    errorMsg: '',
    form: {},
    billTypeArray,
    payTypeArray,
    incomeAccountArray: [],
  },

  onLoad(options) {
    this.init();
    if (options.id) {
      this.getInfo(options)
    }
  },

  init() {
    const form = this.data.form;
    let cards = app.globalData.cards;
    cards = cards.map(item => ({
      value: item._id,
      label: `${item.accountType}-${item.accountName}-${item.userName}`,
      accountTypeCode: item.accountTypeCode
    }))
    const defaultAccount = cards[0];
    this.setBillTypeArray(defaultAccount);

    const defaultPayType = payTypeArray[0];

    form.accountName = defaultAccount.label;
    form.accountCode = defaultAccount.value;
    form.accountTypeCode = defaultAccount.accountTypeCode;
    form.payType = defaultPayType.label;
    form.payTypeCode = defaultPayType.value;

    this.setData({
      form,
      cards
    })
  },

  getInfo(options) {
    wx.showLoading({
      title: '加载中',
    })
    fetch({
      type: 'recordGetList',
      query: {
        _id: options.id,
      },
    }).then(res => {
      if (res.result.success) {
        const form = res.result.data[0];
        this.setBillTypeArray(form);
        this.setIncomeAccountArray(form);
        this.setData({
          form,
          ...options
        })
      }
      wx.hideLoading();
    }).catch(() => {
      wx.hideLoading();
    })
  },

  setBillTypeArray(account) {
    const form = this.data.form;
    const arr = billTypeArray.filter(item => item.permission.includes(account.accountTypeCode));
    const defaultBillType = arr[0];
    form.billType = defaultBillType.label;
    form.billTypeCode = defaultBillType.value;
    this.setData({
      billTypeArray: arr,
      form,
    })
    return arr;
  },

  bindAccountChange(e) {
    const form = this.data.form;
    const accountIndex = Number(e.detail.value);
    const currentAccount = this.data.cards[accountIndex]
    form.accountName = currentAccount.label;
    form.accountCode = currentAccount.value;
    form.accountTypeCode = currentAccount.accountTypeCode;

    // 切换账户后，修改账单类型、支出类型
    this.setBillTypeArray(currentAccount)
    this.setPayType(0);
    this.setData({
      form
    })
  },

  bindBillTypeChange(e) {
    const billTypeArray = this.data.billTypeArray;
    const form = this.data.form;
    const billTypeIndex = e.detail.value;
    const currentType = billTypeArray[billTypeIndex]
    form.billType = currentType.label;
    form.billTypeCode = currentType.value;
    // 账单类型不为支出时，清空支出类型
    if (form.billTypeCode === BILL_PAY) {
      form.payType = payTypeArray[0].label;
      form.payTypeCode = payTypeArray[0].value;
    } else {
      form.payType = null;
      form.payTypeCode = null;
    }
    // 账单类型修改，更新收款账户
    this.setIncomeAccountArray(form);
    this.setData({
      form,
    })
  },
  bindPayTypeChange(e) {
    const payTypeIndex = e.detail.value;
    this.setPayType(payTypeIndex);
  },
  setPayType(index) {
    const form = this.data.form;
    const currentType = this.data.payTypeArray[index]
    form.payType = currentType.label;
    form.payTypeCode = currentType.value;
    this.setData({
      form
    })
  },
  setIncomeAccountArray(form) {
    // 账单类型为个人刷卡、提现时
    if ([BILL_CARD, BILL_CASH].includes(form.billTypeCode)) {
      let incomeAccountArray = [];
      // 个人刷卡收款账户不为信用卡
      if (form.billTypeCode === BILL_CARD) {
        incomeAccountArray = this.data.cards.filter(item => item.accountTypeCode !== ACCOUNT_CARD);
      }
      // 提现收款账户必须为储蓄卡
      if (form.billTypeCode === BILL_CASH) {
        incomeAccountArray = this.data.cards.filter(item => item.accountTypeCode === ACCOUNT_CASH);
      }
      form.incomeAccount = incomeAccountArray[0].label;
      form.incomeAccountCode = incomeAccountArray[0].value;
      this.setData({
        incomeAccountArray
      })
    } else {
      // 账单类型不为个人刷卡、提现时,清空收款信息
      form.incomeAmount = null;
      form.incomeAccount = null;
      form.incomeAccountCode = null;
    }
  },

  bindIncomeAccountChange(e) {
    const form = this.data.form;
    const incomeAccountIndex = e.detail.value;
    const currentIncomeAccount = this.data.incomeAccountArray[incomeAccountIndex];
    form.incomeAccount = currentIncomeAccount.label;
    form.incomeAccountCode = currentIncomeAccount.value;
    this.setData({
      form
    })
  },

  formInputChange(e) {
    const {
      field
    } = e.currentTarget.dataset;
    const form = this.data.form;
    form[field] = e.detail.value;
    this.setData({
      form
    })
  },

  validate() {
    let result = true;
    let errorMsg = '';
    const form = this.data.form;
    const msg = {
      payAmount: '账单金额必须为数字',
      incomeAmount: '收款金额必须为数字',
    }
    // 校验金额
    if (!form.payAmount || isNan(form.payAmount)) {
      errorMsg = msg.payAmount;
      result = false
    }
    // 校验收款金额
    if (form.billTypeCode === BILL_CARD && (!form.incomeAmount || isNan(form.incomeAmount))) {
      errorMsg = msg.incomeAmount;
      result = false
    }
    this.setData({
      errorMsg
    })
    return result;
  },

  submitForm() {
    if (!this.validate()) return;
    const form = this.data.form;
    const id = this.data.id;
    form.payAmount = toNum(form.payAmount);
    if (form.incomeAmount) {
      form.incomeAmount = toNum(form.incomeAmount)
    }

    wx.showLoading({
      title: '加载中',
    })
    fetch({
      type: id ? 'recordUpdate' : 'recordAdd',
      query: {
        _id: id,
        openid: app.globalData.appInfo.openid
      },
      pageNo: +this.data.pageNo,
      pageSize: +this.data.pageSize,
      data: {
        ...form,
        ...app.globalData.appInfo
      },
    }).then(res => {
      if (res.result.success) {
        this.setData({
          msg: id ? '更新成功' : '新增成功',
          form: id ? form : {}
        })
        if (!id) {
          this.init();
        }
        app.globalData.updateAfterInfo = res.result.afterInfo;
        // wx.setStorageSync(UPDATE_AFTER_INFO, res.result.afterInfo)
        console.log(res.result, '--res.result--')
        this.flagFetch();
      } else {
        this.setData({
          errorMsg: res.result.message,
        })
      }
      wx.hideLoading();
    }).catch(err => {
      this.setData({
        errorMsg: err.message,
      })
      wx.hideLoading();
    })
  },

  flagFetch() {
    // 记录更新，需要重查
    app.globalData.recordChange.account = true;
    app.globalData.recordChange.record = true;
    // 账户更新，需要重查
    app.globalData.accountChange.account = true;
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