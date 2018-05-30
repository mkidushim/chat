#! /usr/bin/env node

/**
* My Travel Medic Fast Track Chat
**/
'use strict';

const express = require("express");
const http = require('http');
const https = require('https');
const fs = require('fs');
const socketio = require('socket.io');
const bodyParser = require('body-parser');
const MySQLEvents = require('mysql-events');

const socketEvents = require('./utils/socket'); 
const routes = require('./utils/routes'); 
const config = require('./utils/config'); 
// const options = {
//     key: fs.readFileSync('/etc/apache2/ssl/fusionofideas.key'),
//     cert: fs.readFileSync('/etc/apache2/ssl/fusionofideas.crt')
// };
//server config
var app_config = require('./app_config.js');
class Server{

    constructor(){
        this.port = app_config.app.port;
        this.host = app_config.app.host;
        
        this.app = express();
        this.http = http.Server(this.app);
        this.socket = socketio(this.http);

    }

    appConfig(){        
        this.app.use(
            bodyParser.json()
        );
        new config(this.app);
    }

    /* Including app Routes starts*/
    includeRoutes(){
        new routes(this.app).routesConfig();
        new socketEvents(this.socket).socketConfig();
    }
    /* Including app Routes ends*/  

    appExecute(){
        this.appConfig();
        this.includeRoutes();

        this.http.listen(process.env.PORT || this.port, this.host, () => {
            console.log(`Listening on http://${this.host}:${this.port}`);
        });
    }

}

const app = new Server();
app.appExecute();