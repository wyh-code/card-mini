const cloud = require('wx-server-sdk');
const { BILL_INCOME, BILL_CASH, BILL_REPAY, BILL_RECOVER, BILL_CARD, getCloudEnv, add, minus, TYPE_OTHER } = require('../utils'); 
cloud.init({
  env: getCloudEnv()
});
const db = cloud.database();
const updateAccount = require('./updateAccount').main;

// 新增账单
exports.main = async (event, context) => {
  const time = +new Date;
  const openid = event.query.openid;

  try {
    // 获取当前账本信息
    const result = await db.collection('cards').aggregate()
      .match({ recordType: 1, openid })
      .sort({ //类似于orderBy
        gdp: -1,
      })
      .skip(0) //类似于skip
      .limit(1000) //类似于limit，不填默认是20，没有上限
      .end()
      const account = result.list;
      const accountTypeCodeArr = account.map(item => item.accountTypeCode);
      const accountInfo = {}
      accountTypeCodeArr.forEach(code => accountInfo[code] = [])
      account.forEach(item => {
        accountInfo[item.accountTypeCode].push({
          id: item._id,
          amountAvailable: item.amountAvailable,
          amountCurrent: item.amountCurrent,
          amountFixed: item.amountFixed,
        })
      })

    // 新增账单
    const addResult = await db.collection('records').add({
      // data 字段表示需新增的 JSON 数据
      data: {
        ...event.data,
        accountInfo,
        recordType: 1,
        recordAccountType: 1,
        gmtCreate: time,
        gmtModified: time
      }
    });
    const updateResult = await updateAccount(event);
    console.log(addResult, '==addResult==')
    console.log(updateResult, '==updateResult==');
    if(!updateResult.success){
      // 如果更新账户失败，删除新增的账单
      await db.collection('records').where({ _id: addResult._id }).update({
        // data 字段表示需新增的 JSON 数据
        data: {
          recordType: 0,
          gmtModified: +new Date
        }
      })
      throw updateResult.message;
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