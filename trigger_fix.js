
const http = require('http');

console.log("🔄 Triggering Database Sequence Fix...");

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/patients/fix-seq',
    method: 'GET'
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('BODY: ' + data);
        if (res.statusCode === 200) {
            console.log("✅ Sequence fix triggered successfully!");
        } else {
            console.log("❌ Failed to trigger sequence fix.");
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ Error connecting to server: ${e.message}`);
    console.log("💡 INFO: Ensure the backend server is RUNNING (npm start) on port 5000.");
});

req.end();
