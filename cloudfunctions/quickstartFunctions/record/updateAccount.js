const cloud = require('wx-server-sdk');
const { TYPE_OTHER, BILL_INCOME, BILL_CASH, BILL_REPAY, BILL_RECOVER, BILL_CARD, getCloudEnv, add, minus } = require('../utils'); 
cloud.init({
  env: getCloudEnv()
});
const db = cloud.database();

// 更新账单关联账户
exports.main = async (event, context) => {
  try {
    // 新增收支记录后，要修改相应账户的可用额度
    const cards = await db.collection('cards').where({ _id: event.data.accountCode }).get();
    const card = cards.data[0];
    let amountAvailable = card.amountAvailable;
    // 收入 --> 日常收入、账单还款、转账收入
    if([BILL_INCOME, BILL_REPAY, BILL_RECOVER].includes(event.data.billTypeCode)){
      amountAvailable = add(amountAvailable, event.data.payAmount);
    } else {
      // 支出类
      amountAvailable = minus(amountAvailable, event.data.payAmount);
    }
    // 更新账户
    await db.collection('cards').where({ _id: event.data.accountCode }).update({
      // data 字段表示需新增的 JSON 数据
      data: {
        amountAvailable,
        gmtModified: +new Date
      }
    });

    // 若为个人刷卡、提现时，则需更新关联账户
    if([BILL_CARD, BILL_CASH].includes(event.data.billTypeCode) && event.data.incomeAccountCode !== TYPE_OTHER){
      const cards = await db.collection('cards').where({ _id: event.data.incomeAccountCode }).get();
      const card = cards.data[0];
      let amountAvailable = card.amountAvailable;
      amountAvailable = add(amountAvailable, event.data.incomeAmount);

      // 更新账户
      await db.collection('cards').where({ _id: event.data.incomeAccountCode }).update({
        // data 字段表示需新增的 JSON 数据
        data: {
          amountAvailable,
          gmtModified: +new Date
        }
      });
    }

    return {
      success: true
    };
  } catch (e) {
    // 这里catch到的是该collection已经存在，从业务逻辑上来说是运行成功的，所以catch返回success给前端，避免工具在前端抛出异常
    return {
      success: false,
      message: e.message || '保存失败'
    };
  }
};