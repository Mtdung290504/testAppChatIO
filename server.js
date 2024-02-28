const express = require('express');
const session = require('express-session');
const ejs = require('ejs');
const path = require('path')
const mysql = require('mysql2');
const socketIO = require("socket.io");
const DbServices = require('./services/database/db_services')
const app = express();
const dbServices = new DbServices(mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'chat_app_test_v0',
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0
}));

app.use(session({ secret: '22ns007', resave: false, saveUninitialized: false }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use('/socket.io', express.static(__dirname + '/node_modules/socket.io/client-dist'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
    req.session.user
        ? res.redirect('/chat')
        : res.redirect('/login')
});

app.get('/login', (req, res) => {
    req.session.user
        ? res.redirect('/chat')
        : res.render('login', { error: null, user: null })
});

app.get('/register', (req, res) => {
    req.session.user
        ? res.redirect('/chat')
        : res.render('register', { error: null })
})

app.post('/login', (req, res) => {
    const account = req.body;

    dbServices.authenticateUser(account.username, account.password)
        .then(user => {
            req.session.user = user;
            res.redirect('/chat');
        })
        .catch(error => {
            res.render('login', { error: error.message, user: account });
        });
});

app.post('/register', (req, res) => {
    const newAccount = req.body;

    dbServices.createUser(newAccount.username, newAccount.password)
        .then(() => {
            // res.redirect('/');
            res.render('login', { error: null, user: newAccount });
        })
        .catch(error => {
            res.render('register', { error: error.message });
        });
});

const authenticateUserMiddleware = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/');
    }
}

app.get('/chat', authenticateUserMiddleware, (req, res) => {
    const allUser = dbServices.getListOfUsers();
    const onlineUserId = dbServices.getAllOnlineUserId();
    Promise.all([allUser, onlineUserId])
        .then(([allUser, onlineUserId]) => {
            console.log(onlineUserId);
            onlineUserId.push({ uid: req.session.user.uid })
            onlineUserId = onlineUserId.reduce((arr = [], obj) =>{
                arr.push(obj.uid);
                return arr;
            }, [])
            res.render('chat', { allUser, onlineUserId, authUser: req.session.user });
        })
        .catch(error => {
            console.error('Lỗi xử lý promise! ', error);
        })
});

app.get('/logout', authenticateUserMiddleware, (req, res) => {
    dbServices.logoutUser(req.session.user.uid)
        .then(() => {
            req.session.user = null;
            req.session.destroy((err) => {
                if (err) {
                    console.error('Lỗi khi hủy session:', err);
                }
            });
            res.redirect('/login')
        })
        .catch(error => {
            console.error(`Lỗi khi logout user:::${req.session.user.uid}: `, error);
        });
})

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    dbServices.logoutAllUser()
        .then(() => {
            console.log('logged out all user');
        })
        .catch(error => {
            console.error('Error when log out all user');
        });
});

require('./services/io/socket-handler')(socketIO(server), dbServices);