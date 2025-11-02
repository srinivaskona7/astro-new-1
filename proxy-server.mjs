// proxy-server.mjs
import express from 'express';
import cors from 'cors';

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();

app.use(cors());
app.use(express.json());

const CLIENT_ID = "d295a902-6737-469a-b642-694fbca7a052";
const CLIENT_SECRET = "1bGOIpA0gaXmgIjYpPEMDxROKs0Mga5uUIUxGFLP";

let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });

  const res = await fetch("https://api.prokerala.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error(`Token request failed: ${res.status}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

app.post('/api/horoscope', async (req, res) => {
  try {
    const { date_of_birth, time_of_birth, coordinates, ayanamsa = 1, language = 'en' } = req.body;

    if (!date_of_birth || !time_of_birth || !coordinates) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const token = await getAccessToken();

    // Compose ISO datetime string without encoding:
    const datetimeISO = `${date_of_birth}T${time_of_birth}:00+05:30`;

    const url = new URL('https://api.prokerala.com/v2/astrology/birth-details');
    url.searchParams.append('ayanamsa', ayanamsa);
    url.searchParams.append('coordinates', coordinates);
    url.searchParams.append('datetime', datetimeISO);  // <-- Changed here
    url.searchParams.append('la', language);

    const apiRes = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      return res.status(apiRes.status).json({ error: errText });
    }

    const data = await apiRes.json();
    return res.json(data);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
