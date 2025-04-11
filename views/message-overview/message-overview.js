import { showToast } from '/views/toast/toast.js';

document.addEventListener('DOMContentLoaded', () => {
  fetchNotifications();
});

let notifications = [];
let currentNotificationIndex = null;

function fetchNotifications() {
  fetch('/bananasplit/api/v0/notifications/me', {
    headers: {
      accept: 'application/json',
      Authorization: userToken
    }
  })
    .then(response => response.json())
    .then(data => {
      notifications = data.content
        ? data.content
        : Array.isArray(data)
        ? data
        : [data];
      renderSidebar();
    })
    .catch(err => {
      console.error('Fehler beim Laden der Benachrichtigungen:', err);
      showToast('Fehler beim Laden der Benachrichtigungen', 'error');
    });
}

function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = `
    <button id="mark-all-read-btn">Alle als gelesen markieren</button>
    <div id="message-list"></div>`;

  document
    .getElementById('mark-all-read-btn')
    .addEventListener('click', markAllAsRead);

  const messageList = document.getElementById('message-list');
  notifications.forEach((notification, index) => {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ' + (notification.read ? 'read' : 'unread');
    messageDiv.textContent = notification.message;
    messageDiv.addEventListener('click', () => showMessage(index));
    messageList.appendChild(messageDiv);
  });
}

function showMessage(index) {
  currentNotificationIndex = index;
  const notification = notifications[index];
  document.getElementById('message-content').textContent = notification.message;
  const markBtn = document.getElementById('mark-read-btn');
  markBtn.style.display = notification.read ? 'none' : 'inline-block';

  const messageElements = document.querySelectorAll('#message-list .message');
  messageElements.forEach((el, i) => {
    if (i === index) {
      el.classList.remove('unread');
      el.classList.add('read');
    }
  });
}

function markAsRead() {
  if (currentNotificationIndex === null) return;
  const notification = notifications[currentNotificationIndex];
  fetch(`/bananasplit/api/v0/notifications/${notification.id}/read`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      Authorization: userToken
    }
  })
    .then(response => {
      if (!response.ok) {
        showToast('Fehler beim Markieren als gelesen', 'error');
        alert('Fehler beim Markieren als gelesen.');
        return;
      }
      notifications[currentNotificationIndex].read = true;
      document.getElementById('mark-read-btn').style.display = 'none';
      renderSidebar();
      showToast('Nachricht wurde als gelesen markiert', 'success');
      setTimeout(() => {
        location.reload();
      }, 3000);
    })
    .catch(err => {
      console.error('Fehler beim Markieren als gelesen:', err);
      showToast('Fehler beim Markieren als gelesen', 'error');
      alert('Fehler beim Markieren als gelesen.');
    });
}

function markAllAsRead() {
  const unreadNotifications = notifications.filter(n => !n.read);
  if (unreadNotifications.length === 0) {
    showToast('Keine ungelesenen Nachrichten vorhanden', 'error');
    return;
  }

  const promises = unreadNotifications.map(notification =>
    fetch(`/bananasplit/api/v0/notifications/${notification.id}/read`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        Authorization: userToken
      }
    }).then(response => {
      if (response.ok) {
        notification.read = true;
      }
      setTimeout(() => {
        location.reload();
      }, 3000);
    })
  );

  Promise.all(promises)
    .then(() => {
      renderSidebar();
      const markBtn = document.getElementById('mark-read-btn');
      if (markBtn) markBtn.style.display = 'none';
      showToast('Alle Nachrichten wurden als gelesen markiert', 'success');
    })
    .catch(err => {
      console.error(
        'Fehler beim Markieren aller Nachrichten als gelesen:',
        err
      );
      showToast('Fehler beim Markieren aller Nachrichten', 'error');
      alert('Fehler beim Markieren aller Nachrichten.');
    });
}

window.markAllAsRead = markAllAsRead;
window.markAsRead = markAsRead;
