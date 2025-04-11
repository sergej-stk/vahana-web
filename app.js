const userToken = 'Bearer ' + localStorage.getItem('userToken');

const meUrl = '/bananasplit/api/v0/users/me';
// const meUrl = 'http://localhost:8080/bananasplit/api/v0/users/me';

const pictureUrl = `/bananasplit/api/v0/pictures/`;
// const pictureUrl = `http://localhost:8080/bananasplit/api/v0/pictures/`;

const requestUrl = '/bananasplit/api/v0/auth/password-reset/request';
// const requestUrl =
  // 'http://localhost:8080/bananasplit/api/v0/auth/password-reset/request';

const loginUrl = '/bananasplit/api/v0/auth/login';
// const loginUrl = 'http://localhost:8080/bananasplit/api/v0/auth/login';

const signupUrl = '/bananasplit/api/v0/auth/signup';
// const signupUrl = 'http://localhost:8080/bananasplit/api/v0/auth/signup';

const logoutUrl = '/bananasplit/api/v0/auth/logout';
// const logoutUrl = 'http://localhost:8080/bananasplit/api/v0/auth/logout';

const confirmUrl = '/bananasplit/api/v0/auth/password-reset/confirm';
// const confirmUrl =
  // 'http://localhost:8080/bananasplit/api/v0/auth/password-reset/confirm';

const ridesUrl = '/bananasplit/api/v0/rides';
// const ridesUrl = 'http://localhost:8080/bananasplit/api/v0/rides';

function checkAccessToken() {
  const paths = ['/login', '/register', '/forget-password'];

  if (window.location.pathname === '/reset-password'){
    return;
  }

  if (paths.includes(window.location.pathname)) {
    if (localStorage.getItem('userToken')) {
      redirectToDashboard();
      return;
    }

    return;
  }

  fetch(meUrl, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: userToken
    }
  })
    .then(response => {
      if (!response.ok) {
        localStorage.removeItem('userToken');
        redirectToLogin();
      }

      return response.json();
    })
    .then(json => {
      localStorage.setItem('userID', json.id);
    })
    .catch(() => {
      redirectToLogin();
    });
}

function redirectToLogin() {
  window.location.href = '/';
}

function redirectToDashboard() {
  window.location.href = '/dashboard';
}

checkAccessToken();
