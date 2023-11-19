const cloud = require('wx-server-sdk');
const {
  getCloudEnv,
  minus,
  getMonthInfo,
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

// 查询账户
exports.main = async (event, context) => {
  const { startTime, endTime } = getMonthInfo(event.query.date);

  const getGroup = async (billTypeCode) => {
    const dafaultMatch = {
      openid: event.query.openid,
      gmtCreate: db.command.gte(startTime).and(db.command.lt(endTime)),
      recordType: 1
    }
    const result = await db.collection('records').aggregate()
      .match({
        ...dafaultMatch,
        billTypeCode
      })
      .group({
        _id: null,
        payAmount: $.sum('$payAmount'),
        incomeAmount: $.sum('$incomeAmount'),
      })
      .end()

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

    return {
      success: true,
      data: {
        cardPay: cardInfo.payAmount, // 个人刷卡
        cardIncome: cardInfo.incomeAmount, // 刷卡收入
        cardLoss: minus(cardInfo.payAmount, cardInfo.incomeAmount), // 刷卡损益
        cashPay: cashInfo.payAmount, // 提现金额
        cashIncome: cashInfo.incomeAmount, // 入账金额
        cashLoss: minus(cashInfo.payAmount, cashInfo.incomeAmount), // 提现损益
        repay: repayInfo.payAmount, // 账单还款
        payAmount: payInfo.payAmount, // 日常支出
        income: incomeInfo.payAmount, // 日常收入
        recover: recoverInfo.payAmount, // 转账收入
        loan: loanInfo.payAmount, // 转账支出
      }
    }
  } catch (e) {
    console.log(e, '==err==')
    // 这里catch到的是该collection已经存在，从业务逻辑上来说是运行成功的，所以catch返回success给前端，避免工具在前端抛出异常
    return {
      success: false,
      message: e.message || '获取数据失败'
    };
  }
};