const form = document.getElementById("horoscopeForm");
const loadingEl = document.getElementById("loading");
const resultEl = document.getElementById("result");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  resultEl.hidden = true;
  loadingEl.hidden = false;
  resultEl.innerHTML = "";

  const date_of_birth = document.getElementById("date_of_birth").value;
  const time_of_birth = document.getElementById("time_of_birth").value;
  const placeInput = document.getElementById("place").value.trim();

  if (!date_of_birth || !time_of_birth || !placeInput) {
    alert("Please fill all fields.");
    loadingEl.hidden = true;
    return;
  }

  try {
    const response = await fetch("/api/horoscope", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date_of_birth, time_of_birth, place: placeInput }),
    });

    if (!response.ok) {
      const errBody = await response.json();
      throw new Error(errBody.error || `API failed with status ${response.status}`);
    }

    const horoscope = await response.json();

    loadingEl.hidden = true;
    resultEl.hidden = false;

    if (horoscope.status === "ok" && horoscope.data) {
      const d = horoscope.data;
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
  } catch (error) {
    loadingEl.hidden = true;
    resultEl.hidden = false;
    resultEl.textContent = `Error: ${error.message}`;
  }
});
