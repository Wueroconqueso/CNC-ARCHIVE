// Two real machining equations, solved for whichever variable is missing.
// Equation A: RPM = SFM * 12 / (pi * Diameter)
// Equation B: IPM = RPM * IPT * Flutes
// Given any subset of {diameter, flutes, sfm, rpm, ipt, ipm}, fill in the
// rest wherever exactly one unknown remains in an equation. Runs a few
// passes since solving one equation can unlock the other (they share RPM).
const K = 12 / Math.PI; // 3.8197

export function solveSpeedsAndFeeds(known) {
  const v = { ...known };

  for (let pass = 0; pass < 4; pass++) {
    // Equation A: rpm = sfm * K / diameter
    if (v.rpm == null && v.sfm != null && v.diameter) {
      v.rpm = (v.sfm * K) / v.diameter;
    } else if (v.sfm == null && v.rpm != null && v.diameter) {
      v.sfm = (v.rpm * v.diameter) / K;
    } else if (v.diameter == null && v.sfm != null && v.rpm) {
      v.diameter = (v.sfm * K) / v.rpm;
    }

    // Equation B: ipm = rpm * ipt * flutes
    if (v.ipm == null && v.rpm != null && v.ipt != null && v.flutes) {
      v.ipm = v.rpm * v.ipt * v.flutes;
    } else if (v.ipt == null && v.ipm != null && v.rpm && v.flutes) {
      v.ipt = v.ipm / (v.rpm * v.flutes);
    } else if (v.rpm == null && v.ipm != null && v.ipt && v.flutes) {
      v.rpm = v.ipm / (v.ipt * v.flutes);
    } else if (v.flutes == null && v.ipm != null && v.rpm && v.ipt) {
      v.flutes = v.ipm / (v.rpm * v.ipt);
    }
  }

  return v;
}

// Standard radial chip-thinning formula: at full-diameter (50% of D) radial
// engagement, programmed chip load == actual chip thickness. Below that,
// the real chip is thinner than programmed, so feed can be increased to
// still hit the target chip thickness.
export function chipThinningFactor(rdoc, diameter) {
  if (!rdoc || !diameter || rdoc <= 0 || rdoc > diameter) return null;
  const term = 1 - (1 - (2 * rdoc) / diameter) ** 2;
  if (term <= 0) return null;
  return 1 / Math.sqrt(term);
}
