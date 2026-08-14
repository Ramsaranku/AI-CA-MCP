import { getConnection } from "./src/db/connection.ts";

async function main() {
  const conn = await getConnection("./data/cricket.duckdb");

  try {
    // Main matchup stats
    const matchupSql = `
      WITH matchup_deliveries AS (
        SELECT
          d.match_id,
          d.innings_number,
          d.batter,
          d.batter_id,
          d.bowler,
          d.bowler_id,
          d.runs_batter,
          d.runs_total,
          d.runs_extras,
          d.extras_wides,
          d.extras_noballs,
          d.is_wicket,
          d.wicket_kind,
          d.wicket_player_out,
          m.match_type,
          m.date_start,
          m.team1,
          m.team2,
          m.venue,
          m.event_name
        FROM deliveries d
        JOIN matches m ON d.match_id = m.match_id
        WHERE m.match_type = 'T20'
          AND d.batter ILIKE '%Kohli%'
          AND d.bowler ILIKE '%Bumrah%'
      )
      SELECT
        d.batter AS batter_name,
        d.bowler AS bowler_name,
        COUNT(DISTINCT d.match_id) AS matches,
        COUNT(DISTINCT d.match_id || '-' || d.innings_number) AS innings,
        COUNT(*) FILTER (WHERE d.extras_wides = 0 AND d.extras_noballs = 0) AS balls_faced,
        SUM(d.runs_batter) AS runs_scored,
        COUNT(*) FILTER (WHERE d.is_wicket AND d.wicket_player_out ILIKE '%Kohli%' AND d.wicket_kind IN ('bowled', 'caught', 'lbw', 'hit wicket', 'caught and bowled')) AS dismissals,
        COUNT(*) FILTER (WHERE d.runs_batter = 0 AND d.extras_wides = 0 AND d.extras_noballs = 0) AS dot_balls,
        COUNT(*) FILTER (WHERE d.runs_batter = 4) AS fours,
        COUNT(*) FILTER (WHERE d.runs_batter = 6) AS sixes
      FROM matchup_deliveries d
      GROUP BY d.batter, d.bowler;
    `;

    // Dismissal breakdown
    const dismissalSql = `
      SELECT
        d.wicket_kind AS dismissal_type,
        COUNT(*) AS count
      FROM deliveries d
      JOIN matches m ON d.match_id = m.match_id
      WHERE m.match_type = 'T20'
        AND d.batter ILIKE '%Kohli%'
        AND d.bowler ILIKE '%Bumrah%'
        AND d.is_wicket
        AND d.wicket_player_out ILIKE '%Kohli%'
        AND d.wicket_kind IN ('bowled', 'caught', 'lbw', 'hit wicket', 'caught and bowled')
      GROUP BY d.wicket_kind
      ORDER BY count DESC;
    `;

    // Match history
    const historySQL = `
      SELECT
        m.date_start as date,
        m.team1,
        m.team2,
        m.venue,
        m.event_name,
        SUM(CASE WHEN d.batter ILIKE '%Kohli%' AND d.extras_wides = 0 AND d.extras_noballs = 0 THEN 1 ELSE 0 END) as balls_faced,
        SUM(CASE WHEN d.batter ILIKE '%Kohli%' THEN d.runs_batter ELSE 0 END) as runs_scored,
        COUNT(DISTINCT CASE WHEN d.is_wicket AND d.wicket_player_out ILIKE '%Kohli%' AND d.wicket_kind IN ('bowled', 'caught', 'lbw', 'hit wicket', 'caught and bowled') THEN d.match_id || '-' || d.innings_number END) as dismissed
      FROM deliveries d
      JOIN matches m ON d.match_id = m.match_id
      WHERE m.match_type = 'T20'
        AND d.batter ILIKE '%Kohli%'
        AND d.bowler ILIKE '%Bumrah%'
      GROUP BY m.match_id, m.date_start, m.team1, m.team2, m.venue, m.event_name
      ORDER BY m.date_start DESC
      LIMIT 5;
    `;

    const reader = await conn.runAndReadAll(matchupSql);
    const results = reader.getRowObjectsJson();
    
    if (results.length === 0) {
      console.log("No matchup data found for Kohli vs Bumrah in T20s");
      return;
    }

    const result = results[0];
    const ballsFaced = result.balls_faced || 0;
    const runsScored = result.runs_scored || 0;
    const dismissals = result.dismissals || 0;
    const dotBalls = result.dot_balls || 0;
    const fours = result.fours || 0;
    const sixes = result.sixes || 0;
    
    const average = dismissals > 0 ? (runsScored / dismissals).toFixed(2) : "N/A";
    const strikeRate = ballsFaced > 0 ? ((runsScored / ballsFaced) * 100).toFixed(2) : "N/A";
    const dotBallPct = ballsFaced > 0 ? ((dotBalls / ballsFaced) * 100).toFixed(2) : "N/A";
    const boundaryPct = ballsFaced > 0 ? (((fours + sixes) / ballsFaced) * 100).toFixed(2) : "N/A";
    
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("    VIRAT KOHLI vs JASPRIT BUMRAH - T20 MATCHUP ANALYSIS");
    console.log("═══════════════════════════════════════════════════════════════\n");
    
    console.log("📊 OVERALL RECORD:");
    console.log(`  Matches: ${result.matches}`);
    console.log(`  Innings: ${result.innings}\n`);
    
    console.log("🏏 BATTING PERFORMANCE:");
    console.log(`  Balls Faced:    ${ballsFaced}`);
    console.log(`  Runs Scored:    ${runsScored}`);
    console.log(`  Dismissals:     ${dismissals}`);
    console.log(`  Average:        ${average}`);
    console.log(`  Strike Rate:    ${strikeRate}%\n`);
    
    console.log("📈 SHOT SELECTION:");
    console.log(`  Dot Balls:      ${dotBalls} (${dotBallPct}%)`);
    console.log(`  Fours:          ${fours}`);
    console.log(`  Sixes:          ${sixes}`);
    console.log(`  Boundaries:     ${fours + sixes} (${boundaryPct}% of deliveries)\n`);

    // Dismissal breakdown
    const dismissalReader = await conn.runAndReadAll(dismissalSql);
    const dismissalResults = dismissalReader.getRowObjectsJson();
    
    if (dismissalResults.length > 0) {
      console.log("💀 DISMISSAL BREAKDOWN:");
      for (const dismissal of dismissalResults) {
        console.log(`  ${dismissal.dismissal_type}: ${dismissal.count}`);
      }
      console.log();
    }

    // Recent matches
    const historyReader = await conn.runAndReadAll(historySQL);
    const historyResults = historyReader.getRowObjectsJson();
    
    if (historyResults.length > 0) {
      console.log("📅 RECENT ENCOUNTERS:");
      for (const match of historyResults) {
        const sr = match.balls_faced > 0 ? ((match.runs_scored / match.balls_faced) * 100).toFixed(0) : "0";
        const status = match.dismissed ? "dismissed" : "not out";
        console.log(`  ${match.date} | ${match.team1} vs ${match.team2}`);
        console.log(`    → ${match.runs_scored} runs from ${match.balls_faced} balls (SR: ${sr}%) [${status}]`);
        if (match.venue) console.log(`    → ${match.venue}`);
        console.log();
      }
    }

    console.log("═══════════════════════════════════════════════════════════════\n");

    // Key insights
    console.log("💡 KEY INSIGHTS:");
    const avgPerMatch = (runsScored / result.matches).toFixed(2);
    const dismissalRate = ((dismissals / result.innings) * 100).toFixed(1);
    console.log(`  • Average runs per match: ${avgPerMatch}`);
    console.log(`  • Dismissal rate: ${dismissalRate}% (1 dismissal per ${(result.innings / dismissals).toFixed(1)} innings)`);
    
    if (strikeRate > 140) {
      console.log(`  • Kohli is aggressive against Bumrah with a strike rate above 140`);
    } else if (strikeRate > 120) {
      console.log(`  • Kohli maintains a good strike rate of over 120 against Bumrah`);
    }
    
    if (dotBallPct > 40) {
      console.log(`  • Faces dot balls on ${dotBallPct}% of deliveries - shows respect for Bumrah's line/length`);
    }
    
    console.log();
    
  } catch (error) {
    console.error("Error running query:", error);
  }
}

main().catch(console.error);
