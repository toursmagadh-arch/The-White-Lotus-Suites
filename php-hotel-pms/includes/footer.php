    </main>
  </div>
</div>

<script>
  // Initialize Feather vector icons
  if (typeof feather !== 'undefined') {
    feather.replace();
  }

  // Modal helper
  function openModal(id) {
    var m = document.getElementById(id);
    if (m) m.classList.add('active');
  }
  function closeModal(id) {
    var m = document.getElementById(id);
    if (m) m.classList.remove('active');
  }
</script>
</body>
</html>
