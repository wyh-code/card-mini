const cloud = require('wx-server-sdk');
const {
  TYPE_OTHER,
  BILL_INCOME,
  BILL_CASH,
  BILL_REPAY,
  BILL_RECOVER,
  BILL_CARD,
  getCloudEnv,
  add,
  minus
} = require('../utils');
cloud.init({
  env: getCloudEnv()
});
const db = cloud.database();

/**
 * 回退账单
 * @param {*} event 
 * @param {*} context 
 */
exports.main = async (record, context) => {
  try {
    // 查询相关账户
    const cards = await db.collection('cards').where({
      _id: record.accountCode
    }).get();
    const card = cards.data[0];
    let amountAvailable = card.amountAvailable;
    // 收入 --> 日常收入、账单还款、转账收入
    if ([BILL_INCOME, BILL_REPAY, BILL_RECOVER].includes(record.billTypeCode)) {
      amountAvailable = minus(amountAvailable, record.payAmount);
    } else {
      // 支出类
      amountAvailable = add(amountAvailable, record.payAmount);
    }
    // 更新账户
    await db.collection('cards').where({
      _id: record.accountCode
    }).update({
      // data 字段表示需新增的 JSON 数据
      data: {
        amountAvailable,
        gmtModified: +new Date
      }
    });

    // 若为个人刷卡、提现时，则需更新关联账户
    if ([BILL_CARD, BILL_CASH].includes(record.billTypeCode) && record.incomeAccountCode !== TYPE_OTHER) {
      const cards = await db.collection('cards').where({
        _id: record.incomeAccountCode
      }).get();
      const card = cards.data[0];
      let amountAvailable = card.amountAvailable;
      amountAvailable = minus(amountAvailable, record.incomeAmount);

      // 更新账户
      await db.collection('cards').where({
        _id: record.incomeAccountCode
      }).update({
        // data 字段表示需新增的 JSON 数据
        data: {
          amountAvailable,
          gmtModified: +new Date
        }
      });
    }
    return {
      success: true,
    }
  } catch (e) {
    // 这里catch到的是该collection已经存在，从业务逻辑上来说是运行成功的，所以catch返回success给前端，避免工具在前端抛出异常
    return {
      success: false,
      message: e.message || '更新数据失败'
    };
  }
};