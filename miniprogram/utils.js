// 云环境
const ENV_ID = 'cloud1-自己的云环境';

const TYPE_OTHER = 'TYPE_OTHER'; // 其他
const UPDATE_AFTER_INFO = 'UPDATE_AFTER_INFO' // 编辑账单

// 额度类型
const AMOUNT_FIXED = 'AMOUNT_FIXED' // 当前额度
const AMOUNT_CURRENT = 'AMOUNT_CURRENT' // 当前额度
const AMOUNT_AVAILABLE = 'AMOUNT_AVAILABLE' // 可用额度
const AMOUNT_CASH = 'AMOUNT_CASH' // 现金额度

// 当月统计类型
const MONTH_CARD = 'MONTH_CARD' // 当月刷卡
const MONTH_REPAY = 'MONTH_REPAY' // 当月还款
const MONTH_LOSS = 'MONTH_LOSS' // 当月损益

// 账单类型
const BILL_PAY = 'BILL_PAY' // 日常支出
const BILL_INCOME = 'BILL_INCOME' // 日常收入  --> 工资、收益...
const BILL_CARD = 'BILL_CARD' // 个人刷卡
const BILL_REPAY = 'BILL_REPAY' // 账单还款
const BILL_RECOVER = 'BILL_RECOVER' // 转账收入  --> 他人借款
const BILL_LOAN = 'BILL_LOAN' // 转账支出  --> 借款归还
const BILL_CASH = 'BILL_CASH' // 提现

// 支出类型
const BILL_PAY_Y = 'BILL_PAY_Y' // 日常支出  --> 衣
const BILL_PAY_S = 'BILL_PAY_S' // 日常支出  --> 食
const BILL_PAY_Z = 'BILL_PAY_Z' // 日常支出  --> 住
const BILL_PAY_X = 'BILL_PAY_X' // 日常支出  --> 行
const BILL_PAY_YL = 'BILL_PAY_YL' // 日常支出  --> 娱乐
const BILL_PAY_OTHER = 'BILL_PAY_OTHER' // 日常支出  --> 其他类型...

// 账户类型
const ACCOUNT_CARD = 1; // 信用卡
const ACCOUNT_CASH = 2; // 储蓄卡
const ACCOUNT_ALIPAY = 3; // 支付宝
const ACCOUNT_WX = 4; // 微信
const ACCOUNT_OTHER = 5; // 其他

// 账单还款时出款账户
const paymentAccountArray = [
  {
    label: '其他',
    value: TYPE_OTHER
  }
]

// 账户变量
const previewList = [{
    code: AMOUNT_CURRENT,
    label: '当前额度',
    value: '0.00'
  },
  {
    code: AMOUNT_AVAILABLE,
    label: '可用额度',
    value: '0.00'
  },
  {
    code: AMOUNT_CASH,
    label: '现金额度',
    value: '0.00'
  },
]

const infoTip = [{
    code: MONTH_CARD,
    label: '月刷卡',
    value: '0.00'
  },
  {
    code: MONTH_REPAY,
    label: '月还款',
    value: '0.00'
  },
  {
    code: MONTH_LOSS,
    label: '月损益',
    value: '0.00'
  },
]
// 账户类型
const accountTypeArray = [{
    label: '信用卡',
    value: ACCOUNT_CARD
  },
  {
    label: '储蓄卡',
    value: ACCOUNT_CASH
  },
  {
    label: '支付宝',
    value: ACCOUNT_ALIPAY
  },
  {
    label: '微信',
    value: ACCOUNT_WX
  },
  {
    label: '其他',
    value: ACCOUNT_OTHER
  }
]

// 账单类型
const billTypeArray = [
  {
    label: '日常支出',
    value: BILL_PAY,
    permission: [ACCOUNT_CARD, ACCOUNT_CASH, ACCOUNT_ALIPAY, ACCOUNT_WX, ACCOUNT_OTHER]
  },
  {
    label: '日常收入',
    value: BILL_INCOME,
    permission: [ACCOUNT_CASH, ACCOUNT_ALIPAY, ACCOUNT_WX, ACCOUNT_OTHER]
  },
  {
    label: '个人刷卡',
    value: BILL_CARD,
    permission: [ACCOUNT_CARD, ACCOUNT_OTHER]
  },
  {
    label: '账单还款',
    value: BILL_REPAY,
    permission: [ACCOUNT_CARD, ACCOUNT_OTHER]
  },
  {
    label: '转账收入',
    value: BILL_RECOVER,
    permission: [ACCOUNT_CASH, ACCOUNT_ALIPAY, ACCOUNT_WX, ACCOUNT_OTHER]
  },
  {
    label: '转账支出',
    value: BILL_LOAN,
    permission: [ACCOUNT_CASH, ACCOUNT_ALIPAY, ACCOUNT_WX, ACCOUNT_OTHER]
  },
  {
    label: '提现',
    value: BILL_CASH,
    permission: [ACCOUNT_ALIPAY, ACCOUNT_WX, ACCOUNT_OTHER]
  }
]

const payTypeArray = [
  {
    label: '食',
    value: BILL_PAY_S
  },
  {
    label: '行',
    value: BILL_PAY_X
  },
  {
    label: '衣',
    value: BILL_PAY_Y
  },
  {
    label: '住',
    value: BILL_PAY_Z
  },
  {
    label: '娱乐',
    value: BILL_PAY_YL
  },
  {
    label: '其他支出',
    value: BILL_PAY_OTHER
  },
]

// 保留两位小数
const toNum = (num) => {
  let n = Number(num);
  if(isNaN(n)) {
    n = 0
  }
  return Math.round(n * 100) / 100
}

const fetch = (event) => {
  return wx.cloud.callFunction({
    name: 'quickstartFunctions',
    config: {
      env: ENV_ID
    },
    data: event
  })
}

// 校验 NAN
const isNan = (num) => isNaN(Number(num));

// 字段求和
const sum = (list, keys) => {
  const result = {};
  list.forEach(item => {
    keys.forEach(key => {
      if(result[key]){
        result[key] += Math.round(item[key] * 100)
      }else{
        result[key] = Math.round(item[key] * 100)
      }
    })
  })

  Object.keys(result).forEach(key => {
    result[key] = result[key] / 100
  })

  return result;
}

// 求和
const getAddInfo = (list) => {
  // 个人刷卡
  const cardList = list.filter(item => item.billTypeCode === BILL_CARD);
  const cardInfo = sum(cardList, ['payAmount', 'incomeAmount']);
  // 账单还款
  const repayList = list.filter(item => item.billTypeCode === BILL_REPAY);
  const repayInfo = sum(repayList, ['payAmount']);
  // 日常支出
  const payList = list.filter(item => item.billTypeCode === BILL_PAY);
  const payInfo = sum(payList, ['payAmount']);
  // 日常收入
  const incomeList = list.filter(item => item.billTypeCode === BILL_INCOME);
  const incomeInfo = sum(incomeList, ['payAmount']);
  // 转账支出
  const loanList = list.filter(item => item.billTypeCode === BILL_LOAN);
  const loanInfo = sum(loanList, ['payAmount']);
  // 转账收入
  const recoverList = list.filter(item => item.billTypeCode === BILL_RECOVER);
  const recoverInfo = sum(recoverList, ['payAmount']);

  return {
    cardInfo,
    repayInfo,
    payInfo,
    incomeInfo,
    loanInfo,
    recoverInfo
  }
}

const add = (...args) => {
  let result = 0;
  // 去除小数点
  const arr = args.map(toNum).map(item => Math.round(item * 100));
  // 求和
  arr.forEach(n => result += n)
  return (Math.round(result) / 100);
}

const minus = (...args) => {
  // 去除小数点
  const arr = args.map(toNum).map(item => Math.round(item * 100));
  let num = arr[0];

  arr.slice(1).forEach(n => num -= n);
  return (Math.round(num) / 100);
}

const weeks = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const formaterDate = (time, type) => {
  const date = new Date(time);
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const str = `${y}-${m}-${d}`;
  const options = {
    y,
    m,
    d,
    date: str
  }
  return type ? options : str;
}
const formaterTime = (time, type) => {
  const date = new Date(time);
  let h = date.getHours();
  let m = date.getMinutes();
  let s = date.getSeconds();
  h = h > 9 ? h : `0${h}`;
  m = m > 9 ? m : `0${m}`;
  s = s > 9 ? s : `0${s}`;
  return `${h}:${m}${type ? `:${s}` : ''}`
}


module.exports = {
  ENV_ID,
  TYPE_OTHER,
  AMOUNT_FIXED,
  AMOUNT_CURRENT,
  AMOUNT_AVAILABLE,
  AMOUNT_CASH,
  MONTH_CARD,
  MONTH_REPAY,
  MONTH_LOSS,
  BILL_CASH,
  BILL_CARD,
  BILL_REPAY,
  BILL_PAY,
  BILL_PAY_Y,
  BILL_PAY_S,
  BILL_PAY_Z,
  BILL_PAY_X,
  BILL_PAY_YL,
  BILL_PAY_OTHER,
  BILL_INCOME,
  BILL_RECOVER,
  BILL_LOAN,
  ACCOUNT_CARD,
  ACCOUNT_CASH,
  ACCOUNT_ALIPAY,
  ACCOUNT_WX,
  ACCOUNT_OTHER,
  UPDATE_AFTER_INFO,
  previewList,
  infoTip,
  accountTypeArray,
  billTypeArray,
  payTypeArray,
  paymentAccountArray,
  toNum,
  isNan,
  fetch,
  sum,
  minus,
  add,
  getAddInfo,
  weeks,
  formaterDate,
  formaterTime
};