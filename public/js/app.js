async function detectLocation() {
    try {
        // Try primary API
        let response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error('Primary API failed');
        
        let data = await response.json();
        updateLocationUI(data);
        
    } catch (primaryError) {
        try {
            // Fallback to ipinfo.io
            console.warn('Falling back to secondary API');
            response = await fetch('https://ipinfo.io/json?token=YOUR_TOKEN');
            if (!response.ok) throw new Error('Secondary API failed');
            
            data = await response.json();
            updateLocationUI({
                city: data.city,
                country_name: data.country,
                org: data.org
            });
            
        } catch (fallbackError) {
            console.error('All location APIs failed:', fallbackError);
            document.getElementById('location-info').innerHTML = 
                'Location detection unavailable';
        }
    }
}

function updateLocationUI(data) {
    document.getElementById('city').textContent = 
        `${data.city || 'Unknown'}, ${data.country_name || 'Unknown'}`;
    document.getElementById('isp').textContent = 
        data.org?.split(' ')[0] || 'ISP Not Found';
}

const TEST_CONFIG = {
    downloadSize: 10 * 1024 * 1024, // 10MB
    uploadSize: 5 * 1024 * 1024, // 5MB
    timeout: 15000 // 15 seconds
};

async function startTest() {
    if (isTesting) return;
    isTesting = true;
    
    try {
        // First validate server connection
        await validateServerConnection();
        
        // Reset UI
        resetTest();
        document.getElementById('start-test').disabled = true;
        
        // Run tests sequentially
        await measurePing();
        await measureDownloadSpeed();
        await measureUploadSpeed();
        
        // Save results
        saveTestResults(downloadSpeed, uploadSpeed, ping);
        
    } catch (error) {
        showError(`Test failed: ${error.message}`);
    } finally {
        isTesting = false;
        document.getElementById('start-test').disabled = false;
    }
}

async function validateServerConnection() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
        const response = await fetch('/status', { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error('Server not ready');
        const data = await response.json();
        
        if (data.status !== 'ok') throw new Error('Invalid server response');
        
    } catch (error) {
        throw new Error(`Server connection failed: ${error.message}`);
    }
}

// Updated measureDownloadSpeed
async function measureDownloadSpeed() {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        let receivedBytes = 0;
        
        fetch(`/download?cache=${Date.now()}`)
            .then(response => {
                const reader = response.body.getReader();
                
                function pump() {
                    return reader.read().then(({ done, value }) => {
                        if (done) {
                            const duration = (Date.now() - startTime) / 1000;
                            const speed = ((receivedBytes * 8) / (duration * 1000000)).toFixed(1);
                            updateDownloadResult(speed);
                            resolve();
                            return;
                        }
                        
                        receivedBytes += value.length;
                        const progress = (receivedBytes / TEST_CONFIG.downloadSize) * 100;
                        document.getElementById('download-bar').style.width = `${progress}%`;
                        
                        return pump();
                    });
                }
                
                return pump();
            })
            .catch(reject);
    });
}
