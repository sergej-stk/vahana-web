import { showToast } from '/views/toast/toast.js';

document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', postLogin);
  } else {
    console.error('Login-Button nicht gefunden!');
  }
});

function postLogin() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  if (email.trim() === '') {
    showToast('E-Mail wurde nicht angegeben!', 'error');
    return;
  }
  if (password.trim() === '') {
    showToast('Passwort wurde nicht angegeben!', 'error');
    return;
  }

  const signData = { email, password };
  const jsonData = JSON.stringify(signData);

  const headers = new Headers();
  headers.append('Content-Type', 'application/json');

  fetch(loginUrl, {
    method: 'POST',
    headers: headers,
    body: jsonData
  })
    .then(response => {
      if (!response.ok) {
        showToast('Ungültige E-Mail oder ungültiges Passwort!', 'error');
        return Promise.reject(new Error('Login fehlgeschlagen'));
      }
      return response.json();
    })
    .then(json => {
      localStorage.setItem('userToken', json.token);
      showToast('Login erfolgreich!', 'success');
      window.location.href = '/dashboard';
    });
  // .catch(error => {
  //   console.error('Fehler bei der Login-Anfrage:', error);
  //   showToast(
  //     'Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.',
  //     'error'
  //   );
  // });
}
