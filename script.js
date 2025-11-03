const tabHoroscope = document.getElementById('tabHoroscope');
const tabMatching = document.getElementById('tabMatching');
const horoscopeSection = document.getElementById('horoscopeSection');
const matchingSection = document.getElementById('matchingSection');

const resultEl = document.getElementById('result');
const matchingResult = document.getElementById('matchingResult');

const placeInput = document.getElementById('place');
const suggestionsContainer = document.getElementById('searchSuggestions');
const placeInputGirl = document.getElementById('girl_place');
const suggestionsContainerGirl = document.getElementById('searchSuggestionsGirl');
const placeInputBoy = document.getElementById('boy_place');
const suggestionsContainerBoy = document.getElementById('searchSuggestionsBoy');

tabHoroscope.addEventListener('click', () => {
  tabHoroscope.classList.add('active');
  tabMatching.classList.remove('active');
  horoscopeSection.classList.add('active');
  matchingSection.classList.remove('active');
  resultEl.hidden = true;
  matchingResult.hidden = true;
});

tabMatching.addEventListener('click', () => {
  tabHoroscope.classList.remove('active');
  tabMatching.classList.add('active');
  horoscopeSection.classList.remove('active');
  matchingSection.classList.add('active');
  resultEl.hidden = true;
  matchingResult.hidden = true;
});

function debounce(func, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}

async function fetchLocations(query) {
  if (!query) return [];
  try {
    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
        query
      )}&limit=5&appid=81b56c410d08b1d5653d3af091632562`
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data;
  } catch {
    return [];
  }
}

function setupAutocomplete(input, container) {
  let localIndex = -1;
  let locations = [];

  input.addEventListener(
    'input',
    debounce(async () => {
      localIndex = -1;
      const val = input.value.trim();
      if (val.length < 2) {
        container.style.display = 'none';
        container.innerHTML = '';
        return;
      }
      locations = await fetchLocations(val);
      if (!locations.length) {
        container.style.display = 'none';
        container.innerHTML = '';
        return;
      }
      container.innerHTML = locations
        .map(
          (loc, i) =>
            `<div class="suggestion-item ${
              i === localIndex ? 'active' : ''
            }" data-lat="${loc.lat}" data-lon="${loc.lon}">${loc.name}${
              loc.state ? ', ' + loc.state : ''
            }, ${loc.country}</div>`
        )
        .join('');
      container.style.display = 'block';
    }, 300)
  );

  container.addEventListener('click', (e) => {
    const div = e.target.closest('.suggestion-item');
    if (!div) return;
    input.value = div.textContent;
    input.dataset.coordinates = `${div.getAttribute('data-lat')},${div.getAttribute(
      'data-lon'
    )}`;
    container.style.display = 'none';
    container.innerHTML = '';
  });

  input.addEventListener('keydown', (e) => {
    const items = container.querySelectorAll('.suggestion-item');
    if (!items.length || container.style.display === 'none') return;
    if (e.key === 'ArrowDown') {
      localIndex = (localIndex + 1) % items.length;
      updateFocus(items, localIndex);
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      localIndex = (localIndex - 1 + items.length) % items.length;
      updateFocus(items, localIndex);
      e.preventDefault();
    } else if (e.key === 'Enter' && localIndex >= 0) {
      items[localIndex].click();
      e.preventDefault();
    }
  });

  document.addEventListener('click', (e) => {
    if (!container.contains(e.target) && e.target !== input) {
      container.style.display = 'none';
      container.innerHTML = '';
    }
  });
}

function updateFocus(items, index) {
  items.forEach((item, i) => item.classList.toggle('active', i === index));
  if (items[index]) {
    items[index].scrollIntoView({ block: 'nearest' });
  }
}

// Initialize autocomplete on all inputs
setupAutocomplete(placeInput, suggestionsContainer);
setupAutocomplete(placeInputGirl, suggestionsContainerGirl);
setupAutocomplete(placeInputBoy, suggestionsContainerBoy);

function toISO8601(s) {
  if (!s) return '';
  if (s.endsWith('Z') || s.includes('+')) return s;
  return s + ':00+05:30'; // append seconds & IST as default timezone
}

document.getElementById('horoscopeForm').onsubmit = async (e) => {
  e.preventDefault();
  resultEl.hidden = true;
  const loading = document.getElementById('loading');
  loading.textContent = 'Loading horoscope...';
  resultEl.innerHTML = '';

  const dob = document.getElementById('date_of_birth').value;
  const tob = document.getElementById('time_of_birth').value;
  const place = placeInput.value.trim();
  let coordinates = placeInput.dataset.coordinates;

  if (!dob || !tob || !place) {
    loading.textContent = '';
    alert('Please fill all fields');
    return;
  }

  if (!coordinates) {
    const locs = await fetchLocations(place);
    if (!locs.length) {
      loading.textContent = '';
      alert('Invalid place');
      return;
    }
    coordinates = `${locs[0].lat},${locs[0].lon}`;
  }

  try {
    const res = await fetch('/api/horoscope', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date_of_birth: dob, time_of_birth: tob, coordinates }),
    });
    if (!res.ok) throw new Error('Horoscope fetch failed');
    const data = await res.json();

    loading.textContent = '';
    if (data.status === 'ok' && data.data) {
      const d = data.data;
      resultEl.innerHTML = `
      <h3>Horoscope Details</h3>
      <div class="horoscope-key-info">
        <div class="horoscope-box"><span>🕉️</span><div><strong>Nakshatra:</strong> ${d.nakshatra?.name ?? ''} (Pada: ${d.nakshatra?.pada ?? ''})</div></div>
        <div class="horoscope-box"><span>🧑🏻</span><div><strong>Rasi:</strong> ${d.chandra_rasi?.name ?? ''}</div></div>
        <div class="horoscope-box"><span>👥</span><div><strong>Ganam:</strong> ${d.additional_info?.ganam ?? ''}</div></div>
        <div class="horoscope-box"><span>🐯</span><div><strong>Animal Sign:</strong> ${d.additional_info?.animal_sign ?? ''}</div></div>
        <div class="horoscope-box"><span>🎈</span><div><strong>Symbol:</strong> ${d.additional_info?.symbol ?? ''}</div></div>
      </div>
      <table class="horoscope-table">
        <tbody>
          <tr><th>Nakshatra Lord</th><td>${d.nakshatra?.lord?.name ?? ''} (${d.nakshatra?.lord?.vedic_name ?? ''})</td></tr>
          <tr><th>Soorya Rasi</th><td>${d.soorya_rasi?.name ?? ''}</td></tr>
          <tr><th>Zodiac Sign</th><td>${d.zodiac?.name ?? ''}</td></tr>
          <tr><th>Deity</th><td>${d.additional_info?.deity ?? ''}</td></tr>
          <tr><th>Nadi</th><td>${d.additional_info?.nadi ?? ''}</td></tr>
          <tr><th>Color</th><td>${d.additional_info?.color ?? ''}</td></tr>
          <tr><th>Best Direction</th><td>${d.additional_info?.best_direction ?? ''}</td></tr>
          <tr><th>Syllables</th><td>${d.additional_info?.syllables ?? ''}</td></tr>
          <tr><th>Birth Stone</th><td>${d.additional_info?.birth_stone ?? ''}</td></tr>
          <tr><th>Gender</th><td>${d.additional_info?.gender ?? ''}</td></tr>
          <tr><th>Planet</th><td>${d.additional_info?.planet ?? ''}</td></tr>
          <tr><th>Enemy Yoni</th><td>${d.additional_info?.enemy_yoni ?? ''}</td></tr>
        </tbody>
      </table>`;
      resultEl.hidden = false;
    } else {
      resultEl.textContent = 'Error: Could not generate horoscope.';
      resultEl.hidden = false;
    }
  } catch (error) {
    loading.textContent = '';
    resultEl.hidden = false;
    resultEl.textContent = `Error: ${error.message}`;
  }
};

document.getElementById('matchingForm').onsubmit = async (e) => {
  e.preventDefault();
  matchingResult.hidden = true;
  const loadingMatching = document.getElementById('loadingMatching');
  loadingMatching.textContent = 'Loading matching results...';
  matchingResult.innerHTML = '';

  const girlDOB = document.getElementById('girl_dob').value;
  const boyDOB = document.getElementById('boy_dob').value;
  const girlPlace = placeInputGirl.value.trim();
  const boyPlace = placeInputBoy.value.trim();
  let girlCoords = placeInputGirl.dataset.coordinates;
  let boyCoords = placeInputBoy.dataset.coordinates;

  function toISO8601(s) {
    if (!s) return '';
    if (s.endsWith('Z') || s.includes('+')) return s;
    return s + ':00+05:30';
  }

  const girl_dob_ISO = toISO8601(girlDOB);
  const boy_dob_ISO = toISO8601(boyDOB);

  if (!girlDOB || !boyDOB || !girlPlace || !boyPlace) {
    loadingMatching.textContent = '';
    alert('Please fill all fields for matching.');
    return;
  }

  if (!girlCoords) {
    const resp = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
        girlPlace
      )}&limit=1&appid=81b56c410d08b1d5653d3af091632562`
    );
    const locs = resp.ok ? await resp.json() : [];
    if (!locs.length) {
      loadingMatching.textContent = '';
      alert("Couldn't resolve girl's place");
      return;
    }
    girlCoords = `${locs[0].lat},${locs[0].lon}`;
  }
  if (!boyCoords) {
    const resp = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
        boyPlace
      )}&limit=1&appid=81b56c410d08b1d5653d3af091632562`
    );
    const locs = resp.ok ? await resp.json() : [];
    if (!locs.length) {
      loadingMatching.textContent = '';
      alert("Couldn't resolve boy's place");
      return;
    }
    boyCoords = `${locs[0].lat},${locs[0].lon}`;
  }

  try {
    const res = await fetch('/api/kundali-matching', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ayanamsa: 1,
        girl_coordinates: girlCoords,
        girl_dob: girl_dob_ISO,
        boy_coordinates: boyCoords,
        boy_dob: boy_dob_ISO,
        la: 'en'
      }),
    });
    if (!res.ok) throw new Error('Matching API call failed');
    const data = await res.json();

    loadingMatching.textContent = '';
    if (data.status === 'ok' && data.data) {
      const girl = data.data.girl_info;
      const boy = data.data.boy_info;
      const gm = data.data.guna_milan;
      matchingResult.innerHTML = `
        <h3>Kundali Matching Result</h3>
        <div class="kundali-sections">
          <div class="kundali-section">
            <h3>Girl's Horoscope</h3>
            <p><strong>Nakshatra:</strong> ${girl.nakshatra?.name}</p>
            <p><strong>Rasi:</strong> ${girl.rasi?.name}</p>
            <p><strong>Varna:</strong> ${girl.koot?.varna}</p>
            <p><strong>Vasya:</strong> ${girl.koot?.vasya}</p>
            <p><strong>Tara:</strong> ${girl.koot?.tara}</p>
            <p><strong>Yoni:</strong> ${girl.koot?.yoni}</p>
            <p><strong>Graha Maitri:</strong> ${girl.koot?.graha_maitri}</p>
            <p><strong>Gana:</strong> ${girl.koot?.gana}</p>
            <p><strong>Bhakoot:</strong> ${girl.koot?.bhakoot}</p>
            <p><strong>Nadi:</strong> ${girl.koot?.nadi}</p>
            <p><strong>Mangal Dosha:</strong> ${
              data.data.girl_mangal_dosha_details?.description || 'N/A'
            }</p>
          </div>
          <div class="kundali-section">
            <h3>Boy's Horoscope</h3>
            <p><strong>Nakshatra:</strong> ${boy.nakshatra?.name}</p>
            <p><strong>Rasi:</strong> ${boy.rasi?.name}</p>
            <p><strong>Varna:</strong> ${boy.koot?.varna}</p>
            <p><strong>Vasya:</strong> ${boy.koot?.vasya}</p>
            <p><strong>Tara:</strong> ${boy.koot?.tara}</p>
            <p><strong>Yoni:</strong> ${boy.koot?.yoni}</p>
            <p><strong>Graha Maitri:</strong> ${boy.koot?.graha_maitri}</p>
            <p><strong>Gana:</strong> ${boy.koot?.gana}</p>
            <p><strong>Bhakoot:</strong> ${boy.koot?.bhakoot}</p>
            <p><strong>Nadi:</strong> ${boy.koot?.nadi}</p>
            <p><strong>Mangal Dosha:</strong> ${
              data.data.boy_mangal_dosha_details?.description || 'N/A'
            }</p>
          </div>
        </div>
        <div><strong>Match Summary:</strong> ${data.data.message?.description || ''}</div>
        <table class="horoscope-table" style="margin-top: 18px;">
          <thead>
            <tr>
              <th>Koot</th>
              <th>Girl</th>
              <th>Boy</th>
              <th>Points</th>
              <th>Maximum</th>
            </tr>
          </thead>
          <tbody>
            ${gm.guna
              .map(
                (g) =>
                  `<tr><th>${g.name}</th><td>${g.girl_koot}</td><td>${g.boy_koot}</td><td>${g.obtained_points}</td><td>${g.maximum_points}</td></tr>`
              )
              .join('')}
            <tr>
              <th colspan="3" style="text-align:right;">Total Points</th>
              <td colspan="2">${gm.total_points} / ${gm.maximum_points}</td>
            </tr>
          </tbody>
        </table>
      `;
      matchingResult.hidden = false;
    } else {
      matchingResult.textContent = 'Error fetching matching results.';
      matchingResult.hidden = false;
    }
  } catch (err) {
    loadingMatching.textContent = '';
    matchingResult.textContent = `Error: ${err.message}`;
    matchingResult.hidden = false;
  }
};
