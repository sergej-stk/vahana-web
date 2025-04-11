import { showToast } from '/views/toast/toast.js';

document.addEventListener('DOMContentLoaded', () => {
  handleResetPwClick();
});

function handleResetPwClick() {
  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', postPassword);
  }
}

function postPassword() {
  const param = new URLSearchParams(document.location.search);
  const token = param.get('token');
  const password = document.getElementById('password').value;
  const passwordRepeat = document.getElementById('repeatPassword').value;

  if (password !== passwordRepeat) {
    showToast('Die Passwörter stimmen nicht überein!', 'error');
    return;
  } else if (password == '') {
    showToast('Es wurde kein Passwort angegeben!', 'error');
    return;
  } else if (!checkPassword(password)) {
    showToast('Passwordformat Falsch!<br>Mindestens 8 Zeichen, darunter eine Zahl, ein Groß- und ein Kleinbuchstabe sowie ein Sonderzeichen!', 'error');
    return;
  }

  const passwordData = {
    token: token,
    password: password
  };

  const jsonData = JSON.stringify(passwordData);

  const headers = new Headers();
  headers.append('Content-Type', 'application/json');

  fetch(confirmUrl, {
    method: 'POST',
    headers: headers,
    body: jsonData
  }).then(response => {
    if (!response.ok) {
      showToast(
        'Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.',
        'error'
      );
      return Promise.reject(new Error('Login fehlgeschlagen'));
    }

    showToast('Paswort wurd erfolgreich geändert!', 'success');
    localStorage.removeItem('userToken');
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
