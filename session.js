'use strict';

const str_sign    = '_|_',
	  str_keyword = '&#';
let map_cookies   = new Map(),
	map_sessions  = new Map(),
	request,response,cipher;

class session{
	//初始化页面cookie
	constructor(_object){
		request  = _object.request;
		response = _object.response;
		cipher   = _object.cipher;
		if(request.headers.cookie){
			if(0==this._getClientCookie()){
				this._setClientCookie();
			}
		}else{
			this._setClientCookie();
		}
		_object = null;
	}
	_setClientCookie(){
		let host   = request.headers.host,
			str_id = this._createClientCookie;
		if(!map_cookies.has(host)){
			map_cookies.set(host,new Map());
		}
		map_cookies.get(host).set(str_id,{'user':request.headers['user-agent'],'ip':this.ip});
		response.setHeader('Set-Cookie',['SID='+str_id+';path=/']);
		str_id = host = null;
	}
	get _createClientCookie(){
		let str_time = new Date().getTime()+'';
		return str_time.substring(str_time.length-6)+(Math.round(Math.random()*1000));
	}
	//获取客户端IP
	get ip(){
		let str_ip,str_forwardedIps = request.headers['x-forwarded-for'];
		if(str_forwardedIps){
		    str_ip = str_forwardedIps.split(',')[0];
		}
		str_forwardedIps = null;
		if(!str_ip){
		    str_ip = request.connection.remoteAddress||request.socket.remoteAddress||request.connection.socket.remoteAddress;
		}
		return str_ip;
	}
	_delClientCookie(){
		response.setHeader('Set-Cookie',['SID=;path=/;expires='+new Date(new Date().getTime() + -999 * 1000).toGMTString()]);
	}
	_getClientCookie(){
		let host = request.headers.host;
		if(!map_cookies.has(host)){
			return 0;
		}
		let cookie = request.headers.cookie;
		if(undefined==cookie){
			return 0;
		}
		cookie = cookie.substr(4);
		if(map_cookies.get(host).has(cookie)){
			return cookie;
		}
		return 0;
	}
	//获取session
	get(_str_name){
		let host = request.headers.host;
		if(!map_sessions.has(host)){
			return 0;
		}
		let cookie = request.headers.cookie.substr(4);
		if(/^[0-9]*$/.test(cookie)){
			return 0;
		}
		cookie = cipher.decode(cookie);
		let str_name = cipher.encode(cookie.split(str_sign)[1]+str_sign+cookie.split(str_sign)[0]),
			session  = map_sessions.get(host).get(str_name);
		host = cookie = str_name = null;
		if(session){
			if(_str_name){
				return session.list[_str_name];
			}else{
				return 1;
			}
		}
		return 0;
	}
	//设置session
	set(_str_name,_obj_value){
		let host = request.headers.host;
		if(!map_cookies.has(host)){
			return true;
		}
		let cookie = request.headers.cookie,str_name;
		if(undefined==cookie){
			return true;
		}
		cookie = cookie.substr(4);
		if(map_sessions.has(host)){
			if(!/^[0-9]*$/.test(cookie)){
				str_name = cipher.decode(cookie);
				str_name = cipher.encode(str_name.split(str_sign)[1]+str_sign+str_name.split(str_sign)[0]);
				if(map_sessions.get(host).has(str_name)){
					let session = map_sessions.get(host).get(str_name);
					session.list[_str_name]=_obj_value;
					str_name = _str_name = _obj_value = host = cookie = session = null;
					return false;
				}
			}
		}else{
			map_sessions.set(host,new Map());
			if(!/^[0-9]*$/.test(cookie)){
				cookie = this._createClientCookie;
			}
		}
		let str_id = cipher.encode(cookie+str_sign+str_keyword);
		str_name = cipher.encode(str_keyword+str_sign+cookie);		

		map_sessions.get(host).set(str_name,{cookie:cookie,ip:this.ip,list:{[_str_name]:_obj_value}});
		map_cookies.get(host).set(str_id,map_cookies.get(host).get(cookie));
		map_cookies.get(host).delete(cookie);
		response.setHeader('Set-Cookie',['SID='+str_id+';path=/']);
		_str_name = _obj_value = host = cookie = str_id = str_name = null;

		console.log('set_cookies:   ',map_cookies);
		console.log('set_sessions:   ',map_sessions);
		return false;
	}
}
module.exports=session;

//服务器如果没有配置的域名访问则服务器崩溃