const cloud = require('wx-server-sdk');
const { getCloudEnv } = require('../utils'); 
cloud.init({
  env: getCloudEnv()
});
const db = cloud.database();

// 新增账户
exports.main = async (event, context) => {
  try {
    const result = await db.collection('cards').where(event.query).update({
      // data 字段表示需新增的 JSON 数据
      data: {
        recordType: 0,
        gmtModified: +new Date
      }
    })

    // 账户删除后，批量修改收支记录的账户类型
    await db.collection('records').where({
      accountCode: event.query._id
    }).update({
      data: {
        recordAccountType: 0
      },
    });

    return {
      success: true,
      data: result.data
    }
  } catch (e) {
    // 这里catch到的是该collection已经存在，从业务逻辑上来说是运行成功的，所以catch返回success给前端，避免工具在前端抛出异常
    return {
      success: false,
      message: e.message || '删除数据失败'
    };
  }
};