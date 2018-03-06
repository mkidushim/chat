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

	async userNameCheck (username){
		return await this.db.query(`SELECT count(id) as count FROM user WHERE LOWER(username) = ?`, `${username}`);
	}

	// async registerUser(params){
	// 	try {
	// 		return await this.db.query("INSERT INTO doctor (`username`,`password`,`online`) VALUES (?,?,?)", [params['username'],params['password'],'Y']);
	// 	} catch (error) {
	// 		console.error(error);
	// 		return null;
	// 	}
	// }

	async loginUser(params){
		try {
			return await this.db.query(`SELECT id,hospital_id as hid FROM user WHERE LOWER(username) = ? AND password = ?`, [params.username,params.password]);
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

	getChatList(params){
		try {
			return Promise.all([
				this.db.query(`SELECT id,email, username, name FROM user WHERE id = ?`, [params.uid]),
				this.db.query(`SELECT p.id,email as username, date, last_name, first_name,fa.id as appt_id FROM ft_appt fa JOIN patient p ON p.id = fa.patient_id WHERE fa.online = ? AND hospital_id = ?`, ['2',params.hid])
			]).then( (response) => {
				return {
					userinfo : response[0].length > 0 ? response[0][0] : response[0],
					chatlist : response[1]
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
	getChatListPHP(hid){
		try {
			return Promise.all([
				this.db.query(`SELECT p.id,email as username, date, last_name, first_name,fa.id as appt_id FROM ft_appt fa JOIN patient p ON p.id = fa.patient_id WHERE fa.online = ? AND hospital_id = ?`, ['2',hid])
			]).then( (response) => {
				return {
					user : response[0].length > 0 ? response[0][0] : response[0]
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
	async insertMessages(params){
		try {
			return await this.db.query(
				"INSERT INTO ft_chat (`user_id`,`patient_id`,`content`,`sender`,`appt_id`) values (?,?,?,?,?)",
				[params.fromUserId, params.toUserId, params.message,'ft_er',params.apptId]
			);
		} catch (error) {
			console.warn(error);
			return null;
		}		
	}

	async getMessages(userId, toUserId, aid){
		try {
			return await this.db.query(
				`SELECT id,user_id as fromUserId,patient_id as toUserId,content as message,sender FROM ft_chat WHERE 
					user_id = ? AND patient_id = ? AND appt_id = ? 
					ORDER BY id ASC				
				`,
				[userId, toUserId, aid]
			);
		} catch (error) {
			console.warn(error);
			return null;
		}
	}
}
module.exports = new Helper();