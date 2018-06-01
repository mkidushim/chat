// config.js
const app_config = {
 app: {
  port: process.env.PORT || 4400,
  host: `127.0.0.1`,
  // host: `fast-track-chat-dev.us-west-1.elasticbeanstalk.com`,
 },
 db: {
  host: 'mtm.cc0mfnozno0u.us-west-1.rds.amazonaws.com:3306',
  user: 'fusion',
  password: 'Foidtt75',
  database: 'mtm_dev',
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