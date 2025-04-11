import { showToast } from '/views/toast/toast.js';

const urlParams = new URLSearchParams(window.location.search);
const rideId = urlParams.get('rideId');

// const ridesUrl = '/bananasplit/api/v0/rides';
// const pictureUrl = '/bananasplit/api/v0/pictures/';
const pictureCache = new Map();

let currentRideData = null;

document.addEventListener('DOMContentLoaded', async () => {
  const rideData = await getRideDetails();
  loadRideDetails(rideData);
  loadParticipants(rideData);
  handleGoBack();
  handleJoinRide(rideData);
  handleLeaveRide(rideData);
});

async function loadRideDetails(rideData) {
  if (!rideData || !rideData.origin || !rideData.destination) {
    console.error('Fehlerhafte Fahrtdaten.');
    return;
  }
  currentRideData = rideData;
  const date = new Date(rideData.departure).toLocaleDateString();
  const time = new Date(rideData.departure).toLocaleTimeString(
    navigator.language,
    { hour: '2-digit', minute: '2-digit' }
  );
  document.getElementById('creator').textContent = rideData.driver.username;
  document.getElementById('from').textContent = rideData.origin.city;
  document.getElementById('to').textContent = rideData.destination.city;
  document.getElementById('date').textContent = date;
  document.getElementById('time').textContent = time;
  document.getElementById('seats').textContent = rideData.available_seats;
  renderLeafletMap(rideData);
}

async function renderLeafletMap(rideData) {
  const map = L.map('map').setView(
    [
      rideData.origin.coordinates.latitude,
      rideData.origin.coordinates.longitude
    ],
    6
  );

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  let routingControl = L.Routing.control({
    waypoints: [
      L.latLng(rideData.origin.coordinates.latitude, rideData.origin.coordinates.longitude),
      L.latLng(rideData.destination.coordinates.latitude, rideData.destination.coordinates.longitude)
    ],
    router: L.Routing.osrmv1({
      serviceUrl: 'https://router.project-osrm.org/route/v1'
    }),
    routeWhileDragging: true,
    draggableWaypoints: false
  }).addTo(map);

  // Entferne die Steuerung für Straßenrichtungen
  map.removeControl(routingControl._container);

  routingControl.on('routesfound', function (e) {
    const summary = e.routes[0].summary;
    // Aktualisiere die Distanz im Eingabefeld
    const distanceElement = document.getElementById("distance");
    if (distanceElement) {
      distanceElement.value = (summary.totalDistance / 1000).toFixed(2); // in km
      update_calculated_price();
    }
  });

  // Marker für den Startpunkt (grün) und Zielpunkt (rot)
  const greenIcon = L.icon({
    iconUrl:
      'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    shadowUrl:
      'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const redIcon = L.icon({
    iconUrl:
      'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl:
      'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  L.marker(
    [
      rideData.origin.coordinates.latitude,
      rideData.origin.coordinates.longitude
    ],
    { icon: greenIcon }
  )
    .addTo(map)
    .bindPopup(`<b>${rideData.origin.city}</b>`);

  L.marker(
    [
      rideData.destination.coordinates.latitude,
      rideData.destination.coordinates.longitude
    ],
    { icon: redIcon }
  )
    .addTo(map)
    .bindPopup(`<b>${rideData.destination.city}</b>`);

  getRoute(rideData, map);
}

async function getRoute(rideData, map) {
  const apiKey = '5b3ce3597851110001cf62482ddb79f1fae14aa095fedaaac999e062';
  const url = 'https://api.openrouteservice.org/v2/directions/driving-car';
  const body = {
    coordinates: [
      [
        rideData.origin.coordinates.longitude,
        rideData.origin.coordinates.latitude
      ],
      [
        rideData.destination.coordinates.longitude,
        rideData.destination.coordinates.latitude
      ]
    ],
  };

    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (data.routes && data.routes.length > 0) {
      const routeGeoJSON = L.geoJSON(data.routes[0].geometry, {
        style: { color: 'brown', weight: 5 }
      }).addTo(map);
      map.fitBounds(routeGeoJSON.getBounds());
    } else {
      console.warn('Keine Route gefunden.');
    }
}

async function getRideDetails() {
  try {
    const response = await fetch(`${ridesUrl}/${rideId}`, {
      method: 'GET',
      headers: { accept: 'application/json', Authorization: userToken }
    });
    return await response.json();
  } catch (error) {
    console.error('Fehler beim Abrufen der Fahrtdetails:', error);
  }
}


async function loadParticipants(rideData) {
  try {
    const response = await fetch(`${ridesUrl}/${rideId}/participants`, {
      method: 'GET',
      headers: { accept: 'application/json', Authorization: userToken }
    });
    const data = await response.json();
    const participantsContainer = document.getElementById('participants');
    if (!participantsContainer) {
      console.warn('Kein Container mit der ID "participants" gefunden.');
      return;
    }
    participantsContainer.innerHTML = '';
    if (data.content && data.content.length > 0) {
      data.content.forEach(participant => {
        const participantDiv = document.createElement('div');
        participantDiv.classList.add('participant-container');
        participantDiv.title = participant.username;
        const img = document.createElement('img');
        img.alt = participant.username;
        img.classList.add('participant-img');
        const pictureId = participant.picture_id ? participant.picture_id : null;
        if (pictureId) {
          getPicture(img, pictureId);
        } else {
          img.src =
            'https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg';
        }
        participantDiv.appendChild(img);
        const nameElem = document.createElement('div');
        nameElem.classList.add('participant-name');
        nameElem.textContent = participant.username;
        participantDiv.appendChild(nameElem);

        if (rideData.driver.id === localStorage.getItem('userID')) {
          const removeBtn = document.createElement('button');
          removeBtn.classList.add('remove-participant-btn');
          removeBtn.textContent = '✕';
          removeBtn.title = `Teilnehmer ${participant.username} entfernen`;
          removeBtn.addEventListener('click', e => {
            e.stopPropagation();
            showRemoveDialog(
              `${participant.username} wirklich entfernen?`,
              () => {
                removeParticipant(participant.id, participantDiv);
              }
            );
          });
          participantDiv.appendChild(removeBtn);
        }

        participantsContainer.appendChild(participantDiv);
      });
    } else {
      participantsContainer.innerHTML = '<p>Keine Teilnehmer beigetreten.</p>';
    }
  } catch (error) {
    console.error('Fehler beim Laden der Teilnehmer:', error);
  }
}

function getPicture(imgElement, picture_id) {
  if (pictureCache.has(picture_id)) {
    loadPicture(imgElement, pictureCache.get(picture_id));
    return;
  }
  fetch(pictureUrl + picture_id, {
    method: 'GET',
    headers: { accept: 'image/jpeg', Authorization: userToken }
  })
    .then(response => response.blob())
    .then(file => {
      pictureCache.set(picture_id, file);
      loadPicture(imgElement, file);
    })
    .catch(error => {
      console.error('Fehler beim Laden des Bildes:', error);
    });
}

function loadPicture(imgElement, file) {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = function () {
    imgElement.src = reader.result;
  };
}

async function removeParticipant(participantId, element) {
  try {
    const response = await fetch(
      `${ridesUrl}/${rideId}/participants/${participantId}`,
      {
        method: 'DELETE',
        headers: { accept: 'application/json', Authorization: userToken }
      }
    );
    if (!response.ok) {
      showToast('Fehler beim Entfernen des Teilnehmers.', 'error');
      throw new Error(`Fehler: ${response.status} ${response.statusText}`);
    }
    showToast('Teilnehmer wurde entfernt!', 'success');
    element.remove();
    setTimeout(() => {
      location.reload();
    }, 3000);
  } catch (error) {
    console.error('Fehler beim Entfernen des Teilnehmers:', error);
  }
}

function handleGoBack() {
  const backBtn = document.getElementById('btn-back');
  if (backBtn) {
    backBtn.addEventListener('click', () => window.history.back());
  }
}

function handleJoinRide(rideData) {
  if (rideData.driver.id === localStorage.getItem('userID')) {
    document.getElementById('btn-join').style.display = 'none';
    return;
  }
  const joinBtn = document.getElementById('btn-join');
  if (joinBtn) {
    joinBtn.addEventListener('click', joinRide);
  }
}

function handleLeaveRide(rideData) {
  if (rideData.driver.id === localStorage.getItem('userID')) {
    document.getElementById('btn-leave').style.display = 'none';
    return;
  }
  const leaveBtn = document.getElementById('btn-leave');
  if (leaveBtn) {
    leaveBtn.addEventListener('click', leaveRide);
  }
}

function joinRide() {
  const seats = parseInt(document.getElementById('seats').textContent);
  if (seats === 0) {
    showToast('Keine freien Plätze vorhanden!', 'error');
    return;
  }
  fetch(`${ridesUrl}/${rideId}/join`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      Authorization: userToken,
      'Content-Type': 'application/json'
    }
  })
    .then(response => {
      if (!response.ok) {
        showToast('Du bist der Fahrt schon beigetreten!', 'error');
        throw new Error(`Fehler: ${response.status} ${response.statusText}`);
      }
      showToast('Erfolgreich der Fahrt beigetreten!', 'success');
      loadParticipants();
      setTimeout(() => {
        location.reload();
      }, 3000);
    })
    .catch(error => {
      console.error(error);
    });
}

function leaveRide() {
  fetch(`${ridesUrl}/${rideId}/leave`, {
    method: 'DELETE',
    headers: {
      accept: 'application/json',
      Authorization: userToken,
      'Content-Type': 'application/json'
    }
  })
    .then(response => {
      if (!response.ok) {
        showToast('Du bist der Fahrt nicht beigetreten!', 'error');
        throw new Error(`Fehler: ${response.status} ${response.statusText}`);
      }
      showToast('Erfolgreich die Fahrt verlassen!', 'success');
      loadParticipants();
      setTimeout(() => {
        location.reload();
      }, 3000);
    })
    .catch(error => {
      console.error(error);
    });
}

function showRemoveDialog(message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.classList.add('modal-overlay');
  const dialog = document.createElement('div');
  dialog.classList.add('modal-dialog');
  const content = document.createElement('p');
  content.textContent = message;
  const btnContainer = document.createElement('div');
  btnContainer.classList.add('modal-buttons');
  const confirmBtn = document.createElement('button');
  confirmBtn.textContent = 'Entfernen';
  confirmBtn.classList.add('modal-confirm-btn');
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Abbrechen';
  cancelBtn.classList.add('modal-cancel-btn');
  btnContainer.appendChild(confirmBtn);
  btnContainer.appendChild(cancelBtn);
  dialog.appendChild(content);
  dialog.appendChild(btnContainer);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  confirmBtn.addEventListener('click', () => {
    document.body.removeChild(overlay);
    onConfirm();
  });
  cancelBtn.addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
}
