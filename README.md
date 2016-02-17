Support Node JS 4.x, 5.x version

* javascript ES6 join syntax

* items can be configured independently,Not currently configured independently Port and DNS

  example configured independently:
  
    localhost/class/config/ser-config.json
    
* upload

  example upload:		
```javascript
$(function(){
	var fun_submit=function(){
		var form = $('form'),
				data = new FormData();
		form.find('[type="file"]').each(function(){
			for(var a=0,file;file=this.files[a];a++){
				data.append(this.name,file);
			}
		});
		$.each(form.serializeArray(),function(){
			data.append(this.name,$.trim(this.value));
		});
		console.log(data);
		pubFun.ajax({
    url:'login/file',
    data:data,
    ct:false,
    pd:false,
    suc:function(_data){
        if(undefined!=_data){
            if('err'==_data.msg){
                alert(_data.description);
            }else{
                alert(_data.description);
            }
        }else{
           console.log('success: ','upload error!');
        }
        console.log('success: ',_data);
    },err:function(_data){
      console.log('error: ',_data);
    }
    });
	};
	$('a').click(fun_submit);
});
```
	
* i18n

		"i18n":{
			"path":"class/config/i18n",
			"file":"message"
		}

	default configuration localhost/config/i18n/zh-cn/message.json
	
	example configured independently:
		localhost/config/i18n/zh-cn/sys-login.json
		
		localhost/act/sys/loginAct.js:
		
		get _msgFile(){
			return 'sys-login'
		}

* gzip

		"gzip":{
			"open":true,
			"extension":[
				"css","js","html","htm"
			]
		}

* crypto

		"crypto":{
			"key":"random",
			"iv":"2014050100000001",
			"input":"utf8",
			"output":"base64",
			"keyAlgorithm":"sha256",
			"textAlgorithm":"aes-256-cbc"
		}
	
* filterFile

		"filterFile":[
			"/__demoFile.js"
		]

* filterFolder

		"filterFolder":[
			"/class/","/__demoFolder/"
		]

* filterMime

		"filterMime":{
			"":"text/plain",
			"htm":"text/html",
			"html":"text/html",
			"ico":"image/x-icon",
			"js":"application/x-javascript",
			"swf":"application/x-shockwave-flash",
			"css":"text/css",
			"json":"text/json",
			"txt":"text/plain",
			"jpg":"image/jpeg",
			"gif":"image/gif",
			"png":"image/png",
			"woff":"application/x-font-woff",
			"woff2":"application/x-font-woff",
			"eot":"application/octet-stream",
			"ttf":"application/octet-stream",
			"svg":"image/svg+xml",
			"mp4":"video/mp4",
			"webm":"video/webm",
			"mp3":"audio/mpeg",
			"weba":"audio/webm",
			"m4a":"audio/mpeg",
			"ogx":"application/ogg",
			"oga":"audio/ogg",
			"spx":"audio/ogg",
			"ogg":"audio/ogg",
			"ogv":"video/ogg",
			"wav":"audio/wav",
			"apk":"application/vnd.android.package-archive",
			"zip":"application/zip",
			"manifest":"text/cache-manifest"
		}

* DNS
	
		"dns":{
			"localhost":"E:/work/server/localhost",
			"127.0.0.1":"E:/work/server/orgui",
			"www.example.com":"E:/work/server/www.example.com",
			"example.com":"E:/work/server/www.example.com",
			"xxx.example.com":"E:/work/server/xxx.example.com"
		}

* action and interceptor

	default configuration  localhost/config/action.json
	
	example action:
	
		"action":{
			"login":"/class/act/sys/loginAct"
		}
	
	example interceptor:
	
		"interceptor":{
			"validatLoginIcr":{"path":"/class/icr/wholeIcr1"},
			"validatTestIcr":{"path":"/class/icr/wholeIcr2","action":["login"]}
		}