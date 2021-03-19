/* eslint-disable no-undef */
'use strict';
var rp = require('request-promise');
const { sanitizeEntity } = require('strapi-utils');
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

const appid = 'wx45ae383d67024ad5';
const secret = '2ac5bda4afebe418ef7eda46cc723af4';


module.exports = {
  login: async (ctx) => { 
    const {code, userInfo} = ctx.request.body;
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;
    const res = await rp(url);
    const {openid, session_key}  = JSON.parse(res);
    let info = await strapi.query('user', 'users-permissions').findOne({ openid });
    if(info){
      info = await strapi.query('user', 'users-permissions').update({id: info.id},{...info, ...userInfo});
    }else{
      const pluginStore = await strapi.store({environment: '', type: 'plugin', name: 'users-permissions' });   
      const settings = await pluginStore.get({key: 'advanced' });
      const role = await strapi.query('role', 'users-permissions').findOne({ type: settings.default_role }, []);
      info = await strapi.query('user', 'users-permissions').create({...userInfo, role: role.id, openid, session_key, username: openid, email: '22@qq.com'});
    }
    const jwt = strapi.plugins['users-permissions'].services.jwt.issue({id: info.id})
    return {token:jwt, userInfo: sanitizeEntity(info.toJSON ? info.toJSON() : info, {
      model: strapi.query('user', 'users-permissions').model,
    }),};
  }
};
