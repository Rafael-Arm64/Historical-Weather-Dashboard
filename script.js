document.addEventListener("DOMContentLoaded", () => {
console.log("Script loaded successfully");

const container = document.getElementById("weatherResult");

//Start of initilization for whole script and all functions

async function init() {
    console.log("1. initilization complete"); 
        try {
            const data = await fetchWeather();

            const view1Container = document.getElementById("view1");
            const view2Container = document.getElementById("view2");
            const view3Container = document.getElementById("view3");
              if (view1Container) {
                renderWeather(view1Container, data, "temperature_2m", "Temperature (°C)", "dodgerblue");
              } 
              if (view2Container) {
                 renderWeather(view2Container, data, "wind_speed_10m", "Wind Speed (m/s)", "dodgerblue");
              }
              if (view3Container) {
                  renderWeather(view3Container, data, "precipitation_probability", "Precipitation Probability (%)", "dodgerblue");
              }
    } catch (error) {
        console.error("error 1", error);
        container.innerHTML="Failed to load weather data :(";
        }   
}

// --- FETCH WEATHER ---

async function fetchWeather() {
    console.log("2. Fetching weather data");

    const now = new Date();

    const formatDate = (date) => date.toISOString().split("T")[0];

  const yesterday = new Date();
   yesterday.setDate(now.getDate()- 1);
    const endDate = formatDate(yesterday);

    const dayBefore = new Date();
    dayBefore.setDate(now.getDate()- 32);
    const startDate = formatDate(dayBefore);

    const url = `https://historical-forecast-api.open-meteo.com/v1/forecast?latitude=60.1695&longitude=24.9354&start_date=${startDate}&end_date=${endDate}&hourly=temperature_2m,precipitation_probability,wind_speed_10m`;

    const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Failed to fetch weather :(");
        }
    return await response.json();
}

// --- STATISTICS ---

function calculateStats(values) {

    const sorted = [...values].sort((a, b) => a - b);

    const min = sorted[0];
    const max = sorted[sorted.length - 1];

    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;

    //median 
    const mid = Math.floor(sorted.length / 2);
    const median = 
        sorted.length %2 !==0
            ? sorted[mid]
            : (sorted[mid - 1] + sorted[mid]) / 2;

    //mode 
    const freq = [];
    let mode = sorted[0];
    let maxFreq = 0;

    for (let value of sorted) {
        freq[value] = (freq[value] || 0) +1;
        if (freq[value] > maxFreq) {
            maxFreq = freq[value];
            mode = value;
        }
    }

    //Range
    const range = max - min;

    //standard deviation
    const variance = 
        values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    
    const stdDeviation = Math.sqrt(variance);

    return {
        min: min.toFixed(1),
        max: max.toFixed(1),
        mean: mean.toFixed(1),
        median: median.toFixed(1),
        mode: mode.toFixed(1),
        range: range.toFixed(1),
        stdDev: stdDeviation.toFixed(1),
        variance: variance.toFixed(1)
    };

}



// --- RENDER WEATHER ---

function renderWeather(container, data, variableName, label, color) {


     const fullValues = data.hourly[variableName];
     const fullTimes = data.hourly.time;
     let timespan = 24;

    const renderContent = (selectedSpan) => {
        const values = fullValues.slice(-selectedSpan);
        const times = fullTimes.slice(-selectedSpan);
        const stats = calculateStats(values);
        const canvasId = `chart-${variableName}`;

        let html= `
            <div class = "mb-3 text-white">
                <label>Select Timespan:</label>
                <select class = "form-select w-35 bg-dark text-white" id = "timespanSelect" data-span="${selectedSpan}">
                    <option value ="20" ${selectedSpan === 20 ? `selected`: ``} >Last 20 readings</option>
                    <option value ="24" ${selectedSpan === 24 ? `selected`: ``}>Last 24 Hours</option>
                    <option value ="48" ${selectedSpan === 48 ? `selected`: ``}>Last 48 Hours</option>
                    <option value = "168" ${selectedSpan === 168 ? `selected`: ``}>1 week</option>
                    <option value ="720" ${selectedSpan === 720 ? `selected`: ``}>1 month</option>
                </select>
                <p></p>
                <p style="color: ${color}; font-weight: bold">Avg: ${label} ${stats.mean}</p>
                <p></p>
            </div>

        <div class="table-responsive" style="max-height: 700px; overflow-y: auto;">
            <table class="table table-borderless table-md text-center table-dark table-hover">
                <thead class="table-dark" style="position: sticky; top: 0;">
                    <tr>
                        <th>Date</th>
                        <th>Time</th>
                        <th>${label}</th>
                    </tr>
                </thead>
            <tbody>
        `;

        for (let i =0; i < times.length; i++) {
            html += `
                <tr>
                    <td>${times[i].slice(0,10)}</td>
                    <td>${times[i].slice(11,16)}</td>
                    <td>${values[i]}</td>
                </tr>
            `;
        }

        html += `
            </tbody>
            </table>
        </div>

            <canvas id="chart-${variableName}"></canvas>

            <div class="mt-4 text-white container-fluid">
                <h5 class="mb-3 border-bottom pb-2">Statistics (Last ${selectedSpan} readings)</h5>
                <p>Minimum: ${stats.min}</p>
                <p>Maximum: ${stats.max}</p>
                <p>Mean: ${stats.mean}</p>
                <p>Median: ${stats.median}</p>
                <p>Mode: ${stats.mode}</p>
                <p>Range: ${stats.range}</p>
                <p>Standard Deviation: ${stats.stdDev}</p>
                <p>Variance: ${stats.variance}</p>
            </div>
        `;

        container.innerHTML = html;

        setTimeout(() => {
        renderChart(
            `chart-${variableName}`,
            times.map(t => {
                return selectedSpan > 48 ? t.slice(5, 10): t.slice(11, 16);
            }),
            values,
            label,
            color
        );
        }, 100);

        const select = container.querySelector("#timespanSelect");
        select.addEventListener("change", (e) => {
            renderContent(parseInt(e.target.value));
        });
    };

renderContent(timespan);

}

// --- CHART ---

let charts = {};

function renderChart(containerId, labels, values, labelText, color) {

    const ctx = document.getElementById(containerId);
    if (!ctx) return;

    if (charts[containerId]) {
        charts[containerId].destroy();
    }

   charts[containerId] = new Chart(ctx, {
        type: "line",

        data: {
            labels: labels,
            datasets: [{
                label: labelText,
                data: values,
                borderColor: color,
                borderWidth: 2,
                tension: 0.3
            }] 
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: "white"
                    }
                }   
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        color: "white"
                }
            },
            x: {
                ticks: {
                    color: "white",
                    maxTicksLimit: 10,
                    maxRotation: 0,
                    minRotation: 0,
                }
            }
        }
        }
    
    });
}

init();
setInterval(init, 10*60*1000);

});