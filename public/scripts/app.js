export default class App {
    constructor(uid) {
        this.socket = io();
        this.uid = uid;
        this.targetUid = '';
        this.interfaceBuilder = {
            displayChatBox: (id) => {
                const chatBox = document.querySelector(`.content[data-id="${id}"]`);
                if(chatBox) {
                    document.querySelectorAll('.content').forEach(messBox => {
                        messBox.classList.add('hide');
                    })
                    chatBox.classList.remove('hide');
                    return chatBox;
                }
                return false;
            },

            getMessHtml: (time, message, type) => {
                return `<div class="mess-container${type=='target' ? ' target-mess' : ''}">
                    <div class="mess-content">
                        <div class="time">${this.utils.filterDate(time)}</div>
                        ${message}
                    </div>
                </div>`.trim();
            },

            scrollToBottomSmooth: (element) => {
                let scrollHeight = element.scrollHeight;
                let currentScroll = element.scrollTop;
                let step = Math.floor(scrollHeight / 30);
                
                const scrollAnimaton = () => {
                    currentScroll = Math.min(currentScroll + step, scrollHeight);
                    element.scrollTop = currentScroll;
                    if(currentScroll < scrollHeight) {
                        requestAnimationFrame(scrollAnimaton);
                    }
                };
                requestAnimationFrame(scrollAnimaton);
            },

            appendMessage: (uid, mess, type, messageSendingCode) => {
                if(!uid) {
                    uid = this.targetUid;
                }
                if(mess) {
                    const ctn = document.querySelector(`.content[data-id="${uid}"]`);
                    let messCtn = document.createElement('div');
                    messCtn.classList.add('mess-container');
                    messCtn.classList.add('hide');
                    messCtn.innerHTML = `<div class="mess-content"><div class="time">${this.utils.getCurrentDate()}</div>${mess}</div>`;
                    if(type == 'target') {
                        messCtn.classList.add('target-mess');
                    } else {
                        messCtn.querySelector('.mess-content').innerHTML += `<div data-sendingCode="${messageSendingCode}" class="status">Sending...</div>`;
                    }
                    ctn.appendChild(messCtn);
                    messCtn.classList.remove('hide');
                    this.interfaceBuilder.scrollToBottomSmooth(ctn);
                } else {
                    alert('Error chatting target!')
                    console.error('Error chatting target!');
                }
            },

            clearElementBySelector: (selector, all = true) => {
                if(all) {
                    document.querySelectorAll(selector).forEach(element => {
                        element.remove();
                    });                    
                } else {
                    document.querySelector(selector).remove();
                }
            },

            notificationNewMessageFrom: (chatFriendId, message) => {
                const chatBoxCtn = document.querySelector('.sidenav');
                const chatBox = document.querySelector(`.user[data-id="${chatFriendId}"]`);
                const clearStatus = () => {
                    chatBox.classList.remove('new-mess')
                    chatBox.removeEventListener('click', clearStatus);
                }
                chatBox.classList.add('new-mess');
                chatBox.addEventListener('click', clearStatus);
                chatBox.querySelector('.user-mess').textContent = message;
                chatBoxCtn.insertBefore(chatBox, chatBoxCtn.firstChild);
            }
        };
        this.utils = {
            getCurrentDate: () => {
                const date = new Date();
                const day = date.getDate();
                const month = date.getMonth() + 1; 
                const year = date.getFullYear();
                const hours = date.getHours();
                const minutes = date.getMinutes();
                return `${day}-${month}-${year} ${hours}:${minutes}`;
            },
            
            filterDate: (timeStamp) => {
                const date = new Date(timeStamp);
                const day = date.getDate();
                const month = date.getMonth() + 1; 
                const year = date.getFullYear();
                const hours = date.getHours();
                const minutes = date.getMinutes();
                return `${day}-${month}-${year} ${hours}:${minutes}`;
            },

            generateMessageSendingCode: () => {
                return `${this.uid}-${this.targetUid}-${new Date().toLocaleString().replaceAll(':', '-').replaceAll('/', '-')}`;
            }
        };
    }

    startChattingWith(chatFriendUid) {
        this.targetUid = chatFriendUid;
        let messBoxOfTarget = this.interfaceBuilder.displayChatBox(this.targetUid);
        if(!messBoxOfTarget) {
            messBoxOfTarget = document.createElement('div');
            messBoxOfTarget.dataset.id = `${this.targetUid}`;
            messBoxOfTarget.classList.add('content');
            document.querySelector('.main .content-container').appendChild(messBoxOfTarget);
            this.socket.emit('get message', this.targetUid);
        }
        this.interfaceBuilder.displayChatBox(this.targetUid);
        messBoxOfTarget.scrollTop = messBoxOfTarget.scrollHeight;
    }

    chat(message) {
        const data = {
            messageSendingCode: this.utils.generateMessageSendingCode(),
            senderUid: this.uid,
            receiverUid: this.targetUid,
            message: message
        }
        this.socket.emit('chat to', data);
        this.interfaceBuilder.appendMessage(null, message, '', data.messageSendingCode);
    }

    start() {
        this.socket.on('connect', () => {
            console.log('Socket connected: ', this.socket);
            this.socket.emit('register socket', this.uid);

            this.socket.on('user online', (uid)=>{
                const chatBox = document.querySelector(`.content[data-id="${uid}"]`);
                console.log('User online: ', uid);
                document.querySelector(`.user[data-id="${uid}"]`).classList.add('onl');
                if(chatBox) {
                    chatBox.querySelector('.status').classList.add('onl');
                }
            })
    
            this.socket.on('user offline', (uid)=>{
                const chatBox = document.querySelector(`.content[data-id="${uid}"]`);
                console.log('User offline: ', uid);
                document.querySelector(`.user[data-id="${uid}]"`).classList.remove('onl');
                if(chatBox) {
                    chatBox.querySelector('.status').classList.remove('onl');
                }
            })
            
            this.socket.on('message sent successfully', (messageSendingCode)=>{
                this.interfaceBuilder.clearElementBySelector(`[data-sendingCode="${messageSendingCode}"]`);
            })
            
            this.socket.on('new message', (data)=>{
                const senderUid = data.senderUid;
                if(senderUid == this.uid) {
                    return;
                }
                const message = data.message;
                const chatBox = document.querySelector(`.content[data-id="${senderUid}"]`);
    
                if(senderUid == this.targetUid) {
                    this.interfaceBuilder.appendMessage(null, message, 'target');
                    this.interfaceBuilder.notificationNewMessageFrom(senderUid, message);
                } else if(chatBox) {
                    this.interfaceBuilder.appendMessage(senderUid, message, 'target');
                    this.interfaceBuilder.notificationNewMessageFrom(senderUid, message);
                }
            })
            
            this.socket.on('return list message', (listMessage)=>{
                const messBoxOfTarget = document.querySelector(`.content[data-id="${this.targetUid}"]`);
                const userData = document.querySelector(`.user[data-id="${this.targetUid}"]`);
                let html = `<div class="info-container"><div class="info-box">
                        <div class="status${Array.from(userData.classList).includes('onl') ? ' onl' : ''}"></div>
                        ${userData.querySelector('.username').textContent}
                    </div>
                </div>`.trim();
                if(messBoxOfTarget) {
                    listMessage.forEach(message => {
                        const type = (message.sender_uid == this.uid) ? '' : 'target';
                        html += this.interfaceBuilder.getMessHtml(message.timestamp, message.message, type);
                    });                
                }
                messBoxOfTarget.innerHTML = html;
                messBoxOfTarget.scrollTop = messBoxOfTarget.scrollHeight;
            })
            
            this.socket.on('logout', ()=>{
                window.location.reload();
            })

            this.socket.on('socket registration successful', ()=>{
                console.log(`Successfully registered socket:::${this.socket.id} for \nuser:::${this.uid}`);
                const buildEvents = setInterval(() => {
                    const logoutLink = document.querySelector('#logout-link');
                    const userBoxs = document.querySelectorAll('.user');
                    const form = document.querySelector('#form');
                    if(logoutLink && userBoxs && form) {
                        logoutLink.addEventListener('click', () => {
                            this.socket.emit('logout');
                        });
                        userBoxs.forEach(userBox => {
                            userBox.addEventListener('click', () => {
                                this.startChattingWith(userBox.dataset.id);
                            });
                        });
                        form.addEventListener('submit', (e) => {
                            e.preventDefault();
                            let input = document.querySelector('input');
                            this.chat(`${input.value}`);
                            input.value = '';
                        });
                        clearInterval(buildEvents)
                    }
                }, 1000);
            })
        });
    }
}