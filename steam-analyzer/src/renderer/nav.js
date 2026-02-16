'use strict';

(function () {
  document.querySelectorAll('#tab-nav button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('#tab-nav button').forEach(function (b) { b.classList.remove('active'); });
      document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });
})();
