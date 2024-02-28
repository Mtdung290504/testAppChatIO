class Services {
    constructor(pool) {
        this.pool = pool;
    }

    authenticateUser(username, password) {
        return new Promise((resolve, reject) => {
            this.pool.query('CALL login(?, ?)', [username, password], (error, queryResults) => {
                const results = queryResults[0];
                if (error) {
                    reject(error);
                } else if (results.length === 0) {
                    reject(new Error('Invalid username or password'));
                } else {
                    resolve(results[0]);
                    console.log(`User:::${JSON.stringify(results[0])} Logged in`);
                }
            });
        });
    }

    createUser(username, password) {
        return new Promise((resolve, reject) => {
            this.pool.query('CALL register(?, ?)', [username, password], (error, results) => {
                if (error) {
                    if (error.code === 'ER_DUP_ENTRY') {
                        reject(new Error('Username already exists'));
                    } else {
                        reject(error);
                    }
                } else {
                    console.log('Registered:::', username);
                    resolve();
                }
            });
        });
    }

    registerSocket(uid, socketId) {
        return new Promise((resolve, reject) => {
            this.pool.query('CALL register_socket(?, ?)', [uid, socketId], (error, queryResults) => {
                const results = queryResults[0];
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });        
    }

    findAllSocketIdOfUid(uid) {
        return new Promise((resolve, reject) => {
            this.pool.query('CALL find_all_socketid_of_uid(?)', [uid], (error, queryResults) => {
                const results = queryResults[0];
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });        
    }

    removeSocket(socketId) {
        return new Promise((resolve, reject) => {
            this.pool.query('CALL remove_socketid(?)', [socketId], (error, queryResults) => {
                const results = queryResults[0];
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });        
    }

    saveMessageToDatabase(senderUid, receiverUid, message) {
        return new Promise((resolve, reject) => {
            this.pool.query('CALL new_message(?, ?, ?)', [senderUid, receiverUid, message], (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    getAllMessageBetweenUsers(senderUid, receiverUid) {
        return new Promise((resolve, reject) => {
            this.pool.query('CALL get_all_messages_between(?, ?)', [senderUid, receiverUid], (error, queryResults) => {
                const results = queryResults[0];
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });
    }

    getListOfUsers() {
        return new Promise((resolve, reject) => {
            this.pool.query('CALL get_all_user()', (error, queryResults) => {
                const results = queryResults[0];
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });
    }

    getAllOnlineUserId() {
        return new Promise((resolve, reject) => {
            this.pool.query('CALL get_all_online_user_id()', (error, queryResults) => {
                const results = queryResults[0];
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });
    }

    logoutUser(uid) {
        return new Promise((resolve, reject) => {
            this.pool.query(`CALL logout(?)`, [uid], (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });        
    }

    logoutAllUser() {
        return new Promise((resolve, reject) => {
            this.pool.query('TRUNCATE TABLE online_users', (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });          
    }
}

module.exports = Services