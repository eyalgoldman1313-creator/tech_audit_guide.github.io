// Enhances plain markdown tables: wraps for scrolling, adds data-labels for mobile cards,
// marks numeric cells, total rows, "..." gap rows, and the row-header cell.
function enhanceTables(root) {
  var numRe = /^[\s(\-–]*[\d.,]+%?\)?\s*$|^[-–]$/;
  root.querySelectorAll('table').forEach(function (t) {
    if (t.closest('.mdt') || t.classList.contains('gtable')) return;
    var w = document.createElement('div'); w.className = 'mdt';
    t.parentNode.insertBefore(w, t); w.appendChild(t);
    var heads = Array.prototype.map.call(t.querySelectorAll('thead th'), function (th) { return th.textContent.trim(); });
    // first column that is mostly text = row header
    var rows = t.querySelectorAll('tbody tr');
    var headCol = 0;
    if (heads.length > 1 && /^#|מס/.test(heads[0])) headCol = 1;
    rows.forEach(function (tr) {
      var cells = tr.children, txt = tr.textContent.replace(/\s/g, '');
      if (/^[.…]+$/.test(txt)) { tr.className = 'gap'; return; }
      if (/סה"כ|סה״כ|סך הכל|סה”כ/.test(tr.textContent)) tr.classList.add('total');
      Array.prototype.forEach.call(cells, function (td, i) {
        var v = td.textContent.trim();
        td.setAttribute('data-label', heads[i] || '');
        if (i === headCol) td.classList.add('head');
        else if (numRe.test(v)) td.classList.add('num');
        if (!v || /^[.…]+$/.test(v)) td.classList.add('empty');
        if (i === 0 && headCol === 1 && v) td.setAttribute('data-label', heads[0] || '#');
      });
      if (headCol === 1 && cells[0] && cells[1]) {
        // show "#" together with the row header on mobile
        var n = cells[0].textContent.trim();
        if (n && !cells[1].dataset.n) { cells[1].dataset.n = n; cells[1].insertAdjacentHTML('afterbegin', '<span class="rn">' + n + '. </span>'); cells[0].classList.add('empty'); }
      }
    });
  });
}
