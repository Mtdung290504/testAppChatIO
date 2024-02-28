import App from './app.js';

const authUid = window.authUid;
delete window.authUid;
document.querySelector('#remove-script').remove();
new App(authUid).start();
