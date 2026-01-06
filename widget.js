function loadAsyncPois(t, e, n, a) {
  if (document.body.querySelector("script[data-id=" + e + "]")) a && a();
  else {
    const d = document.createElement("script");
    d.setAttribute("type", "module"),
      (d.src = t + e + ".js"),
      n && (d.src += "?v=" + n),
      d.setAttribute("data-id", e),
      (d.onload = d.onreadystatechange =
        function () {
          !a || (this.readyState && "complete" !== this.readyState) || a();
        }),
      document.body.appendChild(d);
  }
}
function recursiveLoad(t, e, n, a) {
  const d = e[a].getAttribute("data-name");
  a < e.length - 1
    ? loadAsyncPois(t, d, n, function () {
        recursiveLoad(t, e, n, a + 1);
      })
    : loadAsyncPois(t, d, n);
}
document.addEventListener("DOMContentLoaded", () => {
  const t = document.getElementsByClassName("eo-hide");
  for (let e = 0; e < t.length; e++) t[e].style.display = "none";
  const e = document.getElementsByClassName("eopois-async-scripts");
  for (let t = 0; t < e.length; t++) {
    const n = e[t].getAttribute("data-path"),
      a = e[t].getAttribute("data-name"),
      d = e[t].getAttribute("data-version") || "";
    a
      ? loadAsyncPois(n, a, d)
      : e[t].children &&
        e[t].children.length > 0 &&
        recursiveLoad(n, e[t].children, d, 0);
  }
});
