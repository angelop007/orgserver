'use strict';

const fs = require('fs');

class loginAct{
	constructor(_obj){
		if(_obj){
			_obj.response.writeHead(200,{'Content-Type':'text/plain','Connection':'close'});
			_obj.response.write(JSON.stringify(_obj.parameter),'utf8');
			_obj.response.end();
		}
	}
	test(){
		console.log('test:   ',this.parameter);
		let str_result = this.session.set('userinfo',this.parameter);
		if(str_result){
			return 'error.html';
		}
		return 'index.html';
	}
	file(){
		console.log('file:   ',this.parameter);
		//html page <input name="gfiles" type="file">
		let obj_file = this.parameter.find((_obj)=>_obj.name=='gfiles');
		fs.writeFile(
			this.directory+'update/img/'+new Date().getTime()+Math.round(Math.random()*1000)+'.'+obj_file.filename.split('.')[1],
			obj_file.buffer);
	    return {msg:'suc',id:'10001',result:{data:['1','2']}};
	}
	add(){
		console.log('add:   ',this.session.set('add',{name:'dd'}));
		//console.log('validat:   ',this.session.get('userinfo'));
		return {msg:'suc',id:'10001',result:{data:['1','2']}};
	}
	validat(){
		console.log('validat:   ',this.session.set('userinfo',{name:'tt'}));
		//console.log('validat:   ',this.session.get('userinfo'));
		return {msg:'suc',id:'10001',result:{data:['1','2']}};
	}
	get ss(){
		return 'ss'
	}
	get _msgFile(){
		return 'sys-login'
	}
}
module.exports=loginAct;