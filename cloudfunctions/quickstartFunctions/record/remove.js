const cloud = require('wx-server-sdk');
const { getCloudEnv } = require('../utils');
const backRecord = require('./backRecord').main; 
const getList = require('./getList').main;
cloud.init({
  env: getCloudEnv()
});
const db = cloud.database();

// 删除账单
/**
 * 回退账单
 * 查询新的列表数据
 * @param {*} event 
 * @param {*} context 
 */
exports.main = async (event, context) => {
  try {
    // 回退上一笔账单
    const records = await db.collection('records').where({ _id: event.query._id }).get();
    const record = records.data[0];
    const backResult = await backRecord(record)
   
    // 更新账单
    const result = await db.collection('records').where({ _id: event.query._id }).update({
      // data 字段表示需新增的 JSON 数据
      data: {
        recordType: 0,
        gmtModified: +new Date
      }
    })

    // 查询最新数据信息
    const afterInfo = await getList({
      pageSize: event.query.pageSize,
      pageNo: event.query.pageNo,
      query: {
        openid: event.query.openid
      }
    });
    
    // 替换数据
    record.recordType = 0;
    afterInfo.data = [record];

    // 删除后修正fetchEnd
    afterInfo.fetchEnd = true;


    return {
      success: true,
      afterInfo: afterInfo,
    }
  } catch (e) {
    // 这里catch到的是该collection已经存在，从业务逻辑上来说是运行成功的，所以catch返回success给前端，避免工具在前端抛出异常
    return {
      success: false,
      message: e.message || '删除数据失败'
    };
  }
};