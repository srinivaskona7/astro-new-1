const clientId = "d295a902-6737-469a-b642-694fbca7a052";
const clientSecret = "1bGOIpA0gaXmgIjYpPEMDxROKs0Mga5uUIUxGFLP";
const GEO_API_KEY = "81b56c410d08b1d5653d3af091632562";

const form = document.getElementById("horoscopeForm");
const loadingEl = document.getElementById("loading");
const resultEl = document.getElementById("result");
const placeInput = document.getElementById("place");
const suggestionsContainer = document.getElementById("searchSuggestions");

let currentCoordinates = null;

function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

async function fetchLocationSuggestions(query) {
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${GEO_API_KEY}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Geocoding fetch failed");
    return await res.json();
  } catch {
    return [];
  }
}

function renderSuggestions(locations) {
  if (!locations.length) {
    suggestionsContainer.style.display = "none";
    suggestionsContainer.innerHTML = "";
    return;
  }
  suggestionsContainer.innerHTML = locations
    .map((loc) => {
      const displayName = `${loc.name}${loc.state ? ", " + loc.state : ""}, ${loc.country}`;
      return `<div class="suggestion-item" data-lat="${loc.lat}" data-lon="${loc.lon}">${displayName}</div>`;
    })
    .join("");
  suggestionsContainer.style.display = "block";
}

placeInput.addEventListener(
  "input",
  debounce(async function () {
    if (this.value.trim().length < 2) {
      suggestionsContainer.style.display = "none";
      suggestionsContainer.innerHTML = "";
      return;
    }
    const results = await fetchLocationSuggestions(this.value.trim());
    renderSuggestions(results);
  }, 300)
);

suggestionsContainer.addEventListener("click", function (e) {
  const item = e.target.closest(".suggestion-item");
  if (!item) return;
  placeInput.value = item.textContent;
  currentCoordinates = `${item.getAttribute("data-lat")},${item.getAttribute("data-lon")}`;
  suggestionsContainer.style.display = "none";
  suggestionsContainer.innerHTML = "";
});

document.addEventListener("click", (e) => {
  if (!suggestionsContainer.contains(e.target) && e.target !== placeInput) {
    suggestionsContainer.style.display = "none";
    suggestionsContainer.innerHTML = "";
  }
});

async function getAccessToken() {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });
  const res = await fetch("https://api.prokerala.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) throw new Error("Failed to fetch access token");
  const data = await res.json();
  return data.access_token;
}

async function fetchHoroscope(token, date_of_birth, time_of_birth, coordinates) {
  const datetimeISO = `${date_of_birth}T${time_of_birth}:00+05:30`;
  const url = new URL("https://api.prokerala.com/v2/astrology/birth-details");
  url.searchParams.append("ayanamsa", "1");
  url.searchParams.append("coordinates", coordinates);
  url.searchParams.append("datetime", datetimeISO);
  url.searchParams.append("la", "en");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const errR = await res.json().catch(() => ({}));
    throw new Error(errR.error || `Horoscope fetch failed: ${res.status}`);
  }
  return res.json();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  loadingEl.style.display = "block";
  resultEl.style.display = "none";
  resultEl.innerHTML = "";

  const date_of_birth = document.getElementById("date_of_birth").value;
  const time_of_birth = document.getElementById("time_of_birth").value;
  const place = placeInput.value.trim();

  if (!date_of_birth || !time_of_birth || !place) {
    alert("Please fill all fields.");
    loadingEl.style.display = "none";
    return;
  }

  try {
    let coords = currentCoordinates;
    if (!coords) {
      const locs = await fetchLocationSuggestions(place);
      if (locs.length > 0) coords = `${locs[0].lat},${locs[0].lon}`;
      else throw new Error("Unable to geocode provided location");
    }
    const token = await getAccessToken();
    const horoscopeData = await fetchHoroscope(token, date_of_birth, time_of_birth, coords);

    loadingEl.style.display = "none";
    resultEl.style.display = "block";

    if (horoscopeData.status === "ok" && horoscopeData.data) {
      const d = horoscopeData.data;
      resultEl.innerHTML = `
        <h3>Horoscope Details</h3>
        <div class="result-row"><strong>Nakshatra:</strong> ${d.nakshatra?.name || "N/A"} (Pada: ${d.nakshatra?.pada || "N/A"})</div>
        <div class="result-row"><strong>Nakshatra Lord:</strong> ${d.nakshatra?.lord?.name || "N/A"} (${d.nakshatra?.lord?.vedic_name || ""})</div>
        <div class="result-row"><strong>Chandra Rasi:</strong> ${d.chandra_rasi?.name || "N/A"}</div>
        <div class="result-row"><strong>Soorya Rasi:</strong> ${d.soorya_rasi?.name || "N/A"}</div>
        <div class="result-row"><strong>Zodiac Sign:</strong> ${d.zodiac?.name || "N/A"}</div>
        <hr>
        <div class="result-row"><strong>Deity:</strong> ${d.additional_info?.deity || "N/A"}</div>
        <div class="result-row"><strong>Ganam:</strong> ${d.additional_info?.ganam || "N/A"}</div>
        <div class="result-row"><strong>Symbol:</strong> ${d.additional_info?.symbol || "N/A"}</div>
        <div class="result-row"><strong>Animal Sign:</strong> ${d.additional_info?.animal_sign || "N/A"}</div>
        <div class="result-row"><strong>Nadi:</strong> ${d.additional_info?.nadi || "N/A"}</div>
        <div class="result-row"><strong>Color:</strong> ${d.additional_info?.color || "N/A"}</div>
        <div class="result-row"><strong>Best Direction:</strong> ${d.additional_info?.best_direction || "N/A"}</div>
        <div class="result-row"><strong>Syllables:</strong> ${d.additional_info?.syllables || "N/A"}</div>
        <div class="result-row"><strong>Birth Stone:</strong> ${d.additional_info?.birth_stone || "N/A"}</div>
        <div class="result-row"><strong>Gender:</strong> ${d.additional_info?.gender || "N/A"}</div>
        <div class="result-row"><strong>Planet:</strong> ${d.additional_info?.planet || "N/A"}</div>
        <div class="result-row"><strong>Enemy Yoni:</strong> ${d.additional_info?.enemy_yoni || "N/A"}</div>
      `;
    } else {
      resultEl.textContent = "Could not retrieve horoscope details.";
    }
  } catch (err) {
    loadingEl.style.display = "none";
    resultEl.style.display = "block";
    resultEl.textContent = `Error: ${err.message}`;
  }
});
