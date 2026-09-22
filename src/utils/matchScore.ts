export function calculateMatchScore(userA: any, userB: any) {
  if (!userA || !userB) return 0;
  
  let score = 0;

  // 1. Religion match (25 pts) 
  // If my preferred religion is 'any' or matches their religion, give points.
  // And vice versa if we want a two-way match, but here we calculate B's suitability for A.
  const aPrefRelig = userA.pref_religion?.toLowerCase();
  const bRelig = userB.religion?.toLowerCase();
  if (aPrefRelig === 'any' || aPrefRelig === 'open to all' || aPrefRelig === bRelig) {
    score += 25;
  }

  // 2. Location match (20 pts)
  // Simplified text match
  const aPrefLoc = userA.pref_location?.toLowerCase() || "";
  const bCity = userB.city?.toLowerCase() || "";
  if (aPrefLoc === "" || aPrefLoc === 'any' || bCity.includes(aPrefLoc) || aPrefLoc.includes(bCity)) {
    score += 20;
  }

  // 3. Education level match (15 pts)
  // Simple exact match logic for now (can map hierarchies later e.g. Masters > Bachelors)
  if (userA.education === userB.education || !userA.education || !userB.education) {
    score += 15;
  }

  // 4. Age range fit (15 pts)
  const bAge = calculateAge(userB.dob);
  const minAge = userA.pref_min_age || 18;
  const maxAge = userA.pref_max_age || 99;
  if (bAge >= minAge && bAge <= maxAge) {
    score += 15;
  }

  // 5. Diet match (10 pts)
  if (userA.diet === userB.diet || !userA.diet || !userB.diet) {
    score += 10;
  }

  // 6. Lifestyle matching (10 pts) - e.g. smoking/drinking
  if (userA.smoking === userB.smoking && userA.drinking === userB.drinking) {
    score += 10;
  } else if (userA.smoking === userB.smoking || userA.drinking === userB.drinking) {
    score += 5; // Partial match
  }

  // 7. Income range compatibility (5 pts)
  if (userA.income === userB.income || !userA.income) {
    score += 5;
  }

  return Math.min(score, 100);
}

function calculateAge(dobString: string) {
  if (!dobString) return 25; // fallback
  const dob = new Date(dobString);
  const diff = Date.now() - dob.getTime();
  const age = new Date(diff).getUTCFullYear() - 1970;
  return age;
}
