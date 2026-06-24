# Performance Principles

VisualERP is aimed at real office environments where hardware may be modest and internet quality may vary.

## General Principles

- paginate large lists;
- design indexes for common filters and reports;
- avoid N+1 query patterns;
- separate transactional reads from heavy reporting paths where needed.

## Reporting

Reports should be designed for efficiency from the start:

- avoid scanning unnecessary historical data;
- predefine common filters;
- plan aggregate caching later for dashboards and frequent summaries.

## UI Responsiveness

The UI should remain usable on weak office computers.

Guidelines:

- prefer simple screens over heavy animations;
- minimize unnecessary client-side computation;
- render large tables carefully;
- load only the data needed for the current task.

## Future Optimization Areas

- dashboard aggregate caching;
- background report generation for heavy exports;
- warehouse scanning and mobile optimization;
- selective offline sync for unstable networks.
