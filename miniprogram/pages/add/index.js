const { accountTypeArray, toNum, isNan, fetch } = require('../../utils');

const app = getApp();
const initForm = {
  dateBill: 1,
  dateRepayment: 1,
  accountType: '信用卡',
  accountTypeCode: 1
}

Page({
  data: {
    id: '',
    msg: '',
    errorMsg: '',
    form: {...initForm},
    accountTypeArray,
    dateArray: [],
    pageType: 'add'
  },

  onLoad(query) {
    this.setData(query);
    if (query.id) {
      this.getInfo(query.id);
      wx.setNavigationBarTitle({
        title: '编辑账户',
      })
    }
  },

  getInfo(id) {
    wx.showLoading({
      title: '加载中',
    })
    fetch({
      type: 'cardGet',
      query: {
        _id: id,
      }
    }).then(res => {
      const form = res.result.data[0];
      delete form._id;
      this.setData({
        form
      })
      wx.hideLoading();
    }).catch(() => {
      wx.hideLoading();
    })
  },

  onReady() {
    const dateArray = [];
    for (let i = 1; i < 32; i++) {
      dateArray.push({
        name: `${i}日`,
        value: i
      })
    }
    this.setData({
      dateArray
    })
  },

  submitForm() {
    const openid = app.globalData.appInfo.openid;
    const id = this.data.id;
    const form = this.data.form;
    if(!this.validate()) return;

    // 保留两位小数
    this.data.form.amountFixed = toNum(form.amountFixed); // 固定额度
    this.data.form.amountCurrent = toNum(form.amountCurrent); // 当前额度
    this.data.form.amountAvailable = toNum(form.amountAvailable); // 可用额度
    
    if (openid) {
      wx.showLoading({
        title: '加载中',
      })
      fetch({
        type: id ? 'cardUpdate' : 'cardAdd',
        query: id ? {
          _id: id
        } : undefined,
        data: {
          ...this.data.form,
          ...app.globalData.appInfo
        }
      }).then(res => {
        if (res.result.success) {
          this.setData({
            msg: id ? '更新成功' : '新增成功',
            form: id ? {...this.data.form} : {...initForm}
          })
          this.flagFetch();
        } else {
          this.setData({
            errorMsg: res.result.message,
          })
        }
        wx.hideLoading();
      }).catch(err => {
        wx.hideLoading();
      })
    }
  },

  validate() {
    let result = true;
    let errorMsg = '';
    const form = this.data.form;
    const accountTypeCode = form.accountTypeCode;
    const msg = {
      accountName: '请填写账户名称',
      userName: '请填写户主名称',
      amountAvailable: '请填写可用额度',
      amountFixed: '请填写固定额度',
      amountCurrent: '请填写当前额度',
    }
    // 校验必填
    const keys = ['accountName', 'userName', 'amountAvailable', 'amountFixed', 'amountCurrent']
    keys.forEach(key => {
      if(['accountName', 'userName', 'amountAvailable'].includes(key)){
        if(!form[key]){
          errorMsg = msg[key];
          result = false;
        }
      }
      // 信用卡需校验
      if(['amountFixed', 'amountCurrent'].includes(key) && accountTypeCode === 1){
        if(!form[key]){
          errorMsg = msg[key];
          result = false;
        }
      }
    })
    // 校验格式
    if (isNan(form.amountFixed) && accountTypeCode === 1) { // 固定额度
      errorMsg = '固定额度必须为数字';
      result = false;
    }
    if (isNan(form.amountCurrent) && accountTypeCode === 1) { // 当前额度
      errorMsg = '当前额度必须为数字';
      result = false;
    }
    if (isNan(form.amountAvailable)) { // 可用额度
      errorMsg = '可用额度必须为数字';
      result = false;
    }

    this.setData({ errorMsg })
    return result;
  },

  flagFetch() {
    app.globalData.accountChange.account = true;
    
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

  bindAccountType(e) {
    const form = this.data.form;
    const accountTypeArray = this.data.accountTypeArray;
    const accountTypeIndex = Number(e.detail.value);
    const account = accountTypeArray[accountTypeIndex];

    form.accountType = account.label;
    form.accountTypeCode = account.value;
    
    this.setData({
      form
    })
  },
  bindDateBill(e) {
    const form = this.data.form;
    const dateBill = e.detail.value;
    form.dateBill = Number(dateBill) + 1;
    this.setData({
      form
    })
  },
  bindDateRepayment(e) {
    const form = this.data.form;
    const dateRepayment = e.detail.value;
    form.dateRepayment = Number(dateRepayment) + 1;
    this.setData({
      form
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