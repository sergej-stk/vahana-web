import { showToast } from '/views/toast/toast.js';

fetchNotificationCount();

const logOutBtn = document.getElementById('logOutBtn');
logOutBtn.addEventListener('click', onLogOut);

function onLogOut() {
  fetch(logoutUrl, {
    method: 'POST',
    headers: {
      Authorization: userToken
    }
  }).then(response => {
    if (!response.ok) {
      showToast(
        'Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.',
        'error'
      );
      return Promise.reject(new Error('Logout fehlgeschlagen'));
    }
    window.localStorage.removeItem('userToken');
    window.location.href = '/';
  });
}

function fetchNotificationCount() {
  fetch('/bananasplit/api/v0/notifications/me', {
    headers: {
      accept: 'application/json',
      Authorization: userToken
    }
  })
    .then(response => response.json())
    .then(data => {
      const notifications = data.content
        ? data.content
        : Array.isArray(data)
        ? data
        : [data];
      const unreadCount = notifications.filter(n => !n.read).length;
      updateNotificationBadge(unreadCount);
    })
    .catch(err => {
      console.error('Fehler beim Laden der Benachrichtigungen:', err);
    });
}

function updateNotificationBadge(count) {
  const badge = document.getElementById('notification-badge');
  if (count > 0) {
    badge.style.display = 'block';
    badge.textContent = count > 5 ? '5+' : count;
  } else {
    badge.style.display = 'none';
  }
}
