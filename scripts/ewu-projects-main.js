const savedTheme = localStorage.getItem('theme');
if (savedTheme) {  
  // User has made a choice — respect it
  document.documentElement.dataset.theme = savedTheme;
} else {
  // No saved choice — check system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (prefersDark) {
    document.documentElement.dataset.theme = 'dark';
  } else {
    document.documentElement.dataset.theme = 'light';
  }
}

const themeToggle = document.querySelector('.theme-toggle');
const dropdownContent = document.querySelector('.dropdown-content');
const lightToggle = document.querySelector('.light') 
const darkToggle = document.querySelector('.dark') 
const systemToggle = document.querySelector('.system') 

// Toggle dropdown on button click
themeToggle.addEventListener('click', function() {
  dropdownContent.classList.toggle('active');
});

// Close dropdown when a theme is selected
[lightToggle, darkToggle, systemToggle].forEach(button => {
  button.addEventListener('click', function() {
    dropdownContent.classList.remove('active');
  });
});

lightToggle.addEventListener('click', function() {
  setTheme('light');
});

darkToggle.addEventListener('click', function() {
  setTheme('dark');
});

systemToggle.addEventListener('click', function() {
  localStorage.setItem('theme', 'system');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(prefersDark ? 'dark' : 'light');
});

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('theme', theme);
}

// Add keyboard support (Enter/Space to activate)
[lightToggle, darkToggle, systemToggle].forEach(button => {
  button.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.click();
    }
  });
});

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
  const dropdown = document.querySelector('.dropdown-content');
  if (!dropdown.contains(e.target)) {
    dropdownContent.classList.remove('active');
  }
});