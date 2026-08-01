const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('app/team/index.html', 'utf8');
const servicesJs = fs.readFileSync('app/assets/js/services.js', 'utf8');
const scriptJs = fs.readFileSync('app/team/script.js', 'utf8');

const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable" });

dom.window.eval(`
  window.localStorage = {
    _data: {},
    getItem: function(k) { return this._data[k] || null; },
    setItem: function(k, v) { this._data[k] = String(v); },
    clear: function() { this._data = {}; }
  };
  window.VerdeToast = { success: console.log, error: console.error };
  window.requestAnimationFrame = cb => setTimeout(cb, 0);
`);

try {
  dom.window.eval(servicesJs);
  dom.window.eval(scriptJs);
} catch (e) {
  console.error("Eval Error:", e);
}

setTimeout(() => {
  console.log("Checking if services loaded...");
  console.log("getDepartments exists?", !!dom.window.VerdeServices.Team.getDepartments);
  
  console.log("Calling renderDepartments...");
  dom.window.renderDepartments();
  
  console.log("Calling renderOrganization...");
  dom.window.renderOrganization();
  
  setTimeout(() => {
    const depGrid = dom.window.document.getElementById('departments-grid-container').innerHTML.trim();
    console.log("Departments Grid rendered length:", depGrid.length);
    
    const orgTree = dom.window.document.getElementById('org-tree-container').innerHTML.trim();
    console.log("Organization Tree rendered length:", orgTree.length);
    
  }, 1000);
}, 1000);
