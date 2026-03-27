-- PostgreSQL: run after data load; compare counts with the same query shape on MySQL (drop ::bigint on MySQL).
SELECT 'users' AS tbl, COUNT(*)::bigint AS n FROM users
UNION ALL SELECT 'projects', COUNT(*) FROM projects
UNION ALL SELECT 'freelancer_profiles', COUNT(*) FROM freelancer_profiles
UNION ALL SELECT 'messages', COUNT(*) FROM messages
UNION ALL SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL SELECT 'project_ratings', COUNT(*) FROM project_ratings
UNION ALL SELECT 'project_applications', COUNT(*) FROM project_applications
UNION ALL SELECT 'project_payments', COUNT(*) FROM project_payments
UNION ALL SELECT 'project_payment_transactions', COUNT(*) FROM project_payment_transactions
UNION ALL SELECT 'project_payment_orders', COUNT(*) FROM project_payment_orders
ORDER BY tbl;
