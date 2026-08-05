import io
import re

path = r'c:\verde studios\verde labs erp\app\workspace\workspace.js'
with io.open(path, 'r', encoding='utf-8') as f:
    js = f.read()

org_profile_js = """
  /* ==========================================================================
     ORGANIZATION PROFILE (FEATURE EXTENSION)
     ========================================================================== */
  
  function getOrgProfile() {
    var stored = localStorage.getItem('organizationProfile');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch(e) {}
    }
    return {
      orgName: '',
      legalName: '',
      orgCode: '',
      industry: '',
      companySize: '',
      email: '',
      phone: '',
      website: '',
      country: '',
      state: '',
      city: '',
      address: '',
      postalCode: '',
      timezone: '',
      currency: '',
      foundedDate: '',
      description: '',
      logo: ''
    };
  }

  function saveOrgProfileData(data) {
    localStorage.setItem('organizationProfile', JSON.stringify(data));
  }

  function openOrganizationProfile() {
    var p = getOrgProfile();
    
    var logoHtml = 
      '<div style="display:flex;gap:20px;margin-bottom:20px;align-items:center;">' +
        '<div id="org-logo-preview" style="width:80px;height:80px;border-radius:8px;background:var(--bg-2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;overflow:hidden;">' +
          (p.logo ? '<img src="'+esc(p.logo)+'" style="width:100%;height:100%;object-fit:cover;">' : '<span style="color:var(--text-3);font-size:12px;">No Logo</span>') +
        '</div>' +
        '<div>' +
          '<div style="font-size:13px;font-weight:700;color:var(--text-1);margin-bottom:4px;">Organization Logo</div>' +
          '<div style="display:flex;gap:8px;">' +
            '<button class="btn btn-secondary btn-sm" onclick="document.getElementById(\\'org-logo-file\\').click()">Upload</button>' +
            '<button class="btn btn-ghost btn-sm" onclick="window._ws.removeOrgLogo()">Remove</button>' +
          '</div>' +
          '<input type="file" id="org-logo-file" accept="image/*" style="display:none;" onchange="window._ws.handleOrgLogo(this)">' +
          '<input type="hidden" id="org-logo-data" value="'+esc(p.logo)+'">' +
        '</div>' +
      '</div>';

    var formHtml = 
      row2(fieldHTML('Organization Name *', inputHTML('org-name', p.orgName)), fieldHTML('Legal Business Name', inputHTML('org-legal', p.legalName))) +
      row2(fieldHTML('Organization Code', inputHTML('org-code', p.orgCode)), fieldHTML('Industry', inputHTML('org-industry', p.industry))) +
      row2(fieldHTML('Company Size', inputHTML('org-size', p.companySize)), fieldHTML('Founded Date', inputHTML('org-founded', p.foundedDate, 'date'))) +
      row2(fieldHTML('Business Email', inputHTML('org-email', p.email, 'email')), fieldHTML('Phone Number', inputHTML('org-phone', p.phone))) +
      row2(fieldHTML('Website', inputHTML('org-website', p.website)), fieldHTML('Currency', inputHTML('org-currency', p.currency))) +
      row2(fieldHTML('Country', inputHTML('org-country', p.country)), fieldHTML('State/Province', inputHTML('org-state', p.state))) +
      row2(fieldHTML('City', inputHTML('org-city', p.city)), fieldHTML('Postal Code', inputHTML('org-postal', p.postalCode))) +
      fieldHTML('Address', textareaHTML('org-addr', p.address)) +
      fieldHTML('Time Zone', inputHTML('org-tz', p.timezone)) +
      fieldHTML('Description', textareaHTML('org-desc', p.description));
      
    var body = logoHtml + formHtml;

    var footer = 
      '<button class="btn btn-ghost" style="color:var(--danger);margin-right:auto;" onclick="window._ws.resetOrgProfile()">Reset Profile</button>' +
      '<button class="btn btn-ghost" onclick="window._ws.closeModal(\\'ws-m-orgprofile\\')">Cancel</button>' +
      '<button class="btn btn-primary" onclick="window._ws.saveOrganizationProfile()">Save Changes</button>';
      
    openModal('ws-m-orgprofile', 'Organization Profile', body, footer, '650px');
  }

  function handleOrgLogo(input) {
    if (input.files && input.files[0]) {
      var reader = new FileReader();
      reader.onload = function(e) {
        document.getElementById('org-logo-data').value = e.target.result;
        var prev = document.getElementById('org-logo-preview');
        if(prev) prev.innerHTML = '<img src="'+esc(e.target.result)+'" style="width:100%;height:100%;object-fit:cover;">';
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  function removeOrgLogo() {
    document.getElementById('org-logo-data').value = '';
    var prev = document.getElementById('org-logo-preview');
    if(prev) prev.innerHTML = '<span style="color:var(--text-3);font-size:12px;">No Logo</span>';
  }

  function saveOrganizationProfile() {
    var name = val('org-name');
    if (!name) { toast('Organization Name is required', 'error'); return; }
    
    var email = val('org-email');
    if (email && !email.includes('@')) { toast('Invalid Business Email', 'error'); return; }
    
    var website = val('org-website');
    if (website && !website.includes('.')) { toast('Invalid Website URL', 'error'); return; }
    
    var data = {
      orgName: name,
      legalName: val('org-legal'),
      orgCode: val('org-code'),
      industry: val('org-industry'),
      companySize: val('org-size'),
      email: email,
      phone: val('org-phone'),
      website: website,
      country: val('org-country'),
      state: val('org-state'),
      city: val('org-city'),
      address: val('org-addr'),
      postalCode: val('org-postal'),
      timezone: val('org-tz'),
      currency: val('org-currency'),
      foundedDate: val('org-founded'),
      description: val('org-desc'),
      logo: val('org-logo-data')
    };
    
    saveOrgProfileData(data);
    toast('Organization Profile saved successfully', 'success');
    closeModal('ws-m-orgprofile');
  }

  function resetOrgProfile() {
    openModal('ws-m-org-reset-confirm', 'Reset Organization Profile?', 
      '<div style="font-size:14px;color:var(--text-2);">Are you sure you want to completely reset the Organization Profile? This action cannot be undone.</div>', 
      '<button class="btn btn-ghost" onclick="window._ws.closeModal(\\'ws-m-org-reset-confirm\\')">Cancel</button>' +
      '<button class="btn btn-primary" style="background:var(--danger);" onclick="window._ws.confirmResetOrgProfile()">Reset</button>', '400px');
  }

  function confirmResetOrgProfile() {
    localStorage.removeItem('organizationProfile');
    toast('Organization Profile reset', 'success');
    closeModal('ws-m-org-reset-confirm');
    closeModal('ws-m-orgprofile');
    openOrganizationProfile(); // Re-open in blank state
  }
"""

if 'ORGANIZATION PROFILE (FEATURE EXTENSION)' not in js:
    # 1. Inject the new code before the final return statement
    js = js.replace('  return {', org_profile_js + '\n  return {')
    
    # 2. Add 'Organization Profile' to quick actions
    qa_search = "var items = [\n        { label: 'Invite Member', fn: openInviteMember },"
    qa_replace = "var items = [\n        { label: 'Organization Profile', fn: openOrganizationProfile },\n        { label: 'Invite Member', fn: openInviteMember },"
    if qa_search in js:
        js = js.replace(qa_search, qa_replace)
    else:
        # Fallback if the array looks different
        js = js.replace("var items = [", "var items = [\n        { label: 'Organization Profile', fn: window._ws ? window._ws.openOrganizationProfile : openOrganizationProfile },")
    
    # 3. Export the new functions in the IIFE return block
    js = js.replace('init: init,', 'init: init, openOrganizationProfile: openOrganizationProfile, handleOrgLogo: handleOrgLogo, removeOrgLogo: removeOrgLogo, saveOrganizationProfile: saveOrganizationProfile, resetOrgProfile: resetOrgProfile, confirmResetOrgProfile: confirmResetOrgProfile,')

    with io.open(path, 'w', encoding='utf-8') as f:
        f.write(js)
    print("Organization Profile extension added successfully.")
else:
    print("Already added.")
