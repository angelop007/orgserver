'use strict';

const http        = require('http'),
	  url         = require('url'),
	  path        = require('path'),
	  fs          = require('fs'),
	  zlib        = require('zlib'),
	  cipher      = require('./cipher'),
	  session     = require('./session'),
	  // async       = require('async'),
	  json_config = require('./config.json'),
	  json_error  = require('./i18n/ser-error.json');

class server{
	//初始化
	constructor(){
		this.mvc = false;
		let object_this = this;
		this.http = http.createServer(function(_request,_response){
			if(_request.url=='/favicon.ico'){
				_response.end();
			}else{
				Object.assign(object_this,{json_error:json_error,request:_request,response:_response});
				object_this._configDNS();
				object_this._create();
			}
		});
	}
	//创建会话
	_create(){
		try{
			this._filterMimeType();
			this._filterFile();
			this._filterFolder();

			this.cipher  = new cipher(this.dnsConfig.crypto);
			this.session = new session({request:this.request,response:this.response,cipher:this.cipher});

			if(this.mvc&&'/'!=this.fileName&&-1!=this.dnsConfig.actionExtension.indexOf(this.fileExtension)){
				this._mvcAction();
			}else{
				this._defaultPage();
				this._accessFile();
			}
		}catch(err){
			this._error(err);
		}
	}
	//过滤请求文件类型
	_filterMimeType(){
		this.fileName      = decodeURIComponent(url.parse(this.request.url).pathname.toLocaleLowerCase());
		this.fileExtension = path.extname(this.fileName).toLocaleLowerCase().substr(1);
		this.fileMime      = this.dnsConfig.filterMime[this.fileExtension];
		if(undefined==this.fileMime){
			throw new Error(json_error.filterMime['0']);
		}
	}
	//过滤指定不可调用文件
	_filterFile(){
		if(undefined!=this.dnsConfig.filterFile.find(fileName=>fileName==this.fileName)){
			throw new Error(json_error.filterFile['0']+':'+this.fileName);
		}
	}
	//过滤指定不可调用目录
	_filterFolder(){
		if(undefined!=this.dnsConfig.filterFolder.find(folderName=>this.fileName.startsWith(folderName))){
			throw new Error(json_error.filterFolder['0']+':'+this.fileName);
		}
	}
	//设定默认页
	_defaultPage(){
		if('/'==this.fileName){
			let fun_dnsConfig = this.dnsConfig.defaultPage.entries(),
				getPage=function(_str_directory,_str_page){
				if(fs.existsSync(_str_directory+_str_page)){
					return _str_page;
				};
				return getPage(_str_directory,fun_dnsConfig.next().value[1]);
			}
			this.fileName      = getPage(this.directory,fun_dnsConfig.next().value[1]);
			this.fileExtension = path.extname(this.fileName).toLocaleLowerCase().substr(1);
			this.fileMime      = this.dnsConfig.filterMime[this.fileExtension];
			fun_dnsConfig      = null;
		}
		if(this.fileName.startsWith('/')){
			this.fileName = this.fileName.substr(1);
		}
	}
	//读取访问文件
	_accessFile(){
		if(this.dnsConfig.gzip.open){
			this._gzipFile();
		}else{
			this._readFile();
		}
	}
	//读取文件并输出
	_readFile(){
		let object_this = this;
		fs.readFile(this.directory + this.fileName,function(_err,_data){
			try{
				if(_err){
					throw new Error(json_error.filterFile['2']);
				}else{
					object_this.response.writeHead(200,{'Content-Type':object_this.fileMime,'Content-Length':_data.length,'Connection':'close'});
					object_this.response.write(_data,'utf8');
					object_this.response.end();
				}
			}catch(err){
				object_this._error(err);
			}
		});
	}
	//读取文件并以压缩方式输出
	_gzipFile(){
		if(this.dnsConfig.gzip.extension.find(ext=>this.fileName.endsWith(ext))){
			try{
				let stream_file = fs.createReadStream(this.directory + this.fileName),
				    array_ae    = this.request.headers['accept-encoding']||'';
				if(array_ae.match(/\bgzip\b/)){
					this.response.writeHead(200,'Ok',{'Content-Encoding':'gzip','Content-Type':this.fileMime});
					stream_file.pipe(zlib.createGzip()).pipe(this.response);
				}else if(array_ae.match(/\bdeflate\b/)){
					this.response.writeHead(200,'Ok',{'Content-Encoding':'deflate','Content-Type':this.fileMime});
					stream_file.pipe(zlib.createDeflate()).pipe(this.response);
				}else{
					this.response.writeHead(200,'Ok',{'Content-Type':this.fileMime});
					stream_file.pipe(this.response);
				}
				stream_file = array_ae = null;
			}catch(err){
				this._error(err);
			}
		}else{
			this._readFile();
		}
	}
	//配置服务器域名解析
	_configDNS(){
		this.directory = json_config.dns[this.request.headers.host.split(':')[0]]+'/';
		if(fs.existsSync(this.directory+'class/config/ser-config.json')){
			this.dnsConfig = require(this.directory+'class/config/ser-config.json');
		}else{
			this.dnsConfig = json_config;
		}
	}
	//返回错误页面
	_error(_err){
		console.log('--SerErrLog:   ',_err.stack);
		try{
			this.response.statusCode=302;
			this.response.setHeader('Location',this.dnsConfig.errorPage);
			this.response.end();
		}catch(err){
			this.writeText(json_error.system['0']);//跳转错误页面失败
		}
	}
	//页面跳转
	set sendRedirect(_str_fileName){
		try{
			this.response.writeHead(200,{'Content-Type':'text/html','Connection':'close'});
			this.response.write('<script>window.location.href="http://'+this.request.headers.host+'/'+_str_fileName+'"</script>','utf8');
			this.response.end();
		}catch(err){
			this._error(err);
		}
	}
	//输出文本
	writeText(_str_info){
		try{
			this.response.writeHead(200,{'Content-Type':'text/plain','Connection':'close'});
			this.response.write(_str_info,'utf8');
			this.response.end();
		}catch(err){
			this._error(err);
		}
	}
	//输出网页文件流
	writeHTML(_str_fileName){
		try{
			let stream_file = fs.createReadStream(this.directory+_str_fileName);
			this.response.writeHead(200,'Ok',{'Content-Encoding':'gzip','Content-Type':'text/html'});
			stream_file.pipe(zlib.createGzip()).pipe(this.response);
		}catch(err){
			this._error(err);
		}
	}
	//输出JSON
	writeJSON(_json_info){
		try{
			this.response.writeHead(200,{'Content-Type':'application/json','Connection':'close'});
			this.response.write(JSON.stringify(_json_info),'utf8');
			this.response.end();
		}catch(err){
			this._error(err);
		}
	}
	//输出JSONP
	writeJSONP(_json_info){
		try{
			this.response.writeHead(200,{'Content-Type':'application/x-javascript','Connection':'close'});
			this.response.write(_json_info,'utf8');
			this.response.end();
		}catch(err){
			this._error(err);
		}
	}
	//设置服务器端口并启动服务
	start(){
		this.http.listen(json_config.port);
		console.log(json_config.port);
	}
	//绑定MVC
	mvcAction(_action){
		this.mvc = true;
		this._mvcAction = _action;
	}
	/**
	 * 格式化时间
	 * @method dateformat
	 * @param {int} _int_timestamp 时间戳
	 * @param {string} [_string_format] 时间格式('yyyy-MM-dd HH:mm:ss.S')
	 * @return {string} 格式化后时间默认'2000-01-01 00:00:00.0'
	 * @example
	 * 	var string_date=pubFun.dateformat(new Date().getTime(),'yyyy-MM-dd HH:mm:ss.S');
	 *	console.log('out: ',string_date);
	 * 	log(string_date);
	 *
	 * 	var string_date=pubFun.dateformat($.now(),'yyyy-MM-dd HH:mm:ss.S');
	 *	console.log('out: ',string_date);
	 * 	log(string_date);
	 */
	dateformat(_int_timestamp,_string_format){
		_int_timestamp=new Date(_int_timestamp);
		let object_date={
			'M+':_int_timestamp.getMonth()+1,
			'd+':_int_timestamp.getDate(),
			'H+':_int_timestamp.getHours(),
			'm+':_int_timestamp.getMinutes(),
			's+':_int_timestamp.getSeconds(),
			'q+':Math.floor((_int_timestamp.getMonth()+3)/3),
			'S':_int_timestamp.getMilliseconds()
		};
		if(!_string_format){
			_string_format='yyyy-MM-dd HH:mm:ss.S';
		}
		if(/(y+)/.test(_string_format)){
			_string_format=_string_format.replace(
				RegExp.$1,
				(_int_timestamp.getFullYear()+'').substr(4-RegExp.$1.length)
			);
		}
		for(let key in object_date){
			if(new RegExp("("+key+")").test(_string_format)){
				_string_format=_string_format.replace(
					RegExp.$1,
					RegExp.$1.length==1?object_date[key]:('00'+object_date[key]).substr((''+object_date[key]).length)
				);
			}
		}
		_int_timestamp=object_date=null;
		return _string_format;
	}
}

module.exports=server;

/*const set_method = new Set(['init']);
class server{
	get [[...set_method][0]](){
		return '11';
	}
}

let s = new server();
console.log([...set_method][0]);
console.log(s[[...set_method][0]]);*/