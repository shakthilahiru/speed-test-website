const TEST_CONFIG = {
    downloadSize: 10 * 1024 * 1024,    // 10MB
    uploadSize: 5 * 1024 * 1024,       // 5MB
    pingTimeout: 3000,                 // 3 seconds
    testTimeout: 15000,                // 15 seconds
    maxHistory: 20
};

let speedChart;
let testHistory = JSON.parse(localStorage.getItem('speedHistory')) || [];
let isTesting = false;

document.addEventListener('DOMContentLoaded', async () => {
    await initializeApp();
    document.getElementById('start-test').addEventListener('click', startTest);
});

async function initializeApp() {
    try {
        await detectLocation();
        initializeChart();
        loadHistory();
    } catch (error) {
        showError('Initialization failed. Please refresh.');
    }
}

async function detectLocation() {
    try {
        const [ipapiData, ipinfoData] = await Promise.allSettled([
            fetch('https://ipapi.co/json/').then(r => r.json()),
            fetch(`https://ipinfo.io/json?token=${IPINFO_TOKEN}`).then(r => r.json())
        ]);

        const data = ipapiData.value || ipinfoData.value;
        if (!data) throw new Error('No location data');

        updateLocationUI({
            city: data.city || data.city,
            country: data.country_name || data.country,
            isp: (data.org || data.org || '').split(' ')[0]
        });
    } catch (error) {
        console.error('Location detection failed:', error);
        updateLocationUI({
            city: 'Unknown',
            country: 'Unknown',
            isp: 'Unknown ISP'
        });
    }
}

function updateLocationUI({ city, country, isp }) {
    document.getElementById('city').textContent = `${city}, ${country}`;
    document.getElementById('isp').textContent = isp;
}

async function startTest() {
    if (isTesting) return;
    isTesting = true;
    
    try {
        disableUI(true);
        await validateServerConnection();
        resetTestUI();
        
        const results = await Promise.allSettled([
            measurePing(),
            measureDownloadSpeed(),
            measureUploadSpeed()
        ]);

        handleTestResults(results);
        saveTestResults();
    } catch (error) {
        showError(`Test failed: ${error.message}`);
    } finally {
        isTesting = false;
        disableUI(false);
    }
}

async function validateServerConnection() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    try {
        const response = await fetch('/status', { signal: controller.signal });
        clearTimeout(timeout);
        if (!response.ok) throw new Error('Server error');
    } catch (error) {
        throw new Error('Connection to test server failed');
    }
}

async function measurePing() {
    const start = performance.now();
    try {
        await fetch('/ping', { method: 'HEAD' });
        const ping = performance.now() - start;
        updatePingResult(Math.round(ping));
        return ping;
    } catch (error) {
        throw new Error('Ping test failed');
    }
}

async function measureDownloadSpeed() {
    const startTime = Date.now();
    let receivedBytes = 0;
    
    try {
        const response = await fetch(`/download?r=${Date.now()}`);
        const reader = response.body.getReader();
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            receivedBytes += value.length;
            updateDownloadProgress(receivedBytes);
        }
        
        const duration = (Date.now() - startTime) / 1000;
        return (receivedBytes * 8) / (duration * 1000000); // Mbps
    } catch (error) {
        throw new Error('Download test failed');
    }
}

function updateDownloadProgress(received) {
    const progress = (received / TEST_CONFIG.downloadSize) * 100;
    document.getElementById('download-bar').style.width = `${progress}%`;
    document.getElementById('download-result').textContent = 
        `${((received * 8) / 1000000).toFixed(1)} Mbps`;
}

// Similar implementations for uploadSpeed and ping
// Include remaining helper functions from previous versions

function showError(message) {
    const toast = document.getElementById('error-toast');
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 5000);
}
