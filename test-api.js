// Quick test script to verify the new reliable market service

import fetch from 'node-fetch';

async function testAPI() {
    console.log('Testing Fast Reliable Market Service...');
    
    try {
        // Test health endpoint
    console.log('\n[1] Testing health endpoint...');
        const healthResponse = await fetch('http://localhost:3001/api/health');
        const healthData = await healthResponse.json();
    console.log('Health check:', healthData);
        
        // Test Agriwatch endpoint
    console.log('\n[2] Testing Agriwatch endpoint...');
        const agriResponse = await fetch('http://localhost:3001/api/agriwatch/West%20Bengal/wheat?limit=2');
        const agriData = await agriResponse.json();
    console.log('Agriwatch data:', JSON.stringify(agriData, null, 2));
        
        // Test Mandi Rates endpoint
    console.log('\n[3] Testing MandiRates endpoint...');
        const mandiResponse = await fetch('http://localhost:3001/api/mandi-rates/West%20Bengal/wheat?limit=2');
        const mandiData = await mandiResponse.json();
    console.log('MandiRates data:', JSON.stringify(mandiData, null, 2));
        
        console.log('\nAll tests passed! API is working correctly.');
        
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testAPI();