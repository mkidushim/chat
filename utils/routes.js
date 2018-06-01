/**
* Real Time chatting app
* @author Shashank Tiwari
*/

'use strict';

const helper = require('./helper');
const path = require('path');
const crypto = require('crypto');
class Routes{

	constructor(app){

		this.app = app;
	}
	
	appRoutes(){
		this.app.get('*',(request,response) =>{
			response.sendFile(path.join(__dirname + 'index.html'));
			/*
			* OR one can define the template engine and use response.render();
			*/
		});		
	}

	routesConfig(){
		this.appRoutes();
	}
}
module.exports = Routes;