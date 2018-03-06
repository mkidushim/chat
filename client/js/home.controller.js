/**
* Real Time chatting app
* @author Shashank Tiwari
*/

'user strict';

app.controller('homeController', function ($scope, $routeParams, $location, appService){
    
    const rp = $routeParams.userId.split('&');
    const hid = rp[1];
    const UserId = rp[0];
    $scope.data = {
        username: '',
        chatlist: [],
        selectedFriendId: null,
        selectedFriendName: null,
        messages: []
    };
    console.log(UserId);
    console.log(hid);
    appService.connectSocketServer(UserId);
    const params= {hid:hid,uid:UserId};
    console.log(params);
    appService.socketEmit(`chat-list`, params);
    appService.socketOn('test-php', (response) => {
        $scope.$apply( () =>{
            console.log(response);
            if (!response.error) {
                console.log(response);
                if (response.connected == true) {
                    /* 
                    * Removing duplicate user from chat list array
                    */
                    /* 
                    * Adding new online user into chat list array
                    */
                    console.log(response);
                    $scope.data.chatlist.push(response.user);
                } else {
                    /* 
                    * Removing a user from chat list, if user goes offline
                    */
                    $scope.data.chatlist = $scope.data.chatlist.filter(function (obj) {
                        return obj.id !== response.user.id;
                    });
                }
            } else {
                alert(`Faild to load Chat list`);
            }
        });
    });
    appService.socketOn('chat-list-response', (response) => {
        $scope.$apply( () =>{
            if (!response.error) {
                if (response.singleUser) {
                    /* 
                    * Removing duplicate user from chat list array
                    */
                    if ($scope.data.chatlist.length > 0) {
                        $scope.data.chatlist = $scope.data.chatlist.filter(function (obj) {
                            return obj.id !== response.chatList.id;
                        });
                    }
                    /* 
                    * Adding new online user into chat list array
                    */
                    // $scope.data.chatlist.push(response.chatList);
                } else if (response.userDisconnected) {
                    /* 
                    * Removing a user from chat list, if user goes offline
                    */
                    $scope.data.chatlist = $scope.data.chatlist.filter(function (obj) {
                        return obj.socketid !== response.socketId;
                    });
                } else {
                    /* 
                    * Updating entire chatlist if user logs in
                    */
                    $scope.data.chatlist = response.chatList;
                }
            } else {
                alert(`Faild to load Chat list`);
            }
        });
    });

    /*
    * This eventt will display the new incmoing message
    */
    appService.socketOn('add-message-response', (response) => {
        $scope.$apply( () => {
            if (response && response.fromUserId == $scope.data.selectedFriendId) {
                $scope.data.messages.push(response);
                appService.scrollToBottom();
            }
        });
    });       
    // .catch((error) => {
    //     console.log(error.message);
    //     $scope.$apply( () =>{
    //         $location.path(`/`);
    //     });
    // });
    //new function exit chatroom
    $scope.exitChat = () => {
        /*
        * Highlighting the selected user from the chat list
        */
        $scope.data.selectedFriendName = null;
        $scope.data.selectedFriendId = null;
    }

    $scope.selectFriendToChat = (friend) => {
        /*
        * Highlighting the selected user from the chat list
        */
        const friendId = friend.id;
        const apptId = friend.appt_id;
        const friendData = $scope.data.chatlist.filter((obj) => {
            return obj.id === friendId;
        });
        $scope.data.selectedFriendName = friendData[0]['username'];
        $scope.data.selectedFriendId = friendId;
        $scope.data.selectedApptId = apptId;
        /**
        * This HTTP call will fetch chat between two users
        */
        appService.getMessages(UserId, friendId, apptId).then( (response) => {
            $scope.$apply(() => {
                $scope.data.messages = response.messages;
            });
            appService.scrollToBottom();
        }).catch( (error) => {
            console.log(error);
            alert('Unexpected Error, Contact your Site Admin.');
        });
    }

    $scope.sendMessage = (event) => {

        if (event.keyCode === 13) {

            let toUserId = null;
            let toSocketId = null;

            /* Fetching the selected User from the chat list starts */
            let selectedFriendId = $scope.data.selectedFriendId;
            let selectedApptId = $scope.data.selectedApptId;
            if (selectedFriendId === null) {
                return null;
            }
            friendData = $scope.data.chatlist.filter((obj) => {
                return obj.id === selectedFriendId;
            });
            /* Fetching the selected User from the chat list ends */
            
            /* Emmiting socket event to server with Message, starts */
            if (friendData.length > 0) {
                console.log(selectedApptId);
                console.log(friendData);
                toUserId = friendData[0]['id'];         
                let messagePacket = {
                    message: document.querySelector('#message').value,
                    fromUserId: UserId,
                    toUserId: toUserId,
                    apptId: selectedApptId
                };
                $scope.data.messages.push(messagePacket);
                appService.socketEmit(`add-message`, messagePacket);
                appService.scrollToBottom();
                console.log('clear message');
                setTimeout(function() {
                    document.querySelector('#message').value = '';
                }, 200);
            }else {
                alert('Unexpected Error Occured,Please contact Admin');
            }
            /* Emmiting socket event to server with Message, ends */
        }
    }

    $scope.alignMessage = (sender) => {
        return sender == 'patient' ? true : false;
    }

    $scope.logout = () => {
        appService.socketEmit(`logout`, UserId);
        $location.path(`/`);
    }
});