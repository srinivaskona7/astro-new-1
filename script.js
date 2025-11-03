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
      const fields = [
        ['Nakshatra', `${d.nakshatra?.name ?? 'N/A'} (Pada: ${d.nakshatra?.pada ?? 'N/A'})`],
        ['Nakshatra Lord', `${d.nakshatra?.lord?.name ?? 'N/A'} (${d.nakshatra?.lord?.vedic_name ?? ''})`],
        ['Chandra Rasi', d.chandra_rasi?.name ?? 'N/A'],
        ['Soorya Rasi', d.soorya_rasi?.name ?? 'N/A'],
        ['Zodiac Sign', d.zodiac?.name ?? 'N/A'],
        ['Deity', d.additional_info?.deity ?? 'N/A'],
        ['Ganam', d.additional_info?.ganam ?? 'N/A'],
        ['Symbol', d.additional_info?.symbol ?? 'N/A'],
        ['Animal Sign', d.additional_info?.animal_sign ?? 'N/A'],
        ['Nadi', d.additional_info?.nadi ?? 'N/A'],
        ['Color', d.additional_info?.color ?? 'N/A'],
        ['Best Direction', d.additional_info?.best_direction ?? 'N/A'],
        ['Syllables', d.additional_info?.syllables ?? 'N/A'],
        ['Birth Stone', d.additional_info?.birth_stone ?? 'N/A'],
        ['Gender', d.additional_info?.gender ?? 'N/A'],
        ['Planet', d.additional_info?.planet ?? 'N/A'],
        ['Enemy Yoni', d.additional_info?.enemy_yoni ?? 'N/A'],
      ];
      resultEl.innerHTML = '<h3>Horoscope Details</h3>' + 
        fields.map(([k,v]) => 
          `<div class="result-row"><strong>${k}:</strong> ${v}</div>`
        ).join('');
    } else {
      resultEl.textContent = 'Could not retrieve horoscope details.';
    }
  } catch (error) {
    loadingEl.style.display = 'none';
    resultEl.style.display = 'block';
    resultEl.textContent = `Error: ${error.message}`;
  }
});
