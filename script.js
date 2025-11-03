// --- Global Element Initialization ---
const tabHoroscope = document.getElementById('tabHoroscope');
const tabMatching = document.getElementById('tabMatching');
const sectionHoroscope = document.getElementById('horoscopeSection');
const sectionMatching = document.getElementById('matchingSection');

const resultContainer = document.getElementById('result');
const matchContainer = document.getElementById('matchingResult');

const placeInput = document.getElementById('place');
const suggestionsDiv = document.getElementById('searchSuggestions');
const girlPlaceInput = document.getElementById('girl_place');
const girlSuggestionsDiv = document.getElementById('searchSuggestionsGirl');
const boyPlaceInput = document.getElementById('boy_place');
const boySuggestionsDiv = document.getElementById('searchSuggestionsBoy');

// --- Tab Switching ---
function switchTab(tabType) {
  if (tabType === 'horoscope') {
    sectionHoroscope.classList.add('active');
    sectionMatching.classList.remove('active');
    tabHoroscope.classList.add('active');
    tabMatching.classList.remove('active');
  } else {
    sectionHoroscope.classList.remove('active');
    sectionMatching.classList.add('active');
    tabHoroscope.classList.remove('active');
    tabMatching.classList.add('active');
  }
}
document.getElementById('tabHoroscope').onclick = () => switchTab('horoscope');
document.getElementById('tabMatching').onclick = () => switchTab('matching');

// --- Helper functions for fetch & autocomplete ---
async function fetchLocation(query) {
  if (!query || query.length < 2) return [];
  try {
    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=81b56c410d08b1d5653d3af091632562`
    );
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

function setupAutocomplete(inputEl, suggestionsDiv, callback) {
  let selectedIndex = -1;
  inputEl.addEventListener('input', async () => {
    selectedIndex = -1;
    const query = inputEl.value.trim();
    const options = await fetchLocation(query);
    if (!options.length) {
      suggestionsDiv.innerHTML = '';
      suggestionsDiv.style.display = 'none';
      inputEl.dataset.coords = '';
      return;
    }
    suggestionsDiv.innerHTML = options
      .map((loc, idx) => `
        <div class="suggestion-item ${idx === selectedIndex ? 'active' : ''}" 
             data-lat="${loc.lat}" data-lon="${loc.lon}">
          ${loc.name}${loc.state ? ', ' + loc.state : ''}, ${loc.country}
        </div>
      `)
      .join('');
    suggestionsDiv.style.display = 'block';
  });
  suggestionsDiv.onclick = (e) => {
    const item = e.target.closest('.suggestion-item');
    if (!item) return;
    inputEl.value = item.innerText;
    inputEl.dataset.coords = `${item.dataset.lat},${item.dataset.lon}`;
    suggestionsDiv.style.display = 'none';
  };
  inputEl.addEventListener('keydown', (e) => {
    const items = suggestionsDiv.querySelectorAll('.suggestion-item');
    if (!items.length || suggestionsDiv.style.display === 'none') return;
    if (e.key === 'ArrowDown') {
      selectedIndex = (selectedIndex + 1) % items.length;
    } else if (e.key === 'ArrowUp') {
      selectedIndex = (selectedIndex - 1 + items.length) % items.length;
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0) {
        items[selectedIndex].click();
        e.preventDefault();
      }
    }
    items.forEach((el, idx) => el.classList.toggle('active', idx === selectedIndex));
  });
}

// --- Initialize autocompletion ---
setupAutocomplete(placeInput, suggestionsDiv);
setupAutocomplete(girlPlaceInput, girlSuggestionsDiv);
setupAutocomplete(boyPlaceInput, boySuggestionsDiv);

// --- Horoscope Fetch & Render ---
document.getElementById('horoscopeForm').onsubmit = async (e) => {
  e.preventDefault();
  resultContainer.innerHTML = '';
  resultContainer.hidden = true;
  document.getElementById('loading').innerText = 'Loading...';
  const dob = document.getElementById('date_of_birth').value;
  const tob = document.getElementById('time_of_birth').value;
  const place = placeInput.value.trim();
  let coords = placeInput.dataset.coords;

  if (!coords) {
    const locs = await fetchLocation(place);
    if (locs.length) {
      coords = `${locs[0].lat},${locs[0].lon}`;
    } else {
      alert('Invalid place.');
      document.getElementById('loading').innerText = '';
      return;
    }
  }
  try {
    const response = await fetch('/api/horoscope', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({date_of_birth: dob, time_of_birth: tob, coordinates: coords}),
    });
    const data = await response.json();
    document.getElementById('loading').innerText = '';
    if (response.ok && data.status === 'ok' && data.data) {
      renderHoroscope(data.data);
      resultContainer.hidden = false;
    } else {
      resultContainer.innerText = 'Failed to generate horoscope.';
      resultContainer.hidden = false;
    }
  } catch (err) {
    document.getElementById('loading').innerText = '';
    resultContainer.innerText = `Error: ${err.message}`;
    resultContainer.hidden = false;
  }
};

function renderHoroscope(d) {
  resultContainer.innerHTML = `
    <div class="horoscope-box" style="margin-bottom:12px;">
      <div><strong>Nakshatra</strong> ${d.nakshatra?.name ?? ''} (Pada: ${d.nakshatra?.pada ?? ''})</div>
    </div>
    <div class="horoscope-box" style="margin-bottom:12px;">
      <div><strong>Rasi</strong> ${d.chandra_rasi?.name ?? ''}</div>
    </div>
    <div class="horoscope-box" style="margin-bottom:12px;">
      <div><strong>Ganam</strong> ${d.additional_info?.ganam ?? ''}</div>
    </div>
    <div class="horoscope-box" style="margin-bottom:12px;">
      <div><strong>Animal Sign</strong> ${d.additional_info?.animal_sign ?? ''}</div>
    </div>
    <div class="horoscope-box" style="margin-bottom:12px;">
      <div><strong>Symbol</strong> ${d.additional_info?.symbol ?? ''}</div>
    </div>
    <table class="details-table">
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
    </table>
  `;
}

// --- Kundali Matching Submission & Render ---
document.getElementById('matchingForm').onsubmit = async (e) => {
  e.preventDefault();
  matchContainer.hidden = true;
  document.getElementById('loadingMatching').innerText = 'Loading...';

  const girlDob = document.getElementById('girl_dob').value;
  const boyDob = document.getElementById('boy_dob').value;
  const girlPlace = girlPlaceInput.value.trim();
  const boyPlace = boyPlaceInput.value.trim();
  let girlCoords = girlPlaceInput.dataset.coords;
  let boyCoords = boyPlaceInput.dataset.coords;

  // Convert datetimes into ISO
  function toISO(s) { return s ? s + ':00+05:30' : ''; }
  const girlISO = toISO(girlDob);
  const boyISO = toISO(boyDob);

  if (!girlDob || !boyDob || !girlPlace || !boyPlace) {
    alert('Fill all required kundali details.');
    document.getElementById('loadingMatching').innerText = '';
    return;
  }

  // Geocode if missing
  if (!girlCoords) {
    const locs = await fetchLocation(girlPlace);
    if (!locs.length) { alert("Invalid girl's place"); return; }
    girlCoords = `${locs[0].lat},${locs[0].lon}`;
  }
  if (!boyCoords) {
    const locs = await fetchLocation(boyPlace);
    if (!locs.length) { alert("Invalid boy's place"); return; }
    boyCoords = `${locs[0].lat},${locs[0].lon}`;
  }

  try {
    // Call backend API with correct params
    const res = await fetch('/api/kundali-matching', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ ayanamsa: 1, girl_coordinates: girlCoords, girl_dob: girlISO, boy_coordinates: boyCoords, boy_dob: boyISO, la: 'en' })
    });
    const data = await res.json();
    document.getElementById('loadingMatching').innerText = '';

    if (res.ok && data.status === 'ok' && data.data) {
      // Render full matching info
      matchContainer.innerHTML = `
      <div class="kundali-match-details">
        <div class="match-person">
          <h4>Girl's Horoscope</h4>
          <div class="nakshatra-block">
            <div class="nakshatra">${data.data.girl_info?.nakshatra?.name ?? ''}</div>
            <div class="pada">Pada ${data.data.girl_info?.nakshatra?.pada ?? ''}</div>
          </div>
          <ul class="kundali-details">
            <li><strong>Rasi:</strong> ${data.data.girl_info?.rasi?.name ?? ''}</li>
            <li><strong>Varna:</strong> ${data.data.girl_info?.koot?.varna ?? ''}</li>
            <!-- additional info here -->
          </ul>
        </div>
        <div class="match-person">
          <h4>Boy's Horoscope</h4>
          <div class="nakshatra-block">
            <div class="nakshatra">${data.data.boy_info?.nakshatra?.name ?? ''}</div>
            <div class="pada">Pada ${data.data.boy_info?.nakshatra?.pada ?? ''}</div>
          </div>
          <ul class="kundali-details">
            <li><strong>Rasi:</strong> ${data.data.boy_info?.rasi?.name ?? ''}</li>
            <li><strong>Varna:</strong> ${data.data.boy_info?.koot?.varna ?? ''}</li>
            <!-- additional info here -->
          </ul>
        </div>
      </div>
      <div class="match-summary">
        <h4>Match Compatibility</h4>
        <p>${data.data.message?.description ?? ''}</p>
      </div>
      <table class="points-table">
        <thead><tr><th>Koot</th><th>Girl</th><th>Boy</th><th>Points</th></tr></thead>
        <tbody>
          ${data.data.guna_milan.guna.map(g => `
          <tr>
            <td>${g.name}</td>
            <td>${g.girl_koot}</td>
            <td>${g.boy_koot}</td>
            <td>${g.obtained_points}/${g.maximum_points}</td>
          </tr>`).join('')}
          <tr class="total-row">
            <td colspan="3">Total Points</td>
            <td>${data.data.guna_milan.total_points} / ${data.data.guna_milan.maximum_points}</td>
          </tr>
        </tbody>
      </table>`;
      matchContainer.hidden = false;
    }
  } catch (err) {
    document.getElementById('loadingMatching').innerText = '';
    alert('Error fetching match data: ' + err.message);
  }
};
