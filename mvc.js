'use strict';

const url = require('url');

class mvc{
	action(){
		this.language = this.request.headers['accept-language'].split(';')[0].split(',')[0].toLocaleLowerCase();
		let class_mvc = new mvc();
		if(class_mvc._interceptorName(this)){
			return;
		}
		class_mvc._actionName      = this;//验证接口并获取接口信息
		class_mvc._validateVisit   = this;
	}
	_interceptorName(_this){
		_this.json_action  = require(_this.directory + '/class/config/action.json');
		if(_this.json_action.interceptor){
			for(let interceptorName in _this.json_action.interceptor){
				if(!_this.json_action.interceptor[interceptorName].action){
					let interceptor = require(_this.directory+_this.json_action.interceptor[interceptorName].path);
					let class_interceptor = new interceptor();
					let object_info = class_interceptor.execute();
					if(!object_info||true===object_info){
						break;
					}
					this._out(_this,class_interceptor,object_info);
					return true;
				}
			}
		}
	}
	//验证请求类型
	set _validateVisit(_this){
		if(undefined==_this.request.headers.origin&&undefined==_this.request.headers['x-requested-with']){
			//直接访问action文件
			this._handleVisit(_this,this._getParameter(url.parse(_this.request.url,true).query));
		}else if('multipart/form-data'==_this.request.headers['content-type'].split(';')[0]){
			//ajax文件提交访问action文件
			this._sortingParameter = _this;//分拣上传参数
		}else if('application/x-www-form-urlencoded'==_this.request.headers['content-type'].split(';')[0]){
			//ajax文本提交访问action文件
			let object_this = this;
			_this.request.on('data',function(_data){
				object_this._handleVisit(_this,object_this._getParameter(url.parse(_this.request.url,true).query,_data));
			});
		}else{
			throw new Error(_this.json_error.action['0']);
		}
	}
	//处理访问至相应控制器
	_handleVisit(_this,_object_parameter){
		try{
			let action           = require(_this.directory+_this.json_action.action[_this.actionName]),
				object_parameter = {
					request   : _this.request,
					response  : _this.response,
					session   : _this.session,
					parameter : _object_parameter
				};
			//拦截器
			if(_this.json_action.interceptor){
				for(let interceptorName in _this.json_action.interceptor){
					if(_this.json_action.interceptor[interceptorName].action){
						if(undefined!=_this.json_action.interceptor[interceptorName].action.find(name=>name==_this.actionName)){
							let interceptor = require(_this.directory+_this.json_action.interceptor[interceptorName].path);
							let class_interceptor = new interceptor();
							Object.assign(class_interceptor,object_parameter);
							let object_info = class_interceptor.execute();
							if(!object_info||true===object_info){
								break;
							}
							this._out(_this,class_interceptor,object_info);
							return;
						}
					}
				}
			}
			//请求控制器
			if(_this.actionMethod){
				let class_action = new action();
				Object.assign(class_action,object_parameter);
				this._out(_this,class_action,class_action[_this.actionMethod]());
			}else{
				new action(object_parameter);
			}
		}catch(err){
			_this._error(err);
		}
	}
	_out(_this,_class_action,_object_info){
		if('string'==typeof _object_info){
			_this.sendRedirect = _object_info;
		}else{
			let json_msg     = require(_this.directory+_this.dnsConfig.i18n.path+'/'+_this.language+'/'+(_class_action._msgFile||_this.dnsConfig.i18n.file)+'.json'),
			    json_info    = {msg:_object_info.msg,description:json_msg[_object_info.msg][_object_info.id],result:_object_info.result},
				str_callback = undefined;
			if(_class_action.parameter){
				str_callback = _class_action.parameter.find(result=>result.name=='callback');
			}
			if(str_callback){
				_this.writeJSONP(str_callback.value+'('+JSON.stringify(json_info)+')');
			}else{
				_this.writeJSON(json_info);
			}
			str_callback = json_info = json_msg = null;
		}
	}
	//分拣上传参数
	set _sortingParameter(_this){
		let array_file   = [],	  //文件数据
			int_enter    = 0,	  //行数
			array_fileName = [],
			array_filePath = [],
			array_fileData = [],
			array_textName = [],
			array_textData = [],
			bool_start   = false, //开始上传标识[true:开始上传,false:停止上传]
			bool_end     = false,
			int_tagMark  = 0,     //标签类型标识[0:文本,1:文件]
			int_start    = 0;
		_this.request.on('data',function(_data){
			for(let i=0;i<_data.length;i++){
		 		if(13==_data[i] && 10==_data[i+1]){
		 			if(13==_data[i+2] && 10==_data[i+3]){//数据断行
						bool_start = true;
						let str_fileName    = new Buffer(array_file).toString();
						let object_fileName = str_fileName.match(/filename=".*"/g);
						if(object_fileName){//文件
		                	int_tagMark=1;
		                	array_fileName[array_fileName.length] = str_fileName.match(/name=".*"/g)[0].split('"')[1];
		                	array_filePath[array_filePath.length] = object_fileName[0].split('"')[1];
		                }else{//文本
		                	int_tagMark=0;
		                	array_textName[array_textName.length] = str_fileName.match(/name=".*"/g)[0].split('"')[1];
		                }
		 				continue;
		 			}
		            if(bool_end){//数据结束
		            	switch(int_tagMark){
		            		case 0:
		            			array_textData[array_textData.length] = _data.slice(int_start,i).toString();
		            			break;
		            		case 1:
		            			array_fileData[array_fileData.length] = _data.slice(int_start,i);
		            			break;
		            		default:break;
		            	}
		            	bool_end   = false;
						array_file = [_data[i]];
		            }
		            if(bool_start){//数据开始
		            	int_start = i+2;
		            	array_file = [];
		            	bool_end   = true;
		            	bool_start = false;
		            }
		            int_enter++;
		        }
		        array_file.push(_data[i]);
			}
		});
		let object_this = this;
		_this.request.on('end',function(_data){
			let object_parameter = [];
			array_textName.map(function(_value,_index){
				object_parameter.push({name:_value,value:array_textData[_index]});
			});
			array_fileName.map(function(_value,_index){
				object_parameter.push({name:_value,buffer:array_fileData[_index],filename:array_filePath[_index]});
			});
			object_this._handleVisit(_this,object_this._getParameter(url.parse(_this.request.url,true).query).concat(object_parameter));
		});
	}
	//验证接口并获取接口信息
	set _actionName(_this){
		let array_fileInfo = _this.fileName.substr(1).split('/'),
			array_fileName = array_fileInfo[0].split('.');
		_this.actionName   = '';

		if(1==array_fileName.length){
			_this.actionName = array_fileName[0];
		}else{
			for(let i=0,_str_fileName;_str_fileName=array_fileName[i];i++){
				if(i==array_fileName.length-1){break;}
				_this.actionName += _this.fileExtension == _str_fileName?('.'+_str_fileName):_str_fileName;
			}
		}
		array_fileName = null;
		if(undefined==_this.json_action.action[_this.actionName]){
			throw new Error(_this.json_error.action['0']);
		}
		_this.actionMethod = array_fileInfo[1];
	}
	//buffer转hashmap
	_getParameter(_object_param,_buffer){
		let array_param = [];
		for(let key of Object.keys(_object_param)){
			array_param.push({name:key,value:_object_param[key]});
		}
		_object_param = null;
		if(_buffer){
			_buffer = _buffer.toString().split('&');
			let temp;
			for(let i=0,temp;temp=_buffer[i];i++){
				temp = temp.split('=');
				array_param.push({name:temp[0],value:temp[1]});
			}
			temp = _buffer = null;
		}
		return array_param;
	}
}
module.exports=mvc;