const CLIENT_ID = "d295a902-6737-469a-b642-694fbca7a052";
const CLIENT_SECRET = "1bGOIpA0gaXmgIjYpPEMDxROKs0Mga5uUIUxGFLP";

const TOKEN_URL = "https://api.prokerala.com/token";
const HOROSCOPE_API_BASE = "https://api.prokerala.com/v2/astrology/birth-details";

const form = document.getElementById("horoscopeForm");
const loadingEl = document.getElementById("loading");
const resultEl = document.getElementById("result");

// Token cache object
let tokenCache = {
  accessToken: null,
  expiry: 0,
};

async function getAccessToken() {
  const now = Date.now();
  if (tokenCache.accessToken && tokenCache.expiry > now) {
    return tokenCache.accessToken;
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  }).toString();

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.status}`);
  }

  const data = await response.json();
  tokenCache.accessToken = data.access_token;
  tokenCache.expiry = now + (data.expires_in - 60) * 1000; // refresh 1 minute before expiry

  return tokenCache.accessToken;
}

async function fetchHoroscope(token, date_of_birth, time_of_birth, coordinates) {
  const datetimeISO = `${date_of_birth}T${time_of_birth}:00+05:30`;

  const url = new URL(HOROSCOPE_API_BASE);
  url.searchParams.append("ayanamsa", "1");
  url.searchParams.append("coordinates", coordinates);
  url.searchParams.append("datetime", datetimeISO);
  url.searchParams.append("la", "en");

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Horoscope fetch failed with status: ${response.status}`);
  }

  return response.json();
}

function displayResult(data) {
  resultEl.hidden = false;
  const d = data;

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
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  resultEl.hidden = true;
  loadingEl.hidden = false;
  resultEl.innerHTML = "";

  try {
    const date_of_birth = document.getElementById("date_of_birth").value;
    const time_of_birth = document.getElementById("time_of_birth").value;
    const placeInput = document.getElementById("place").value.trim();

    if (!date_of_birth || !time_of_birth || !placeInput) {
      alert("Please fill all fields.");
      loadingEl.hidden = true;
      return;
    }

    // For demo purposes, hardcoded coordinates for Nidadavolu.
    // You can integrate geocoding API here for converting placeInput to coordinates
    const coordinates = "16.91,81.67";

    const token = await getAccessToken();
    const horoscopeData = await fetchHoroscope(token, date_of_birth, time_of_birth, coordinates);

    loadingEl.hidden = true;
    displayResult(horoscopeData.data); // pass the inner 'data' field of response
  } catch (error) {
    loadingEl.hidden = true;
    resultEl.hidden = false;
    resultEl.textContent = `Error: ${error.message}`;
  }
});
