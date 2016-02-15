'use strict';
/*
公用方法操作类
*/
const crypto = require('crypto');//加载 crypto 支持加密
let obj_config;

class cipher{
	constructor(_obj_config){
		obj_config = _obj_config;
	}
	//加密
	encode(_str_text){
		let obj_createKey = crypto.createHash(obj_config.keyAlgorithm).update('__'+obj_config.key+'_cn__key').digest();
		let obj_encipher  = crypto.createCipheriv(obj_config.textAlgorithm,obj_createKey,obj_config.iv);
		obj_createKey     = null;
		return obj_encipher.update(_str_text,obj_config.input,obj_config.output) + obj_encipher.final(obj_config.output);
	}
	//解密
	decode(_str_text){
		let obj_createKey = crypto.createHash(obj_config.keyAlgorithm).update('__'+obj_config.key+'_cn__key').digest();
		let obj_decipher  = crypto.createDecipheriv(obj_config.textAlgorithm,obj_createKey,obj_config.iv);
		obj_createKey     = null;
		return obj_decipher.update(_str_text,obj_config.output,obj_config.input) + obj_decipher.final(obj_config.input);
	}
}
module.exports=cipher;