const cloud = require('wx-server-sdk');
const { getCloudEnv } = require('../utils'); 
cloud.init({
  env: getCloudEnv()
});
const db = cloud.database();

// 新增账户
exports.main = async (event, context) => {
  const time = +new Date;
  try {
    await db.collection('cards').add({
      // data 字段表示需新增的 JSON 数据
      data: {
        ...event.data,
        recordType: 1,
        gmtCreate: time,
        gmtModified: time
      }
    });
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