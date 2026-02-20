
import Application from '../../src/app';
import path from 'path';
import fs from 'fs';
import { before, after } from 'mocha';
import { exit } from 'process';

const infra = Application.instance();

/////////////////////////////////////////////////////////////////////////////////

//Set-up
before(async function() {
    this.timeout(10000); // Increase timeout to 10 seconds for setup
    console.log('Set-up: Initializing test set-up!');
    await infra.start();
    await wait(1000);

    // Authenticate user and store token for tests that need it
    try {
        await authenticateUser();
    } catch (error) {
        console.warn('Warning: Authentication failed, tests may fail if authentication is required:', error.message);
    }
    console.log('\nTest set-up: Done!\n');
});

//Tear-down
after(async function() {
    this.timeout(5000); // Increase timeout for teardown
    console.info('Tear-down: Server shut down successfully!');
    await wait(1000);
    exit(0);
});

/////////////////////////////////////////////////////////////////////////////////

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

global.TestCache = {};

export const setTestData = (value:any, key:string) => {
    global.TestCache[key] = value;
};

export const getTestData = (key:string): any => {
    return global.TestCache[key];
};

function loadTestData() {
    var filepath = path.join(process.cwd(), 'tests', 'api-tests', 'test.data', 'test.data.json');
    var fileBuffer = fs.readFileSync(filepath, 'utf8');
    const obj = JSON.parse(fileBuffer);
    return obj;
}

function initializeCache() {
    const testData = loadTestData();
    global.TestCache = { ...testData };
}

import request from 'supertest';

export const authenticateUser = async () => {
    const agent = request.agent(infra._expressApp);
    const email = process.env.TEST_EMAIL || process.env.TEST_USERNAME || 'admin@example.com';
    const password = process.env.TEST_PASSWORD || 'Admin123!';
    
    try {
        const response = await agent
            .post('/api/v1/auth/login')
            .set('Content-Type', 'application/json')
            .send({
                email: email,
                password: password
            });
        
        if (response.body?.Data?.accessToken) {
            setTestData(response.body.Data.accessToken, 'JWT_ACCESS_TOKEN');
            console.log('Authentication successful: Token stored in test cache');
            return response.body.Data.accessToken;
        } else {
            throw new Error('Authentication failed: Token not found in response');
        }
    } catch (error) {
        console.error('Authentication error:', error.message);
        throw error;
    }
};
