// Dynamic Greeting & Date
(function(){
  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
  document.getElementById('greetingTitle').textContent = greeting + ', Midhul 👋';

  const d = new Date();
  const opts = {weekday:'short', month:'long', day:'numeric'};
  document.getElementById('currentDate').textContent = d.toLocaleDateString('en-US', opts);
})();

// Checkbox interactions
document.querySelectorAll('.chk-item').forEach(item => {
  item.addEventListener('click', function(e){
    if(e.target.tagName !== 'INPUT') {
      const input = this.querySelector('input');
      if(input) input.checked = !input.checked;
    }
    this.classList.toggle('done');
  });
});

// Mock Timer logic
let seconds = 6322; // 01:45:22
setInterval(() => {
  seconds++;
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  document.getElementById('workTimer').textContent = `${h}:${m}:${s}`;
}, 1000);