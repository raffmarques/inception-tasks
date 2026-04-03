// Migration overlay
function showMigration() { document.getElementById('migrationOverlay').style.display = 'flex'; }
function hideMigration() { document.getElementById('migrationOverlay').style.display = 'none'; }

// Task detail overlay
function openDetail() { document.getElementById('taskDetailOverlay').style.display = 'flex'; }
function hideDetail()  { document.getElementById('taskDetailOverlay').style.display = 'none'; }

// Status cycle on task rows
var STATUSES = ['open','completed','migrated','cancelled'];
var SIGS_TEXT = { open:'\u25cb', completed:'\u25cf', migrated:'\u203a', cancelled:'\u00d7' };
var SIGS_CLASS = { open:'', completed:'task-item--completed', migrated:'task-item--migrated', cancelled:'task-item--cancelled' };
function cycleStatus(sigEl) {
  var row = sigEl.closest('.task-item');
  var current = 'open';
  STATUSES.forEach(function(s) {
    if (row.classList.contains('task-item--' + s)) current = s;
  });
  var next = STATUSES[(STATUSES.indexOf(current) + 1) % STATUSES.length];
  STATUSES.forEach(function(s) { row.classList.remove('task-item--' + s); });
  if (next !== 'open') row.classList.add('task-item--' + next);
  sigEl.textContent = SIGS_TEXT[next];
}

// Detail sig cycle
var DETAIL_SIGS_ARR = ['\u25cb','\u25cf','\u203a','\u00d7'];
var detailSigIdx = 0;
function cycleDetailSig() {
  detailSigIdx = (detailSigIdx + 1) % DETAIL_SIGS_ARR.length;
  document.getElementById('detailSig').textContent = DETAIL_SIGS_ARR[detailSigIdx];
}

// Migration actions
var migrateCount = 3;
function migrateTask(id) {
  var row = document.getElementById(id);
  row.style.opacity = '0.4';
  row.style.transition = 'opacity 0.2s';
  var actions = row.querySelector('.migration-task__actions');
  actions.textContent = '';
  var span = document.createElement('span');
  span.style.cssText = 'font-family:var(--font-mono);font-size:0.6rem;color:var(--copper)';
  span.textContent = '> migrated';
  actions.appendChild(span);
  updateMigrateCount();
}
function cancelTask(id) {
  var row = document.getElementById(id);
  row.style.opacity = '0.3';
  row.style.transition = 'opacity 0.2s';
  row.querySelector('.migration-task__sig').textContent = 'x';
  var actions = row.querySelector('.migration-task__actions');
  actions.textContent = '';
  var span = document.createElement('span');
  span.style.cssText = 'font-family:var(--font-mono);font-size:0.6rem;color:var(--ink-ghost)';
  span.textContent = 'cancelled';
  actions.appendChild(span);
  updateMigrateCount();
}
function updateMigrateCount() {
  migrateCount = Math.max(0, migrateCount - 1);
  document.getElementById('migrateProgress').textContent = migrateCount + ' task' + (migrateCount === 1 ? '' : 's') + ' remaining';
}

// Rating buttons
function setRating(btn) {
  var group = btn.closest('.rating-group');
  group.querySelectorAll('.rating-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
}

// Zoom pills
function setZoom(pill) {
  pill.closest('.zoom-pills').querySelectorAll('.zoom-pill').forEach(function(p) { p.classList.remove('active'); });
  pill.classList.add('active');
}

// Mode buttons
document.querySelectorAll('.mode-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.mode-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
  });
});

// Peek sidebar
var peekOpen = false;
function togglePeek() {
  peekOpen = !peekOpen;
  var sb = document.getElementById('peekSidebar');
  var strip = document.getElementById('peekStrip');

  if (peekOpen) {
    sb.classList.add('peek-sidebar--open');
    strip.style.display = 'none';

    var panel = document.createElement('div');
    panel.className = 'peek-panel';
    panel.id = 'peekPanel';

    var header = document.createElement('div');
    header.className = 'peek-panel__header';

    var title = document.createElement('span');
    title.className = 'peek-panel__title';
    title.textContent = 'W12';

    var closeBtn = document.createElement('button');
    closeBtn.className = 'peek-close';
    closeBtn.textContent = 'collapse x';
    closeBtn.onclick = togglePeek;

    header.appendChild(title);
    header.appendChild(closeBtn);
    panel.appendChild(header);

    var tasks = [
      { sig: '>', content: 'Q1 planning retro', done: false },
      { sig: 'o', content: 'Finalize Supabase schema', done: false },
      { sig: 'o', content: 'Ship CSS redesign', done: false }
    ];

    tasks.forEach(function(t) {
      var row = document.createElement('div');
      row.className = 'flow-task';
      var sig = document.createElement('span');
      sig.className = 'flow-task__sig';
      sig.style.color = t.sig === '>' ? 'var(--copper)' : 'var(--sig-open)';
      sig.textContent = t.sig === '>' ? '\u203a' : '\u25cb';
      var content = document.createElement('span');
      content.className = 'flow-task__content';
      content.textContent = t.content;
      row.appendChild(sig);
      row.appendChild(content);
      panel.appendChild(row);
    });

    var spacer = document.createElement('div');
    spacer.style.height = '16px';
    panel.appendChild(spacer);

    var hl = document.createElement('div');
    hl.className = 'flow-highlight';
    var hlIcon = document.createElement('span');
    hlIcon.className = 'flow-highlight__icon';
    hlIcon.textContent = '\u2600';
    var hlText = document.createElement('span');
    hlText.className = 'flow-highlight__text';
    hlText.textContent = 'Land the new design system before Friday';
    hl.appendChild(hlIcon);
    hl.appendChild(hlText);
    panel.appendChild(hl);

    sb.appendChild(panel);
  } else {
    sb.classList.remove('peek-sidebar--open');
    strip.style.display = '';
    var existingPanel = document.getElementById('peekPanel');
    if (existingPanel) existingPanel.remove();
  }
}

// Subtask checkboxes
document.querySelectorAll('.subtask-item input[type="checkbox"]').forEach(function(cb) {
  cb.addEventListener('change', function() {
    var label = document.querySelector('label[for="' + cb.id + '"]');
    if (label) label.classList.toggle('checked', cb.checked);
  });
});

// Simulate sync pulse on load
setTimeout(function() {
  var dot = document.getElementById('syncDot');
  if (dot) {
    dot.classList.add('syncing');
    setTimeout(function() { dot.classList.remove('syncing'); }, 1800);
  }
}, 1200);

// ── MOBILE INTERACTIONS ──────────────────────────────────────

function mOpenDetail() {
  document.getElementById('mDetailBackdrop').classList.add('open');
  document.getElementById('mDetailSheet').classList.add('open');
}
function mCloseDetail() {
  document.getElementById('mDetailBackdrop').classList.remove('open');
  document.getElementById('mDetailSheet').classList.remove('open');
}

function mOpenSheet() {
  document.getElementById('mSheetBackdrop').classList.add('open');
  document.getElementById('mWeekSheet').classList.add('open');
}
function mCloseSheet() {
  document.getElementById('mSheetBackdrop').classList.remove('open');
  document.getElementById('mWeekSheet').classList.remove('open');
}

function mOpenMarchSheet() {
  document.getElementById('mMarchBackdrop').classList.add('open');
  document.getElementById('mMarchSheet').classList.add('open');
}
function mCloseMarchSheet() {
  document.getElementById('mMarchBackdrop').classList.remove('open');
  document.getElementById('mMarchSheet').classList.remove('open');
}

// Mobile subtask checkboxes
document.querySelectorAll('.m-detail-sheet input[type="checkbox"]').forEach(function(cb) {
  cb.addEventListener('change', function() {
    var label = document.querySelector('label[for="' + cb.id + '"]');
    if (label) label.classList.toggle('checked', cb.checked);
  });
});
