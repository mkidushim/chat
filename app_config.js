// config.js
const app_config = {
 app: {
  port: 4400,
  host: `fasttrackchat-env.jmxxwfx2em.us-west-2.elasticbeanstalk.com`,
 },
 db: {
  host: 'localhost',
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