import { showToast } from '/views/toast/toast.js';

document.addEventListener('DOMContentLoaded', () => {
  handleRegisterClick();
});

function handleRegisterClick() {
  const registerBtn = document.getElementById('registerBtn');
  if (registerBtn) {
    registerBtn.addEventListener('click', postRegister);
  }
}

function postRegister() {
  const email = document.getElementById('email').value;
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const passwordRepeat = document.getElementById('passwordRepeat').value;
  const dataProtection = document.getElementById('dataProtection');

  if (email == '') {
    showToast('Es wurde keine E-Mail angegeben!', 'error');
    return;
  } else if (username == '') {
    showToast('Es wurde kein Benutzername angegeben!', 'error');
    return;
  } else if (password !== passwordRepeat) {
    showToast('Die Passwörter stimmen nicht überein!', 'error');
    return;
  } else if (password == '') {
    showToast('Es wurde kein Passwort angegeben!', 'error');
    return;
  } else if (!dataProtection.checked) {
    showToast('Sie haben die Datenschutzerklärung nicht akzeptiert!', 'error');
    return;
  } else if (!checkPassword(password)) {
    showToast('Passwordformat Falsch!<br>Mindestens 8 Zeichen, darunter eine Zahl, ein Groß- und ein Kleinbuchstabe sowie ein Sonderzeichen!', 'error');
    return;
  }

  const signData = {
    username: username,
    email: email,
    terms_accepted: true,
    password: password
  };

  const jsonData = JSON.stringify(signData);

  const headers = new Headers();
  headers.append('Content-Type', 'application/json');

  fetch(signupUrl, {
    method: 'POST',
    headers: headers,
    body: jsonData
  }).then(response => {
    if (!response.ok) {
      showToast('E-Mail oder Benutzername bereits vorhanden!', 'error');
      return Promise.reject(new Error('Login fehlgeschlagen'));
    }

    showToast('Register erfolgreich!', 'success');
    window.location.href = '/login';
  });

  function checkPassword(password) {
    const regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}$/;
  
    if (regex.test(password)) {
      return true;
    } else {
      return false;
    }
  }
}
