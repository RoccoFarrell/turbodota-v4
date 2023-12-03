SELECT
        
matches.match_id,
matches.start_time,
((player_matches.player_slot < 128) = matches.radiant_win) win,
player_matches.hero_id,
player_matches.account_id
FROM matches
JOIN player_matches using(match_id)
JOIN heroes on heroes.id = player_matches.hero_id
WHERE player_matches.account_id in ("65110965")
AND matches.start_time >= extract(epoch from timestamp '2023-11-28T22:52:20.879Z')
ORDER BY matches.match_id NULLS LAST
LIMIT 200