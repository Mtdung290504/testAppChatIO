class SocketHandler {
    constructor(io, dbServices) {
        this.io = io;
        this.dbServices = dbServices;
    }

    onlineUsers = {};

    foundSocket(socket) {
        let find = false;
        for (const userSockets in this.onlineUsers) {
            if (Object.hasOwnProperty.call(this.onlineUsers, userSockets)) {
                this.onlineUsers[userSockets].forEach(socketId => {
                    if(socket.id == socketId) {
                        find = true;
                    }
                })
            }
        }
        return find;
    }

    startHandling() {
        this.io.on("connection", (socket) => {
            socket.on("login", (user)=>{
                if(!this.foundSocket(socket)) {
                    let userSockets = this.onlineUsers[user.id];                
                    if(!userSockets) {
                        this.onlineUsers[user.id] = [socket.id];
                        console.log(`\tUser:::${user.id} logged in`);
                    } else {
                        userSockets.push(socket.id)
                        console.log(`\tUser:::${user.id} create new connect`);
                    }                    
                }
                console.log('Users online: ', this.onlineUsers)
            })

            socket.on("chat to", (user, message, getterId)=>{
                // Send message to all socket of target if target is online
                const getterSockets = this.onlineUsers[getterId]
                if (getterSockets) {
                    getterSockets.forEach((socketId)=>{
                        io.to(socketId).emit("message from", {
                            senderId: user.id,
                            message: message,
                        })
                    })
                }
                // Save data to db: sender Id, getter Id, message
                this.dbServices.saveMessageToDatabase(user.id, getterId, message)
            });

            socket.on("disconnect", ()=>{
                for (const userId in this.onlineUsers) {
                    if (Object.hasOwnProperty.call(this.onlineUsers, userId)) {
                        this.onlineUsers[userId] = this.onlineUsers[userId].filter((socketId)=>{
                            return socketId !== socket.id
                        })
                    }
                    if(this.onlineUsers[userId].length == 0) {
                        console.log(`User:::${userId} offline`)
                    }
                }
            });

            socket.on("logout", (userId) => {
                //Delete logged out user from onlineUsers
                //Update display of all user
                delete this.onlineUsers[userId]
            })
        })
    }
}

module.exports = SocketHandler