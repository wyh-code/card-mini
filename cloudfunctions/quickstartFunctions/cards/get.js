const cloud = require('wx-server-sdk');
const { getCloudEnv } = require('../utils'); 
cloud.init({
  env: getCloudEnv()
});
const db = cloud.database();

// 查询账户
exports.main = async (event, context) => {
  try {
    const result = await db.collection('cards').aggregate()
      .match({
        ...event.query,
        recordType: 1
      })
      .sort({ //类似于orderBy
        gdp: -1,
      })
      .skip(0) //类似于skip
      .limit(1000) //类似于limit，不填默认是20，没有上限
      .end()
    return {
      success: true,
      data: result.list
    }
  } catch (e) {
    // 这里catch到的是该collection已经存在，从业务逻辑上来说是运行成功的，所以catch返回success给前端，避免工具在前端抛出异常
    return {
      success: false,
      message: e.message || '获取数据失败'
    };
  }
};