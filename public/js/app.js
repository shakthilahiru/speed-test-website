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
