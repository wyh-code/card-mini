const getOpenId = require('./getOpenId/index');

const cardAdd = require('./cards/add');
const cardGet = require('./cards/get');
const cardUpdate = require('./cards/update');
const cardRemove = require('./cards/remove');

const recordAdd = require('./record/add');
const recordRemove = require('./record/remove');
const recordUpdate = require('./record/update');
const recordGetList = require('./record/getList');
const recordGetMonth = require('./record/getMonth');


// 云函数入口函数
exports.main = async (event, context) => {
  switch (event.type) {
    case 'getOpenId':
      return await getOpenId.main(event, context);
    case 'cardAdd': 
      return await cardAdd.main(event, context);
    case 'cardGet': 
      return await cardGet.main(event, context);
    case 'cardUpdate': 
      return await cardUpdate.main(event, context);
    case 'cardRemove': 
      return await cardRemove.main(event, context);
    case 'recordAdd': 
      return await recordAdd.main(event, context);
    case 'recordRemove': 
      return await recordRemove.main(event, context);
    case 'recordUpdate': 
      return await recordUpdate.main(event, context);
    case 'recordGetList': 
      return await recordGetList.main(event, context);
    case 'recordGetMonth': 
      return await recordGetMonth.main(event, context);
  }
};
