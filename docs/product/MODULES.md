# Модули системы

VisualERP должен строиться как набор модулей с возможностью поэтапного включения.

## Архитектурная формула

`VisualERP Core + Industry Profiles + Optional Modules`

## MVP Modules

### Warehouse

Отвечает за:

- склады;
- приемки;
- остатки;
- перемещения;
- инвентаризации.

### Production

Отвечает за:

- производственные заказы;
- расход материалов;
- выпуск продукции;
- статусы выполнения.

### BOM / Recipe

Отвечает за:

- спецификации изделий;
- рецептуры;
- состав готовой продукции;
- связь нормы расхода с производством.

### Shipments

Отвечает за:

- отгрузки;
- резерв логики на будущее;
- списание готовой продукции со склада при отгрузке.

### Write-offs

Отвечает за:

- списания по браку;
- порче;
- потерям;
- ручным корректировкам по регламенту.

### Reports

Отвечает за:

- отчеты по остаткам;
- движению;
- выпуску;
- отгрузкам;
- списаниям.

### Audit Log

Отвечает за:

- историю ключевых действий;
- чувствительные изменения;
- базовую трассируемость.

### Users and Roles

Отвечает за:

- пользователей;
- роли;
- права;
- контроль доступа.

## Future Optional Modules

- Quality Control
- Finance
- CRM
- Equipment Maintenance
- Payroll
- Multi-branch support
- Offline sync
- Barcode / QR support
- Mobile warehouse app

## Module Dependencies

Базовые зависимости:

- `Production` depends on `Items`, `Workshop`, `Warehouse`, and `BOM / Recipe`
- `Shipments` depends on `Warehouse` and `Items`
- `Write-offs` depends on `Warehouse` and `Audit Log`
- `Reports` depends on all transactional modules
- `Users and Roles` and `Audit Log` are cross-cutting modules

## Enable / Disable Concept

Модули должны подключаться конфигурацией, а не форком кода.

Принципы:

- ядро знает о доступности модуля через конфигурацию;
- выключенный модуль не должен ломать другие модули;
- данные и права должны проверяться с учетом включенных модулей;
- UI и API в будущем должны скрывать выключенные модули;
- отраслевые профили могут рекомендовать модули по умолчанию, но не менять ядро насильно.
