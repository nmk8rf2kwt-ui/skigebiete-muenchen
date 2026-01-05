export function exportCSV(areas) {
  let csv = "Rang;Skigebiet;Schnee;Lifte;Score\n";

  areas.forEach((a, i) => {
    csv += `${i + 1};${a.name};${a.snow};${a.liftsOpen}/${a.liftsTotal};${a.score}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = "skigebiete.csv";
  link.click();
}
