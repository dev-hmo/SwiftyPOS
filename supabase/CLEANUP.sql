-- CLEANUP: Correct foreign key order

DELETE FROM sales_items;
DELETE FROM sales_transactions;
DELETE FROM inventory_movements;
DELETE FROM product_stocks;
DELETE FROM product_variants;
DELETE FROM product_categories;
DELETE FROM promotions;
DELETE FROM account_transactions;
DELETE FROM audit_logs;
DELETE FROM business_settings;
DELETE FROM products;
DELETE FROM stores;
DELETE FROM customers;
DELETE FROM user_tenants;
DELETE FROM super_admins;
DELETE FROM tenants;

-- Delete orphaned auth users
DELETE FROM auth.users
WHERE email IN ('superadmin@swiftypos.com', 'admin@demo.com', 'cashier@demo.com');
