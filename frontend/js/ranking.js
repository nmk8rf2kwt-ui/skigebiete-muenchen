export function snowClass(cm){
  if (cm >= 80) return "good";
  if (cm >= 40) return "mid";
  return "bad";
}
export function liftClass(open, total){
  const p = open/total;
  if (p >= 0.7) return "good";
  if (p >= 0.4) return "mid";
  return "bad";
}
export function calcScore(a){
  const liftPct = (a.liftsOpen/a.liftsTotal)*100;
  return Math.round(a.snow*0.4 + liftPct*0.4 + (a.weatherBonus||0)*0.2);
}
