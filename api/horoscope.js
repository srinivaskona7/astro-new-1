export default async function handler(req, res) {
      if (req.method !== 'POST') {
        res.status(405).json({error: 'Method Not Allowed'});
        return;
      }
      const {date_of_birth, time_of_birth, coordinates} = req.body;
      if (!date_of_birth || !time_of_birth || !coordinates) {
        res.status(400).json({error: 'Missing parameters'});
        return;
      }
    
      const CLIENT_ID = 'd295a902-6737-469a-b642-694fbca7a052';
      const CLIENT_SECRET = '1bGOIpA0gaXmgIjYpPEMDxROKs0Mga5uUIUxGFLP';
    
      try {
        // Fetch token from Prokerala
        const tokenResponse = await fetch('https://api.prokerala.com/token', {
          method: 'POST',
          headers: {'Content-Type': 'application/x-www-form-urlencoded'},
          body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET
          }).toString()
        });
    
        if (!tokenResponse.ok) throw new Error('Failed to fetch token');
    
        const {access_token} = await tokenResponse.json();
    
        // Compose astrology API request with correct ISO datetime and coordinates
        const datetimeISO = `${date_of_birth}T${time_of_birth}:00+05:30`;
        const url = new URL('https://api.prokerala.com/v2/astrology/birth-details');
        url.searchParams.append('ayanamsa', '1');
        url.searchParams.append('coordinates', coordinates);
        url.searchParams.append('datetime', datetimeISO);
        url.searchParams.append('la', 'en');
    
        // Fetch horoscope data
        const horoscopeResp = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${access_token}`,
            Accept: 'application/json'
          }
        });
    
        const horoscopeData = await horoscopeResp.json();
    
        res.status(horoscopeResp.status).json(horoscopeData);
      } catch (error) {
        res.status(500).json({error: error.message});
      }
    }
    