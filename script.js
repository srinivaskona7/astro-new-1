const tabHoroscope = document.getElementById('tabHoroscope');
const tabMatching = document.getElementById('tabMatching');
const horoscopeSection = document.getElementById('horoscopeSection');
const matchingSection = document.getElementById('matchingSection');
const resultEl = document.getElementById('result');
const matchingResult = document.getElementById('matchingResult');

tabHoroscope.onclick = () => {
  tabHoroscope.classList.add('active');
  tabMatching.classList.remove('active');
  horoscopeSection.classList.add('active');
  matchingSection.classList.remove('active');
  resultEl.hidden = true;
  matchingResult.hidden = true;
};

tabMatching.onclick = () => {
  tabHoroscope.classList.remove('active');
  tabMatching.classList.add('active');
  horoscopeSection.classList.remove('active');
  matchingSection.classList.add('active');
  resultEl.hidden = true;
  matchingResult.hidden = true;
};

async function fetchLocations(query) {
  if (!query || query.length < 2) return [];
  const key = '81b56c410d08b1d5653d3af091632562'; // Replace with your OWM API key
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${key}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

function setupAutocomplete(inputEl, suggestionsEl) {
  let selectedIdx = -1;
  inputEl.addEventListener('input', async () => {
    selectedIdx = -1;
    const query = inputEl.value.trim();
    const results = await fetchLocations(query);
    if (!results.length) {
      suggestionsEl.style.display = 'none';
      suggestionsEl.innerHTML = '';
      inputEl.dataset.coords = '';
      return;
    }
    suggestionsEl.innerHTML = results.map((res, idx) => `<div class="suggestion-item${idx === selectedIdx ? ' active' : ''}" data-lat="${res.lat}" data-lon="${res.lon}">${res.name}${res.state ? ', ' + res.state : ''}, ${res.country}</div>`).join('');
    suggestionsEl.style.display = 'block';
  });

  suggestionsEl.addEventListener('click', (e) => {
    const item = e.target.closest('.suggestion-item');
    if (!item) return;
    inputEl.value = item.textContent;
    inputEl.dataset.coords = `${item.dataset.lat},${item.dataset.lon}`;
    suggestionsEl.style.display = 'none';
    suggestionsEl.innerHTML = '';
  });

  inputEl.addEventListener('keydown', (e) => {
    const items = suggestionsEl.querySelectorAll('.suggestion-item');
    if (!items.length || suggestionsEl.style.display === 'none') return;
    if (e.key === 'ArrowDown') {
      selectedIdx = (selectedIdx + 1) % items.length;
      updateFocus(items, selectedIdx);
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      selectedIdx = (selectedIdx - 1 + items.length) % items.length;
      updateFocus(items, selectedIdx);
      e.preventDefault();
    } else if (e.key === 'Enter') {
      if (selectedIdx >= 0) {
        items[selectedIdx].click();
        e.preventDefault();
      }
    }
  });

  document.addEventListener('click', (e) => {
    if (!suggestionsEl.contains(e.target) && e.target !== inputEl) {
      suggestionsEl.style.display = 'none';
      suggestionsEl.innerHTML = '';
    }
  });
}

function updateFocus(items, idx) {
  items.forEach((el, i) => el.classList.toggle('active', i === idx));
  if (items[idx]) items[idx].scrollIntoView({ block: 'nearest' });
}

setupAutocomplete(document.getElementById('place'), document.getElementById('searchSuggestions'));
setupAutocomplete(document.getElementById('girl_place'), document.getElementById('searchSuggestionsGirl'));
setupAutocomplete(document.getElementById('boy_place'), document.getElementById('searchSuggestionsBoy'));

function createProgressCircle(current, max) {
  const percent = Math.round((current / max) * 100);
  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference * (1 - percent / 100);
  return `
    <div class="progress-circle" title="${percent}%">
      <svg>
        <circle class="progress-bg" cx="18" cy="18" r="${radius}"/>
        <circle class="progress-fg" cx="18" cy="18" r="${radius}" stroke-dasharray="${circumference}" stroke-dashoffset="${dashoffset}" />
        <text x="18" y="21" class="progress-text">${percent}%</text>
      </svg>
    </div>`;
}

function renderDetailTable(obj) {
  return `<table class="kundali-details-table">
    <tbody>
      <tr><th>Rasi</th><td>${obj.rasi?.name || ''} (${obj.rasi?.lord?.name || ''} / ${obj.rasi?.lord?.vedic_name || ''})</td></tr>
      <tr><th>Nakshatra</th><td>${obj.nakshatra?.name || ''} (${obj.nakshatra?.lord?.name || ''} / ${obj.nakshatra?.lord?.vedic_name || ''}), Pada: ${obj.nakshatra?.pada || ''}</td></tr>
      <tr><th>Varna</th><td>${obj.koot?.varna || ''}</td></tr>
      <tr><th>Vasya</th><td>${obj.koot?.vasya || ''}</td></tr>
      <tr><th>Tara</th><td>${obj.koot?.tara || ''}</td></tr>
      <tr><th>Yoni</th><td>${obj.koot?.yoni || ''}</td></tr>
      <tr><th>Graha Maitri</th><td>${obj.koot?.graha_maitri || ''}</td></tr>
      <tr><th>Gana</th><td>${obj.koot?.gana || ''}</td></tr>
      <tr><th>Bhakoot</th><td>${obj.koot?.bhakoot || ''}</td></tr>
      <tr><th>Nadi</th><td>${obj.koot?.nadi || ''}</td></tr>
    </tbody>
  </table>`;
}

document.getElementById('horoscopeForm').onsubmit = async (e) => {
  e.preventDefault();
  const loadingEl = document.getElementById('loading');
  const resultEl = document.getElementById('result');
  resultEl.innerHTML = '';
  resultEl.hidden = true;
  loadingEl.textContent = 'Loading…';

  const dob = document.getElementById('date_of_birth').value;
  const tob = document.getElementById('time_of_birth').value;
  const place = document.getElementById('place').value.trim();
  let coords = document.getElementById('place').dataset.coords;

  if (!coords) {
    const locs = await fetchLocations(place);
    if (!locs.length) {
      alert('Invalid place');
      loadingEl.textContent = '';
      return;
    }
    coords = `${locs[0].lat},${locs[0].lon}`;
  }

  try {
    const resp = await fetch('/api/horoscope', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date_of_birth: dob, time_of_birth: tob, coordinates: coords }),
    });
    const data = await resp.json();
    loadingEl.textContent = '';

    if (resp.ok && data.status === 'ok' && data.data) {
      renderHoroscope(data.data);
      resultEl.hidden = false;
    } else {
      alert('Failed to fetch horoscope');
    }
  } catch (err) {
    alert('Error fetching horoscope: ' + err.message);
  }
};

function renderHoroscope(d) {
  const resultEl = document.getElementById('result');
  resultEl.innerHTML = `
  <div class="horoscope-top">
    <div class="horo-box">Nakshatra ${d.nakshatra?.name || ''} (Pada: ${d.nakshatra?.pada || ''})</div>
    <div class="horo-box">Rasi ${d.chandra_rasi?.name || ''}</div>
    <div class="horo-box">Ganam ${d.additional_info?.ganam || ''}</div>
    <div class="horo-box">Animal Sign ${d.additional_info?.animal_sign || ''}</div>
    <div class="horo-box">Symbol ${d.additional_info?.symbol || ''}</div>
  </div>
  <table class="details-table">
    <tbody>
      <tr><th>Nakshatra Lord</th><td>${d.nakshatra?.lord?.name || ''} (${d.nakshatra?.lord?.vedic_name || ''})</td></tr>
      <tr><th>Soorya Rasi</th><td>${d.soorya_rasi?.name || ''}</td></tr>
      <tr><th>Zodiac Sign</th><td>${d.zodiac?.name || ''}</td></tr>
      <tr><th>Deity</th><td>${d.additional_info?.deity || ''}</td></tr>
      <tr><th>Nadi</th><td>${d.additional_info?.nadi || ''}</td></tr>
      <tr><th>Color</th><td>${d.additional_info?.color || ''}</td></tr>
      <tr><th>Best Direction</th><td>${d.additional_info?.best_direction || ''}</td></tr>
      <tr><th>Syllables</th><td>${d.additional_info?.syllables || ''}</td></tr>
      <tr><th>Birth Stone</th><td>${d.additional_info?.birth_stone || ''}</td></tr>
      <tr><th>Gender</th><td>${d.additional_info?.gender || ''}</td></tr>
      <tr><th>Planet</th><td>${d.additional_info?.planet || ''}</td></tr>
      <tr><th>Enemy Yoni</th><td>${d.additional_info?.enemy_yoni || ''}</td></tr>
    </tbody>
  </table>`;
  resultEl.hidden = false;
}

document.getElementById('matchingForm').onsubmit = async (e) => {
  e.preventDefault();
  const loadingEl = document.getElementById('loadingMatching');
  const matchEl = document.getElementById('matchingResult');
  matchEl.innerHTML = '';
  matchEl.hidden = true;
  loadingEl.textContent = 'Loading…';

  const girlDobRaw = document.getElementById('girl_dob').value;
  const boyDobRaw = document.getElementById('boy_dob').value;
  const girlPlace = document.getElementById('girl_place').value.trim();
  const boyPlace = document.getElementById('boy_place').value.trim();
  let girlCoords = document.getElementById('girl_place').dataset.coords;
  let boyCoords = document.getElementById('boy_place').dataset.coords;

  if (!girlDobRaw || !boyDobRaw || !girlPlace || !boyPlace) {
    alert('Fill all fields');
    loadingEl.textContent = '';
    return;
  }

  const girlDob = girlDobRaw.endsWith('Z') || girlDobRaw.includes('+') ? girlDobRaw : girlDobRaw + ':00+05:30';
  const boyDob = boyDobRaw.endsWith('Z') || boyDobRaw.includes('+') ? boyDobRaw : boyDobRaw + ':00+05:30';

  if (!girlCoords) {
    const locs = await fetchLocations(girlPlace);
    if (!locs.length) {
      alert("Invalid girl's place");
      loadingEl.textContent = '';
      return;
    }
    girlCoords = `${locs[0].lat},${locs[0].lon}`;
  }
  if (!boyCoords) {
    const locs = await fetchLocations(boyPlace);
    if (!locs.length) {
      alert("Invalid boy's place");
      loadingEl.textContent = '';
      return;
    }
    boyCoords = `${locs[0].lat},${locs[0].lon}`;
  }

  try {
    const resp = await fetch('/api/kundali-matching', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ayanamsa: 1,
        girl_coordinates: girlCoords,
        girl_dob: girlDob,
        boy_coordinates: boyCoords,
        boy_dob: boyDob,
        la: 'en',
      }),
    });
    const data = await resp.json();
    loadingEl.textContent = '';
    if (resp.ok && data.status === 'ok' && data.data) {
      displayKundaliMatch(data.data);
      matchEl.hidden = false;
    } else {
      alert('Failed to fetch kundali matching');
    }
  } catch (err) {
    loadingEl.textContent = '';
    alert('Error: ' + err.message);
  }
};

function displayKundaliMatch(data) {
  const gm = data.guna_milan || {};
  const pointsRows = (gm.guna || []).map(g => `
    <tr>
      <td>${g.name}</td>
      <td>${g.girl_koot}</td>
      <td>${g.boy_koot}</td>
      <td>
        ${g.obtained_points} / ${g.maximum_points}
        ${createProgressCircle(g.obtained_points, g.maximum_points)}
      </td>
    </tr>`).join('');

  document.getElementById('matchingResult').innerHTML = `
  <div class="kundali-container">
    <div class="kundali-card">
      <h4>Boy's Details</h4>
      ${renderDetailTable(data.boy_info)}
    </div>
    <div class="kundali-card">
      <h4>Girl's Details</h4>
      ${renderDetailTable(data.girl_info)}
    </div>
  </div>
  <div class="match-summary">
    <h4>Match Summary</h4>
    <p>${data.message?.description || ''}</p>
  </div>
  <table class="points-table">
    <thead><tr><th>Koot</th><th>Girl</th><th>Boy</th><th>Points</th></tr></thead>
    <tbody>
      ${pointsRows}
      <tr class="total-row">
        <td colspan="3">Total Points</td>
        <td>
          ${gm.total_points || 0} / ${gm.maximum_points || 0}
          ${createProgressCircle(gm.total_points || 0, gm.maximum_points || 0)}
        </td>
      </tr>
    </tbody>
  </table>`;
  document.getElementById('matchingResult').hidden = false;
}
