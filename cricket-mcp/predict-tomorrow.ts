import { getConnection } from "./src/db/connection.ts";

async function main() {
  const conn = await getConnection("./data/cricket.duckdb");

  try {
    // Check for matches scheduled for tomorrow
    const sql = `
      SELECT
        match_id,
        match_type,
        date_start,
        team1,
        team2,
        venue,
        event_name,
        event_stage,
        toss_winner,
        toss_decision
      FROM matches
      WHERE DATE(date_start) = DATE('2026-08-14')
      ORDER BY date_start;
    `;

    const reader = await conn.runAndReadAll(sql);
    const results = reader.getRowObjectsJson();
    
    if (results.length === 0) {
      console.log("❌ No matches scheduled for tomorrow (2026-08-14)\n");
      
      // Show upcoming matches
      const upcomingSql = `
        SELECT
          DATE(date_start) as match_date,
          COUNT(*) as match_count
        FROM matches
        WHERE DATE(date_start) > DATE('2026-08-13')
        GROUP BY DATE(date_start)
        ORDER BY match_date
        LIMIT 5;
      `;
      
      const upcomingReader = await conn.runAndReadAll(upcomingSql);
      const upcomingResults = upcomingReader.getRowObjectsJson();
      
      if (upcomingResults.length > 0) {
        console.log("📅 Upcoming matches in the database:");
        for (const upcoming of upcomingResults) {
          console.log(`  ${upcoming.match_date}: ${upcoming.match_count} match(es)`);
        }
      }
      return;
    }

    console.log("═══════════════════════════════════════════════════════════════");
    console.log("            MATCHES SCHEDULED FOR TOMORROW (2026-08-14)");
    console.log("═══════════════════════════════════════════════════════════════\n");

    for (const match of results) {
      console.log(`🏟️  ${match.match_type} | ${match.event_name || 'Friendly'}`);
      console.log(`   ${match.team1} vs ${match.team2}`);
      if (match.venue) console.log(`   📍 Venue: ${match.venue}`);
      if (match.event_stage) console.log(`   Stage: ${match.event_stage}`);
      console.log();
    }

    // For prediction, let's get head-to-head records for the teams
    if (results.length > 0) {
      const match = results[0];
      const h2hSql = `
        SELECT
          CASE WHEN m.outcome_winner = $team1 THEN $team1 ELSE $team2 END as winner,
          COUNT(*) as wins
        FROM matches m
        WHERE (
          (m.team1 = $team1 AND m.team2 = $team2)
          OR (m.team1 = $team2 AND m.team2 = $team1)
        )
        AND m.match_type = $match_type
        AND m.outcome_winner IS NOT NULL
        GROUP BY winner
        ORDER BY wins DESC;
      `;

      const h2hReader = await conn.runAndReadAll(h2hSql, {
        team1: match.team1,
        team2: match.team2,
        match_type: match.match_type
      });
      const h2hResults = h2hReader.getRowObjectsJson();

      if (h2hResults.length > 0) {
        console.log("📊 HEAD-TO-HEAD RECORD:");
        let team1_wins = 0, team2_wins = 0;
        
        for (const record of h2hResults) {
          console.log(`  ${record.winner}: ${record.wins} wins`);
          if (record.winner === match.team1) team1_wins = record.wins;
          else team2_wins = record.wins;
        }
        
        console.log("\n💡 PREDICTION:");
        if (team1_wins > team2_wins) {
          console.log(`  🔴 ${match.team1} is favored (${team1_wins}-${team2_wins} head-to-head)`);
        } else if (team2_wins > team1_wins) {
          console.log(`  🔵 ${match.team2} is favored (${team2_wins}-${team1_wins} head-to-head)`);
        } else {
          console.log(`  ⚪ Evenly matched (${team1_wins}-${team2_wins} head-to-head)`);
        }
      }
    }

  } catch (error) {
    console.error("Error:", error);
  }
}

main().catch(console.error);
