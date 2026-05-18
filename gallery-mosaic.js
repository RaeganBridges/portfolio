(function (global) {
  var ROW_PATTERN = [3, 4, 3, 4];
  var GAP = 6;
  var DEFAULT_RATIO = 0.667;

  function loadMeta(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        resolve({
          src: src,
          ratio: img.naturalWidth && img.naturalHeight
            ? img.naturalWidth / img.naturalHeight
            : DEFAULT_RATIO
        });
      };
      img.onerror = function () {
        resolve({ src: src, ratio: DEFAULT_RATIO });
      };
      img.src = src;
    });
  }

  function targetSum(rowSize) {
    if (rowSize === 3) return 1.5 + DEFAULT_RATIO * 2;
    if (rowSize === 4) return 1.5 + DEFAULT_RATIO * 3;
    return DEFAULT_RATIO * rowSize;
  }

  function pickRow(pool, rowSize, target) {
    var picked = [];
    var work = pool.slice();

    function removeItem(item) {
      var idx = work.indexOf(item);
      if (idx !== -1) work.splice(idx, 1);
    }

    var landscapes = work.filter(function (x) { return x.ratio > 1.05; });
    if (landscapes.length && rowSize >= 2) {
      landscapes.sort(function (a, b) {
        return Math.abs(a.ratio - 1.5) - Math.abs(b.ratio - 1.5);
      });
      picked.push(landscapes[0]);
      removeItem(landscapes[0]);
    }

    while (picked.length < rowSize && work.length) {
      var currentSum = picked.reduce(function (s, x) { return s + x.ratio; }, 0);
      var best = null;
      var bestDiff = Infinity;
      for (var k = 0; k < work.length; k++) {
        var diff = Math.abs(currentSum + work[k].ratio - target);
        if (diff < bestDiff) {
          bestDiff = diff;
          best = work[k];
        }
      }
      if (!best) break;
      picked.push(best);
      removeItem(best);
    }

    while (picked.length < rowSize && work.length) {
      picked.push(work.shift());
    }

    picked.forEach(function (item) {
      var idx = pool.indexOf(item);
      if (idx !== -1) pool.splice(idx, 1);
    });

    return picked;
  }

  function packRows(items, pattern) {
    var pool = items.slice();
    var rows = [];
    var patternIdx = 0;
    while (pool.length) {
      var rowSize = pattern[patternIdx % pattern.length];
      if (pool.length < rowSize) rowSize = pool.length;
      rows.push(pickRow(pool, rowSize, targetSum(rowSize)));
      patternIdx++;
    }
    return rows;
  }

  function buildGallery(box, rows) {
    box.innerHTML = '';
    var index = 0;
    rows.forEach(function (rowItems) {
      var row = document.createElement('div');
      row.className = 'gallery-row gallery-row--' + rowItems.length;
      rowItems.forEach(function (meta) {
        var item = document.createElement('div');
        item.className = 'gallery-item';
        item.dataset.index = index;
        var check = document.createElement('button');
        check.type = 'button';
        check.className = 'selection-checkbox';
        check.setAttribute('aria-label', 'Select photo');
        var img = document.createElement('img');
        img.src = meta.src;
        img.alt = 'Photo ' + (index + 1);
        img.dataset.index = index;
        item.appendChild(check);
        item.appendChild(img);
        row.appendChild(item);
        index += 1;
      });
      box.appendChild(row);
    });
  }

  function layoutRows(box, wrap) {
    if (!box || !wrap) return;
    var rowWidth = wrap.clientWidth;
    if (!rowWidth) return;
    box.querySelectorAll('.gallery-row').forEach(function (row) {
      var imgs = Array.prototype.slice.call(row.querySelectorAll('.gallery-item img'));
      if (!imgs.length) return;
      var ratios = imgs.map(function (img) {
        return img.naturalWidth && img.naturalHeight
          ? img.naturalWidth / img.naturalHeight
          : DEFAULT_RATIO;
      });
      var totalRatio = ratios.reduce(function (sum, r) { return sum + r; }, 0);
      var rowHeight = (rowWidth - GAP * (imgs.length - 1)) / totalRatio;
      row.style.height = rowHeight + 'px';
      imgs.forEach(function (img, i) {
        img.style.width = Math.round(rowHeight * ratios[i]) + 'px';
        img.style.height = rowHeight + 'px';
      });
    });
  }

  function whenImagesReady(box, callback) {
    var imgs = box.querySelectorAll('.gallery-item img');
    var pending = imgs.length;
    if (!pending) {
      callback();
      return;
    }
    function done() {
      pending -= 1;
      if (pending <= 0) callback();
    }
    Array.prototype.forEach.call(imgs, function (img) {
      if (img.complete && img.naturalWidth) done();
      else {
        img.addEventListener('load', done);
        img.addEventListener('error', done);
      }
    });
  }

  function initGalleryMosaic(box, sources, ready) {
    var wrap = box.closest('.gallery-box-wrap') || box.parentElement;
    Promise.all(sources.map(loadMeta)).then(function (items) {
      var rows = packRows(items, ROW_PATTERN);
      buildGallery(box, rows);
      var ordered = [];
      rows.forEach(function (row) {
        row.forEach(function (item) { ordered.push(item.src); });
      });
      whenImagesReady(box, function () {
        layoutRows(box, wrap);
        ready(ordered);
      });
      window.addEventListener('resize', function () {
        layoutRows(box, wrap);
      });
    });
  }

  global.initGalleryMosaic = initGalleryMosaic;
})(window);
