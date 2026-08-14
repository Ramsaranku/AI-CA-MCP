import { getConnection } from "./src/db/connection.ts";

async function main() {
  const conn = await getConnection("./data/cricket.duckdb");

  // Search for Australia vs Bangladesh test matches
  const ausBanTestSQL = `
    SELECT 
      match_id,
      date_start,
      team1,
      team2,
      match_type,
      venue,
      outcome_winner,
      outcome_result
    FROM matches
    WHERE match_type = 'Test'
      AND (
        (team1 = 'Australia' AND team2 = 'Bangladesh') OR
        (team1 = 'Bangladesh' AND team2 = 'Australia')
      )
    ORDER BY date_start DESC
    LIMIT 10;
  `;

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("     AUSTRALIA vs BANGLADESH TEST MATCHES (Recent History)");
  console.log("═══════════════════════════════════════════════════════════════\n");

  const reader = await conn.runAndReadAll(ausBanTestSQL);
  const matches = reader.getRowObjectsJson();
  
  if (matches.length === 0) {
    console.log("❌ No Australia vs Bangladesh Test matches found in database.\n");
    console.log("Let me check what test matches ARE in the database...\n");
    
    const recentTestSQL = `
      SELECT 
        date_start,
        team1,
        team2,
        venue
      FROM matches
      WHERE match_type = 'Test'
      ORDER BY date_start DESC
      LIMIT 5;
    `;
    
    const testReader = await conn.runAndReadAll(recentTestSQL);
    const testMatches = testReader.getRowObjectsJson();
    console.log("Most Recent Test Matches in Database:");
    testMatches.forEach((m, idx) => {
      console.log(`${idx + 1}. ${m.date_start.split('T')[0]} - ${m.team1} vs ${m.team2} at ${m.venue}`);
    });
  } else {
    console.log(`Found ${matches.length} Australia vs Bangladesh Test matches:\n`);
    matches.forEach((match, idx) => {
      console.log(`${idx + 1}. ${match.date_start.split('T')[0]}`);
      console.log(`   ${match.team1} vs ${match.team2}`);
      console.log(`   Venue: ${match.venue}`);
      console.log(`   Result: ${match.outcome_result} - Won by ${match.outcome_winner}\n`);
    });
  }
}

main().catch(console.error);
