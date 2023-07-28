//supertest to test API Endpoints by making http requests for testing.
const request = require('supertest');
//imported app main code.
const app = require('../Auth1');
//imported my db code.
const db = require('../db');



//Unit test cases for registration functionality.
describe('Test registration functionality', () => {

    it('should register a new user successfully', async () => {
        const response = await request(app).post('/register')
            .send({
                username: 'user40',
                password: 'pass40',
                role: 'admin',
            });
        expect(response.status).toBe(201);
        expect(response.text).toContain('User registered successfully!');
    });

    it('should return a 400 status and error message for missing data', async () => {
        const userData = {
            username: 'user23',
            role: 'admin',
        };
        const response = await request(app)
            .post('/register')
            .send(userData);
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Missing required data.' });
    });
   it('should return a 500 status and error message for server errors', async () => {

      //initialized a mock database which throws an error object and implemented it instead of real database query.
       jest.spyOn(db, 'query').mockImplementation(() => {
           // Simulate a database error by throwing an error
           throw new Error('Database error');
       });
       const userData = {
           username: 'user40',
           password: 'pass40',
           role:'yuytu',
           rate:'5',
       };
       const response = await request(app).post('/register').send(userData);

       expect(response.status).toBe(500);
       expect(response.body).toEqual({ error: 'Database error' });
       db.query.mockRestore();
   });
});

//Unit test cases for Login functionality.
describe('Test Login functionality and authentication', () => {
    // Test registration endpoint
    it('should login successfully ', async () => {
        const userData = {
            username: 'user40', // Provide valid username
            password: 'pass40', // Provide valid password for the test user
        };

        const response = await request(app)
            .post('/login')
            .send(userData);

        expect(response.status).toBe(200);
        expect(response.text).toContain('Login successful.');
    });
    it('should sent a invalid credentials message', async () => {
        const response = await request(app).post('/login')
            .send({
                username: 'navya1',
                password: 'navya2',
            });
        expect(response.status).toBe(401);
        expect(response.text).toContain('Invalid credentials.');

    });
      it('should return a 500 status and error message for database errors ', async () => {
          jest.spyOn(db, 'query').mockImplementation(() => {
           throw new Error('Database error');
       });
       const userData = {
           username: 'user30',
           password: 'pass30',
       };

       const response = await request(app).post('/login').send(userData);
       expect(response.status).toBe(500);
       expect(response.body).toEqual({ error: 'Database error' });
       db.query.mockRestore();
    });
});


//Unit test cases for '/protected' page functionality.
describe('to test authorization functionality ', () => {
    it('should provide access to the requested protected page', async () => {
        //used agent object here to maintain state between multiple requests to the same server.
        const agent = request.agent(app);
        await agent.post('/register').send({
            username: 'user40',
            password: 'pass40',
            role: 'user',
        });
        await agent.post('/login').send({
            username: 'user40',
            password: 'pass40',
        });
        const response = await agent.get('/protected');

        // Expect the response to have a 200 status code
        expect(response.status).toBe(200);
        expect(response.text).toContain('You have access to protected data!');
    });
    it('should it protect route from unauthorized access', async () => {
        const response = await request(app).get('/protected');
        expect(response.status).toBe(403);
        expect(response.body).toEqual({ message: 'Access forbidden. Authentication failed.' });
    });

});

//Unit test cases for '/logout' page functionality.
describe('to test logout functionality', () => {

    it('should destroy the session and redirect to login page', async () => {
        //used agent object here to maintain state between multiple requests to the same server.
        const agent = request.agent(app);
        await agent.post('/register').send({
            username: 'user44',
            password: 'pass44',
            role: 'user',
        });
        await agent.post('/login').send({
            username: 'user44',
            password: 'pass44',
        });
        await agent.get('/protected');
        const response = await agent.get('/logout');
        expect(request.agent.session).toBeUndefined();
        expect(response.text).toContain('Found. Redirecting to /login');
    });
});





