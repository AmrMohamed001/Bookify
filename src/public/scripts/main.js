/**
 * Bookify - Main JavaScript File
 * Client-side functionality for Bookify platform
 */

// =======================
// UTILITY FUNCTIONS
// =======================

/**
 * Show a toast notification
 */
function showToast(message, type = 'info', duration = 3000) {
  const toastContainer =
    document.getElementById('toastContainer') || createToastContainer();

  const toast = document.createElement('div');
  toast.className = `alert alert-${type} position-fixed bottom-0 end-0 m-3 animate-slideInRight`;
  toast.style.zIndex = '9999';
  toast.textContent = message;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, duration);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toastContainer';
  container.style.cssText =
    'position: fixed; bottom: 0; right: 0; z-index: 9999;';
  document.body.appendChild(container);
  return container;
}

/**
 * Fetch with error handling
 */
/**
 * Fetch with error handling and auto-refresh token
 */
async function apiFetch(url, options = {}) {
  // Default headers
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    let response = await fetch(url, config);

    // Handle 401 Unauthorized (Expired Token)
    if (response.status === 401) {
      // Don't try refresh on auth pages to prevent infinite loop
      const isAuthPage =
        window.location.pathname.includes('/login') ||
        window.location.pathname.includes('/register');

      if (isAuthPage) {
        throw new Error('Not authenticated');
      }

      console.log('Access token expired, attempting refresh...');

      try {
        // Attempt refresh (cookies handled automatically by browser)
        const refreshRes = await fetch('/api/v1/auth/refresh-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (refreshRes.ok) {
          console.log('Token refreshed, retrying request...');
          // Retry original request (browser sends new cookies)
          response = await fetch(url, config);
        } else {
          console.log('Refresh failed, redirecting to login');
          window.location.href = '/login?expired=true';
          throw new Error('Session expired');
        }
      } catch (err) {
        console.error('Refresh logic failed:', err);
        window.location.href = '/login?expired=true';
        throw err;
      }
    }

    // Clone response to read json body
    const data = await response
      .clone()
      .json()
      .catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * Format currency
 */
function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Format date
 */
function formatDate(date, locale = 'en-US') {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// =======================
// CART FUNCTIONS
// =======================

async function addToCart(bookId, format = 'digital', quantity = 1) {
  try {
    const data = await apiFetch('/api/v1/cart', {
      method: 'POST',
      body: JSON.stringify({
        bookId,
        format,
        quantity,
      }),
    });

    showToast('Book added to cart!', 'success');
    updateCartCount();
    return data;
  } catch (error) {
    showToast(error.message, 'danger');
  }
}

async function removeFromCart(itemId) {
  try {
    await apiFetch(`/api/v1/cart/${itemId}`, {
      method: 'DELETE',
    });

    showToast('Item removed from cart', 'info');
    location.reload();
  } catch (error) {
    showToast(error.message, 'danger');
  }
}

async function updateCartQuantity(itemId, quantity) {
  try {
    await apiFetch(`/api/v1/cart/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });

    location.reload();
  } catch (error) {
    showToast(error.message, 'danger');
  }
}

async function updateCartCount() {
  // Don't update cart count on auth pages (user not logged in)
  const isAuthPage =
    window.location.pathname.includes('/login') ||
    window.location.pathname.includes('/register');
  if (isAuthPage) return;

  // Check if cart badge exists (indicates user might be logged in)
  const cartBadge = document.querySelector('[href="/cart"] .badge');
  if (!cartBadge) return;

  try {
    const data = await apiFetch('/api/v1/cart/count');
    if (cartBadge && data.count !== undefined) {
      cartBadge.textContent = data.count;
    }
  } catch (error) {
    // Silently fail - user might not be logged in
    console.log('Cart count update skipped (user may not be logged in)');
  }
}

// =======================
// WISHLIST FUNCTIONS
// =======================

async function addToWishlist(bookId) {
  try {
    await apiFetch('/api/v1/wishlist', {
      method: 'POST',
      body: JSON.stringify({ bookId }),
    });

    showToast('Added to wishlist!', 'success');
  } catch (error) {
    showToast(error.message, 'danger');
  }
}

async function removeFromWishlist(bookId) {
  try {
    await apiFetch(`/api/v1/wishlist/${bookId}`, {
      method: 'DELETE',
    });

    showToast('Removed from wishlist', 'info');
    location.reload();
  } catch (error) {
    showToast(error.message, 'danger');
  }
}

// =======================
// REVIEW FUNCTIONS
// =======================

async function submitReview(bookId, rating, reviewText) {
  try {
    const data = await apiFetch('/api/v1/reviews', {
      method: 'POST',
      body: JSON.stringify({
        bookId,
        rating: parseInt(rating),
        reviewText,
      }),
    });

    showToast('Review submitted successfully!', 'success');
    setTimeout(() => location.reload(), 1500);
    return data;
  } catch (error) {
    showToast(error.message, 'danger');
  }
}

async function deleteReview(reviewId) {
  if (!confirm('Are you sure you want to delete this review?')) return;

  try {
    await apiFetch(`/api/v1/reviews/${reviewId}`, {
      method: 'DELETE',
    });

    showToast('Review deleted', 'info');
    location.reload();
  } catch (error) {
    showToast(error.message, 'danger');
  }
}

async function markReviewHelpful(reviewId) {
  try {
    await apiFetch(`/api/v1/reviews/${reviewId}/helpful`, {
      method: 'POST',
    });

    showToast('Thank you for your feedback!', 'success');
  } catch (error) {
    showToast(error.message, 'danger');
  }
}

// =======================
// SEARCH FUNCTIONS
// =======================

async function searchBooks(query) {
  try {
    const response = await apiFetch(
      `/api/v1/search?q=${encodeURIComponent(query)}`
    );
    displaySearchResults(response.data);
  } catch (error) {
    showToast('Search failed', 'danger');
  }
}

function displaySearchResults(results) {
  const container = document.getElementById('searchResults');
  if (!container) return;

  if (results.length === 0) {
    container.innerHTML =
      '<p class="text-muted text-center py-4">No results found</p>';
    return;
  }

  container.innerHTML = results
    .map(
      book => `
    <div class="search-result-item mb-3 p-3 border-bottom">
      <a href="/book/${book._id}" class="text-decoration-none">
        <h6 class="mb-1">${book.title}</h6>
        <p class="text-muted small">by ${book.author.name}</p>
      </a>
    </div>
  `
    )
    .join('');
}

// =======================
// AUTOCOMPLETE SEARCH
// =======================

let searchDebounceTimer;

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.querySelector('input[placeholder*="Search"]');

  if (searchInput) {
    searchInput.addEventListener('input', e => {
      clearTimeout(searchDebounceTimer);
      const query = e.target.value.trim();

      if (query.length < 2) return;

      searchDebounceTimer = setTimeout(() => {
        fetchSearchSuggestions(query);
      }, 300);
    });
  }
});

async function fetchSearchSuggestions(query) {
  try {
    const data = await apiFetch(
      `/api/v1/search/autocomplete?q=${encodeURIComponent(query)}`
    );
    displaySearchSuggestions(data.suggestions || []);
  } catch (error) {
    console.error('Autocomplete error:', error);
  }
}

function displaySearchSuggestions(suggestions) {
  const container =
    document.getElementById('searchSuggestions') ||
    createSuggestionsContainer();

  if (suggestions.length === 0) {
    container.style.display = 'none';
    return;
  }

  container.innerHTML = suggestions
    .map(
      suggestion => `
    <a href="/book/${suggestion._id}" class="dropdown-item">
      <img src="${suggestion.coverImage.url}" alt="" style="width: 30px; height: 40px; object-fit: cover; margin-right: 10px;">
      <span>${suggestion.title}</span>
    </a>
  `
    )
    .join('');

  container.style.display = 'block';
}

function createSuggestionsContainer() {
  const container = document.createElement('div');
  container.id = 'searchSuggestions';
  container.className = 'dropdown-menu w-100';
  container.style.display = 'none';
  document
    .querySelector('input[placeholder*="Search"]')
    .parentElement.appendChild(container);
  return container;
}

// =======================
// PASSWORD VISIBILITY TOGGLE
// =======================

function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
  input.setAttribute('type', type);
}

// =======================
// FORM VALIDATION
// =======================

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePassword(password) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*]/.test(password)
  );
}

// =======================
// RATING STAR INPUT
// =======================

document.addEventListener('DOMContentLoaded', () => {
  const starInputs = document.querySelectorAll('input[name="rating"]');

  starInputs.forEach(input => {
    input.addEventListener('change', e => {
      const rating = e.target.value;
      console.log('Rating selected:', rating);
    });
  });
});

// =======================
// PAGINATION
// =======================

function goToPage(page) {
  const url = new URL(window.location);
  url.searchParams.set('page', page);
  window.location.href = url.toString();
}

// =======================
// LOADING SPINNER
// =======================

function showLoadingSpinner() {
  let spinner = document.getElementById('loadingSpinner');
  if (!spinner) {
    spinner = document.createElement('div');
    spinner.id = 'loadingSpinner';
    spinner.innerHTML = `
      <div class="position-fixed top-50 start-50 translate-middle" style="z-index: 9999;">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
    `;
    document.body.appendChild(spinner);
  }
  spinner.style.display = 'block';
}

function hideLoadingSpinner() {
  const spinner = document.getElementById('loadingSpinner');
  if (spinner) {
    spinner.style.display = 'none';
  }
}

// =======================
// SMOOTH SCROLL
// =======================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  });
});

// =======================
// INITIALIZATION
// =======================

document.addEventListener('DOMContentLoaded', () => {
  // Initialize tooltips
  const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  tooltips.forEach(tooltip => {
    new bootstrap.Tooltip(tooltip);
  });

  // Initialize popovers
  const popovers = document.querySelectorAll('[data-bs-toggle="popover"]');
  popovers.forEach(popover => {
    new bootstrap.Popover(popover);
  });

  // Update cart count on page load
  updateCartCount();

  console.log('Bookify App Initialized');
});

// =======================
// ERROR HANDLING
// =======================

window.addEventListener('error', event => {
  console.error('Global error:', event.error);
  showToast('An unexpected error occurred', 'danger');
});

window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason);
  showToast('An unexpected error occurred', 'danger');
});
