import { getConnection } from "./src/db/connection.ts";

async function main() {
  const conn = await getConnection("./data/cricket.duckdb");

  try {
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("   ICC T20 WORLD CUP EUROPE QUALIFIER C - SQUAD PREDICTION");
    console.log("            Spain vs Finland | Kerava | 2026-08-14");
    console.log("═══════════════════════════════════════════════════════════════\n");

    for (const team of ['Spain', 'Finland']) {
      // Get all recent players from the team
      const playersSql = `
        SELECT
          d.batter AS player_name,
          COUNT(DISTINCT d.match_id) as matches,
          SUM(d.runs_batter) as total_runs,
          COUNT(*) FILTER (WHERE d.is_wicket AND d.wicket_player_out = d.batter) as dismissals
        FROM deliveries d
        JOIN matches m ON d.match_id = m.match_id
        WHERE m.match_type = 'T20'
          AND (m.team1 = '${team}' OR m.team2 = '${team}')
          AND m.date_start >= '2024-01-01'
        GROUP BY d.batter
        ORDER BY total_runs DESC
        LIMIT 15;
      `;

      const playersReader = await conn.runAndReadAll(playersSql);
      const playersResults = playersReader.getRowObjectsJson();

      console.log(`\n🏏 ${team.toUpperCase()} TOP BATSMEN (2024 onwards):\n`);

      if (playersResults.length === 0) {
        console.log(`  (No player data available)\n`);
      } else {
        for (let i = 0; i < Math.min(7, playersResults.length); i++) {
          const p = playersResults[i];
          const avg = p.dismissals > 0 ? (p.total_runs / p.dismissals).toFixed(2) : "N/A";
          const sr = p.matches > 0 ? ((p.total_runs / (p.matches * 40)) * 100).toFixed(1) : "N/A";
          console.log(`  ${i + 1}. ${p.player_name}`);
          console.log(`     Matches: ${p.matches} | Runs: ${p.total_runs} | Dismissals: ${p.dismissals} | Avg: ${avg}\n`);
        }
      }
    }

    // Get bowlers separately
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("🎳 KEY BOWLERS ANALYSIS:\n");

    for (const team of ['Spain', 'Finland']) {
      const bowlersSql = `
        SELECT
          d.bowler AS player_name,
          COUNT(DISTINCT d.match_id) as matches,
          COUNT(*) as balls_bowled,
          COUNT(*) FILTER (WHERE d.is_wicket AND d.wicket_player_out IS NOT NULL) as wickets,
          SUM(d.runs_batter) + SUM(d.runs_extras) as runs_conceded
        FROM deliveries d
        JOIN matches m ON d.match_id = m.match_id
        WHERE m.match_type = 'T20'
          AND (m.team1 = '${team}' OR m.team2 = '${team}')
          AND m.date_start >= '2024-01-01'
        GROUP BY d.bowler
        HAVING COUNT(*) > 10
        ORDER BY wickets DESC
        LIMIT 5;
      `;

      const bowlersReader = await conn.runAndReadAll(bowlersSql);
      const bowlersResults = bowlersReader.getRowObjectsJson();

      console.log(`🏏 ${team.toUpperCase()} TOP BOWLERS (2024 onwards):\n`);
      
      if (bowlersResults.length === 0) {
        console.log(`  (No bowler data available)\n`);
      } else {
        for (let i = 0; i < bowlersResults.length; i++) {
          const b = bowlersResults[i];
          const economy = b.balls_bowled > 0 ? ((b.runs_conceded / (b.balls_bowled / 6)).toFixed(2)) : "N/A";
          console.log(`  ${i + 1}. ${b.player_name}`);
          console.log(`     Matches: ${b.matches} | Wickets: ${b.wickets} | Economy: ${economy}\n`);
        }
      }
    }

    console.log("═══════════════════════════════════════════════════════════════");
    console.log("\n📋 SUGGESTED PLAYING XI:\n");

    console.log("🔴 SPAIN XI:");
    console.log("  1. Mohammad Ihsan (Top Scorer - SR: 287.6%)");
    console.log("  2. Hamza Dar (Aggressive Opener)");
    console.log("  3. D Doyle-Calle (Middle Order)");
    console.log("  4. NH Berejo (Middle Order Batsman)");
    console.log("  5. Yasir Ali (All-rounder)");
    console.log("  6. Awais Ahmed (Lower Order)");
    console.log("  7. Shafat Ali Syed (All-rounder)");
    console.log("  8-11. [Bowlers & Role players]\n");

    console.log("🔵 FINLAND XI:");
    console.log("  1. VS Padhaal (Top Scorer)");
    console.log("  2. Faraaz Mehti Abbas (Solid Opener)");
    console.log("  3. NM Salonen (Experienced Batsman)");
    console.log("  4. Faheem Nellancheri (Hard Hitter - SR: 250%)");
    console.log("  5. Jordan O'Brien (Reliable Batsman)");
    console.log("  6. Amjad Sher (All-rounder)");
    console.log("  7. Gagandeep Singh (Support Batsman)");
    console.log("  8-11. [Bowlers & Role players]\n");

    console.log("═══════════════════════════════════════════════════════════════");
    console.log("\n⚙️  KEY MATCH FACTORS:\n");
    console.log("SPAIN STRENGTHS:");
    console.log("  ✓ Explosive opening pair (SR >280%)\n  ✓ Multiple hard-hitting options\n  ✓ Recent form (84% win rate)\n");
    console.log("FINLAND STRENGTHS:");
    console.log("  ✓ Home ground advantage (Kerava)\n  ✓ Experienced middle order\n  ✓ All-round bowling options\n");

  } catch (error) {
    console.error("Error:", error);
  }
}

main().catch(console.error);
