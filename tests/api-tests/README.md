
# API Test Suite Documentation

## Overview

This directory contains comprehensive API integration tests for the Batterlicious Service. The test suite is built using **Mocha**, **Chai**, **Supertest**, and **Faker.js** to ensure robust API endpoint testing with automated test data generation.

## Table of Contents

- [Test Framework](#test-framework)
- [Test Structure](#test-structure)
- [Setup and Configuration](#setup-and-configuration)
- [Running Tests](#running-tests)
- [Test Pattern](#test-pattern)
- [Authentication](#authentication)
- [Test Data Management](#test-data-management)
- [Best Practices](#best-practices)

---

## Test Framework

### Core Technologies

- **Mocha**: Test runner and framework
- **Chai**: Assertion library using BDD-style assertions
- **Supertest**: HTTP assertion library for API testing
- **Faker.js**: Generates realistic fake data for testing
- **TypeScript**: Type-safe test code

### Key Dependencies

```json
{
  "@faker-js/faker": "version",
  "@types/chai": "version",
  "@types/mocha": "version",
  "@types/supertest": "version",
  "chai": "version",
  "mocha": "version",
  "supertest": "version"
}
```

### Installation

To install the testing dependencies, run:

```bash
npm install --save-dev @faker-js/faker @types/chai @types/mocha @types/supertest chai mocha supertest
```

---

## Test Structure

```
tests/
├── api-tests/
│   ├── init.ts                 # Test initialization and global setup
│   └── tests/
│       ├── 01_test1.test.ts    # Name must ends with test.ts
│       ├── 02_test2.test.ts
│       └── 03_test3.test.ts
└── README.md                   # This file
```

### Test File Naming Convention

Test files are numbered sequentially (01,02 etc) to ensure proper execution order, as some tests may have dependencies on others.

---

## Setup and Configuration

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Test API credentials
TEST_API_KEY=your_test_api_key_here
JWT_ACCESS_TOKEN=your_jwt_token_here

# Database configuration
DB_HOST=host
DB_PORT=port
DB_NAME=test_database
DB_USER=test_user
DB_PASS=test_password

# Application configuration
NODE_ENV=test
PORT=3000
```

### TypeScript Configuration

The `tsconfig.json` file is configured to include test files in the TypeScript compilation:

Add test path in `tsconfig.json`

```json
{  
    "include": [
        "src/**/*",
        "tests/api-tests/tests/*"
    ],   
}
```

**Key Configuration Points**:
  - `src/**/*` - All source files
  - `tests/api-tests/tests/*` - All test files

### Test Initialization

The `init.ts` file handles:

1. **Application startup** - Initializes the Express application
2. **Global test cache** - Stores test data across test suites
3. **Before/After hooks** - Setup and teardown operations
4. **Test data utilities** - Helper functions for data management

```typescript
// Test cache for sharing data between tests
global.TestCache = {};

export const setTestData = (value: any, key: string) => {
    global.TestCache[key] = value;
};

export const getTestData = (key: string): any => {
    return global.TestCache[key];
};
```

---

## Running Tests

### Build TypeScript Project

Before running tests, compile the TypeScript code:

```bash
npm run build
```

This will compile all TypeScript files (including tests) according to the `tsconfig.json` configuration into the `dist/` directory.

### Run All Tests

```bash
npm test
```

### Run Specific Test File

```bash
# Using Mocha directly (requires compilation first)
npx mocha tests/api-tests/tests/01_OtpVerification.test.ts

# Using ts-node (no compilation needed)
npx ts-node --files tests/api-tests/tests/01_OtpVerification.test.ts
```

### Run Tests with TypeScript

The `--files` flag ensures TypeScript includes all files specified in `tsconfig.json`:

```bash
npx ts-node --files tests/api-tests/tests/01_OtpVerification.test.ts
```

### Run Multiple Test Files

```bash
# Run all test files with ts-node
npx mocha --require ts-node/register tests/api-tests/tests/**/*.test.ts

# Run specific pattern
npx mocha --require ts-node/register tests/api-tests/tests/0[1-5]_*.test.ts
```

### Run with Coverage

```bash
npx nyc mocha tests/api-tests/tests/**/*.test.ts
```

---

## Test Pattern

Each test file follows a consistent CRUD pattern:

### 1. **Create Operation**

```typescript
it('Create <resource> test', function (done) {
    // Generate test data using Faker
    loadResourceCreateModel();
    const createModel = getTestData('ResourceCreateModel');
    
    agent
        .post('/api/v1/<resource>')
        .set('Content-Type', 'application/json')
        .set('x-api-key', `${process.env.TEST_API_KEY}`)
        .set('Authorization', `Bearer ${process.env.JWT_ACCESS_TOKEN}`)
        .send(createModel)
        .expect((response) => {
            // Store ID for subsequent tests
            setTestData(response.body.Data.id, 'RESOURCE_ID');
            
            // Assert response structure
            expect(response.body.Data).to.have.property('PropertyName');
            
            // Assert values match input
            expect(response.body.Data.PropertyName).to.equal(createModel.PropertyName);
        })
        .expect(201, done);
});
```

### 2. **Read Operation (Get by ID)**

```typescript
it('Get <resource> by id', function (done) {
    agent
        .get(`/api/v1/<resource>/${getTestData('RESOURCE_ID')}`)
        .set('Content-Type', 'application/json')
        .set('x-api-key', `${process.env.TEST_API_KEY}`)
        .set('Authorization', `Bearer ${process.env.JWT_ACCESS_TOKEN}`)
        .expect((response) => {
            // Assert response structure and values
            expect(response.body.Data).to.have.property('PropertyName');
            expect(response.body.Data.PropertyName).to.equal(createModel.PropertyName);
        })
        .expect(200, done);
});
```

### 3. **Search Operation**

```typescript
it('Search <resource> records', function (done) {
    agent
        .get(`/api/v1/<resource>/search${loadResourceQueryString()}`)
        .set('Content-Type', 'application/json')
        .set('x-api-key', `${process.env.TEST_API_KEY}`)
        .set('Authorization', `Bearer ${process.env.JWT_ACCESS_TOKEN}`)
        .expect((response) => {
            // Assert pagination structure
            expect(response.body.Data.ResourceRecords).to.have.property('TotalCount');
            expect(response.body.Data.ResourceRecords).to.have.property('RetrievedCount');
            expect(response.body.Data.ResourceRecords).to.have.property('PageIndex');
            expect(response.body.Data.ResourceRecords).to.have.property('ItemsPerPage');
            expect(response.body.Data.ResourceRecords).to.have.property('Order');
            
            // Assert data exists
            expect(response.body.Data.ResourceRecords.TotalCount).to.be.greaterThan(0);
            expect(response.body.Data.ResourceRecords.RetrievedCount).to.be.greaterThan(0);
            expect(response.body.Data.ResourceRecords.Items.length).to.be.greaterThan(0);
        })
        .expect(200, done);
});
```

### 4. **Update Operation**

```typescript
it('Update <resource> test', function (done) {
    loadResourceUpdateModel();
    const updateModel = getTestData('ResourceUpdateModel');
    
    agent
        .put(`/api/v1/<resource>/${getTestData('RESOURCE_ID')}`)
        .set('Content-Type', 'application/json')
        .set('x-api-key', `${process.env.TEST_API_KEY}`)
        .set('Authorization', `Bearer ${process.env.JWT_ACCESS_TOKEN}`)
        .send(updateModel)
        .expect((response) => {
            // Assert updated values
            expect(response.body.Data.PropertyName).to.equal(updateModel.PropertyName);
        })
        .expect(200, done);
});
```

### 5. **Delete Operation**

```typescript
it('Delete <resource> test', function (done) {
    agent
        .delete(`/api/v1/<resource>/${getTestData('RESOURCE_ID')}`)
        .set('Content-Type', 'application/json')
        .set('x-api-key', `${process.env.TEST_API_KEY}`)
        .set('Authorization', `Bearer ${process.env.JWT_ACCESS_TOKEN}`)
        .expect((response) => {
            expect(response.body).to.have.property('Status');
            expect(response.body.Status).to.equal('success');
        })
        .expect(200, done);
});
```

### 6. **Recreation Test**

Most test files include a final create test to ensure the resource can be recreated after deletion, verifying complete CRUD cycle integrity.

---

## Authentication

### API Key Authentication

All API requests require an API key in the header:

```typescript
.set('x-api-key', `${process.env.TEST_API_KEY}`)
```

### JWT Bearer Token

All requests also require a valid JWT token:

```typescript
.set('Authorization', `Bearer ${process.env.JWT_ACCESS_TOKEN}`)
```

### Security Headers

Standard security headers are included:

```typescript
.set('Content-Type', 'application/json')
```

---

## Test Data Management

### Faker.js Integration

Each test uses Faker.js to generate realistic, random test data:

```typescript
export const loadResourceCreateModel = async () => {
    const model = {
        Name: faker.person.fullName(),
        Email: faker.internet.email(),
        Phone: faker.phone.number(),
        Price: faker.number.float({ min: 10, max: 100, multipleOf: 0.02 }),
        Date: faker.date.soon({ days: 30 }).toISOString(),
        Description: faker.word.words({ count: { min: 1, max: 2 } }),
        IsActive: faker.datatype.boolean(),
        Quantity: faker.number.int({ min: 1, max: 100 })
    };
    setTestData(model, 'ResourceCreateModel');
};
```

### Common Faker Patterns

- **Names**: `faker.person.fullName()`
- **Email**: `faker.internet.email()`
- **Phone**: `faker.phone.number()`
- **Numbers**: `faker.number.int({ min: 1, max: 100 })`
- **Decimals**: `faker.number.float({ min: 1, max: 100, multipleOf: 0.02 })`
- **Dates**: `faker.date.soon({ days: 30 }).toISOString()`
- **Text**: `faker.word.words({ count: { min: 1, max: 2 } })`
- **Boolean**: `faker.datatype.boolean()`

### Test Cache

The global test cache (`global.TestCache`) stores:
- Created resource IDs for subsequent operations
- Test models for validation
- Shared data between test suites

```typescript
// Store data
setTestData(response.body.Data.id, 'RESOURCE_ID');

// Retrieve data
const resourceId = getTestData('RESOURCE_ID');
```

---

## Best Practices

### 1. **Sequential Execution**

Tests are numbered to ensure proper execution order. Some tests depend on others:
- Products must exist before creating Product Variants
- Vendors must exist before creating Orders
- Delivery Partners must exist before creating Orders

### 2. **Cleanup and Recreation**

Each test file includes a final create test to:
- Verify deletion was successful
- Ensure resources can be recreated
- Leave test data in a consistent state

### 3. **Isolation**

Each test should:
- Handle dependencies on other tests gracefully when sequential execution is required
- Use Faker.js for generating realistic and varied test data
- Clean up after itself

### 4. **Assertions**

Always assert:
- **Response structure** - Verify all expected properties exist
- **Response values** - Validate data matches input
- **HTTP status codes** - Ensure correct status (200, 201, etc.)
- **Response types** - Check data types are correct

### 5. **Error Handling**

Tests use Mocha's `done` callback for async operations:

```typescript
it('Test description', function (done) {
    agent
        .get('/api/endpoint')
        .expect(200, done);  // done() called automatically
});
```

### 6. **Descriptive Test Names**

Test names clearly indicate:
- The resource being tested
- The operation being performed
- Expected behavior

Example: `"Create resource test"`, `"Get resource by id"`

---

## Troubleshooting

### Common Issues

#### 1. **Authentication Failures**

**Error**: 401 Unauthorized

**Solution**: 
- Verify `TEST_API_KEY` and `JWT_ACCESS_TOKEN` are set in `.env`
- Ensure tokens are valid and not expired
- Check that the authorization header format is correct

#### 2. **Database Connection Issues**

**Error**: Cannot connect to database

**Solution**:
- Verify database credentials in `.env`
- Ensure database server is running
- Check network connectivity
- Verify database exists and is accessible

#### 3. **Dependency Test Failures**

**Error**: Foreign key constraint violations

**Solution**:
- Run tests in sequential order (01, 02, 03...)
- Ensure dependent resources are created first
- Check that test IDs are properly stored in test cache

#### 4. **Timeout Errors**

**Error**: Test timeout exceeded

**Solution**:
- Increase Mocha timeout: `this.timeout(5000);`
- Check network connectivity
- Verify application server is running
- Ensure database queries are optimized

#### 5. **Date Format Mismatches**

**Error**: Date validation failures

**Solution**:
- Use consistent ISO format: `.toISOString()`
- Handle timezone conversions properly

---

## Contributing

When adding new tests:

1. **Follow the naming convention**: `##_ResourceName.test.ts`
2. **Use the standard CRUD pattern**
3. **Include all five test operations**: Create, Read, Search, Update, Delete
4. **Add test data generators** using Faker.js
6. **Ensure proper sequencing** if the test has dependencies

---

## Additional Resources

- [Mocha Documentation](https://mochajs.org/)
- [Chai Assertion Library](https://www.chaijs.com/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Faker.js Documentation](https://fakerjs.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

---

## License

ISC

---