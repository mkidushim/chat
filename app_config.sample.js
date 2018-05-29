// config.js
const app_config = {
 app: {
  port: 4400,
  host: ``,
 },
 db: {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'mtm',
  debug: true
 },
 cert: __dirname+'/../files/certs/development_com.foi5.enterprise.MyTravelMedic.pem',
 cert_pass: 'zdfjfkweighkxljadfewgergjkdgxl',
 fileDir: 'https://mike.fusionofideas.com/mtmapi/files/users/',
 placeholderURL: 'assets/img/user_no_profileimage@2x.png',
 cert_prod:false
};

module.exports = app_config;