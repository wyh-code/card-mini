// components/not-found/index.js.js
Component({

  /**
   * 组件的属性列表
   */
  properties: {
    type: String,
    msg: String,
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    add(){
      if (!app.globalData.appInfo?.openid) {
        this.setData({
          errorMsg: '请先登录'
        });
      } else {
        let url = `../add/index?pageType=${type}${id ? `&id=${id}` : ''}`
        wx.navigateTo({
          url
        })
      }
    }
  }
})