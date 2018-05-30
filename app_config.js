// config.js
const app_config = {
 app: {
  port: process.env.PORT || 4400,
  host: `127.0.0.1`,
  // host: `fast-track-chat-dev.us-west-1.elasticbeanstalk.com`,
 },
 db: {
  host: '192.168.1.166',
  user: 'root',
  password: 'Monster.',
  database: 'mtm',
  debug: true
 },
 cert: __dirname+'/files/pat_cert.pem',
 cert_pass: 'zdfjfkweighkxljadfewgergjkdgxl',
 cert_topic:'com.foi5.enterprise.MyTravelMedic',
 fileDir: 'https://mtm-dev.fusionofideas.com/api/files/users/',
 placeholderURL: 'assets/img/user_no_profileimage@2x.png',
 cert_prod:true
};

module.exports = app_config;