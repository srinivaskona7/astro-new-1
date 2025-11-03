// Your existing elements
const form = document.getElementById('horoscopeForm');
const loadingEl = document.getElementById('loading');
const resultEl = document.getElementById('result');
const placeInput = document.getElementById('place');
const suggestionsContainer = document.getElementById('searchSuggestions');

let currentCoordinates = null;

// Debounced geocoding API calls for location search suggestions
const GEO_API_KEY = '81b56c410d08b1d5653d3af091632562';
function debounce(fn, ms) { let timer; return function (...args) { clearTimeout(timer); timer = setTimeout(() => fn.apply(this, args), ms); }; }
async function fetchLocationSuggestions(query) {
  try {
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${GEO_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Location fetch failed');
    return await res.json();
  } catch {
    return [];
  }
}
function renderSuggestions(locs) {
  if (!locs.length) {
    suggestionsContainer.style.display = 'none';
    suggestionsContainer.innerHTML = '';
    return;
  }
  suggestionsContainer.innerHTML = locs.map(loc => {
    const name = `${loc.name}${loc.state ? ', '+loc.state : ''}, ${loc.country}`;
    return `<div class="suggestion-item" data-lat="${loc.lat}" data-lon="${loc.lon}" style="padding:8px;cursor:pointer;">${name}</div>`;
  }).join('');
  suggestionsContainer.style.display = 'block';
}
placeInput.addEventListener('input', debounce(async function() {
  if (this.value.trim().length < 2) {
    suggestionsContainer.style.display = 'none'; suggestionsContainer.innerHTML = ''; return;
  }
  const locs = await fetchLocationSuggestions(this.value.trim());
  renderSuggestions(locs);
}, 300));
suggestionsContainer.addEventListener('click', e => {
  const el = e.target.closest('.suggestion-item');
  if (!el) return;
  placeInput.value = el.textContent;
  currentCoordinates = `${el.getAttribute('data-lat')},${el.getAttribute('data-lon')}`;
  suggestionsContainer.innerHTML = ''; suggestionsContainer.style.display = 'none';
});
document.addEventListener('click', e => {
  if (!suggestionsContainer.contains(e.target) && e.target !== placeInput) {
    suggestionsContainer.style.display = 'none'; suggestionsContainer.innerHTML = '';
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
      // Fallback geocode
      const locs = await fetchLocationSuggestions(placeName);
      if (!locs.length) throw new Error('Invalid location');
      coords = `${locs[0].lat},${locs[0].lon}`;
    }
    const response = await fetch('/api/horoscope', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
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
        <div><strong>Nakshatra:</strong> ${d.nakshatra?.name || 'N/A'} (Pada: ${d.nakshatra?.pada || 'N/A'})</div>
        <div><strong>Nakshatra Lord:</strong> ${d.nakshatra?.lord?.name || 'N/A'} (${d.nakshatra?.lord?.vedic_name || ''})</div>
        <div><strong>Chandra Rasi:</strong> ${d.chandra_rasi?.name || 'N/A'}</div>
        <div><strong>Soorya Rasi:</strong> ${d.soorya_rasi?.name || 'N/A'}</div>
        <div><strong>Zodiac Sign:</strong> ${d.zodiac?.name || 'N/A'}</div>
        <hr>
        <div><strong>Deity:</strong> ${d.additional_info?.deity || 'N/A'}</div>
        <div><strong>Ganam:</strong> ${d.additional_info?.ganam || 'N/A'}</div>
        <div><strong>Symbol:</strong> ${d.additional_info?.symbol || 'N/A'}</div>
        <div><strong>Animal Sign:</strong> ${d.additional_info?.animal_sign || 'N/A'}</div>
        <div><strong>Nadi:</strong> ${d.additional_info?.nadi || 'N/A'}</div>
        <div><strong>Color:</strong> ${d.additional_info?.color || 'N/A'}</div>
        <div><strong>Best Direction:</strong> ${d.additional_info?.best_direction || 'N/A'}</div>
        <div><strong>Syllables:</strong> ${d.additional_info?.syllables || 'N/A'}</div>
        <div><strong>Birth Stone:</strong> ${d.additional_info?.birth_stone || 'N/A'}</div>
        <div><strong>Gender:</strong> ${d.additional_info?.gender || 'N/A'}</div>
        <div><strong>Planet:</strong> ${d.additional_info?.planet || 'N/A'}</div>
        <div><strong>Enemy Yoni:</strong> ${d.additional_info?.enemy_yoni || 'N/A'}</div>`;
    } else {
      resultEl.textContent = 'Could not retrieve horoscope details.';
    }
  } catch (error) {
    loadingEl.style.display = 'none';
    resultEl.style.display = 'block';
    resultEl.textContent = `Error: ${error.message}`;
  }
});
