-- Remove subscribers and views columns from channels table
ALTER TABLE channels DROP COLUMN IF EXISTS subscribers;
ALTER TABLE channels DROP COLUMN IF EXISTS views;
