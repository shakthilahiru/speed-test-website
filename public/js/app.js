let speedChart;
let testHistory = JSON.parse(localStorage.getItem('speedHistory')) || [];

document.addEventListener('DOMContentLoaded', async () => {
    await detectLocation();
    initializeChart();
    loadHistory();
});

async function detectLocation() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        document.getElementById('city').textContent = `${data.city}, ${data.country_name}`;
        document.getElementById('isp').textContent = data.org;
    } catch (error) {
        console.error('Location detection failed:', error);
    }
}

function initializeChart() {
    const ctx = document.getElementById('speed-chart').getContext('2d');
    
    speedChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: testHistory.map((_, i) => i + 1),
            datasets: [{
                label: 'Download (Mbps)',
                data: testHistory.map(t => t.download),
                borderColor: '#009FFD',
                tension: 0.3
            }, {
                label: 'Upload (Mbps)',
                data: testHistory.map(t => t.upload),
                borderColor: '#00C896',
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function loadHistory() {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = testHistory
        .slice(-5)
        .map((test, i) => `
            <div class="history-item">
                <span>Test #${testHistory.length - i}</span>
                <span>↓ ${test.download} Mbps ↑ ${test.upload} Mbps</span>
            </div>
        `).join('');
}

// Speed test implementation (similar to previous with additions)
// Include previous speed test logic and add:
function saveTestResults(download, upload, ping) {
    const testResult = {
        timestamp: new Date().toISOString(),
        download: download.toFixed(1),
        upload: upload.toFixed(1),
        ping: ping
    };

    testHistory.push(testResult);
    localStorage.setItem('speedHistory', JSON.stringify(testHistory));
    
    speedChart.data.labels.push(testHistory.length);
    speedChart.data.datasets[0].data.push(download);
    speedChart.data.datasets[1].data.push(upload);
    speedChart.update();
    
    loadHistory();
}
