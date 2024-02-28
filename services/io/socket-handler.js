const socketHandler = (io, db) => {
    io.on('connection', (socket) => {
        socket.on('register socket', (uid) => {
            console.log(`register socket:::${socket.id} by user:::${uid}`);
            db.registerSocket(uid, socket.id)
                .then(sockets => {
                    socket.uid = uid;
                    if (sockets.length === 1) {
                        console.log('user online: ', uid);
                        io.emit('user online', uid);
                        io.to(socket.id).emit('socket registration successful');
                    }
                })
                .catch(error => {
                    console.error(`Lỗi khi đăng ký socket:::{uid:${uid}, socketId: ${socket.id}}: `, error);
                });
        })

        socket.on('chat to', async (data) => {
            const messageSendingCode = data.messageSendingCode;
            const senderUid = socket.uid;
            const receiverUid = data.receiverUid;
            const message = data.message;
            
            try {
                const [saveMessage, senderSockets, receiverSockets] = await Promise.all([
                    db.saveMessageToDatabase(senderUid, receiverUid, message),
                    db.findAllSocketIdOfUid(senderUid),
                    db.findAllSocketIdOfUid(receiverUid)
                ]);

                senderSockets.forEach(row => {
                    io.to(row.socketid).emit('message sent successfully', messageSendingCode);
                });
                receiverSockets.forEach(row => {
                    io.to(row.socketid).emit('new message', { senderUid: senderUid, message: message });
                });
            } catch (error) {
                console.error(`Lỗi khi gửi tin nhắn từ user:::${senderUid} đến user:::${receiverUid}: `, error);
            }
        })

        socket.on('get message', (chatFriendUid) => {
            const userUid = socket.uid;
            db.getAllMessageBetweenUsers(userUid, chatFriendUid)
                .then(listMessage => {
                    io.to(socket.id).emit('return list message', listMessage);
                })
                .catch (error => {
                    console.error(`Lỗi khi lấy danh sách tin nhắn giữa user:::${userUid} và user:::${chatFriendUid}: `, error);
                })
        })

        socket.on('logout', async () => {
            const logoutUid = socket.uid;
            try {
                const [logout, logoutSockets] = await Promise.all([
                    db.logoutUser(logoutUid),
                    db.findAllSocketIdOfUid(logoutUid)
                ]);

                logoutSockets.forEach(row => {
                    io.to(row.socketid).emit('logout');
                });
            } catch (error) {
                console.error(`Lỗi khi đăng ký logout user:::${logoutUid}: `, error);
            }
        })

        socket.on('disconnect', () => {
            db.removeSocket(socket.id)
                .then(remainingSockets => {
                    if (remainingSockets.length === 0) {
                        io.emit('user offline', socket.uid);
                    }
                })
                .catch(error => {
                    console.error(`Lỗi khi loại bỏ socket:::{uid:${socket.uid}, socketId: ${socket.id}}: `, error);
                });
        })
    })
}

module.exports = socketHandler