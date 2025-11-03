// api/horoscope.js
export default async function handler(req, res) {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
      }
    
      const { date_of_birth, time_of_birth, place } = req.body;
    
      if (!date_of_birth || !time_of_birth || !place) {
        return res.status(400).json({ error: "Missing required fields" });
      }
    
      const CLIENT_ID = "d295a902-6737-469a-b642-694fbca7a052";
      const CLIENT_SECRET = "1bGOIpA0gaXmgIjYpPEMDxROKs0Mga5uUIUxGFLP";
    
      try {
        // Get Access Token
        const tokenResponse = await fetch("https://api.prokerala.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "client_credentials",
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
          }).toString(),
        });
    
        if (!tokenResponse.ok) {
          return res.status(tokenResponse.status).json({ error: "Token fetch failed" });
        }
        const tokenData = await tokenResponse.json();
        const access_token = tokenData.access_token;
    
        // Compose datetime in ISO 8601 with IST timezone (+05:30)
        const datetimeISO = `${date_of_birth}T${time_of_birth}:00+05:30`;
    
        // Hardcoded coordinates for Nidadavolu, IN; replace with geo lookup if needed
        const coordinates = "16.91,81.67";
    
        // Prokerala birth-details API URL
        const apiUrl = new URL("https://api.prokerala.com/v2/astrology/birth-details");
        apiUrl.searchParams.append("ayanamsa", "1");
        apiUrl.searchParams.append("coordinates", coordinates);
        apiUrl.searchParams.append("datetime", datetimeISO);
        apiUrl.searchParams.append("la", "en");
    
        // Fetch birth details with the token
        const apiResponse = await fetch(apiUrl.toString(), {
          headers: {
            Authorization: `Bearer ${access_token}`,
            Accept: "application/json",
          },
        });
    
        if (!apiResponse.ok) {
          const errorBody = await apiResponse.text();
          return res.status(apiResponse.status).json({ error: errorBody });
        }
    
        const horoscopeData = await apiResponse.json();
        res.status(200).json(horoscopeData);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
    WFLW-FHPS