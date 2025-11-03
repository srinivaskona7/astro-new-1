export default async function handler(req, res) {
      if (req.method !== "POST") return res.status(405).json({error: "Method not allowed"});
      const {date_of_birth, time_of_birth, coordinates} = req.body;
      if (!date_of_birth || !time_of_birth || !coordinates) return res.status(400).json({error: "Missing params"});
    
      // Prokerala creds
      const CLIENT_ID = "d295a902-6737-469a-b642-694fbca7a052";
      const CLIENT_SECRET = "1bGOIpA0gaXmgIjYpPEMDxROKs0Mga5uUIUxGFLP";
      try {
        // Token step
        const tokenResp = await fetch("https://api.prokerala.com/token", {
          method: "POST",
          headers: {"Content-Type":"application/x-www-form-urlencoded"},
          body: new URLSearchParams({
            grant_type:"client_credentials",
            client_id:CLIENT_ID,
            client_secret:CLIENT_SECRET
          }).toString()
        });
        if (!tokenResp.ok) throw new Error("Token fetch failed");
        const {access_token} = await tokenResp.json();
    
        // Horoscope step
        const datetimeISO = `${date_of_birth}T${time_of_birth}:00+05:30`;
        const url = new URL("https://api.prokerala.com/v2/astrology/birth-details");
        url.searchParams.append("ayanamsa", "1");
        url.searchParams.append("coordinates", coordinates);
        url.searchParams.append("datetime", datetimeISO);
        url.searchParams.append("la", "en");
    
        const apiResp = await fetch(url.toString(), {
          headers: {Authorization:`Bearer ${access_token}`,Accept:"application/json"}
        });
    
        const payload = await apiResp.json();
        return res.status(apiResp.status).json(payload);
      } catch (err) {
        return res.status(500).json({error:err.message});
      }
    }
    