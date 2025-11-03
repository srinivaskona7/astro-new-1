const form = document.getElementById('horoscopeForm');
const loadingEl = document.getElementById('loading');
const resultEl = document.getElementById('result');
const placeInput = document.getElementById('place');
const suggestionsContainer = document.getElementById('searchSuggestions');

let currentCoordinates = null;
let suggestionIndex = -1;
const GEO_API_KEY = '81b56c410d08b1d5653d3af091632562';

function debounce(fn, ms) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

async function fetchLocationSuggestions(query) {
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${GEO_API_KEY}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Location fetch failed');
    const data = await res.json();
    return data;
  } catch (e) {
    console.error('[Location Search] Error:', e);
    return [];
  }
}

function renderSuggestions(locations) {
  if (!locations.length) {
    suggestionsContainer.style.display = 'none';
    suggestionsContainer.innerHTML = '';
    suggestionIndex = -1;
    return;
  }
  suggestionsContainer.innerHTML = locations
    .map((loc, idx) => {
      const name = `${loc.name}${loc.state ? ', ' + loc.state : ''}, ${loc.country}`;
      return `<div class="suggestion-item${idx === suggestionIndex ? ' active' : ''}" data-lat="${loc.lat}" data-lon="${loc.lon}" tabindex="0">${name}</div>`;
    })
    .join('');
  suggestionsContainer.style.display = 'block';
}

placeInput.addEventListener('input', debounce(async function () {
  suggestionIndex = -1;
  const query = this.value.trim();
  if (query.length < 2) {
    suggestionsContainer.style.display = 'none';
    suggestionsContainer.innerHTML = '';
    return;
  }
  const locs = await fetchLocationSuggestions(query);
  renderSuggestions(locs);
}, 300));

suggestionsContainer.addEventListener('click', function (e) {
  const el = e.target.closest('.suggestion-item');
  if (!el) return;
  placeInput.value = el.textContent;
  currentCoordinates = `${el.getAttribute('data-lat')},${el.getAttribute('data-lon')}`;
  suggestionsContainer.style.display = 'none';
  suggestionsContainer.innerHTML = '';
  suggestionIndex = -1;
});

placeInput.addEventListener('keydown', function (e) {
  const items = suggestionsContainer.querySelectorAll('.suggestion-item');
  if (!items.length || suggestionsContainer.style.display === 'none') return;

  if (e.key === 'ArrowDown') {
    suggestionIndex = (suggestionIndex + 1) % items.length;
    updateFocus(items);
    e.preventDefault();
  } else if (e.key === 'ArrowUp') {
    suggestionIndex = (suggestionIndex - 1 + items.length) % items.length;
    updateFocus(items);
    e.preventDefault();
  } else if (e.key === 'Enter' && suggestionIndex >= 0) {
    items[suggestionIndex].click();
    suggestionIndex = -1;
    e.preventDefault();
  }
});

function updateFocus(items) {
  items.forEach((el, idx) => el.classList.toggle('active', idx === suggestionIndex));
  if (items[suggestionIndex]) {
    items[suggestionIndex].scrollIntoView({ block: 'nearest' });
  }
}

document.addEventListener('click', function (e) {
  if (!suggestionsContainer.contains(e.target) && e.target !== placeInput) {
    suggestionsContainer.style.display = 'none';
    suggestionsContainer.innerHTML = '';
    suggestionIndex = -1;
  }
});

form.addEventListener('submit', async e => {
  e.preventDefault();
  loadingEl.style.display = 'block';
  resultEl.style.display = 'none';
  resultEl.innerHTML = '';

  const dob = document.getElementById('date_of_birth').value;
  const tob = document.getElementById('time_of_birth').value;
  const placeName = placeInput.value.trim();

  if (!dob || !tob || !placeName) {
    alert('Please fill all fields!');
    loadingEl.style.display = 'none';
    return;
  }

  try {
    let coords = currentCoordinates;
    if (!coords) {
      const locs = await fetchLocationSuggestions(placeName);
      if (!locs.length) throw new Error('Invalid location');
      coords = `${locs[0].lat},${locs[0].lon}`;
    }
    const response = await fetch('/api/horoscope', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({date_of_birth: dob, time_of_birth: tob, coordinates: coords})
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `HTTP Error ${response.status}`);
    }
    const data = await response.json();
    loadingEl.style.display = 'none';
    resultEl.style.display = 'block';

    if (data.status === 'ok' && data.data) {
      const d = data.data;
      resultEl.innerHTML = `
        <h3>Horoscope Details</h3>
        <div class="horoscope-key-info">
          <div class="horoscope-box">
            <img src="https://cdn-icons-png.flaticon.com/512/3074/3074195.png" alt="Nakshatra" />
            <div><strong>Nakshatra:</strong> ${d.nakshatra?.name ?? 'N/A'} (Pada: ${d.nakshatra?.pada ?? 'N/A'})</div>
          </div>
          <div class="horoscope-box">
            <img src="https://cdn-icons-png.flaticon.com/512/4202/4202839.png" alt="Rasi" />
            <div><strong>Rasi:</strong> ${d.chandra_rasi?.name ?? 'N/A'}</div>
          </div>
          <div class="horoscope-box">
            <img src="https://cdn-icons-png.flaticon.com/512/4240/4240736.png" alt="Ganam" />
            <div><strong>Ganam:</strong> ${d.additional_info?.ganam ?? 'N/A'}</div>
          </div>
          <div class="horoscope-box">
            <img src="https://cdn-icons-png.flaticon.com/512/616/616408.png" alt="Animal Sign" />
            <div><strong>Animal Sign:</strong> ${d.additional_info?.animal_sign ?? 'N/A'}</div>
          </div>
          <div class="horoscope-box">
            <img src="https://cdn-icons-png.flaticon.com/512/2049/2049240.png" alt="Symbol" />
            <div><strong>Symbol:</strong> ${d.additional_info?.symbol ?? 'N/A'}</div>
          </div>
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
    } else {
      resultEl.textContent = 'Could not retrieve horoscope details.';
    }
  } catch (error) {
    loadingEl.style.display = 'none';
    resultEl.style.display = 'block';
    resultEl.textContent = `Error: ${error.message}`;
  }
});
