const cloud = require('wx-server-sdk');
const { getCloudEnv, BILL_INCOME, BILL_PAY, BILL_REPAY, BILL_RECOVER, BILL_LOAN } = require('../utils'); 
cloud.init({
  env: getCloudEnv()
});
const db = cloud.database();
const backRecord = require('./backRecord').main;
const updateAccount = require('./updateAccount').main;
const getList = require('./getList').main;

/**
 * 更新账单
 * 1、回退上一笔账单
 * 2、更新账单信息
 * 3、更新关联账户
 * @param {*} event 
 * @param {*} context 
 */
exports.main = async (event, context) => {
  try {
    console.log(event, '==event==');
    // 回退上一笔账单
    const records = await db.collection('records').where(event.query).get();
    const record = records.data[0];
    const backResult = await backRecord(record)
    // 更新账单信息
    delete event.data._id;
    if([BILL_INCOME, BILL_PAY, BILL_REPAY, BILL_RECOVER, BILL_LOAN].includes(event.data.billTypeCode)){
      event.data.incomeAmount = 0;
    }

    const updateRecord = await db.collection('records').where({ _id: event.query._id }).update({
      // data 字段表示需新增的 JSON 数据
      data: {
        ...event.data,
        gmtModified: +new Date
      }
    });
   
    // 更新关联账户
    const updateResult = await updateAccount(event);
    if(!updateResult.success){
    
      // 如果更新账户失败，回退新增的账单
      await db.collection('records').where({ _id: event.query._id }).update({
        // data 字段表示需新增的 JSON 数据
        data: {
          ...record,
          gmtModified: +new Date,
          updateResult,
        }
      })
      throw updateResult.message;
    }

    // 查询最新数据信息
    const afterInfo = await getList({
      pageSize: event.pageSize,
      pageNo: event.pageNo,
      query: {
        openid: event.query.openid
      }
    });
    afterInfo.data = afterInfo.data.filter(item => item._id === event.query._id);

    return {
      success: true,
      afterInfo,
    }
  } catch (e) {
    console.log(e,'==err=')
    // 这里catch到的是该collection已经存在，从业务逻辑上来说是运行成功的，所以catch返回success给前端，避免工具在前端抛出异常
    return {
      success: false,
      message: e.message || '更新数据失败'
    };
  }
};