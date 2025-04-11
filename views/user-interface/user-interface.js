import { showToast } from '/views/toast/toast.js';

document.addEventListener('DOMContentLoaded', () => {
  handleDeleteClick();
  handlePasswortClick();
  handleProfileClick();
  handleChangeClick();
});

function handleDeleteClick() {
  const deleteBtn = document.getElementById('deleteBtn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', onDeleteUser);
  }
}

function handlePasswortClick() {
  const passwordBtn = document.getElementById('passwordBtn');
  if (passwordBtn) {
    passwordBtn.addEventListener('click', onPasswordReset);
  }
}

function handleProfileClick() {
  const profileBtn = document.getElementById('profileBtn');
  if (profileBtn) {
    profileBtn.addEventListener('click', onChangePic);
  }
}

function handleChangeClick() {
  const changeBtn = document.getElementById('changeBtn');
  if (changeBtn) {
    changeBtn.addEventListener('click', onChangeUserData);
  }
}

function getUser() {
  fetch(meUrl, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: userToken
    }
  })
    .then(response => response.json())
    .then(userData => {
      localStorage.setItem('pictureID', userData.picture_id);
      fillUserData(userData);
      getPicture();
    });
}

function fillUserData(userData) {
  document.getElementById('username').value = userData.username;
  document.getElementById('email').value = userData.email;
  document.getElementById('lastname').value = userData.lastname || '';
  document.getElementById('firstname').value = userData.firstname || '';
  document.getElementById('phonenumber').value = userData.phonenumber || '';
  document.getElementById('title').textContent =
    (userData.firstname || '') + ' ' + (userData.lastname || '');
  document.getElementById('street').value = userData.address.street || '';
  document.getElementById('house_number').value =
    userData.address.house_number || '';
  document.getElementById('postcode').value =
    userData.address.postal_code || '';
  document.getElementById('city').value = userData.address.city || '';
}

function onChangeUserData() {
  const username = document.getElementById('username').value;
  const email = document.getElementById('email').value;
  const lastname = document.getElementById('lastname').value;
  const firstname = document.getElementById('firstname').value;
  const phonenumber = document.getElementById('phonenumber').value.trim();
  const postcode = document.getElementById('postcode').value;
  const city = document.getElementById('city').value;
  const street = document.getElementById('street').value;
  const house_number = document.getElementById('house_number').value;

  if (!checkNumber(phonenumber)) {
    showToast(
      'Ungültige deutsche Handynummer!<br>Erlaubt: +491701234567 oder 0170-1234567',
      'error'
    );
    return;
  }

  const signData = {
    username: username,
    email: email,
    lastname: lastname,
    firstname: firstname,
    phonenumber: phonenumber,
    address: {
      street: street,
      house_number: house_number,
      postal_code: postcode,
      city: city
    }
  };

  const jsonData = JSON.stringify(signData);

  fetch(meUrl, {
    method: 'PATCH',
    headers: {
      accept: 'application/json',
      Authorization: userToken,
      'Content-Type': 'application/json'
    },
    body: jsonData
  })
    .then(response => {
      if (!response.ok) {
        showToast(
          'Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.',
          'error'
        );
        throw new Error(`Fehler: ${response.status} ${response.statusText}`);
      }
      showToast('Ihre Änderung wurde gespeichert!', 'success');
      return response.json();
    })
    .then(userData => {
      fillUserData(userData);
      getPicture();
      checkAccessToken();
    });
}

function getPicture() {
  const picture_id = localStorage.getItem('pictureID');

  fetch(pictureUrl + picture_id, {
    method: 'GET',
    headers: {
      accept: 'image/jpeg',
      Authorization: userToken
    }
  })
    .then(response => response.blob())
    .then(file => {
      loadPicture(file);
    });
}

function onChangePic() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept =
    'image/jpeg, image/png, image/gif, image/webp, image/bmp, image/svg+xml';
  input.style.display = 'none';

  document.body.appendChild(input);
  input.click();
  document.body.removeChild(input);

  input.addEventListener('change', function () {
    if (input.files.length > 0) {
      const file = input.files[0];

      loadPicture(file);

      const formData = new FormData();
      formData.append('picture', file);

      putPicture(formData);
    }
  });
}

function loadPicture(file) {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = function () {
    const profileImage = document.getElementById('profileImage');

    if (profileImage.firstChild) {
      profileImage.removeChild(profileImage.firstChild);
    }

    const imageElement = new Image();
    imageElement.src = reader.result;
    imageElement.classList.add('profile-pic');
    profileImage.appendChild(imageElement);
  };
}

function putPicture(formData) {
  const picture_id = localStorage.getItem('pictureID');

  fetch(pictureUrl + picture_id, {
    method: 'PUT',
    headers: {
      Authorization: userToken
    },
    body: formData
  }).then(response => {
    if (!response.ok) {
      showToast(
        'Es ist ein Fehler aufgetreten. Dein Profilbild wurde nicht gespeichert.',
        'error'
      );
      throw new Error(`Fehler: ${response.status} ${response.statusText}`);
    }
    showToast('Ihr Profilbild wurde gespeichert!', 'success');
  });
}

function onPasswordReset() {
  const email = document.getElementById('email').value;

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
      throw new Error(`Fehler: ${response.status} ${response.statusText}`);
    }
    showToast('Es wurde eine E-Mail gesendet!', 'success');
  });
}

function onDeleteUser() {
  fetch(meUrl, {
    method: 'DELETE',
    headers: {
      Authorization: userToken
    }
  }).then(response => {
    if (!response.ok) {
      showToast(
        'Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.',
        'error'
      );
      throw new Error(`Fehler: ${response.status} ${response.statusText}`);
    }

    showToast('Benutzer wurde gelöscht!', 'success');
    localStorage.removeItem('userToken');
    checkAccessToken();
  });
}

function checkNumber(phonenumber) {
  if (phonenumber === ''){
    return true;
  }

  const regex =
    /^(?:\+49|0)(1[5-7][0-9])[\s\-]?\d{7,8}$/;

  if (regex.test(phonenumber)) {
    const cleaned = phonenumber
      .replace(/\s+/g, '')
      .replace(/-/g, '')
      .replace(/\(/g, '')
      .replace(/\)/g, '');

    let international = cleaned;
    if (/^0\d+/.test(cleaned)) {
      international = '+49' + cleaned.slice(1);
    }

    return true;
  } else {
    return false;
  }
}

getUser();
