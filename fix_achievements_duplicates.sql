-- Skrypt naprawy duplikatów osiągnięć
-- Problem: W tabeli achievements było 1928 duplikatów zamiast 19 unikalnych osiągnięć

-- 1. Usuń duplikaty osiągnięć, zostawiając tylko pierwszy z każdej grupy
DELETE FROM achievements 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM achievements 
  GROUP BY name, requirement_type, requirement_value
);

-- 2. Usuń osierocone rekordy w user_achievements
DELETE FROM user_achievements 
WHERE achievement_id NOT IN (SELECT id FROM achievements);

-- 3. Sprawdź wynik
SELECT 'Liczba unikalnych osiągnięć:' as info, COUNT(*) as count FROM achievements
UNION ALL
SELECT 'Liczba rekordów user_achievements:', COUNT(*) FROM user_achievements;
