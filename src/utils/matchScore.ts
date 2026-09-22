export function calculateMatchScore(userA: any, userB: any) {
  if (!userA || !userB) return 0;
  
  let score = 0;

  // 1. Religion match (25 pts) 
  const aPrefRelig = userA.pref_religion?.toLowerCase();
  const bRelig = userB.religion?.toLowerCase();
  if (aPrefRelig === 'any' || aPrefRelig === 'open to all' || aPrefRelig === bRelig) {
    score += 25;
  }

  // 2. Location match (20 pts)
  const aPrefLoc = userA.pref_location?.toLowerCase() || "";
  const bCity = userB.city?.toLowerCase() || "";
  if (aPrefLoc === "" || aPrefLoc === 'any' || bCity.includes(aPrefLoc) || aPrefLoc.includes(bCity)) {
    score += 20;
  }

  // 3. Education level match (15 pts)
  const eduHierarchy: Record<string, number> = {
    'high school': 1,
    'diploma': 2,
    'bachelors': 3,
    'masters': 4,
    'phd': 5,
    'ca': 6,
    'cs': 6
  };
  const aEdu = userA.education?.toLowerCase();
  const bEdu = userB.education?.toLowerCase();

  if (!aEdu || !bEdu) {
    score += 15;
  } else if (aEdu === bEdu) {
    score += 15;
  } else if (eduHierarchy[bEdu] >= eduHierarchy[aEdu]) {
    score += 12;
  } else {
    score += 5;
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

  // 6. Lifestyle matching (10 pts)
  if (userA.smoking === userB.smoking && userA.drinking === userB.drinking) {
    score += 10;
  } else if (userA.smoking === userB.smoking || userA.drinking === userB.drinking) {
    score += 5; 
  }

  // 7. Income range compatibility (5 pts)
  if (userA.income === userB.income || !userA.income) {
    score += 5;
  }

  // 8. Profession Type Match Bonus
  const aProf = userA.profession_type?.toLowerCase();
  const bProf = userB.profession_type?.toLowerCase();
  if (aProf && bProf) {
    if (aProf === bProf && (aProf === 'ca' || aProf === 'cs')) {
      score += 15;
    } else if ((aProf === 'ca' && bProf === 'cs') || (aProf === 'cs' && bProf === 'ca')) {
      score += 10;
    }
  }

  return Math.min(score, 100);
}

export function calculateAge(dobString: string) {
  if (!dobString) return 25; 
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}
