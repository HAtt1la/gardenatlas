<script>
  import { onMount } from 'svelte';
  import { t } from '../lib/i18n.js';
  import { showToast } from '../lib/stores.js';
  import {
    getAllTodos, addTodo, updateTodo, deleteTodo,
    completeTodo, reopenTodo, computePriorityScores, wouldCreateCycle
  } from '../lib/db.js';

  let todos = [];
  let scores = new Map();
  let newText = '';
  let adding = false;

  // Bottom sheet state
  let sheetTodo = null;       // todo being viewed in detail sheet
  let sheetDoneDate = '';     // editable done date in sheet
  let sheetEditingDone = false;

  async function load() {
    todos = await getAllTodos();
    scores = computePriorityScores(todos);
  }

  onMount(load);

  // ── Derived lists ────────────────────────────────────────────
  $: openTodos = todos
    .filter(t => !t.doneAt)
    .sort((a, b) => {
      const sa = scores.get(a.id) ?? 0;
      const sb = scores.get(b.id) ?? 0;
      if (sb !== sa) return sb - sa;           // higher score first
      return a.createdAt.localeCompare(b.createdAt); // older first on tie
    });

  $: doneTodos = todos
    .filter(t => t.doneAt)
    .sort((a, b) => b.doneDate?.localeCompare(a.doneDate ?? '') ?? 0);

  // ── Helpers ──────────────────────────────────────────────────
  function isBlocked(todo) {
    if (!todo.blockedBy?.length) return false;
    return todo.blockedBy.some(bid => {
      const blocker = todos.find(t => t.id === bid);
      return blocker && !blocker.doneAt;
    });
  }

  function getBlockerNames(todo) {
    return (todo.blockedBy || [])
      .map(bid => todos.find(t => t.id === bid))
      .filter(Boolean)
      .filter(t => !t.doneAt)
      .map(t => t.text);
  }

  function priorityColor(todo) {
    if (isBlocked(todo)) return 'blocked';
    const s = scores.get(todo.id) ?? 0;
    if (s >= 3) return 'high';
    if (s >= 1) return 'mid';
    return 'none';
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso.length === 10 ? iso + 'T00:00:00' : iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  // ── Actions ──────────────────────────────────────────────────
  async function handleAdd() {
    if (!newText.trim()) return;
    adding = true;
    await addTodo(newText);
    newText = '';
    await load();
    adding = false;
  }

  function handleKeydown(e) {
    if (e.key === 'Enter') handleAdd();
  }

  async function handleDone(todo) {
    const today = new Date().toISOString().split('T')[0];
    await completeTodo(todo.id, today);
    await load();
    showToast('Task completed ✓', 'success');
  }

  async function handleReopen(todo) {
    await reopenTodo(todo.id);
    await load();
  }

  async function handleDelete(todo) {
    await deleteTodo(todo.id);
    if (sheetTodo?.id === todo.id) sheetTodo = null;
    await load();
  }

  // ── Bottom sheet ─────────────────────────────────────────────
  function openSheet(todo) {
    sheetTodo = todo;
    sheetDoneDate = todo.doneDate || '';
    sheetEditingDone = false;
  }

  function closeSheet() {
    sheetTodo = null;
  }

  async function saveDoneDate() {
    if (!sheetTodo || !sheetDoneDate) return;
    await updateTodo(sheetTodo.id, { doneDate: sheetDoneDate });
    await load();
    sheetTodo = todos.find(t => t.id === sheetTodo.id) || null;
    sheetEditingDone = false;
    showToast('Date updated', 'success');
  }

  // Add prerequisite to sheetTodo
  async function addPrereq(prereqId) {
    if (!sheetTodo) return;
    if (wouldCreateCycle(todos, sheetTodo.id, prereqId)) {
      showToast('Cannot add: would create a cycle', 'error');
      return;
    }
    const current = sheetTodo.blockedBy || [];
    if (current.includes(prereqId)) return;
    await updateTodo(sheetTodo.id, { blockedBy: [...current, prereqId] });
    await load();
    sheetTodo = todos.find(t => t.id === sheetTodo.id) || null;
    scores = computePriorityScores(todos);
  }

  async function removePrereq(prereqId) {
    if (!sheetTodo) return;
    const current = sheetTodo.blockedBy || [];
    await updateTodo(sheetTodo.id, { blockedBy: current.filter(id => id !== prereqId) });
    await load();
    sheetTodo = todos.find(t => t.id === sheetTodo.id) || null;
    scores = computePriorityScores(todos);
  }

  // Tasks that sheetTodo unblocks (tasks that have sheetTodo in their blockedBy)
  $: unblockedBySheet = sheetTodo
    ? todos.filter(t => (t.blockedBy || []).includes(sheetTodo.id))
    : [];

  // Tasks eligible to add as prerequisites: open, not sheetTodo itself, not already a prereq
  $: prereqCandidates = sheetTodo
    ? todos.filter(t =>
        !t.doneAt &&
        t.id !== sheetTodo.id &&
        !(sheetTodo.blockedBy || []).includes(t.id) &&
        !wouldCreateCycle(todos, sheetTodo.id, t.id)
      )
    : [];
</script>

<div class="todo-container">
  <!-- Add task input -->
  <div class="add-row">
    <input
      class="add-input"
      type="text"
      bind:value={newText}
      placeholder={$t('todoPlaceholder')}
      on:keydown={handleKeydown}
      disabled={adding}
    />
    <button class="btn-add" on:click={handleAdd} disabled={adding || !newText.trim()}>
      +
    </button>
  </div>

  <!-- Open tasks -->
  {#if openTodos.length === 0}
    <p class="empty-msg">{$t('todoNone')}</p>
  {:else}
    <div class="section-label">{$t('todoOpen')}</div>
    <div class="todo-list">
      {#each openTodos as todo (todo.id)}
        {@const blocked = isBlocked(todo)}
        {@const color = priorityColor(todo)}
        {@const score = scores.get(todo.id) ?? 0}
        <button class="todo-item {blocked ? 'is-blocked' : ''}"
          on:click={() => openSheet(todo)}>
          <span class="priority-dot dot-{color}" title={
            blocked ? $t('todoBlocked') :
            color === 'high' ? 'High priority' :
            color === 'mid' ? 'Medium priority' : 'No dependents'
          }></span>
          <div class="todo-body">
            <span class="todo-text">{todo.text}</span>
            <div class="todo-meta">
              {#if blocked}
                <span class="meta-blocked">🔒 {$t('todoBlocked')}: {getBlockerNames(todo).join(', ')}</span>
              {:else if score > 0}
                <span class="meta-unblocks">→ {$t('todoUnblocks', { n: score })}</span>
              {/if}
              <span class="meta-date">{formatDate(todo.createdAt)}</span>
            </div>
          </div>
          {#if !blocked}
            <span
              class="btn-done"
              role="button" tabindex="0"
              on:click|stopPropagation={() => handleDone(todo)}
              on:keydown|stopPropagation={(e) => e.key === 'Enter' && handleDone(todo)}
              title={$t('todoMarkDone')}
            >✓</span>
          {/if}
        </button>
      {/each}
    </div>
  {/if}

  <!-- Done tasks -->
  {#if doneTodos.length > 0}
    <div class="section-label done-label">{$t('todoDone')}</div>
    <div class="todo-list done-list">
      {#each doneTodos as todo (todo.id)}
        <button class="todo-item todo-done"
          on:click={() => openSheet(todo)}>
          <span class="priority-dot dot-done">✓</span>
          <div class="todo-body">
            <span class="todo-text">{todo.text}</span>
            <div class="todo-meta">
              <span class="meta-date">{$t('todoAddedDate')}: {formatDate(todo.createdAt)}</span>
              <span class="meta-date done-date">· {$t('todoDoneDate')}: {formatDate(todo.doneDate)}</span>
            </div>
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>

<!-- Bottom sheet overlay -->
{#if sheetTodo}
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
  <div class="sheet-overlay" on:click={closeSheet}>
    <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
    <div class="sheet" on:click|stopPropagation>
      <div class="sheet-handle"></div>

      <h3 class="sheet-title">{sheetTodo.text}</h3>

      <div class="sheet-dates">
        <span>{$t('todoAddedDate')}: {formatDate(sheetTodo.createdAt)}</span>
        {#if sheetTodo.doneAt}
          <span>·</span>
          {#if sheetEditingDone}
            <input
              type="date"
              class="date-inline"
              bind:value={sheetDoneDate}
              max={new Date().toISOString().split('T')[0]}
            />
            <button class="link-btn" on:click={saveDoneDate}>Save</button>
            <button class="link-btn" on:click={() => sheetEditingDone = false}>✕</button>
          {:else}
            <span>{$t('todoDoneDate')}: {formatDate(sheetTodo.doneDate)}</span>
            <button class="link-btn" on:click={() => sheetEditingDone = true}>✎</button>
          {/if}
        {/if}
      </div>

      <!-- Prerequisites (what this task is waiting for) -->
      <div class="sheet-section">
        <div class="sheet-section-title">{$t('todoBlockedBy')}</div>
        {#if (sheetTodo.blockedBy || []).length === 0}
          <p class="sheet-empty">None</p>
        {:else}
          <ul class="dep-list">
            {#each sheetTodo.blockedBy as bid}
              {@const blocker = todos.find(t => t.id === bid)}
              {#if blocker}
                <li class="dep-item {blocker.doneAt ? 'dep-done' : ''}">
                  <span class="dep-status">{blocker.doneAt ? '✓' : '⏳'}</span>
                  <span class="dep-text">{blocker.text}</span>
                  {#if !sheetTodo.doneAt}
                    <button class="link-btn danger" on:click={() => removePrereq(bid)}>✕</button>
                  {/if}
                </li>
              {/if}
            {/each}
          </ul>
        {/if}

        <!-- Add prerequisite picker -->
        {#if !sheetTodo.doneAt && prereqCandidates.length > 0}
          <div class="prereq-picker">
            <select class="prereq-select" on:change={(e) => { if (e.target.value) { addPrereq(Number(e.target.value)); e.target.value = ''; }}}>
              <option value="">{$t('todoAddPrereq')}…</option>
              {#each prereqCandidates as c}
                <option value={c.id}>{c.text}</option>
              {/each}
            </select>
          </div>
        {/if}
      </div>

      <!-- Tasks this one unblocks -->
      {#if unblockedBySheet.length > 0}
        <div class="sheet-section">
          <div class="sheet-section-title">{$t('todoBlocks')}</div>
          <ul class="dep-list">
            {#each unblockedBySheet as t}
              <li class="dep-item {t.doneAt ? 'dep-done' : ''}">
                <span class="dep-status">{t.doneAt ? '✓' : '⏳'}</span>
                <span class="dep-text">{t.text}</span>
              </li>
            {/each}
          </ul>
        </div>
      {/if}

      <!-- Sheet actions -->
      <div class="sheet-actions">
        {#if sheetTodo.doneAt}
          <button class="btn btn-secondary" on:click={() => { handleReopen(sheetTodo); closeSheet(); }}>
            {$t('todoReopen')}
          </button>
        {:else}
          <button class="btn btn-primary" on:click={() => { handleDone(sheetTodo); closeSheet(); }}>
            {$t('todoMarkDone')}
          </button>
        {/if}
        <button class="btn btn-danger" on:click={() => { handleDelete(sheetTodo); closeSheet(); }}>
          {$t('todoDelete')}
        </button>
        <button class="btn btn-ghost" on:click={closeSheet}>
          {$t('cancel')}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .todo-container {
    padding: 1rem;
    max-width: 600px;
    margin: 0 auto;
  }

  /* Add row */
  .add-row {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
  }

  .add-input {
    flex: 1;
    padding: 0.75rem 1rem;
    border: 2px solid #e9ecef;
    border-radius: 10px;
    font-size: 1rem;
    font-family: inherit;
  }

  .add-input:focus {
    border-color: #2d5a27;
    outline: none;
  }

  .btn-add {
    width: 44px;
    height: 44px;
    background: #2d5a27;
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 1.5rem;
    font-weight: 300;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .btn-add:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  /* Section labels */
  .section-label {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #888;
    margin: 0 0 0.5rem;
  }

  .done-label {
    margin-top: 1.5rem;
  }

  .empty-msg {
    color: #aaa;
    font-size: 0.9rem;
    text-align: center;
    padding: 2rem 1rem;
    margin: 0;
  }

  /* List */
  .todo-list {
    list-style: none;
    padding: 0;
    margin: 0 0 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .todo-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: white;
    border-radius: 10px;
    padding: 0.75rem;
    box-shadow: 0 1px 4px rgba(0,0,0,0.07);
    cursor: pointer;
    transition: background 0.15s;
    border: none;
    width: 100%;
    text-align: left;
  }

  .todo-item:hover {
    background: #f8fdf8;
  }

  .todo-item.is-blocked {
    opacity: 0.65;
  }

  .todo-done {
    background: #f8f9fa;
    box-shadow: none;
  }

  /* Priority dot */
  .priority-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
  }

  .dot-high   { background: #e74c3c; }
  .dot-mid    { background: #f39c12; }
  .dot-none   { background: #bdc3c7; }
  .dot-blocked { background: #bdc3c7; border: 2px solid #bdc3c7; }
  .dot-done   {
    background: #27ae60;
    color: white;
    font-size: 8px;
    font-weight: 700;
  }

  /* Todo body */
  .todo-body {
    flex: 1;
    min-width: 0;
  }

  .todo-text {
    display: block;
    font-size: 0.9375rem;
    font-weight: 500;
    color: #222;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .todo-done .todo-text {
    color: #999;
    text-decoration: line-through;
  }

  .todo-meta {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    margin-top: 2px;
  }

  .meta-date {
    font-size: 0.75rem;
    color: #bbb;
  }

  .done-date {
    color: #27ae60;
  }

  .meta-blocked {
    font-size: 0.75rem;
    color: #e74c3c;
  }

  .meta-unblocks {
    font-size: 0.75rem;
    color: #2d5a27;
    font-weight: 600;
  }

  /* Done button */
  .btn-done {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 2px solid #27ae60;
    background: transparent;
    color: #27ae60;
    font-size: 1.1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.15s;
  }

  .btn-done:hover {
    background: #27ae60;
    color: white;
  }

  /* ── Bottom sheet ── */
  .sheet-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    z-index: 200;
    display: flex;
    align-items: flex-end;
  }

  .sheet {
    background: white;
    border-radius: 16px 16px 0 0;
    padding: 1rem 1.25rem 2rem;
    width: 100%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 -4px 24px rgba(0,0,0,0.15);
  }

  .sheet-handle {
    width: 40px;
    height: 4px;
    background: #ddd;
    border-radius: 2px;
    margin: 0 auto 1rem;
  }

  .sheet-title {
    font-size: 1.1rem;
    color: #222;
    margin: 0 0 0.5rem;
    font-weight: 600;
  }

  .sheet-dates {
    font-size: 0.8rem;
    color: #999;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
    margin-bottom: 1.25rem;
  }

  .date-inline {
    padding: 0.2rem 0.4rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.8rem;
  }

  .link-btn {
    background: none;
    border: none;
    color: #2d5a27;
    font-size: 0.8rem;
    cursor: pointer;
    padding: 0;
    text-decoration: underline;
  }

  .link-btn.danger {
    color: #e74c3c;
    text-decoration: none;
    font-size: 0.9rem;
    font-weight: 700;
  }

  .sheet-section {
    margin-bottom: 1.25rem;
  }

  .sheet-section-title {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #888;
    margin-bottom: 0.5rem;
  }

  .sheet-empty {
    font-size: 0.875rem;
    color: #bbb;
    margin: 0;
  }

  .dep-list {
    list-style: none;
    padding: 0;
    margin: 0 0 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .dep-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    padding: 0.4rem 0.5rem;
    background: #f8f9fa;
    border-radius: 6px;
  }

  .dep-done {
    opacity: 0.5;
  }

  .dep-status {
    font-size: 0.8rem;
    color: #999;
    width: 16px;
    flex-shrink: 0;
  }

  .dep-text {
    flex: 1;
    color: #333;
  }

  .prereq-picker {
    margin-top: 0.5rem;
  }

  .prereq-select {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    font-size: 0.875rem;
    background: white;
    color: #333;
  }

  .prereq-select:focus {
    border-color: #2d5a27;
    outline: none;
  }

  .sheet-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-top: 1.25rem;
  }

  .btn {
    padding: 0.65rem 1.1rem;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    transition: background 0.15s;
  }

  .btn-primary {
    background: #2d5a27;
    color: white;
  }

  .btn-primary:hover { background: #3d7a37; }

  .btn-secondary {
    background: #e9ecef;
    color: #333;
  }

  .btn-secondary:hover { background: #dee2e6; }

  .btn-danger {
    background: #fdecea;
    color: #c0392b;
  }

  .btn-danger:hover { background: #e74c3c; color: white; }

  .btn-ghost {
    background: none;
    color: #888;
    border: 1px solid #ddd;
  }

  .btn-ghost:hover { background: #f0f0f0; }
</style>
