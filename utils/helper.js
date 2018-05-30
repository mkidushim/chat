/**
* Real Time chatting app
* @author Shashank Tiwari
*/

'doctor strict';
const DB = require('./db');

class Helper{
	
	constructor(app){
		this.db = DB;
	}
	async getHospitalName(id){
		try {
			const result = await this.db.query("SELECT name FROM hospital WHERE id = ?", [id]);
			if(result !== null){
				return result[0]['name'];
			}else{
				return null;
			}
		} catch (error) {
			return null;
		}
	}
	async getEta(id){
		try {
			const result = await this.db.query("SELECT eta FROM ft_appt WHERE id = ?", [id]);
			if(result !== null){
				return result[0]['eta'];
			}else{
				return null;
			}
		} catch (error) {
			return null;
		}
	}
	async getName(id){
		try {
			const result = await this.db.query("SELECT name FROM user WHERE id = ?", [id]);
			if(result !== null){
				return result[0]['name'];
			}else{
				return null;
			}
		} catch (error) {
			return null;
		}
	}
	//set messages for appt id to read
	async messageRead(aid){
		try {
			return await this.db.query("UPDATE ft_chat SET `read`=1 WHERE appt_id = ? AND sender='patient'", [aid]);
		} catch (error) {
			console.log(error);
			return null;
		}
	}
	//get apn tokens for push notifs
	async getTokens (uid){
		try {
			return await this.db.query(`SELECT DISTINCT token FROM apn_token WHERE user_id = ? AND user_type = 'patient'`, [uid]);
		} catch (error) {
			return null;
		}
	}
	async getPatient(appt_id){
		try {
			return await this.db.query(`SELECT img, last_name, first_name,fa.id as appt_id,status,eta  FROM ft_appt fa JOIN patient p ON p.id = fa.patient_id WHERE fa.id= ?`, [appt_id]);
		} catch (error) {
			return null;
		}
	}
	async userSessionCheck(userId){
		try {
			const result = await this.db.query(`SELECT online,username FROM ft_appt fa JOIN user d ON d.id = fa.hospital_id WHERE fa.id = ?`, [userId]);
			if(result !== null){
				return result[0]['username'];
			}else{
				return null;
			}
		} catch (error) {
			return null;
		}
	}
	async addSocketId(userId, userSocketId){
		try {
			return await this.db.query(`UPDATE user SET socketid = ?, online= ? WHERE id = ?`, [userSocketId,'2',userId]);
		} catch (error) {
			console.log(error);
			return null;
		}
	}
	async isUserLoggedOut(userSocketId){
		try {
			return await this.db.query(`SELECT online FROM user WHERE socketid = ?`, [userSocketId]);
		} catch (error) {
			return null;
		}
	}
	async logoutUser(userSocketId){
		return await this.db.query(`UPDATE user SET socketid = ?, online= ? WHERE socketid = ?`, ['','1',userSocketId]);
	}
	async tokenRemove(now){
		try {
			return await this.db.query(
				"DELETE FROM `session` WHERE `expiration`<=?",
				[now]
			);
		} catch (error) {
			console.warn(error);
			return null;
		}		
	}
	async tokenUpdate(exp,user,token){
		try {
			return await this.db.query(
				"UPDATE `session` SET `expiration` = ? WHERE `token` = ? AND `user` = ? AND `type` = 'portal'",
				[exp,token,user]
			);
		} catch (error) {
			console.warn(error);
			return null;
		}		
	}
	async userAuth(user,token){
		try {
			return await this.db.query(`SELECT id FROM session WHERE user=? AND token=? AND type = 'portal'`, [user,token]);
		} catch (error) {
			console.warn(error);
			return null;
		}
	}
	//get chatlist for hospital admin
	getChatListAdmin(params){
		try {
			return Promise.all([
				this.db.query(`SELECT id,email, username, name,hospital_id FROM user WHERE id = ?`, [params.uid]),
				this.db.query(`SELECT p.id,arrived,img,email as username, date, last_name, first_name,fa.id as appt_id,status,user_id,eta,fa.updated_at FROM ft_appt fa JOIN patient p ON p.id = fa.patient_id WHERE fa.online = ? AND hospital_id = ? ORDER BY fa.id DESC`, ['2',params.hid]),
				this.db.query(`DELETE FROM session WHERE expiration<=?`, [params.now]),
				this.db.query(`SELECT id FROM session WHERE user=? AND token=? AND type = 'portal'`, [params.user,params.token]),
				this.db.query(`UPDATE session SET expiration = ? WHERE user = ? AND token = ? AND type = 'portal'`, [params.exp_d,params.user,params.token]),
			]).then( (response) => {
				return {
					userinfo : response[0].length > 0 ? response[0][0] : response[0],
					chatlist : response[1],
					deleteAuth : response[2],
					auth : response[3],
					updateAuth : response[4]
				};
			}).catch( (error) => {
				console.warn(error);
				return (null);
			});
		} catch (error) {
			console.warn(error);
			return null;
		}
	}
	getChatListMarket(params,hid){
		try {
			return Promise.all([
				this.db.query(`SELECT id,email, username, name,hospital_id FROM user WHERE id = ?`, [params.uid]),
				this.db.query(`SELECT p.id,arrived,img,email as username, date, last_name, first_name,fa.id as appt_id,status,user_id,eta,fa.updated_at,hospital_id FROM ft_appt fa JOIN patient p ON p.id = fa.patient_id WHERE fa.online = ? AND hospital_id IN (?) ORDER BY fa.id DESC`, ['2',hid]),
				this.db.query(`DELETE FROM session WHERE expiration<=?`, [params.now]),
				this.db.query(`SELECT id FROM session WHERE user=? AND token=? AND type = 'portal'`, [params.user,params.token]),
				this.db.query(`UPDATE session SET expiration = ? WHERE user = ? AND token = ? AND type = 'portal'`, [params.exp_d,params.user,params.token]),
			]).then( (response) => {
				return {
					userinfo : response[0].length > 0 ? response[0][0] : response[0],
					chatlist : response[1],
					deleteAuth : response[2],
					auth : response[3],
					updateAuth : response[4]
				};
			}).catch( (error) => {
				console.warn(error);
				return (null);
			});
		} catch (error) {
			console.warn(error);
			return null;
		}
	}
	async getMessageCount(aid){
		try {
			const result = await this.db.query("SELECT COUNT(*) as count FROM ft_chat WHERE appt_id = ? AND sender='patient' AND `read`=0", [aid]);
			if(result !== null){
				return result[0]['count'];
			}else{
				return null;
			}
		} catch (error) {
			return null;
		}
	}
	//get chatlist for hospital users
	getChatList(params){
		try {
			return Promise.all([
				this.db.query(`SELECT id,email, username, name,hospital_id FROM user WHERE id = ?`, [params.uid]),
				this.db.query(`SELECT p.id,arrived,img,email as username, date, last_name, first_name,fa.id as appt_id,status,user_id,eta,fa.updated_at FROM ft_appt fa JOIN patient p ON p.id = fa.patient_id WHERE fa.online = ? AND hospital_id = ? AND (user_id=? OR user_id = '-1') ORDER BY fa.id DESC`, ['2',params.hid,params.uid]),
				this.db.query(`DELETE FROM session WHERE expiration<=?`, [params.now]),
				this.db.query(`SELECT id FROM session WHERE user=? AND token=? AND type = 'portal'`, [params.user,params.token]),
				this.db.query(`UPDATE session SET expiration = ? WHERE user = ? AND token = ? AND type = 'portal'`, [params.exp_d,params.user,params.token]),
			]).then( (response) => {
				return {
					userinfo : response[0].length > 0 ? response[0][0] : response[0],
					chatlist : response[1],
					deleteAuth : response[2],
					auth : response[3],
					updateAuth : response[4]
				};
			}).catch( (error) => {
				console.warn(error);
				return (null);
			});
		} catch (error) {
			console.warn(error);
			return null;
		}
	}
	async updateApptStatus(status,user_id,appt_id,user,token,now,exp_d){
		try {
			return await this.db.query(`UPDATE ft_appt SET status=?,user_id=? WHERE id = ?`, [status,user_id,appt_id]);
		} catch (error) {
			console.log(error);
			return null;
		}
	}
	async apptUpdate(status,appt_id){
		try {
			return await this.db.query(`UPDATE ft_appt SET status=? WHERE id = ?`, [status,appt_id]);
		} catch (error) {
			console.log(error);
			return null;
		}
	}
	async apptArrived(appt_id){
		try {
			return await this.db.query(`UPDATE ft_appt SET arrived='1' WHERE id = ?`, [appt_id]);
		} catch (error) {
			console.log(error);
			return null;
		}
	}
	async insertMessages(params){
		try {
			return await this.db.query(
				"INSERT INTO ft_chat (`user_id`,`patient_id`,`content`,`sender`,`appt_id`,`created_at`,`date`) values (?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)",
				[params.fromUserId, params.toUserId, params.message,'ft_er',params.apptId]
			);
		} catch (error) {
			console.warn(error);
			return null;
		}		
	}
}
module.exports = new Helper();