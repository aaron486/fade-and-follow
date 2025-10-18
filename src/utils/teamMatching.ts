// Team name matching utilities for connecting Odds API teams to database teams

interface TeamMapping {
  oddsApiName: string;
  dbName: string;
  aliases?: string[];
}

// College Football team mappings
export const NCAAF_TEAM_MAPPINGS: TeamMapping[] = [
  { oddsApiName: 'Alabama', dbName: 'Alabama Crimson Tide', aliases: ['Crimson Tide', 'Bama'] },
  { oddsApiName: 'Arkansas', dbName: 'Arkansas Razorbacks', aliases: ['Razorbacks', 'Hogs'] },
  { oddsApiName: 'Auburn', dbName: 'Auburn Tigers', aliases: ['Tigers'] },
  { oddsApiName: 'Michigan', dbName: 'Michigan Wolverines', aliases: ['Wolverines'] },
  { oddsApiName: 'Ohio State', dbName: 'Ohio State Buckeyes', aliases: ['Buckeyes', 'OSU'] },
  { oddsApiName: 'Georgia', dbName: 'Georgia Bulldogs', aliases: ['Bulldogs', 'UGA'] },
  { oddsApiName: 'Florida', dbName: 'Florida Gators', aliases: ['Gators'] },
  { oddsApiName: 'LSU', dbName: 'LSU Tigers', aliases: ['Tigers', 'Louisiana State'] },
  { oddsApiName: 'Texas', dbName: 'Texas Longhorns', aliases: ['Longhorns', 'UT'] },
  { oddsApiName: 'Oklahoma', dbName: 'Oklahoma Sooners', aliases: ['Sooners', 'OU'] },
  { oddsApiName: 'USC', dbName: 'USC Trojans', aliases: ['Trojans', 'Southern California'] },
  { oddsApiName: 'Oregon', dbName: 'Oregon Ducks', aliases: ['Ducks'] },
  { oddsApiName: 'Penn State', dbName: 'Penn State Nittany Lions', aliases: ['Nittany Lions', 'PSU'] },
  { oddsApiName: 'Clemson', dbName: 'Clemson Tigers', aliases: ['Tigers'] },
  { oddsApiName: 'Notre Dame', dbName: 'Notre Dame Fighting Irish', aliases: ['Fighting Irish', 'Irish', 'ND'] },
  { oddsApiName: 'Florida State', dbName: 'Florida State Seminoles', aliases: ['Seminoles', 'FSU'] },
  { oddsApiName: 'Miami', dbName: 'Miami Hurricanes', aliases: ['Hurricanes', 'Canes', 'The U'] },
  { oddsApiName: 'Texas A&M', dbName: 'Texas A&M Aggies', aliases: ['Aggies', 'TAMU'] },
  { oddsApiName: 'Tennessee', dbName: 'Tennessee Volunteers', aliases: ['Volunteers', 'Vols'] },
  { oddsApiName: 'Wisconsin', dbName: 'Wisconsin Badgers', aliases: ['Badgers'] },
];

// College Basketball team mappings
export const NCAAB_TEAM_MAPPINGS: TeamMapping[] = [
  { oddsApiName: 'Duke', dbName: 'Duke Blue Devils', aliases: ['Blue Devils'] },
  { oddsApiName: 'North Carolina', dbName: 'North Carolina Tar Heels', aliases: ['Tar Heels', 'UNC'] },
  { oddsApiName: 'Kentucky', dbName: 'Kentucky Wildcats', aliases: ['Wildcats', 'UK'] },
  { oddsApiName: 'Kansas', dbName: 'Kansas Jayhawks', aliases: ['Jayhawks', 'KU'] },
  { oddsApiName: 'Villanova', dbName: 'Villanova Wildcats', aliases: ['Wildcats'] },
  { oddsApiName: 'UConn', dbName: 'UConn Huskies', aliases: ['Connecticut', 'Huskies'] },
  { oddsApiName: 'Gonzaga', dbName: 'Gonzaga Bulldogs', aliases: ['Bulldogs', 'Zags'] },
  { oddsApiName: 'UCLA', dbName: 'UCLA Bruins', aliases: ['Bruins'] },
  { oddsApiName: 'Michigan State', dbName: 'Michigan State Spartans', aliases: ['Spartans', 'MSU'] },
  { oddsApiName: 'Syracuse', dbName: 'Syracuse Orange', aliases: ['Orange'] },
  { oddsApiName: 'Louisville', dbName: 'Louisville Cardinals', aliases: ['Cardinals'] },
  { oddsApiName: 'Arizona', dbName: 'Arizona Wildcats', aliases: ['Wildcats'] },
  { oddsApiName: 'Indiana', dbName: 'Indiana Hoosiers', aliases: ['Hoosiers', 'IU'] },
  { oddsApiName: 'Maryland', dbName: 'Maryland Terrapins', aliases: ['Terrapins', 'Terps'] },
  { oddsApiName: 'Virginia', dbName: 'Virginia Cavaliers', aliases: ['Cavaliers', 'UVA'] },
  { oddsApiName: 'Purdue', dbName: 'Purdue Boilermakers', aliases: ['Boilermakers'] },
  { oddsApiName: 'Illinois', dbName: 'Illinois Fighting Illini', aliases: ['Fighting Illini', 'Illini'] },
  { oddsApiName: 'Texas', dbName: 'Texas Longhorns', aliases: ['Longhorns', 'UT'] },
  { oddsApiName: 'Baylor', dbName: 'Baylor Bears', aliases: ['Bears'] },
  { oddsApiName: 'Michigan', dbName: 'Michigan Wolverines', aliases: ['Wolverines'] },
];

/**
 * Normalize team name for comparison
 */
const normalizeTeamName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
};

/**
 * Match Odds API team name to database team name
 */
export const matchTeamName = (
  oddsApiTeamName: string,
  sport: 'ncaaf' | 'ncaab' | 'nfl' | 'nba' | 'mlb' | 'nhl'
): string => {
  const normalized = normalizeTeamName(oddsApiTeamName);
  
  // Select appropriate mapping based on sport
  let mappings: TeamMapping[] = [];
  if (sport === 'ncaaf') {
    mappings = NCAAF_TEAM_MAPPINGS;
  } else if (sport === 'ncaab') {
    mappings = NCAAB_TEAM_MAPPINGS;
  }
  
  // For non-college sports, return as-is (they usually match exactly)
  if (mappings.length === 0) {
    return oddsApiTeamName;
  }
  
  // Try exact match on odds API name
  const exactMatch = mappings.find(
    m => normalizeTeamName(m.oddsApiName) === normalized
  );
  if (exactMatch) {
    return exactMatch.dbName;
  }
  
  // Try matching with aliases
  const aliasMatch = mappings.find(m => 
    m.aliases?.some(alias => normalizeTeamName(alias) === normalized)
  );
  if (aliasMatch) {
    return aliasMatch.dbName;
  }
  
  // Try partial match - check if the odds API name is contained in DB name
  const partialMatch = mappings.find(m =>
    normalizeTeamName(m.dbName).includes(normalized) ||
    normalized.includes(normalizeTeamName(m.oddsApiName))
  );
  if (partialMatch) {
    return partialMatch.dbName;
  }
  
  // If no match found, return original (will work for teams not in our mapping)
  return oddsApiTeamName;
};

/**
 * Extract sport type from event or bet
 */
export const extractSportType = (sport: string): 'ncaaf' | 'ncaab' | 'nfl' | 'nba' | 'mlb' | 'nhl' => {
  const normalized = sport.toLowerCase();
  
  if (normalized.includes('ncaaf') || normalized.includes('college football')) {
    return 'ncaaf';
  }
  if (normalized.includes('ncaab') || normalized.includes('college basketball')) {
    return 'ncaab';
  }
  if (normalized.includes('nfl')) {
    return 'nfl';
  }
  if (normalized.includes('nba')) {
    return 'nba';
  }
  if (normalized.includes('mlb')) {
    return 'mlb';
  }
  if (normalized.includes('nhl')) {
    return 'nhl';
  }
  
  // Default fallback
  return 'nfl';
};

/**
 * Match both teams in an event and return normalized names
 */
export interface MatchedEvent {
  homeTeam: string;
  awayTeam: string;
  originalHomeTeam: string;
  originalAwayTeam: string;
}

export const matchEventTeams = (
  homeTeam: string,
  awayTeam: string,
  sport: string
): MatchedEvent => {
  const sportType = extractSportType(sport);
  
  return {
    homeTeam: matchTeamName(homeTeam, sportType),
    awayTeam: matchTeamName(awayTeam, sportType),
    originalHomeTeam: homeTeam,
    originalAwayTeam: awayTeam,
  };
};
