const cloud = require('wx-server-sdk');
const { getCloudEnv, formaterDate } = require('../utils'); 
const getDateInfo = require('./getDateInfo');
const getMonth = require('./getMonth').main;

cloud.init({
  env: getCloudEnv()
});
const db = cloud.database();

// 新增账户
exports.main = async (event, context) => {
  const limit = event.pageSize || 20;
  const skip = ((event.pageNo || 1) - 1) * limit;

  try{
    const result = await db.collection('records').where({
      ...event.query,
      recordType: 1
    })
    .field({             //显示哪些字段
      accountInfo: false,  
      openid: false,
      appid: false,
      // recordType: false
    })
    .orderBy('gmtCreate', 'desc')  //排序方式，降序排列
    .skip(skip)                 //跳过多少个记录（常用于分页），0表示这里不跳过
    .limit(limit)               //限制显示多少条记录，这里为10
    .get()                   //获取根据查询条件筛选后的集合数据  

    // 查询总条数
    const count = await db.collection("records").where({
      ...event.query,
      recordType: 1
    }).count();

    // 获取每日收支信息
    const dateInfo = { };
    const monthInfo = { };
    result.data.forEach(item => {
      const date = formaterDate(item.gmtCreate);
      dateInfo[date] = {};
      const month = date.split('-').slice(0, 2).join('-');
      monthInfo[month] = {};
    })
    
    await Promise.all(Object.keys(dateInfo).map(async date => {
      dateInfo[date] = await getDateInfo(event.query.openid, date);
    }))

    // 获取每月收支信息
    await Promise.all(Object.keys(monthInfo).map(async month => {
      monthInfo[month] = await getMonth({
        query: {
          openid: event.query.openid, 
          date: `${month}-${1}`
        }
      });
    }))
    Object.keys(monthInfo).forEach(month => {
      monthInfo[month] = monthInfo[month].data
    })
    
    return {
      success: true,
      data: result.data,
      dateInfo,
      monthInfo,
      count,
      fetchEnd: event.pageSize * event.pageNo >= count.total,
      pageSize: event.pageSize,
      pageNo: event.pageNo
    }
  } catch (e) {
    console.log(e, '==e==')
    // 这里catch到的是该collection已经存在，从业务逻辑上来说是运行成功的，所以catch返回success给前端，避免工具在前端抛出异常
    return {
      success: false,
      message: e.message || '获取数据失败'
    };
  }
};
