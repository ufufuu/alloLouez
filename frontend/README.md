# AlloLouez Frontend

The frontend is split into two independent web applications:

- `web/` — public customer marketplace, inspired by the aggregator model of VIPCars.
- `admin/` — internal operations dashboard for bookings, vehicles, suppliers, customers and reports.

Both applications are designed to consume the future `backend/` API. A React Native mobile app can use the same API without duplicating business logic.