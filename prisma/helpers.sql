--fix auto increment after manually adding
SELECT setval(pg_get_serial_sequence('"Random"', 'id'), coalesce(max(id)+1, 1), false) FROM "Random";
SELECT setval(pg_get_serial_sequence('"Match"', 'id'), coalesce(max(id)+1, 1), false) FROM "Match";
SELECT setval(pg_get_serial_sequence('"UserPrefs"', 'id'), coalesce(max(id)+1, 1), false) FROM "UserPrefs";
SELECT setval(pg_get_serial_sequence('"PlayersMatchDetail"', 'id'), coalesce(max(id)+1, 1), false) FROM "PlayersMatchDetail";