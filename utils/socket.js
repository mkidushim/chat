/**
* Real Time chatting app
* @author Shashank Tiwari
*/
'use strict';

const path = require('path');
var MySQLEvents = require('mysql-events');
const helper = require('./helper');
var moment = require('moment'); 
var apn = require('apn');
var app_config = require('../app_config.js');


class Socket{

	constructor(socket){
		this.io = socket;
		this.rooms = [];
	}
	
	socketEvents(){
		this.io.on('connection', (socket) => {
			/**
			* add patient from register_ft_appt.php or update_ft_appt.php (changes appt status) 
			*/
			socket.on('chat-list-php', async (u) => {
				let chatListResponse = {};
				if(u.connected !== false){
					if(u.img != ''){
						u.img = app_config.fileDir+u.img; 
					}else {
						u.img = app_config.placeholderURL;
					}
					const conn = u.connected;
					u.count = await helper.getMessageCount(u.appt_id);
					if(u.user_id != '-1'){
						u.sender_name = await helper.getName(u.user_id);	
					}
					if(u.status == 'arrived'){
						var no_res = await helper.apptArrived(u.appt_id);
					}
					if(u.status == 'pending'){
							var options = {
								cert: app_config.cert,
								key:app_config.cert,
								passphrase: app_config.cert_pass,
								production: app_config.cert_prod
							};
		 					const push = await helper.getTokens(u.id);
							var provider = new apn.Provider(options);
							console.log(push);
							for(var i = 0; i<=push.length-1; i++){
								var note = new apn.Notification();
								var token = push[i]['token'];
								note.badge = 0;
								note.sound = "default";
								note.setContentAvailable(1);
								note.aps.customPayload = {'apnType': '1','apptID':u.appt_id,'message_id':u.msg_id};
								note.alert = {"title":'',"body":u.msg};
								note.topic = "com.foi5.enterprise.MyTravelMedic";
								provider.send(note, token).then( (response) => {
									console.log(response.sent)
									console.log(response.failed);
								});
							}
							provider.shutdown();
					}
					if((u.status == 'cancelled' || u.status == 'arrived') && u.user_id == '-1'){
						socket.broadcast.to('hospital'+u.hid).emit('test-php', {
							error:false,
							connected: conn,
							user: u
						});
					}else if(u.status == 'arrived' && u.user_id != '-1'){
						if(u.hospital_admin != '1'){
							socket.broadcast.to('hospital_admin'+u.hid).emit('test-php', {
								error:false,
								connected: conn,
								user: u
							});
						}
						socket.broadcast.to(u.user_id).emit('test-php', {
							error:false,
							connected: conn,
							user: u
						});
						console.log(u.market_id)
						socket.broadcast.to('market'+u.market_id).emit('test-php', {
							error:false,
							connected: conn,
							user: u
						});
					}else{
						socket.broadcast.to('hospital'+u.hid).emit('test-php', {
							error:false,
							connected: conn,
							user: u
						});
					}
				}

			});
			/**
			* get chat list for hospital user 
			*/
			socket.on('chat-list', async (params) => {
				let chatListResponse = {};
				const userId = params.uid;
				if (userId === '' && (typeof userId !== 'string' || typeof userId !== 'number')) {

					chatListResponse.error = true;
					chatListResponse.message = `User does not exits.`;
					
					this.io.emit('chat-list-response',chatListResponse);
				}else{
					const now = moment().format('YYYY-MM-DD HH:mm:ss');
					var exp = moment().add(12,'hours').valueOf();
					exp = moment(exp).format('YYYY-MM-DD HH:mm:ss');
					params.exp_d = exp;
					params.now = now;
					console.log(params.admin);
					if(params.admin == '1'){
						var room_str = 'hospital_admin'+params.hid;
						socket.join(room_str);
						var result = await helper.getChatListAdmin(params);
					}else if(params.market == '1'){
						var hospitals = params.hid.split(',');
						console.log(hospitals);
						socket.join('market'+params.market_id);
						for(var i = 0; i<=hospitals.length;i++){
							var room_str = 'hospital'+hospitals[i];
							socket.join(room_str);
						}
						var result = await helper.getChatListMarket(params,hospitals);
					}else{
						var result = await helper.getChatList(params);
					}
					for(var i = 0; i<result.chatlist.length; i++){
						if(result.chatlist[i].img != ''){
							result.chatlist[i].img = app_config.fileDir+result.chatlist[i].img; 
						}else {
							result.chatlist[i].img = app_config.placeholderURL;
						}
						result.chatlist[i].count = await helper.getMessageCount(result.chatlist[i].appt_id);
						if(result.chatlist[i].user_id != '-1'){
							result.chatlist[i].sender_name = await helper.getName(result.chatlist[i].user_id);	
						}
						if(result.chatlist[i].hospital_id != '-1'){
							result.chatlist[i].hospital_name = await helper.getHospitalName(result.chatlist[i].hospital_id);	
							var room_str = 'hospital'+result.chatlist[i].hospital_id;
							socket.join(room_str);
						}
					}
					if(params.market != '1'){
						var room_str = 'hospital'+result.userinfo.hospital_id;
						socket.join(room_str);
					}
					socket.join(userId);
					if(result.auth.length == 0){
						this.io.to(socket.id).emit('chat-list-response', {
							error: true,
							auth: true,
							chatList: result.chatlist
						});
					}else{
						this.io.to(socket.id).emit('chat-list-response', {
							error: result !== null ? false : true,
							auth: false,
							chatList: result.chatlist
						});
					}
				}
			});
			/**
			* join appt room triggered when hospital user clicks on a patient
			*/
			socket.on('join-room',async (pkg)=>{
				var rooms = this.rooms;
				for(var i=0; i<= rooms.length-1; i++){
					var r = rooms[i];
					socket.leave(r);
					var ix = this.rooms.indexOf(r);
					this.rooms.splice(ix, 1);
				}
				this.rooms.push('appt_id|'+pkg.appt_id);
				socket.join('appt_id|'+pkg.appt_id);
			});
			socket.on('eta-update',async(e)=>{
				this.io.to('hospital'+e.hospital_id).emit('update-eta', {
					error: false,
					info: e,
					auth: false
				});
			});
			/**
			* update patient status on the front end
			*/
			socket.on('chat-list-status', async (params) => {

			  let chatListResponse = {};
			  const appt_id = params.appt_id;
			  const user_id = params.user_id;
			  const status = params.status;
			  const now = moment().format('YYYY-MM-DD HH:mm:ss');
				var exp = moment().add(12,'hours').valueOf();
				const exp_d = moment(exp).format('YYYY-MM-DD HH:mm:ss');
				const tremove = await helper.tokenRemove(now);
				const auth = await helper.userAuth(params.user,params.token);
				const tupdate = await helper.tokenUpdate(exp_d,params.user,params.token);
				if(user_id != '-1'){
					params.user_name = await helper.getName(user_id);	
				}
				params.eta = await helper.getEta(appt_id);
				if (appt_id === '' && (typeof appt_id !== 'string' || typeof appt_id !== 'number')) {

					chatListResponse.error = true;
					chatListResponse.message = `appt_id does not exits.`;
					
					this.io.to(socket.id).emit('chat-list-response',chatListResponse);
				}else{
					if(auth.length == 0){
						this.io.to(socket.id).emit('chat-list-update', {
							error: true,
							auth: true
						});    
					}else{
						var rs = null;
						if(status == 'end_session'){
							// arrived functonality not needed from chat anymore
							var rs = await helper.apptUpdate(status,appt_id);
							var options = {
								cert: app_config.cert,
								key:app_config.cert,
								passphrase: app_config.cert_pass,
								production: app_config.cert_prod
							};
		 					const push = await helper.getTokens(params.patient_id);
							var provider = new apn.Provider(options);
							for(var i = 0; i<=push.length-1; i++){
								var note = new apn.Notification();
								var token = push[i]['token'];
								note.badge = 0;
								note.sound = "default";
								note.setContentAvailable(1);
								note.aps.customPayload = {'apnType': '2','apptID':appt_id,'status':'end_session'};
								note.alert = {"title":'',"body":'The Hospital has ended your session.'};
								note.topic = "com.foi5.enterprise.MyTravelMedic";
								provider.send(note, token).then( (response) => {
									console.log(response.sent)
									console.log(response.failed);
								});
							}
							provider.shutdown();
						}else if (status == 'in_transit'){
							var rs = await helper.updateApptStatus(status,user_id,appt_id,params.user,params.token,now,exp_d);
						}else{
							var rs = await helper.apptUpdate(status,appt_id);
							if(status == 'arrived'){
								var no_res = await helper.apptArrived(appt_id);
							}
						}
						this.io.to('hospital'+params.hospital_id).emit('chat-list-update', {
							error: rs !== null ? false : true,
							user: params,
							auth: false
						});
						// if((status == 'cancelled' && user_id == '-1') || status == 'in_transit'){
						// }else if(status == 'arrived'){
						// 	var str = 'hospital_admin'+params.hospital_id;
						// 	this.io.to(str).emit('chat-list-update', {
						// 		error: result !== null ? false : true,
						// 		user: params,
						// 		auth: false
						// 	});
						// 	this.io.to(user_id).emit('chat-list-update', {
						// 		error: result !== null ? false : true,
						// 		user: params,
						// 		auth: false
						// 	});
						// }else if(status == 'cancelled' && user_id != '-1'){
						// 	this.io.to(user_id).emit('chat-list-update', {
						// 		error: result !== null ? false : true,
						// 		user: params,
						// 		auth: false
						// 	});
						// }
					}
				}
			});
			/**
			* send the messages to the patient app and push notification
			*/
			socket.on('add-message', async (data) => {
				
				if (data.message === '') {
					
					this.io.to(socket.id).emit(`add-message-response`,`Message cant be empty`); 

				}else if(data.fromUserId === ''){
					
					this.io.to(socket.id).emit(`add-message-response`,`Unexpected error, Login again.`); 

				}else if(data.toUserId === ''){
					
					this.io.to(socket.id).emit(`add-message-response`,`Select a user to chat.`); 

				}else{                    
					let toSocketId = data.toSocketId;
					const now = moment().format('YYYY-MM-DD HH:mm:ss');
					var exp = moment().add(12,'hours').valueOf();
					const exp_d = moment(exp).format('YYYY-MM-DD HH:mm:ss');
					const tremove = await helper.tokenRemove(now);
					const auth = await helper.userAuth(data.user,data.token);
					const tupdate = await helper.tokenUpdate(exp_d,data.user,data.token);
					data.sender = 'ft_er';
					data.auth = false;
					if(auth.length == 0){
						data.auth = true;
					}
					const sqlResult = await helper.insertMessages(data);
					const push = await helper.getTokens(data.toUserId);
					var options = {
						cert: app_config.cert,
						key:app_config.cert,
						passphrase: app_config.cert_pass,
						production: app_config.cert_prod
					};
 
					var provider = new apn.Provider(options);
					var sendFailed = true;
					for(var i = 0; i<=push.length-1; i++){
						var note = new apn.Notification();
						var token = push[i]['token'];
						note.badge = 0;
						note.sound = "default";
						note.setContentAvailable(1);
						note.aps.customPayload = {'apnType': '1','apptID':data.apptId,'message_id':sqlResult.insertId};
						note.alert = {"title":'',"body":data.message};
						note.topic = "com.foi5.enterprise.MyTravelMedic";
						provider.send(note, token).then( (response) => {
							console.log(response.sent)
							console.log(response.failed);
						});
					}
					this.io.to('appt_id|'+data.apptId).emit(`add-message-response`, data);
					provider.shutdown();
				}
			});
			 /**
			* add message from patient app 
			*/
			socket.on('add-message-php', async (data) => {
				let toSocketId = data.apptId;
				if(data.uid == '-1'){
					this.io.to('hospital'+data.hid).emit(`add-message-response`, data);
				}else{

					//Why is it sending two messages to admin if they are assigned
					this.io.to(data.uid).emit(`add-message-response`, data);  	
					this.io.to('market'+data.market_id).emit(`add-message-response`, data);
					if(data.admin != '1'){
						this.io.to('hospital_admin'+data.hid).emit(`add-message-response`, data);  
					}
				}
			});

			 /**
			* mark messages read for this appt 
			*/
			socket.on('message-read', async (data) => {
				await helper.messageRead(data.aid);
			});
			/**
			* update eta 
			*/
			// socket.on('update-eta', async (data) => {
			// 	this.io.to('')
			// });

			/**
			* Logout the user
			*/
			socket.on('logout', async () => {
				const isLoggedOut = await helper.logoutUser(socket.id);
				this.io.to(socket.id).emit('logout-response',{
					error : false
				});
				socket.disconnect();
			});

		});

	}
	
	socketConfig(){
		this.io.use( async (socket, next) => {
			var userId = socket.request._query['userId'];
			let userSocketId = socket.id;          
			const response = await helper.addSocketId( userId, userSocketId);
			if(response &&  response !== null){
				next();
			}else{
				console.error(`Socket connection failed, for  user Id ${userId}.`);
			}
		});

		this.socketEvents();
	}
}
module.exports = Socket;