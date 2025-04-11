document.addEventListener('DOMContentLoaded', () => {
  initNavabr();
  initFooter();
  handleSearchInput();
});

function handleSearchInput() {
  const searchInput = document.getElementById('searchInput');

  if (searchInput) {
    searchInput.addEventListener('keyup', e => {
      const searchTerm = e.target.value.toLowerCase();
      console.log('Suche nach:', searchTerm);
    });
  }
}

function initNavabr() {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/views/navbar/navbar.css';
  document.head.appendChild(link);

  link.onload = function () {
    fetch('/views/navbar/navbar.html')
      .then(response => response.text())
      .then(data => {
        document.getElementById('navbar-container').innerHTML = data;

        const script = document.createElement('script');
        script.type = 'module';
        script.src = '/views/navbar/navbar.js';
        document.body.appendChild(script);
      })
      .catch(error => console.error('Hat nicht geklappt'));
  };
}

function initFooter() {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/views/footer/footer.css';
  document.head.appendChild(link);

  link.onload = function () {
    fetch('/views/footer/footer.html')
      .then(response => response.text())
      .then(data => {
        document.getElementById('footer-container').innerHTML = data;
      })
      .catch(error => console.error('Hat nicht geklappt'));
  };
}
