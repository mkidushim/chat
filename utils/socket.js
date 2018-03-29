/**
* Real Time chatting app
* @author Shashank Tiwari
*/
'use strict';

const path = require('path');
var MySQLEvents = require('mysql-events');
const helper = require('./helper');
var moment = require('moment'); 


class Socket{

    constructor(socket){
        this.io = socket;
    }
    
    socketEvents(){

        this.io.on('connection', (socket) => {
            socket.on('chat-list-php', async (u) => {
                let chatListResponse = {};
                if(u.connected !== false){
                    const result = await helper.getChatListPHP(u.hid);
                    if(result.user != ''){
                        result.user.img = 'https://mike.fusionofideas.com/mtmapi/files/users/'+result.user.img; 
                    }else {
                        result.user.img = 'assets/img/user_no_profileimage@2x.png';
                    }
                    const conn = u.connected;
                    socket.broadcast.emit('test-php', {
                        error: result !== null ? false : true,
                        connected: conn,
                        user: result.user
                    });
                }else{
                    socket.broadcast.emit('test-php', u);
                }

            });
            /**
            * get the user's Chat chlist
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
                    // getChatList gets only patients assigned to that user
                    //getChatListAdmin gets all users regardless of user id
                    if(params.admin == '1'){
                        var result = await helper.getChatListAdmin(params);
                    }else{
                        var result = await helper.getChatList(params);
                    }
                    for(var i = 0; i<result.chatlist.length; i++){
                        if(result.chatlist[i].img != ''){
                            result.chatlist[i].img = 'https://mike.fusionofideas.com/mtmapi/files/users/'+result.chatlist[i].img; 
                        }else {
                            result.chatlist[i].img = 'assets/img/user_no_profileimage@2x.png';
                        }
                    }
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

                    // socket.broadcast.emit('chat-list-response', {
                    //     error: result !== null ? false : true,
                    //     singleUser: true,
                    //     chatList: result.userinfo
                    // });
                }
            });
            //update chat list status
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
                if (appt_id === '' && (typeof appt_id !== 'string' || typeof appt_id !== 'number')) {

                    chatListResponse.error = true;
                    chatListResponse.message = `appt_id does not exits.`;
                    
                    this.io.emit('chat-list-response',chatListResponse);
                }else{
                    if(auth.length == 0){
                        this.io.to(socket.id).emit('chat-list-update', {
                            error: true,
                            auth: true
                        });    
                    }else{
                        const result = await helper.updateApptStatus(status,user_id,appt_id,params.user,params.token,now,exp_d);
                        this.io.broadcast.emit('chat-list-update', {
                            error: result !== null ? false : true,
                            user: params,
                            auth: false
                        });
                    }
                }
            });
            /**
            * send the messages to the user
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
                    this.io.to(socket.id).emit(`add-message-response`, data); 
                }               
            });
            socket.on('add-message-php', async (data) => {
                let toSocketId = data.socket;
                this.io.to(toSocketId).emit(`add-message-response`, data);  
            });


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


            /**
            * sending the disconnected user to all socket users. 
            */
            socket.on('disconnect',async ()=>{
                const isLoggedOut = await helper.logoutUser(socket.id);
                // setTimeout(async ()=>{
                //     const isLoggedOut = await helper.isUserLoggedOut(socket.id);
                //     if (isLoggedOut && isLoggedOut !== null) {
                //         socket.broadcast.emit('chat-list-response', {
                //             error: false,
                //             userDisconnected: true,
                //             socketId: socket.id
                //         });
                //     }
                // },1000);
            });

        });

    }
    
    socketConfig(){

        this.io.use( async (socket, next) => {
            let userId = socket.request._query['userId'];
            let userSocketId = socket.id;          
            console.log(userSocketId);
            console.log(userId);
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