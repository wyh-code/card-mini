const {
  BILL_PAY,
  BILL_INCOME,
  BILL_CARD,
  BILL_REPAY,
  UPDATE_AFTER_INFO,
  BILL_RECOVER,
  BILL_LOAN,
  BILL_CASH,
  fetch,
  formaterDate,
  add,
  toNum,
  minus,
  weeks,
  formaterTime,
} = require('../../utils');
const app = getApp();

Page({
  data: {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    startMonth: `${new Date().getFullYear()}-${new Date().getMonth() + 1}`,
    currentMonth: `${new Date().getFullYear()}-${new Date().getMonth() + 1}`,
    countPay: '0.00',
    countIncome: '0.00',
    fetchEnd: false,
    login: false,
    pageNo: 1,
    pageSize: 10,
    total: 0,
    list: [],
    recordList: [],
    dateInfo: {},
    monthInfo: {},
    showId: '',
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
  },

  onShow() {
    const openid = app.globalData.appInfo?.openid;
    const updateAfterInfo = app.globalData.updateAfterInfo;
    // const updateAfterInfo = wx.getStorageSync(UPDATE_AFTER_INFO);
    const recordChange = app.globalData.recordChange.record || app.globalData.accountChange.record;

    if (updateAfterInfo) {
      this.updateRecord();
      return;
    }

    if (openid && recordChange && !updateAfterInfo) {
      this.setData({
        pageNo: 1
      }, () => {
        this.getList();
      })
    }

    this.setData({
      login: !!openid,
    });
  },

  onHide() {
    // 清除缓存的编辑信息
    app.globalData.updateAfterInfo = undefined;
  },


  updateRecord() {
    const updateAfterInfo = app.globalData.updateAfterInfo;
    console.log('updateRecord')
    this.handlerRecord({
      success: updateAfterInfo.success,
      result: updateAfterInfo
    }, 'replace');
  },

  onElementLinstener() {
    // 取消旧的监听
    this.observe?.disconnect();
    // 创建新的监听
    this.observe = wx.createIntersectionObserver(this, {
      thresholds: [0],
      observeAll: true
    })

    this.observe.relativeTo('.month-record').observe('.record-item', (res) => {
      const currentMonth = res.dataset.month;
      const [year, month] = currentMonth.split('-');
      /**
       * 如果有下边距离，证明是进入时
       *  相交区域的 top 取值为 目标边界与参照边界在上的那条线
       */
      if (res.intersectionRect.bottom) {
        this.setData({
          currentMonth,
          year,
          month
        })
      }
    })
  },

  packMonth(info, list) {
    const monthInfoState = this.data.monthInfo;
    const currentMonthInfo = {}
    Object.keys(info).forEach(month => {
      try {
        const monthInfo = info[month];
        // 总出账 = 个人刷卡 + 日常支出 + 转账支出 + 提现
        const countPay = add(monthInfo.cardPay, monthInfo.payAmount, monthInfo.loan, monthInfo.cashPay);
        // 总入账 = 刷卡收入 + 账单还款 + 日常收入 + 转账收入 + 提现收入
        const countIncome = add(monthInfo.cardIncome, monthInfo.repay, monthInfo.income, monthInfo.recover, monthInfo.cashIncome);
        currentMonthInfo[month] = {
          countPay: countPay.toFixed(2),
          countIncome: countIncome.toFixed(2)
        };
      } catch (err) {
        console.log(err, '==123=')
      }
    })
    
    // 如果没有可用数据, 月份信息应该清零
    if(!list.filter(it => it.recordType).length){
      Object.keys(monthInfoState).forEach(month => {
        monthInfoState[month] = {}
      })
    }

    this.setData({
      monthInfo: {
        ...monthInfoState,
        ...currentMonthInfo
      }
    }, () => {
      this.onElementLinstener();
    })
    this.setCurrentMonth();
  },

  setCurrentMonth() {
    const currentMonth = `${this.data.year}-${this.data.month}`;
    this.setData({
      currentMonth
    })
  },

  getList(type) {
    const openid = app.globalData.appInfo?.openid;
    wx.showLoading({
      title: '查询中',
    })
    fetch({
      type: 'recordGetList',
      query: {
        openid
      },
      pageNo: this.data.pageNo,
      pageSize: this.data.pageSize
    }).then(res => {
      this.handlerRecord(res, type)
      app.globalData.recordChange.record = false;
      app.globalData.accountChange.record = false;
      wx.hideLoading();
    }).catch(() => {
      wx.hideLoading();
    })
  },

  handlerRecord(res, type) {
    try{
      if (res.result.success) {
        let year = this.data.year;
        let month = this.data.month;
        let startMonth = this.data.startMonth;
        let list = res.result.data.map(item => {
          item.icon = `../../images/${item.billTypeCode}.png`;
          item.payAmount = item.payAmount.toFixed(2);
          item.time = formaterTime(item.gmtCreate);
          item.pageNo = res.result.pageNo;
          item.pageSize = res.result.pageSize;
  
          if ([BILL_INCOME, BILL_RECOVER, BILL_REPAY].includes(item.billTypeCode)) {
            item.payAmount = `+${item.payAmount}`;
            item.payAmountClass = 'record-item-add-mount';
          } else if ([BILL_CARD, BILL_CASH].includes(item.billTypeCode)) {
            item.incomeAmountClass = 'record-item-add-mount';
            item.incomeAmount = `+${item.incomeAmount.toFixed(2)}`;
            item.payAmount = `-${item.payAmount}`;
          } else {
            item.payAmount = `-${item.payAmount}`;
          }
          // 如果是被删除的数据
          if(!item.recordType){
            item.className = 'record-item-content-remove'
          }
          // 如果账户被删除
          if(!item.recordAccountType){
            item.className = 'record-item-content-accountRemove'
          }
          return item;
        });
        let dateInfo = res.result.dateInfo;
        let monthInfo = res.result.monthInfo;
  
        if (type === 'concat') {
          list = [...this.data.list, ...list];
        }
        if (type === 'replace') {
          const target = list[0];
          list = this.data.list.map(item => {
            if (item._id === target._id) {
              return target;
            }
            return item;
          })
        }
  
        dateInfo = {
          ...this.data.dateInfo,
          ...dateInfo
        };

        const showList = list.filter(it => it.recordType);
        if(app.globalData.recordChange.record && showList.length){
          const option = formaterDate(showList[0].gmtCreate, 1);
          year = option.y;
          month = option.m;
          startMonth = `${year}-${month}`
        }
       
        // 更新数据
        this.setData({
          list,
          year,
          month,
          startMonth,
          currentMonth: `${year}-${month}`,
          dateInfo,
          showId: '',
          total: res.result.count.total,
          fetchEnd: res.result.fetchEnd,
        }, () => {
          // 组装数组
          this.packList(list, dateInfo);
          // 组装月份数据
          this.packMonth(monthInfo, list);
        })
  
        app.globalData.recordChange.record = false;
      }
    }catch(err){
      console.log(err,'==err=')
    }
  },

  packList(list, dateInfo) {
    try {
      const monthObj = {};
      const obj = {};
      let preDate = '';
      list.forEach(item => {
        if(item.recordType){
          const options = formaterDate(item.gmtCreate, 1);
          const date = options.date;
          if (!obj[date]) {
            obj[date] = [];
            obj[date].options = options;
            if(preDate && obj[preDate]){
              obj[preDate][obj[preDate].length - 1].infoClass = 'record-item-content-info-last'
            }

            preDate = date;
          }
          // 删除上次遍历的赋值
          item.infoClass = ''
          obj[date].push(item)
        }
      })
      // 获取最后一条账单记录
      if(preDate && obj[preDate]){
        obj[preDate][obj[preDate].length - 1].infoClass = 'record-item-content-info-last'
      }

      Object.keys(obj).forEach(key => {
        const countInfo = dateInfo[key];
        const year = obj[key].options.y;
        const month = obj[key].options.m;
        const date = obj[key].options.d;
        const monthKey = `${year}-${month}`;
        if (!monthObj[monthKey]) {
          monthObj[monthKey] = {};
          monthObj[monthKey].list = [];
        }
        // 出账 = 个人刷卡 + 日常支出 + 转账支出 + 提现
        const countPay = add(countInfo.cardInfo.payAmount, countInfo.payInfo.payAmount, countInfo.loanInfo.payAmount, countInfo.cashInfo.payAmount);
        // 入账 = 刷卡收入 + 账单还款 + 日常收入 + 转账收入 + 提现收入
        const countIncome = add(countInfo.cardInfo.incomeAmount, countInfo.repayInfo.payAmount, countInfo.incomeInfo.payAmount, countInfo.recoverInfo.payAmount, countInfo.cashInfo.incomeAmount);
       
        const info = {
          monthKey,
          id: `${monthKey}-${date}`,
          year,
          month,
          date,
          day: weeks[(new Date(key)).getDay()],
          countPay: countPay.toFixed(2),
          countIncome: countIncome.toFixed(2),
          list: obj[key]
        }
        monthObj[monthKey].list.push(info);
        monthObj[monthKey].monthKey = monthKey;
        monthObj[monthKey].year = year;
        monthObj[monthKey].month = month;
        monthObj[monthKey].showMonthKey = monthKey !== this.data.startMonth;
      })

      const result = [];
      Object.keys(monthObj).forEach(month => {
        result.push(monthObj[month])
      })
      this.setData({
        recordList: result
      })
    } catch (err) {
      console.log(err, '==er12r===')
    }
  },

  toDetail(e) {
    const id = e.currentTarget.dataset.id;
    const showId = this.data.showId;
    if (!showId) {
      wx.navigateTo({
        url: `../recordDetail/index?id=${id}`
      })
    }
  },

  clickPage(e) {
    setTimeout(() => {
      this.setData({
        showId: ''
      })
    })
  },

  bindshow(e) {
    const showId = e.currentTarget.dataset.id;
    this.setData({
      showId
    })
  },

  bindbuttontap(e) {
    const id = e.currentTarget.dataset.id;
    const pageSize = e.currentTarget.dataset.pagesize;
    const pageNo = e.currentTarget.dataset.pageno;
    if (e.detail.data === 'edit') {
      wx.navigateTo({
        url: `../create/index?id=${id}&pageNo=${pageNo}&pageSize=${pageSize}`
      })
    }

    if (e.detail.data === 'remove') {
      wx.showModal({
        title: '提示',
        content: '确认删除该账单吗？',
        success: (res) => {
          if (res.confirm) {
            this.onRemove({ pageSize, pageNo, id })
          } else if (res.cancel) {}
        }
      })
    }
  },

  onRemove({ id, pageSize, pageNo }) {
    const openid = app.globalData.appInfo?.openid;
    wx.showLoading({
      title: '加载中',
    })
    fetch({
      type: 'recordRemove',
      query: {
        _id: id,
        openid,
        pageSize, 
        pageNo
      },
    }).then(res => {
      if (res.result.success) {
        this.setData({
          msg: '删除成功',
        })
        // 标记请求
        this.flagFetch();

        // 更新视图
        const removeAfterInfo = res.result.afterInfo;
        this.handlerRecord({
          success: removeAfterInfo.success,
          result: removeAfterInfo
        }, 'replace');
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

  flagFetch() {
    // 记录更新，需要重查
    app.globalData.recordChange.account = true;
    app.globalData.recordChange.record = true;
    // 账户更新，需要重查
    app.globalData.accountChange.account = true;
  },

  onReachBottom() {
    // 未获取所有数据则继续请求
    if (!this.data.fetchEnd) {
      this.setData({
        pageNo: this.data.pageNo + 1
      }, () => {
        this.getList('concat')
      })
    }
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