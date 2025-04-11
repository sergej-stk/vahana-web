import { showToast } from '/views/toast/toast.js';

let currentPage = 1;
let allRides = [];
let pages = {};

document.addEventListener('DOMContentLoaded', async () => {
  handleApplyFilters();
  handlePrevPage();
  handleNextPage();
  handleCreateRide();
});

async function renderRides() {
  const status = document.getElementById('status').value;

  const rideList = document.getElementById('ride-list');
  rideList.innerHTML = '';

  const ridesToShow = allRides;

  ridesToShow.forEach(ride => {
    const date = new Date(ride.departure).toLocaleDateString();
    const time = new Date(ride.departure).toLocaleTimeString(
      navigator.language,
      { hour: '2-digit', minute: '2-digit' }
    );

    const rideCard = document.createElement('div');
    rideCard.classList.add('ride-card');

    const textContainer = document.createElement('div');
    textContainer.classList.add('text-container');
    textContainer.innerHTML = `
      <h2>${ride.origin.city} ➝ ${ride.destination.city}</h2>
      <p><strong>Ersteller:</strong> ${ride.driver.username}</p>
      <p><strong>Freie Plätze:</strong> ${ride.available_seats}</p>
      <p><strong>Datum:</strong> ${date}</p>
      <p><strong>Uhrzeit:</strong> ${time}</p>
    `;

    const button = document.createElement('button');
    const editButton = document.createElement('button');
    if (ride.driver.id != localStorage.getItem('userID')) {
      button.classList.add('btn-join');
      button.textContent = 'Mitfahren';
      button.onclick = () => openRideDetail(ride.id);
      textContainer.appendChild(button);
    } else {
      editButton.classList.add('btn-edit');
      editButton.textContent = 'Anpassen';
      editButton.onclick = () => openRideDetail(ride.id);
      textContainer.appendChild(editButton);

      button.classList.add('btn-delete');
      button.textContent = 'Löschen!';
      button.onclick = () => deleteRide(ride.id);
      textContainer.appendChild(button);
    }

    if (ride.status === 'CANCELED' || ride.status === 'COMPLETED') {
      textContainer.removeChild(button);

      if (textContainer.contains(editButton)) {
        textContainer.removeChild(editButton);
      }
    }

    if (status === 'NONE') {
      const statusField = document.createElement('div');
      statusField.classList.add('status-field');
      statusField.innerHTML = `
        <h4>${ride.status}</h4>
      `;
      textContainer.appendChild(statusField);
    }

    rideCard.appendChild(textContainer);
    getPicture(rideCard, ride.driver.picture_id);

    rideList.appendChild(rideCard);
  });

  updatePagination();
}

async function getRides({
  page = 0,
  size = 4,
  sortby,
  sortdirection,
  status,
  origincity,
  destinationcity,
  username
} = {}) {
  const queryParams = new URLSearchParams({
    page,
    size,
    sortby,
    sortdirection,
    status,
    origincity,
    destinationcity,
    username
  }).toString();

  const response = await fetch(`${ridesUrl}?${queryParams}`, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: userToken
    }
  });
  const data = await response.json();
  return { content: data.content, page: data.page };
}

const pictureCache = new Map();

function getPicture(rideCard, picture_id) {
  if (pictureCache.has(picture_id)) {
    loadPicture(rideCard, pictureCache.get(picture_id));
    return;
  }

  fetch(pictureUrl + picture_id, {
    method: 'GET',
    headers: {
      accept: 'image/jpeg',
      Authorization: userToken
    }
  })
    .then(response => response.blob())
    .then(file => {
      pictureCache.set(picture_id, file);
      loadPicture(rideCard, file);
    });
}

function loadPicture(rideCard, file) {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = function () {
    const imageElement = new Image();
    imageElement.src = reader.result;
    imageElement.classList.add('profile-pic');
    rideCard.appendChild(imageElement);
  };
}

function updatePagination() {
  let totalPages = pages.totalPages;

  if (allRides.length === 0) {
    currentPage = 1;
    totalPages = 1;
  } else if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  document.getElementById(
    'page-info'
  ).textContent = `Seite ${currentPage} von ${totalPages}`;
  document.getElementById('prev-page').disabled = currentPage === 1;
  document.getElementById('next-page').disabled = currentPage === totalPages;
}

function openRideDetail(rideId) {
  window.location.href = `/views/ride-overview/ride-detail.html?rideId=${rideId}`;
}

function createRide() {
  window.location.href = '/rides-create';
}

function deleteRide(rideID) {
  fetch(ridesUrl + '/me/' + rideID, {
    method: 'DELETE',
    headers: {
      accept: 'application/json',
      Authorization: userToken
    }
  }).then(response => {
    if (!response.ok) {
      showToast('Fahrt konnte nicht gelöscht werden!', 'error');
      return Promise.reject(new Error('Error'));
    }

    showToast('Fahrt wurde gelöscht!', 'success');

    allRides = allRides.filter(ride => ride.id !== rideID);
    renderRides();
  });
}

async function fillPagnitation() {
  const sortby = document.getElementById('sortby').value;
  const sortdirection = document.getElementById('sortdirection').value;
  const status = document.getElementById('status').value;
  const origincity = document.getElementById('origincity').value;
  const destinationcity = document.getElementById('destinationcity').value;
  const username = document.getElementById('username').value;

  const result = await getRides({
    sortby,
    sortdirection,
    status,
    origincity,
    destinationcity,
    username
  });
  allRides = result.content;
  pages = result.page;

  renderRides();
}

async function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    await loadPageData();
  }
}

async function nextPage() {
  if (currentPage < pages.totalPages) {
    currentPage++;
    await loadPageData();
  }
}

async function loadPageData() {
  const sortby = document.getElementById('sortby').value;
  const sortdirection = document.getElementById('sortdirection').value;
  const status = document.getElementById('status').value;
  const origincity = document.getElementById('origincity').value;
  const destinationcity = document.getElementById('destinationcity').value;
  const username = document.getElementById('username').value;

  const result = await getRides({
    page: currentPage - 1,
    size: 4,
    sortby,
    sortdirection,
    status,
    origincity,
    destinationcity,
    username
  });

  allRides = result.content;
  pages = result.page;

  renderRides();
}

function handlePrevPage() {
  const prevBtn = document.getElementById('prev-page');
  if (prevBtn) {
    prevBtn.addEventListener('click', prevPage);
  }
}

function handleNextPage() {
  const nextBtn = document.getElementById('next-page');
  if (nextBtn) {
    nextBtn.addEventListener('click', nextPage);
  }
}

function handleCreateRide() {
  const createBtn = document.getElementById('createRide');
  if (createBtn) {
    createBtn.addEventListener('click', createRide);
  }
}

function handleApplyFilters() {
  const filterBtn = document.getElementById('applyFilters');
  if (filterBtn) {
    filterBtn.addEventListener('click', fillPagnitation);
  }
}
