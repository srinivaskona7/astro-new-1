export default async function handler(req, res) {
      if (req.method !== 'POST') {
        res.status(405).json({error: 'Method Not Allowed'});
        return;
      }
      const {
        ayanamsa,
        girl_coordinates,
        girl_dob,
        boy_coordinates,
        boy_dob,
        la = 'en'
      } = req.body;
    
      if (!ayanamsa || !girl_coordinates || !girl_dob || !boy_coordinates || !boy_dob) {
        res.status(400).json({error: 'Missing required parameters'});
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
    
        // Build URL with query params
        const url = new URL('https://api.prokerala.com/v2/astrology/kundli-matching/advanced');
        url.searchParams.append('ayanamsa', ayanamsa.toString());
        url.searchParams.append('girl_coordinates', girl_coordinates);
        url.searchParams.append('girl_dob', girl_dob);
        url.searchParams.append('boy_coordinates', boy_coordinates);
        url.searchParams.append('boy_dob', boy_dob);
        url.searchParams.append('la', la);
    
        // Fetch kundali matching data
        const kundaliResponse = await fetch(url.toString(), {
          method: 'GET', // Note: this endpoint requires GET with query string
          headers: {
            Authorization: `Bearer ${access_token}`,
            Accept: 'application/json'
          }
        });
    
        const kundaliData = await kundaliResponse.json();
    
        res.status(kundaliResponse.status).json(kundaliData);
      } catch (error) {
        res.status(500).json({error: error.message});
      }
    }
    