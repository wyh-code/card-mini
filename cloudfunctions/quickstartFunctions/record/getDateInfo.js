const cloud = require('wx-server-sdk');
const {
  getCloudEnv,
  getDateInfo,
  BILL_CARD,
  BILL_LOAN,
  BILL_PAY,
  BILL_REPAY,
  BILL_RECOVER,
  BILL_INCOME,
  BILL_CASH
} = require('../utils');
cloud.init({
  env: getCloudEnv()
});
const db = cloud.database();
const $ = db.command.aggregate;

// 获取每日收支信息
module.exports = async (openid, date) => {
  const getGroup = async (billTypeCode) => {
    const { startTime, endTime } = getDateInfo(date);
    const dafaultMatch = {
      openid,
      gmtCreate: db.command.gte(startTime).and(db.command.lt(endTime)),
      billTypeCode,
      recordType: 1
    }

    const result = await db.collection('records').aggregate()
      .match(dafaultMatch)
      .group({
        _id: null,
        payAmount: $.sum('$payAmount'),
        incomeAmount: $.sum('$incomeAmount'),
      })
      .end();
    
    return result.list[0] || {}
  }

  try {
    const cardInfo = await getGroup(BILL_CARD); // 个人刷卡
    const repayInfo = await getGroup(BILL_REPAY); // 账单还款
    const payInfo = await getGroup(BILL_PAY); // 日常支出
    const incomeInfo = await getGroup(BILL_INCOME); // 日常收入
    const loanInfo = await getGroup(BILL_LOAN); // 转账支出
    const recoverInfo = await getGroup(BILL_RECOVER); // 转账收入
    const cashInfo = await getGroup(BILL_CASH); // 提现
    const dateInfo = {
      cardInfo,
      repayInfo,
      payInfo,
      incomeInfo,
      loanInfo,
      recoverInfo,
      cashInfo
    }
    return dateInfo;
  } catch (e) {
    console.log(e, '==e==')
    // 这里catch到的是该collection已经存在，从业务逻辑上来说是运行成功的，所以catch返回success给前端，避免工具在前端抛出异常
    return {
      success: false,
      message: e.message || '获取数据失败'
    };
  }
};