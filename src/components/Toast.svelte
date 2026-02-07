<script>
  export let message;
  export let type = 'info';
</script>

<div class="toast toast-{type}">
  {message}
</div>

<style>
  .toast {
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    animation: slideUp 0.3s ease;
  }

  .toast-info {
    background: #333;
    color: white;
  }

  .toast-success {
    background: #27ae60;
    color: white;
  }

  .toast-error {
    background: #e74c3c;
    color: white;
  }

  @keyframes slideUp {
    from {
      transform: translateX(-50%) translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
  }
</style>
