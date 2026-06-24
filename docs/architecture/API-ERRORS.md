# API Error Specifications

This document defines the standardized error catalog for VisualERP. All backend services must return errors matching the structures and HTTP statuses documented here.

---

## 1. Standard Error Envelope

Every API error response must conform to the following JSON structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable explanation of the error.",
    "details": []
  },
  "meta": {
    "requestId": "req_123",
    "timestamp": "2026-06-25T03:52:16.000Z"
  }
}
```

---

## 2. Error Catalog

### 2.1 VALIDATION_ERROR (HTTP 400)
- **Meaning**: Request payload contains invalid fields or fails data constraint validation (e.g. Zod validation failure).
- **Example Scenario**: User submits a transfer request with a negative quantity.
- **Example Response**:
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Validation failed for request fields.",
      "details": [
        {
          "field": "lines.0.quantity",
          "issue": "Quantity must be greater than zero."
        }
      ]
    },
    "meta": {
      "requestId": "req_001",
      "timestamp": "2026-06-25T03:52:16.000Z"
    }
  }
  ```

### 2.2 UNAUTHORIZED (HTTP 401)
- **Meaning**: The request lacks valid authentication credentials (missing, invalid, or expired Bearer token).
- **Example Scenario**: Accessing the API without providing the `Authorization` header.
- **Example Response**:
  ```json
  {
    "error": {
      "code": "UNAUTHORIZED",
      "message": "Authentication token is missing or has expired.",
      "details": []
    },
    "meta": {
      "requestId": "req_002",
      "timestamp": "2026-06-25T03:52:16.000Z"
    }
  }
  ```

### 2.3 FORBIDDEN (HTTP 403)
- **Meaning**: The authenticated user lacks the required granular permission role to perform the action.
- **Example Scenario**: A Workshop Master attempts to invite a new user to the organization.
- **Example Response**:
  ```json
  {
    "error": {
      "code": "FORBIDDEN",
      "message": "You do not have permission to execute this action.",
      "details": [
        {
          "requiredPermission": "settings:manage"
        }
      ]
    },
    "meta": {
      "requestId": "req_003",
      "timestamp": "2026-06-25T03:52:16.000Z"
    }
  }
  ```

### 2.4 NOT_FOUND (HTTP 404)
- **Meaning**: The requested resource does not exist.
- **Example Scenario**: Fetching an item using a non-existent UUID.
- **Example Response**:
  ```json
  {
    "error": {
      "code": "NOT_FOUND",
      "message": "The requested resource was not found.",
      "details": [
        {
          "entity": "Item",
          "id": "e5b8d231-8930-4e3a-bf41-4560d2bdf7cc"
        }
      ]
    },
    "meta": {
      "requestId": "req_004",
      "timestamp": "2026-06-25T03:52:16.000Z"
    }
  }
  ```

### 2.5 CONFLICT (HTTP 409)
- **Meaning**: The request conflicts with current server state constraints (e.g. unique keys, active locks).
- **Example Scenario**: Registering an Item with a SKU that is already used by another item in the organization.
- **Example Response**:
  ```json
  {
    "error": {
      "code": "CONFLICT",
      "message": "SKU already exists in the organization.",
      "details": [
        {
          "field": "sku",
          "value": "MAT-CEM-500"
        }
      ]
    },
    "meta": {
      "requestId": "req_005",
      "timestamp": "2026-06-25T03:52:16.000Z"
    }
  }
  ```

### 2.6 DOCUMENT_ALREADY_POSTED (HTTP 422)
- **Meaning**: Attempting to edit or post a document that has already been posted.
- **Example Scenario**: Attempting to run `PATCH /api/purchase-receipts/:id` on a posted receipt.
- **Example Response**:
  ```json
  {
    "error": {
      "code": "DOCUMENT_ALREADY_POSTED",
      "message": "Document cannot be modified because it is already posted.",
      "details": [
        {
          "documentId": "a988d231-8930-4e3a-bf41-4560d2bdf7dd"
        }
      ]
    },
    "meta": {
      "requestId": "req_006",
      "timestamp": "2026-06-25T03:52:16.000Z"
    }
  }
  ```

### 2.7 DOCUMENT_CANCELLED (HTTP 422)
- **Meaning**: Attempting to post or modify a document that was already cancelled.
- **Example Scenario**: Attempting to call `/post` on a cancelled transfer document.
- **Example Response**:
  ```json
  {
    "error": {
      "code": "DOCUMENT_CANCELLED",
      "message": "Document cannot be processed because it has been cancelled.",
      "details": []
    },
    "meta": {
      "requestId": "req_007",
      "timestamp": "2026-06-25T03:52:16.000Z"
    }
  }
  ```

### 2.8 INVALID_STATUS_TRANSITION (HTTP 422)
- **Meaning**: Attempting to change an entity status to a state not permitted by transition rules.
- **Example Scenario**: Changing a ProductionOrder status from `PLANNED` directly to `COMPLETED` without going through `IN_PROGRESS`.
- **Example Response**:
  ```json
  {
    "error": {
      "code": "INVALID_STATUS_TRANSITION",
      "message": "Invalid production order status transition.",
      "details": [
        {
          "from": "PLANNED",
          "to": "COMPLETED",
          "allowed": ["IN_PROGRESS", "CANCELLED"]
        }
      ]
    },
    "meta": {
      "requestId": "req_008",
      "timestamp": "2026-06-25T03:52:16.000Z"
    }
  }
  ```

### 2.9 INSUFFICIENT_STOCK (HTTP 422)
- **Meaning**: The stock balance of an item at a specific location or batch is insufficient to cover the transaction.
- **Example Scenario**: Posting a Transfer of 100 kg of sand when only 50 kg is available in `WH-MAIN`.
- **Example Response**:
  ```json
  {
    "error": {
      "code": "INSUFFICIENT_STOCK",
      "message": "Insufficient stock available for this operation.",
      "details": [
        {
          "itemId": "e5b8d231-8930-4e3a-bf41-4560d2bdf7cc",
          "locationId": "7d4bd231-8930-4e3a-bf41-4560d2bdf7ff",
          "available": 50.000000,
          "requested": 100.000000
        }
      ]
    },
    "meta": {
      "requestId": "req_009",
      "timestamp": "2026-06-25T03:52:16.000Z"
    }
  }
  ```

### 2.10 BOM_ALREADY_ACTIVE (HTTP 409)
- **Meaning**: Attempting to activate a BOM version when another BOM version for the same output item is already active.
- **Example Scenario**: Activating BOM version `2.0` before deactivating version `1.0`.
- **Example Response**:
  ```json
  {
    "error": {
      "code": "BOM_ALREADY_ACTIVE",
      "message": "Only one active BOM version is permitted per output item.",
      "details": [
        {
          "outputItemId": "c338d231-8930-4e3a-bf41-4560d2bdf7c2",
          "activeBomId": "a118d231-8930-4e3a-bf41-4560d2bdf7cc"
        }
      ]
    },
    "meta": {
      "requestId": "req_010",
      "timestamp": "2026-06-25T03:52:16.000Z"
    }
  }
  ```

### 2.11 BOM_NOT_FOUND (HTTP 404)
- **Meaning**: The production order references a BOM that does not exist.
- **Example Scenario**: Creating a ProductionOrder with a invalid `bomId`.
- **Example Response**:
  ```json
  {
    "error": {
      "code": "BOM_NOT_FOUND",
      "message": "The specified BOM specification was not found.",
      "details": []
    },
    "meta": {
      "requestId": "req_011",
      "timestamp": "2026-06-25T03:52:16.000Z"
    }
  }
  ```

### 2.12 LOCATION_MISMATCH (HTTP 400)
- **Meaning**: The document locations do not meet logical rules (e.g. source and target locations are the same).
- **Example Scenario**: Creating a Transfer where `sourceLocationId` equals `targetLocationId`.
- **Example Response**:
  ```json
  {
    "error": {
      "code": "LOCATION_MISMATCH",
      "message": "Source and target locations must be different.",
      "details": [
        {
          "sourceLocationId": "7d4bd231-8930-4e3a-bf41-4560d2bdf7ff",
          "targetLocationId": "7d4bd231-8930-4e3a-bf41-4560d2bdf7ff"
        }
      ]
    },
    "meta": {
      "requestId": "req_012",
      "timestamp": "2026-06-25T03:52:16.000Z"
    }
  }
  ```

### 2.13 ORGANIZATION_SCOPE_VIOLATION (HTTP 403)
- **Meaning**: Attempting to access or reference resources belonging to a different tenant organization.
- **Example Scenario**: A user authenticated in Organization A attempts to load a `PurchaseReceipt` belonging to Organization B.
- **Example Response**:
  ```json
  {
    "error": {
      "code": "ORGANIZATION_SCOPE_VIOLATION",
      "message": "Resource organization context mismatch.",
      "details": []
    },
    "meta": {
      "requestId": "req_013",
      "timestamp": "2026-06-25T03:52:16.000Z"
    }
  }
  ```

### 2.14 MODULE_DISABLED (HTTP 403)
- **Meaning**: The request targets a module that is disabled in the tenant's configuration settings.
- **Example Scenario**: Posting a Shipment when the `SHIPMENTS` module has been toggled off.
- **Example Response**:
  ```json
  {
    "error": {
      "code": "MODULE_DISABLED",
      "message": "The module containing this resource is disabled.",
      "details": [
        {
          "module": "SHIPMENTS"
        }
      ]
    },
    "meta": {
      "requestId": "req_014",
      "timestamp": "2026-06-25T03:52:16.000Z"
    }
  }
  ```

### 2.15 IDEMPOTENCY_CONFLICT (HTTP 409)
- **Meaning**: A request with the same `Idempotency-Key` was submitted with a different payload than the original request.
- **Example Scenario**: Retrying a `/post` receipt request with a different supplier ID using the same key.
- **Example Response**:
  ```json
  {
    "error": {
      "code": "IDEMPOTENCY_CONFLICT",
      "message": "Idempotency key conflict. Payload does not match prior request.",
      "details": []
    },
    "meta": {
      "requestId": "req_015",
      "timestamp": "2026-06-25T03:52:16.000Z"
    }
  }
  ```

### 2.16 INTERNAL_ERROR (HTTP 500)
- **Meaning**: An unhandled exception or database connection crash occurred on the server.
- **Example Scenario**: Database server timeouts during a transaction query.
- **Example Response**:
  ```json
  {
    "error": {
      "code": "INTERNAL_ERROR",
      "message": "An internal server error occurred. Please contact support.",
      "details": []
    },
    "meta": {
      "requestId": "req_016",
      "timestamp": "2026-06-25T03:52:16.000Z"
    }
  }
  ```
