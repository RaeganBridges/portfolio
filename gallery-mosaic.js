(function (global) {
  var ROW_PATTERN = [3, 4, 3, 4];
  var GAP = 6;
  var DEFAULT_RATIO = 0.667;
  var MOBILE_BREAKPOINT = 767;

  function isMobile() {
    return window.matchMedia && window.matchMedia('(max-width: ' + MOBILE_BREAKPOINT + 'px)').matches;
  }

  function loadMeta(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      var settled = false;
      function finish(ratio) {
        if (settled) return;
        settled = true;
        resolve({ src: src, ratio: ratio });
      }
      img.onload = function () {
        finish(img.naturalWidth && img.naturalHeight
          ? img.naturalWidth / img.naturalHeight
          : DEFAULT_RATIO);
      };
      img.onerror = function () {
        finish(DEFAULT_RATIO);
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
        img.loading = 'lazy';
        img.decoding = 'async';
        item.appendChild(check);
        item.appendChild(img);
        row.appendChild(item);
        index += 1;
      });
      box.appendChild(row);
    });
  }

  function layoutRowsDesktop(box, wrap) {
    var rowWidth = wrap.clientWidth;
    if (!rowWidth) return false;
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
      if (!rowHeight || rowHeight < 1) rowHeight = 160;
      row.style.height = rowHeight + 'px';
      imgs.forEach(function (img, i) {
        img.style.width = Math.round(rowHeight * ratios[i]) + 'px';
        img.style.height = rowHeight + 'px';
      });
    });
    return true;
  }

  function layoutRowsMobile(box) {
    box.querySelectorAll('.gallery-row').forEach(function (row) {
      row.style.height = 'auto';
      row.querySelectorAll('.gallery-item img').forEach(function (img) {
        img.style.width = '100%';
        img.style.height = 'auto';
      });
    });
  }

  function layoutRows(box, wrap, attempt) {
    if (!box || !wrap) return;
    attempt = attempt || 0;
    if (isMobile()) {
      layoutRowsMobile(box);
      return;
    }
    if (!layoutRowsDesktop(box, wrap) && attempt < 12) {
      setTimeout(function () {
        layoutRows(box, wrap, attempt + 1);
      }, 50 * (attempt + 1));
    }
  }

  function scheduleLayout(box, wrap) {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        layoutRows(box, wrap);
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
    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      callback();
    }
    function done() {
      pending -= 1;
      if (pending <= 0) finish();
    }
    Array.prototype.forEach.call(imgs, function (img) {
      if (img.complete) {
        done();
      } else {
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      }
    });
    setTimeout(function () {
      if (!finished) finish();
    }, 12000);
  }

  function loadItemsForPacking(sources, callback) {
    if (isMobile() || sources.length > 40) {
      callback(sources.map(function (src) {
        return { src: src, ratio: DEFAULT_RATIO };
      }));
      return;
    }
    var batchSize = 12;
    var items = [];
    var index = 0;
    function nextBatch() {
      var batch = sources.slice(index, index + batchSize);
      if (!batch.length) {
        callback(items);
        return;
      }
      Promise.all(batch.map(loadMeta)).then(function (batchItems) {
        items = items.concat(batchItems);
        index += batchSize;
        nextBatch();
      });
    }
    nextBatch();
  }

  function initGalleryMosaic(box, sources, ready) {
    var wrap = box.closest('.gallery-box-wrap') || box.parentElement;
    if (!box || !wrap) return;

    loadItemsForPacking(sources, function (items) {
      var rows = packRows(items, ROW_PATTERN);
      buildGallery(box, rows);
      var ordered = [];
      rows.forEach(function (row) {
        row.forEach(function (item) { ordered.push(item.src); });
      });

      whenImagesReady(box, function () {
        scheduleLayout(box, wrap);
        ready(ordered);
      });

      window.addEventListener('resize', function () {
        scheduleLayout(box, wrap);
      });
      window.addEventListener('orientationchange', function () {
        scheduleLayout(box, wrap);
      });
      window.addEventListener('pageshow', function () {
        scheduleLayout(box, wrap);
      });
      document.addEventListener('gallery-unlock', function () {
        scheduleLayout(box, wrap);
      });
    });
  }

  if (!document.getElementById('gallery-mosaic-mobile-styles')) {
    var style = document.createElement('style');
    style.id = 'gallery-mosaic-mobile-styles';
    style.textContent = [
      '@media (max-width: ' + MOBILE_BREAKPOINT + 'px) {',
      '  .gallery-row { flex-wrap: wrap; height: auto !important; overflow: visible; }',
      '  .gallery-row--3 .gallery-item,',
      '  .gallery-row--4 .gallery-item { flex: 0 0 calc(50% - ' + (GAP / 2) + 'px); width: calc(50% - ' + (GAP / 2) + 'px); }',
      '  .gallery-row--3 .gallery-item:last-child:nth-child(odd) { flex: 0 0 100%; width: 100%; }',
      '  .gallery-item img { width: 100% !important; height: auto !important; display: block; }',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  global.initGalleryMosaic = initGalleryMosaic;
  global.relayoutGalleryMosaic = function (box) {
    var wrap = box && (box.closest('.gallery-box-wrap') || box.parentElement);
    if (box && wrap) scheduleLayout(box, wrap);
  };
})(window);
