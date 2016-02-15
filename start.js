'use strict';

const server=require('./server'),
	  orgmvc=require('./mvc');

let class_server = new server(),
	class_mvc = new orgmvc();

class_server.mvcAction(class_mvc.action);
class_server.start();
