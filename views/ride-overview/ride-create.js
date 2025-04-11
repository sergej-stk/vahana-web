import { showToast } from '/views/toast/toast.js';

document.addEventListener('DOMContentLoaded', () => {
  handleCreateClick();
});

function handleCreateClick() {
  const createBtn = document.getElementById('createBtn');
  if (createBtn) {
    createBtn.addEventListener('click', onCreateRide);
  }
}

async function onCreateRide() {
  const seats = parseInt(document.getElementById('input-seats').value, 10);
  const departureTime = convertToUTC(
    document.getElementById('departure-time').value
  );

  const startObject = await initStartData();
  const destObject = await initDestinationData();

  if (!startObject || !destObject || !departureTime) {
    showToast('Bitte füllen Sie alle erforderlichen Felder aus.', 'error');
    return;
  }

  if (
    !startObject.origin?.coordinates?.latitude ||
    !startObject.origin?.coordinates?.longitude
  ) {
    showToast('Die Start-Addresse exestiert nicht!', 'error');
    return;
  }

  if (
    !destObject.destination?.coordinates?.latitude ||
    !destObject.destination?.coordinates?.longitude
  ) {
    showToast('Die Ziel-Addresse exestiert nicht!', 'error');
    return;
  }

  if (seats > 10) {
    showToast('Maximal nur 10 Plätze!', 'error');
    return;
  }

  const ridesData = {
    origin: startObject.origin,
    destination: destObject.destination,
    departure: departureTime,
    available_seats: seats
  };

  fetch(ridesUrl, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      Authorization: userToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(ridesData)
  }).then(response => {
    if (!response.ok) {
      showToast(
        'Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.',
        'error'
      );
      throw new Error(`Fehler: ${response.status} ${response.statusText}`);
    }
    showToast('Die Fahrt wurde erstellt!', 'success');
    window.location.href = '/rides';
  });
}

async function initStartData() {
  const street = document.getElementById('start-street').value.trim();
  const houseNo = document.getElementById('start-house-number').value.trim();
  const postalCode = document.getElementById('start-postal-code').value.trim();
  const city = document.getElementById('start-city').value.trim();
  const country = document.getElementById('start-country').value.trim();

  const startCords = await getGeolocation(
    `${street} ` +
      `${houseNo}, ` +
      `${postalCode} ` +
      `${city}, ` +
      `${country}`
  );

  if (!street || !houseNo || !postalCode || !city || !country) {
    return null;
  }

  const startData = {
    origin: {
      street: street,
      house_number: houseNo,
      postal_code: postalCode,
      city: city,
      country: country,
      coordinates: {
        latitude: startCords.latitude,
        longitude: startCords.longitude
      }
    }
  };

  return startData;
}

async function initDestinationData() {
  const street = document.getElementById('destination-street').value.trim();
  const houseNo = document
    .getElementById('destination-house-number')
    .value.trim();
  const postalCode = document
    .getElementById('destination-postal-code')
    .value.trim();
  const city = document.getElementById('destination-city').value.trim();
  const country = document.getElementById('destination-country').value.trim();

  const destCords = await getGeolocation(
    `${street} ` +
      `${houseNo}, ` +
      `${postalCode} ` +
      `${city}, ` +
      `${country}`
  );

  if (!street || !houseNo || !postalCode || !city || !country) {
    return null;
  }

  const destinationData = {
    destination: {
      street: street,
      house_number: houseNo,
      postal_code: postalCode,
      city: city,
      country: country,
      coordinates: {
        latitude: destCords.latitude,
        longitude: destCords.longitude
      }
    }
  };

  return destinationData;
}

async function getGeolocation(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    address
  )}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.length > 0) {
      const { lat, lon } = data[0];
      return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
    } else {
      return 0;
    }
  } catch (error) {
    showToast(
      'Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.',
      'error'
    );
    return 0;
  }
}

function convertToUTC(departureTime) {
  if (!departureTime) {
    return;
  }

  const utcDate = new Date(departureTime + 'Z');
  return utcDate.toISOString();
}
