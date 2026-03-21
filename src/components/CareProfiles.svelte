<script>
  import { showToast } from '../lib/stores.js';
  import {
    getCareProfiles, getCareRulesForProfile,
    addCareProfile, updateCareProfile, deleteCareProfile,
    addCareRule, updateCareRule, deleteCareRule
  } from '../lib/db.js';
  import { t } from '../lib/i18n.js';

  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const TRIGGERS = ['season', 'event:flowering', 'event:sickness', 'event:pruned'];
  const ACTIONS  = ['spray', 'prune', 'water'];

  let profiles = [];
  let expandedProfileId = null;
  let profileRules = {};  // { [profileId]: rules[] }

  // Profile form state
  let editingProfile = null;  // null = closed, {} = new, {...} = existing
  let profileName = '';
  let profileDesc = '';

  // Rule form state
  let editingRule = null;   // null = closed, {} = new, {...} = existing
  let editingRuleProfileId = null;
  let ruleTrigger = 'season';
  let ruleTriggerMonths = [];
  let ruleAction = 'spray';
  let ruleProduct = '';
  let rulePurpose = '';
  let ruleWindowDays = 14;

  async function load() {
    profiles = await getCareProfiles();
  }
  load();

  async function toggleProfile(id) {
    if (expandedProfileId === id) {
      expandedProfileId = null;
      return;
    }
    expandedProfileId = id;
    if (!profileRules[id]) {
      profileRules[id] = await getCareRulesForProfile(id);
    }
  }

  // ── Profile CRUD ────────────────────────────────────────────────────────────

  function openNewProfile() {
    editingProfile = {};
    profileName = '';
    profileDesc = '';
  }

  function openEditProfile(profile) {
    editingProfile = profile;
    profileName = profile.name;
    profileDesc = profile.description || '';
  }

  async function saveProfile() {
    const trimmed = profileName.trim();
    if (!trimmed) return;
    if (editingProfile.id) {
      await updateCareProfile(editingProfile.id, { name: trimmed, description: profileDesc.trim() });
      showToast($t('careProfileSaved'), 'success');
    } else {
      await addCareProfile({ name: trimmed, description: profileDesc.trim() });
      showToast($t('careProfileSaved'), 'success');
    }
    editingProfile = null;
    await load();
  }

  async function deleteProfile(profile) {
    if (profile.isBuiltin) return;
    if (!confirm($t('deleteCareProfile') + ' "' + profile.name + '"?')) return;
    await deleteCareProfile(profile.id);
    if (expandedProfileId === profile.id) expandedProfileId = null;
    showToast($t('careProfileDeleted'), 'success');
    await load();
  }

  // ── Rule CRUD ────────────────────────────────────────────────────────────────

  function openNewRule(profileId) {
    editingRule = {};
    editingRuleProfileId = profileId;
    ruleTrigger = 'season';
    ruleTriggerMonths = [];
    ruleAction = 'spray';
    ruleProduct = '';
    rulePurpose = '';
    ruleWindowDays = 14;
  }

  function openEditRule(rule, profileId) {
    editingRule = rule;
    editingRuleProfileId = profileId;
    ruleTrigger = rule.trigger;
    ruleTriggerMonths = [...(rule.triggerMonths || [])];
    ruleAction = rule.action;
    ruleProduct = rule.product || '';
    rulePurpose = rule.purpose || '';
    ruleWindowDays = rule.windowDays ?? 14;
  }

  function toggleMonth(m) {
    if (ruleTriggerMonths.includes(m)) {
      ruleTriggerMonths = ruleTriggerMonths.filter(x => x !== m);
    } else {
      ruleTriggerMonths = [...ruleTriggerMonths, m].sort((a,b) => a-b);
    }
  }

  async function saveRule() {
    if (!rulePurpose.trim()) return;
    const data = {
      profileId: editingRuleProfileId,
      trigger: ruleTrigger,
      triggerMonths: ruleTrigger === 'season' ? ruleTriggerMonths : [],
      action: ruleAction,
      product: ruleProduct.trim() || '',
      purpose: rulePurpose.trim(),
      windowDays: Number(ruleWindowDays) || 14
    };
    if (editingRule.id) {
      await updateCareRule(editingRule.id, data);
    } else {
      await addCareRule(data);
    }
    showToast($t('careRuleSaved'), 'success');
    editingRule = null;
    profileRules[editingRuleProfileId] = await getCareRulesForProfile(editingRuleProfileId);
    profileRules = { ...profileRules };
  }

  async function deleteRule(rule) {
    if (!confirm($t('deleteRule') + '?')) return;
    await deleteCareRule(rule.id);
    showToast($t('careRuleDeleted'), 'success');
    profileRules[rule.profileId] = await getCareRulesForProfile(rule.profileId);
    profileRules = { ...profileRules };
  }

  function triggerLabel(trigger) {
    switch (trigger) {
      case 'season':           return $t('triggerSeason');
      case 'event:flowering':  return $t('triggerFlowering');
      case 'event:sickness':   return $t('triggerSickness');
      case 'event:pruned':     return $t('triggerPruned');
      default: return trigger;
    }
  }

  function actionLabel(action) {
    switch (action) {
      case 'spray': return $t('actionSpray');
      case 'prune': return $t('actionPrune');
      case 'water': return $t('actionWater');
      default: return action;
    }
  }
</script>

<div class="container">
  <div class="page-header">
    <h2 class="page-title">{$t('careProfiles')}</h2>
    <button class="btn btn-primary btn-sm" on:click={openNewProfile}>+ {$t('addCareProfile')}</button>
  </div>
  <p class="page-desc">{$t('careProfilesDesc')}</p>

  {#each profiles as profile (profile.id)}
    <div class="profile-card">
      <div class="profile-header"
        role="button" tabindex="0"
        on:click={() => toggleProfile(profile.id)}
        on:keydown={(e) => e.key === 'Enter' && toggleProfile(profile.id)}>
        <div class="profile-info">
          <span class="profile-name">{profile.name}</span>
          {#if profile.isBuiltin}
            <span class="builtin-badge">{$t('careProfileBuiltin')}</span>
          {/if}
          {#if profile.description}
            <span class="profile-desc">{profile.description}</span>
          {/if}
        </div>
        <div class="profile-actions" role="presentation" on:click|stopPropagation on:keydown|stopPropagation>
          <button class="btn-icon-sm" on:click={() => openEditProfile(profile)}>✏️</button>
          {#if !profile.isBuiltin}
            <button class="btn-icon-sm danger" on:click={() => deleteProfile(profile)}>🗑️</button>
          {/if}
          <span class="expand-arrow">{expandedProfileId === profile.id ? '▲' : '▼'}</span>
        </div>
      </div>

      {#if expandedProfileId === profile.id}
        <div class="rules-section">
          {#if profileRules[profile.id]?.length > 0}
            <div class="rules-list">
              {#each profileRules[profile.id] as rule (rule.id)}
                <div class="rule-row">
                  <div class="rule-info">
                    <span class="rule-action">{actionLabel(rule.action)}</span>
                    <span class="rule-trigger">— {triggerLabel(rule.trigger)}
                      {#if rule.trigger === 'season' && rule.triggerMonths?.length}
                        ({rule.triggerMonths.map(m => MONTH_NAMES[m-1]).join(', ')})
                      {/if}
                    </span>
                    <span class="rule-purpose">{rule.purpose}</span>
                    {#if rule.product}
                      <span class="rule-product">{rule.product}</span>
                    {/if}
                    <span class="rule-window">{rule.windowDays} {$t('days')}</span>
                  </div>
                  <div class="rule-actions">
                    <button class="btn-icon-sm" on:click={() => openEditRule(rule, profile.id)}>✏️</button>
                    <button class="btn-icon-sm danger" on:click={() => deleteRule(rule)}>🗑️</button>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <p class="no-rules">{$t('careProfileRules')}: 0</p>
          {/if}
          <button class="btn btn-secondary btn-sm" on:click={() => openNewRule(profile.id)}>
            + {$t('addRule')}
          </button>
        </div>
      {/if}
    </div>
  {/each}

  {#if profiles.length === 0}
    <p class="empty">{$t('addCareProfile')}</p>
  {/if}
</div>

<!-- Profile form modal -->
{#if editingProfile !== null}
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <div class="modal-overlay" role="presentation"
    on:click={() => editingProfile = null}
    on:keydown={(e) => e.key === 'Escape' && (editingProfile = null)}>
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <div class="modal" role="dialog" aria-modal="true"
      on:click|stopPropagation on:keydown|stopPropagation>
      <h3 class="modal-title">{editingProfile.id ? $t('editCareProfile') : $t('addCareProfile')}</h3>
      <div class="form-group">
        <label for="profile-name">{$t('careProfileName')}</label>
        <input id="profile-name" class="form-input" bind:value={profileName} placeholder={$t('careProfileName')} />
      </div>
      <div class="form-group">
        <label for="profile-desc">{$t('careProfileDescription')}</label>
        <input id="profile-desc" class="form-input" bind:value={profileDesc} placeholder={$t('careProfileDescription')} />
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" on:click={() => editingProfile = null}>{$t('cancel')}</button>
        <button class="btn btn-primary" on:click={saveProfile}>{$t('save')}</button>
      </div>
    </div>
  </div>
{/if}

<!-- Rule form modal -->
{#if editingRule !== null}
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <div class="modal-overlay" role="presentation"
    on:click={() => editingRule = null}
    on:keydown={(e) => e.key === 'Escape' && (editingRule = null)}>
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <div class="modal" role="dialog" aria-modal="true"
      on:click|stopPropagation on:keydown|stopPropagation>
      <h3 class="modal-title">{editingRule.id ? $t('editRule') : $t('addRule')}</h3>

      <div class="form-group">
        <label for="rule-trigger">{$t('ruleTrigger')}</label>
        <select id="rule-trigger" class="form-input" bind:value={ruleTrigger}>
          {#each TRIGGERS as tr}
            <option value={tr}>{triggerLabel(tr)}</option>
          {/each}
        </select>
      </div>

      {#if ruleTrigger === 'season'}
        <div class="form-group">
          <span class="form-label">{$t('careProfileMonths')}</span>
          <div class="month-grid">
            {#each MONTH_NAMES as m, i}
              <button
                type="button"
                class="month-btn {ruleTriggerMonths.includes(i+1) ? 'selected' : ''}"
                on:click={() => toggleMonth(i+1)}
              >{m}</button>
            {/each}
          </div>
        </div>
      {/if}

      <div class="form-group">
        <label for="rule-action">{$t('ruleAction')}</label>
        <select id="rule-action" class="form-input" bind:value={ruleAction}>
          {#each ACTIONS as a}
            <option value={a}>{actionLabel(a)}</option>
          {/each}
        </select>
      </div>

      <div class="form-group">
        <label for="rule-purpose">{$t('rulePurpose')} *</label>
        <input id="rule-purpose" class="form-input" bind:value={rulePurpose} placeholder={$t('rulePurpose')} />
      </div>

      <div class="form-group">
        <label for="rule-product">{$t('ruleProduct')}</label>
        <input id="rule-product" class="form-input" bind:value={ruleProduct} placeholder={$t('ruleProduct')} />
      </div>

      <div class="form-group">
        <label for="rule-window">{$t('ruleWindowDays')}</label>
        <input id="rule-window" class="form-input" type="number" bind:value={ruleWindowDays} min="1" max="365" />
      </div>

      <div class="modal-actions">
        <button class="btn btn-secondary" on:click={() => editingRule = null}>{$t('cancel')}</button>
        <button class="btn btn-primary" on:click={saveRule}>{$t('save')}</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .container {
    padding: 1rem;
    max-width: 600px;
    margin: 0 auto;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
  }

  .page-title {
    font-size: 1.5rem;
    color: #2d5a27;
    margin: 0;
  }

  .page-desc {
    font-size: 0.875rem;
    color: #666;
    margin: 0 0 1rem;
  }

  .profile-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    margin-bottom: 0.75rem;
    overflow: hidden;
  }

  .profile-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.875rem 1rem;
    cursor: pointer;
    user-select: none;
  }

  .profile-header:hover {
    background: #f8faf8;
  }

  .profile-info {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
  }

  .profile-name {
    font-weight: 600;
    font-size: 0.9375rem;
    color: #222;
  }

  .builtin-badge {
    font-size: 0.7rem;
    background: #e8f5e9;
    color: #2d5a27;
    padding: 0.1rem 0.4rem;
    border-radius: 8px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .profile-desc {
    font-size: 0.8125rem;
    color: #888;
    width: 100%;
  }

  .profile-actions {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex-shrink: 0;
  }

  .expand-arrow {
    font-size: 0.75rem;
    color: #999;
    margin-left: 0.25rem;
  }

  .rules-section {
    border-top: 1px solid #f0f0f0;
    padding: 0.75rem 1rem;
  }

  .rules-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .rule-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 0.5rem 0.625rem;
    background: #f8f9fa;
    border-radius: 8px;
    gap: 0.5rem;
  }

  .rule-info {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 0.5rem;
    align-items: baseline;
    flex: 1;
    font-size: 0.8125rem;
  }

  .rule-action {
    font-weight: 700;
    color: #2d5a27;
  }

  .rule-trigger {
    color: #555;
  }

  .rule-purpose {
    color: #333;
    width: 100%;
  }

  .rule-product {
    color: #888;
    font-style: italic;
  }

  .rule-window {
    color: #aaa;
    font-size: 0.75rem;
  }

  .rule-actions {
    display: flex;
    gap: 0.25rem;
    flex-shrink: 0;
  }

  .no-rules {
    font-size: 0.875rem;
    color: #999;
    margin: 0 0 0.75rem;
  }

  .empty {
    text-align: center;
    color: #999;
    padding: 2rem;
  }

  /* Buttons */
  .btn {
    padding: 0.5rem 1rem;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: background 0.2s;
  }

  .btn-sm {
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
  }

  .btn-primary { background: #2d5a27; color: white; }
  .btn-primary:hover { background: #3d7a37; }
  .btn-secondary { background: #e9ecef; color: #333; }
  .btn-secondary:hover { background: #dee2e6; }

  .btn-icon-sm {
    width: 30px;
    height: 30px;
    border-radius: 6px;
    border: 1px solid #dee2e6;
    background: white;
    cursor: pointer;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  .btn-icon-sm.danger { color: #e74c3c; border-color: #f5c6cb; }
  .btn-icon-sm.danger:hover { background: #fff5f5; }

  /* Modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.45);
    z-index: 200;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 1rem;
  }

  .modal {
    background: white;
    border-radius: 16px 16px 12px 12px;
    padding: 1.25rem;
    width: 100%;
    max-width: 480px;
    max-height: 85vh;
    overflow-y: auto;
  }

  .modal-title {
    font-size: 1.1rem;
    color: #2d5a27;
    margin: 0 0 1rem;
  }

  .form-group {
    margin-bottom: 0.875rem;
  }

  .form-group label, .form-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.3rem;
  }

  .form-input {
    width: 100%;
    padding: 0.625rem;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    font-family: inherit;
    font-size: 0.9375rem;
    background: white;
    box-sizing: border-box;
  }

  .form-input:focus {
    border-color: #2d5a27;
    outline: none;
  }

  .month-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 0.375rem;
  }

  .month-btn {
    padding: 0.35rem 0;
    border-radius: 6px;
    border: 2px solid #e9ecef;
    background: white;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 500;
    color: #555;
    transition: all 0.15s;
  }

  .month-btn.selected {
    background: #2d5a27;
    border-color: #2d5a27;
    color: white;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 1rem;
  }
</style>
