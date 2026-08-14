import { getConnection } from "./src/db/connection.ts";

async function main() {
  const conn = await getConnection("./data/cricket.duckdb");

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("      AUSTRALIA PACE BOWLING ANALYSIS vs BANGLADESH");
  console.log("═══════════════════════════════════════════════════════════════\n");

  // Get Australian pace bowlers' wickets against Bangladesh
  const wicketsSQL = `
    SELECT 
      d.bowler,
      d.wicket_kind,
      d.wicket_player_out,
      COUNT(*) as count
    FROM deliveries d
    INNER JOIN innings i ON d.match_id = i.match_id AND d.innings_number = i.innings_number
    WHERE d.match_id IN (
      SELECT match_id FROM matches 
      WHERE match_type = 'Test' 
        AND ((team1 = 'Bangladesh' AND team2 = 'Australia') 
             OR (team1 = 'Australia' AND team2 = 'Bangladesh'))
    )
    AND d.is_wicket = true
    AND d.bowler IS NOT NULL
    AND i.batting_team = 'Bangladesh'
    AND i.bowling_team = 'Australia'
    GROUP BY d.bowler, d.wicket_kind, d.wicket_player_out
    ORDER BY d.bowler, count DESC;
  `;

  console.log("🎯 DISMISSALS OF BANGLADESH BATSMEN BY AUSTRALIAN PACE BOWLERS\n");

  const wicketsReader = await conn.runAndReadAll(wicketsSQL);
  const wickets = wicketsReader.getRowObjectsJson();

  if (wickets.length === 0) {
    console.log("❌ No wicket data found. Let me try a broader query...\n");
    
    // Broader query to understand data structure
    const broadSQL = `
      SELECT DISTINCT bowler, wicket_kind
      FROM deliveries
      WHERE is_wicket = true
      LIMIT 5;
    `;
    
    const broadReader = await conn.runAndReadAll(broadSQL);
    const sample = broadReader.getRowObjectsJson();
    console.log("Sample wicket data:", JSON.stringify(sample, null, 2));
  } else {
    const bowlerStats: Record<string, { total: number; types: Record<string, number>; victims: Set<string> }> = {};
    
    wickets.forEach(w => {
      if (!bowlerStats[w.bowler]) {
        bowlerStats[w.bowler] = { total: 0, types: {}, victims: new Set() };
      }
      bowlerStats[w.bowler].total += w.count;
      bowlerStats[w.bowler].types[w.wicket_kind] = (bowlerStats[w.bowler].types[w.wicket_kind] || 0) + w.count;
      if (w.wicket_player_out) {
        bowlerStats[w.bowler].victims.add(w.wicket_player_out);
      }
    });

    Object.entries(bowlerStats)
      .sort((a, b) => b[1].total - a[1].total)
      .forEach(([bowler, data]) => {
        console.log(`\n🔥 ${bowler}`);
        console.log(`   Total Wickets: ${data.total}`);
        console.log(`   Victims: ${Array.from(data.victims).join(', ')}`);
        console.log(`   Dismissal Types:`);
        Object.entries(data.types)
          .sort((a, b) => (b as [string, number])[1] - (a as [string, number])[1])
          .forEach(([type, count]) => {
            console.log(`     • ${type}: ${count}`);
          });
      });
  }

  // Get batting stats of Bangladesh batsmen
  console.log("\n\n📊 BANGLADESH BATSMEN PERFORMANCE vs AUSTRALIAN PACE\n");

  const batsmenSQL = `
    SELECT 
      d.batter,
      COUNT(*) as balls_faced,
      SUM(CASE WHEN d.is_wicket = true THEN 1 ELSE 0 END) as dismissals,
      SUM(d.runs_batter) as runs_scored
    FROM deliveries d
    INNER JOIN innings i ON d.match_id = i.match_id AND d.innings_number = i.innings_number
    WHERE d.match_id IN (
      SELECT match_id FROM matches 
      WHERE match_type = 'Test' 
        AND ((team1 = 'Bangladesh' AND team2 = 'Australia') 
             OR (team1 = 'Australia' AND team2 = 'Bangladesh'))
    )
    AND i.batting_team = 'Bangladesh'
    AND i.bowling_team = 'Australia'
    AND d.batter IS NOT NULL
    GROUP BY d.batter
    HAVING COUNT(*) >= 15
    ORDER BY runs_scored DESC
    LIMIT 15;
  `;

  const batsmenReader = await conn.runAndReadAll(batsmenSQL);
  const batsmen = batsmenReader.getRowObjectsJson();

  if (batsmen.length > 0) {
    console.log("Batsman                  | Balls | Runs | Avg | SR%");
    console.log("──────────────────────────────────────────────────────");
    
    batsmen.forEach(b => {
      const avg = b.dismissals > 0 ? (b.runs_scored / b.dismissals).toFixed(1) : "N/A";
      const sr = ((b.runs_scored / b.balls_faced) * 100).toFixed(1);
      const name = b.batter.padEnd(24);
      console.log(`${name} | ${String(b.balls_faced).padStart(5)} | ${String(b.runs_scored).padStart(4)} | ${String(avg).padStart(4)} | ${sr}`);
    });
  }

  // Analyze runs by match phase
  console.log("\n\n📈 RUNS CONCEDED IN DIFFERENT PHASES\n");

  const phaseSQL = `
    SELECT 
      CASE 
        WHEN over_number <= 10 THEN 'Powerplay (1-10)'
        WHEN over_number <= 30 THEN 'Middle Overs (11-30)'
        ELSE 'Death Overs (30+)'
      END as phase,
      COUNT(*) as balls_bowled,
      SUM(runs_total) as runs_conceded,
      SUM(CASE WHEN is_wicket = true THEN 1 ELSE 0 END) as wickets_taken
    FROM deliveries d
    INNER JOIN innings i ON d.match_id = i.match_id AND d.innings_number = i.innings_number
    WHERE d.match_id IN (
      SELECT match_id FROM matches 
      WHERE match_type = 'Test' 
        AND ((team1 = 'Bangladesh' AND team2 = 'Australia') 
             OR (team1 = 'Australia' AND team2 = 'Bangladesh'))
    )
    AND i.batting_team = 'Bangladesh'
    AND i.bowling_team = 'Australia'
    GROUP BY phase
    ORDER BY CASE WHEN phase LIKE 'Powerplay%' THEN 1 WHEN phase LIKE 'Middle%' THEN 2 ELSE 3 END;
  `;

  const phaseReader = await conn.runAndReadAll(phaseSQL);
  const phases = phaseReader.getRowObjectsJson();

  phases.forEach(p => {
    const economy = ((p.runs_conceded / p.balls_bowled) * 6).toFixed(2);
    const wicketRate = (p.wickets_taken / (p.balls_bowled / 6)).toFixed(2);
    console.log(`${p.phase}`);
    console.log(`  Economy: ${economy} runs/over | Wickets: ${p.wickets_taken} | Wicket rate: ${wicketRate} per over`);
  });
}

main().catch(console.error);
