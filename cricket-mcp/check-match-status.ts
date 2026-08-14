import { getConnection } from "./src/db/connection.ts";

async function main() {
  const conn = await getConnection("./data/cricket.duckdb");

  // Check database date range and stats
  const statsSQL = `
    SELECT 
      MIN(DATE(date_start)) as earliest_match,
      MAX(DATE(date_start)) as latest_match,
      COUNT(*) as total_matches,
      COUNT(DISTINCT event_name) as total_events
    FROM matches;
  `;

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("                    MATCH STATUS CHECK");
  console.log("═══════════════════════════════════════════════════════════════\n");

  const statsReader = await conn.runAndReadAll(statsSQL);
  const stats = statsReader.getRowObjectsJson()[0];
  
  console.log("📊 Database Statistics:");
  console.log(`   Total Matches: ${stats.total_matches}`);
  console.log(`   Total Events: ${stats.total_events}`);
  console.log(`   Date Range: ${stats.earliest_match} to ${stats.latest_match}\n`);

  // Show latest 10 matches
  console.log("───────────────────────────────────────────────────────────────");
  console.log("                     LATEST 10 MATCHES");
  console.log("───────────────────────────────────────────────────────────────\n");

  const latestSQL = `
    SELECT 
      match_id,
      date_start,
      team1,
      team2,
      match_type,
      event_name,
      outcome_result,
      outcome_winner
    FROM matches
    ORDER BY date_start DESC
    LIMIT 10;
  `;

  const latestReader = await conn.runAndReadAll(latestSQL);
  const latestMatches = latestReader.getRowObjectsJson();
  
  latestMatches.forEach((match, idx) => {
    const date = match.date_start.split("T")[0];
    const result = match.outcome_result || "In Progress";
    const winner = match.outcome_winner ? ` - Won by ${match.outcome_winner}` : "";
    console.log(`${idx + 1}. ${date} | ${match.team1} vs ${match.team2}`);
    console.log(`   Type: ${match.match_type} | Event: ${match.event_name || "N/A"}`);
    console.log(`   Result: ${result}${winner}\n`);
  });

  await conn.close();
}

main().catch(console.error);
