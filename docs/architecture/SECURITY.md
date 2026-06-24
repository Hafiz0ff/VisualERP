# Security Baseline

This document defines the initial security posture for VisualERP.

## Authentication

Future authentication should provide:

- secure sign-in;
- protected sessions or tokens;
- controlled session expiration;
- password hygiene or future SSO compatibility.

Exact implementation is deferred to later phases.

## Authorization

Authorization must be role-based with action-level permissions.

Principles:

- least privilege by default;
- module access separated from action rights;
- sensitive operations restricted to authorized roles;
- financial visibility separable from operational editing.

## Role-Based Access Control

The system should support:

- named roles for business users;
- granular `Permission` records;
- role bundles that can evolve over time;
- future organization-specific permission customization.

## Audit Log

Security-sensitive and operationally important actions must be recorded in `AuditLog`.

Examples:

- user and role changes;
- stock corrections;
- write-offs;
- production confirmations;
- shipment confirmations;
- critical settings changes.

## Sensitive Operations

The following categories should receive stronger scrutiny:

- deleting or voiding transactional records;
- adjusting stock outside normal flow;
- changing user permissions;
- changing industry profile terminology;
- enabling or disabling modules.

## Backup Strategy

The future production deployment must include:

- scheduled database backups;
- restore verification procedures;
- retention policy aligned with business risk;
- operational ownership for backup monitoring.

## Data Ownership

Each organization must own and isolate its data. Even if the first version starts single-tenant in practice, the model should preserve clear data ownership boundaries.

## Early Security Principles

- no hidden side effects;
- explicit permission checks;
- secure defaults;
- auditable mutations;
- no assumption that internal users are always trustworthy.
