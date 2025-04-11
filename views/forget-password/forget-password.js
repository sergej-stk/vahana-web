import { showToast } from '/views/toast/toast.js';

document.addEventListener('DOMContentLoaded', () => {
  handleResetPwClick();
});

function handleResetPwClick() {
  document.querySelector('.btn-resetPW').addEventListener('click', async () => {
    const email = document.getElementById('email').value;

    if (!email) {
      showToast('E-Mail wurde nicht angegeben!', 'error');
      return;
    }

    fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    }).then(response => {
      if (!response.ok) {
        showToast(
          'Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.',
          'error'
        );
        return Promise.reject(new Error('Login fehlgeschlagen'));
      }
      showToast('Ihnen wurde eine E-Mail gesendet!', 'success');
    });
  });
}
