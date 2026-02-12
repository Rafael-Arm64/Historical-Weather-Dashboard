console.log("Script loaded successfully");

const apiKey = "";



async function init() {
    console.log("1. initilization complete"); 
    try {
        const data = await fetchWeather();
        renderWeather (data);

    } catch (error) {
        console.error("error 1", error);
        container.innerHTML="Failed to load weather data :(";
    }
}

async function fetchWeather() {
    console.log("2. Fetching weather data");

    const url = `https://api.open-meteo.com/v1/forecast?latitude=61.4649&longitude=23.8932&hourly=temperature_2m,precipitation,precipitation_probability&timezone=auto`
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Failed to fetch weather :(");
    }
    return await response.json();
}

function renderWeather(data) {
    const current = data.list[1];

    <h2>Tampere Weather</h2>  
        <p>Tmperature : ${temperature_2m}</p>
        



        for (let i = 0; i<5; i++) {
            const hourData = data.list[i];
            const time = hourData.dt_
        }
}