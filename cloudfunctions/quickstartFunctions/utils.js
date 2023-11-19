// 云环境
const ENV_ID = 'cloud1-自己的云环境';

const TYPE_OTHER = 'TYPE_OTHER'; // 其他

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
const ACCOUNT_CARD = 1;
const ACCOUNT_CASH = 2;
const ACCOUNT_ALIPAY = 3;
const ACCOUNT_WX = 4;
const ACCOUNT_OTHER = 5;

const getCloudEnv = () => ENV_ID;

// 账户变量
const previewList = [{
    code: AMOUNT_CURRENT,
    label: '当前额度',
    value: 0
  },
  {
    code: AMOUNT_AVAILABLE,
    label: '可用额度',
    value: 0
  },
  {
    code: AMOUNT_CASH,
    label: '现金额度',
    value: 0
  },
]

const infoTip = [{
    code: MONTH_CARD,
    label: '当月刷卡',
    value: 0
  },
  {
    code: MONTH_REPAY,
    label: '当月还款',
    value: 0
  },
  {
    code: MONTH_LOSS,
    label: '当月损益',
    value: 0
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
const billTypeArray = [{
    label: '日常支出',
    value: BILL_PAY
  },
  {
    label: '日常收入',
    value: BILL_INCOME
  },
  {
    label: '个人刷卡',
    value: BILL_CARD
  },
  {
    label: '账单还款',
    value: BILL_REPAY
  },
  {
    label: '转账收入',
    value: BILL_RECOVER
  },
  {
    label: '转账支出',
    value: BILL_LOAN
  },
]

const payTypeArray = [{
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
  if (isNaN(n)) {
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
      if (result[key]) {
        result[key] += Math.round(item[key] * 100)
      } else {
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

const getBJTime = (time) => {
  const date = new Date(time);
  const offset = date.getTimezoneOffset();
  const diff = (offset + 480) * 60 * 1000;
  return time + diff;
}

const formaterDate = (time) => {
  const BJ_date = new Date(getBJTime(time));
  return `${BJ_date.getFullYear()}-${BJ_date.getMonth() + 1}-${BJ_date.getDate()}`
}

const getOffsetTime = () => ((new Date()).getTimezoneOffset() + 480) * 60 * 1000;

const getTime = (date) => {
  // 偏移时间
  const offsetTime = getOffsetTime();
  // 确定北京时间
  let time;
  if (date) {
    // 如果有指定日期，则直接取用指定日期
    time = +new Date(date);
  } else {
    // 如果没有指定日期，则：北京时间 = 服务器时间 + 偏移时间
    time = +new Date() + offsetTime
  }

  return time;
}

/**
 * 由格林威治时间计算北京时间
 * 计算北京时间的当前年月
 * 计算北京时间当前月份的时间戳跨度
 * 时间跨度向前平移
 * 
 * 主要确定北京时间当前月份
 * 解决临界点问题：北京时间2月1日7点，格林威治时间1月31日23点。
 * 若在8点前访问，则后端会汇总1月份的数据
 */
const getMonthInfo = (date) => {
  const time = getTime(date);
  // 偏移时间
  const offsetTime = getOffsetTime();
  // 开始年月
  const startBJYear = (new Date(time)).getFullYear();
  const startBJMonth = (new Date(time)).getMonth();
  // 结束年月
  const endBJMonth = (startBJMonth + 1) % 12;
  const endBJYear = endBJMonth ? startBJYear : startBJYear + 1;
  // 开始、结束时间戳
  const startTime = +new Date(`${startBJYear}-${startBJMonth + 1}-1 00:00:00`)
  const endTime = +new Date(`${endBJYear}-${endBJMonth + 1}-1 00:00:00`)

  return {
    startTime: startTime - offsetTime,
    endTime: endTime - offsetTime
  }
}

const getDateInfo = (d) => {
  // 偏移时间
  const offsetTime = getOffsetTime();
  const time = getTime(d);

  const year = new Date(time).getFullYear();
  const month = new Date(time).getMonth();
  const date = new Date(time).getDate();

  const startTime = +(new Date(`${year}-${month + 1}-${date} 00:00:00`)) - offsetTime;
  const endTime = startTime + (24 * 60 * 60 * 1000);
  
  return {
    startTime,
    endTime
  }
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
  getCloudEnv,
  previewList,
  infoTip,
  accountTypeArray,
  billTypeArray,
  payTypeArray,
  toNum,
  isNan,
  fetch,
  sum,
  minus,
  add,
  getAddInfo,
  formaterDate,
  getBJTime,
  getOffsetTime,
  getMonthInfo,
  getDateInfo
};