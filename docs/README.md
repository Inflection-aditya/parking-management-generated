# Parking Management API Documentation

Welcome to the comprehensive API documentation for the Parking Management application.

<a id="documentation-structure"></a>
## 📚 Documentation Structure

This documentation is organized by modules, with each module containing detailed information about its functionality, endpoints, and database schema.

<a id="available-modules"></a>
## 🗂️ Available Modules



<a id="technology-stack"></a>
## 🛠️ Technology Stack

- **Framework**: Express
- **Database**: parking_manageme with TypeORM
- **Authentication**: Password, PhoneOtp, EmailOtp, SocialLogin
- **Validation**: None
- **Response Handling**: Custom ResponseHandler

<a id="api-versioning"></a>
## 📋 API Versioning

All endpoints are versioned using the `v1` prefix: 
```
/v1/{module}/{endpoint}
```

<a id="response-format"></a>
## 🔄 Response Format

All API responses follow a standardized format:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  },
  "timestamp": "2026-02-20T10:57:35.812Z"
}
```

<a id="error-handling"></a>
## ❌ Error Handling

Errors are handled consistently across all endpoints:

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": 400,
    "details": "Additional error details"
  },
  "timestamp": "2026-02-20T10:57:35.812Z"
}
```

---

<a id="how-to-use-this-documentation"></a>
## 📖 How to Use This Documentation

1. **Module Overview**: Each module documentation starts with a description of its purpose
2. **Controller Information**: Links to the controller file and its routes
3. **Database Schema**: Links to the entity/model files and database structure
4. **Domain Types**: Information about data models used for requests and responses
5. **Endpoints Table**: Complete list of all available endpoints with HTTP methods, URLs, and parameters
6. **Response Examples**: Sample JSON responses for successful operations and errors

---

<a id="getting-started"></a>
## 🚀 Getting Started

To use this API:

1. **Install Dependencies**: `Install project dependencies`
2. **Setup Database**: Configure your parking_manageme database and update the connection string
3. **Run Migrations**: `Run database migrations`
4. **Start Server**: `Start the server`

---
