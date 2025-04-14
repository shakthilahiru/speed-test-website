let isTesting = false;
let speedChart;
let testHistory = JSON.parse(localStorage.getItem('speedHistory')) || [];

document.addEventListener('DOMContentLoaded', async () => {
    await detectLocation();
    initializeChart();
    loadHistory();
    document.getElementById('start-test').addEventListener('click', startTest);
});

async function startTest() {
    if (isTesting) return;
    isTesting = true;
    document.getElementById('start-test').disabled = true;
    resetTest();

    try {
        await measurePing();
        await measureDownloadSpeed();
        await measureUploadSpeed();
        saveTestResults(downloadSpeed, uploadSpeed, ping);
    } catch (error) {
        showError("Test failed. Please try again.");
    } finally {
        isTesting = false;
        document.getElementById('start-test').disabled = false;
    }
}

async function measurePing() {
    const start = performance.now();
    try {
        const response = await fetch('/ping', { method: 'HEAD' });
        if (!response.ok) throw new Error();
        const duration = performance.now() - start;
        ping = Math.round(duration);
        updatePingResult(ping);
    } catch (error) {
        throw new Error('Ping test failed');
    }
}

function measureDownloadSpeed() {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const url = '/download?' + Date.now(); // Cache busting
        let receivedSize = 0;
        const startTime = Date.now();

        xhr.open('GET', url);
        xhr.responseType = 'arraybuffer';

        xhr.onprogress = (event) => {
            receivedSize = event.loaded;
            const progress = (receivedSize / TEST_DATA_SIZE) * 100;
            document.getElementById('download-bar').style.width = `${progress}%`;
        };

        xhr.onload = () => {
            const duration = (Date.now() - startTime) / 1000;
            downloadSpeed = ((receivedSize * 8) / (duration * 1000000)).toFixed(1);
            updateDownloadResult(downloadSpeed);
            resolve();
        };

        xhr.onerror = () => reject('Download test failed');
        xhr.send();
    });
}

function measureUploadSpeed() {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const testData = new ArrayBuffer(10 * 1024 * 1024); // 10MB
        const startTime = Date.now();

        xhr.open('POST', '/upload');
        xhr.setRequestHeader('Content-Type', 'application/octet-stream');

        xhr.upload.onprogress = (event) => {
            const progress = (event.loaded / event.total) * 100;
            document.getElementById('upload-bar').style.width = `${progress}%`;
        };

        xhr.onload = () => {
            const duration = (Date.now() - startTime) / 1000;
            uploadSpeed = ((testData.byteLength * 8) / (duration * 1000000)).toFixed(1);
            updateUploadResult(uploadSpeed);
            resolve();
        };

        xhr.onerror = () => reject('Upload test failed');
        xhr.send(testData);
    });
}

// Keep other functions from previous implementation (update*Result, resetTest, etc.)
