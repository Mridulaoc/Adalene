document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById('productForm');
    const nameInput = document.getElementById('name');
    const priceInput = document.getElementById('price');
    const mpriceInput = document.getElementById('mprice');
    const quantityInput = document.getElementById('quantity');
    const ratingInput = document.getElementById('rating');
    const descriptionInput = document.getElementById('description');
    const errorContainer = document.createElement('div');
    errorContainer.id = 'errorContainer';
    errorContainer.style.color = 'red';
    form.insertBefore(errorContainer, form.firstChild);
  
    // Validation functions
    function validateName() {
      const name = nameInput.value.trim();
      if (name.length < 5) {
        setError('Name must be at least 5 characters long');
        return false;
      }
      clearError();
      return true;
    }
  
    function validatePrice() {
      const price = parseFloat(priceInput.value);
      if (isNaN(price) || price <= 0) {
        setError('Please enter a valid price greater than 0');
        return false;
      }
      clearError();
      return true;
    }
  
    function validateMPrice() {
      const mprice = parseFloat(mpriceInput.value);
      if (isNaN(mprice) || mprice <= 0) {
        setError('Please enter a valid MRP greater than 0');
        return false;
      }
      clearError();
      return true;
    }
  
    function validateQuantity() {
      const quantity = parseInt(quantityInput.value);
      if (isNaN(quantity) || quantity <= 0) {
        setError('Please enter a valid quantity greater than 0');
        return false;
      }
      clearError();
      return true;
    }
  
    function validateRating() {
      const rating = parseFloat(ratingInput.value);
      if (isNaN(rating) || rating < 1 || rating > 5) {
        setError('Please enter a valid rating between 1 and 5');
        return false;
      }
      clearError();
      return true;
    }
  
    function validateDescription() {
      const description = descriptionInput.value.trim();
      if (description.length < 10 || description.length > 200) {
        setError('Product description must be between 10 and 200 characters');
        return false;
      }
      clearError();
      return true;
    }
  
    // Helper functions
    function setError(message) {
      errorContainer.textContent = message;
    }
  
    function clearError() {
      errorContainer.textContent = '';
    }
  
    // Add event listeners for real-time validation
    nameInput.addEventListener('input', validateName);
    priceInput.addEventListener('input', validatePrice);
    mpriceInput.addEventListener('input', validateMPrice);
    quantityInput.addEventListener('input', validateQuantity);
    ratingInput.addEventListener('input', validateRating);
    descriptionInput.addEventListener('input', validateDescription);
  
    // Form submission validation
    form.addEventListener('submit', function(event) {
      const isValid = 
        validateName() &&
        validatePrice() &&
        validateMPrice() &&
        validateQuantity() &&
        validateRating() &&
        validateDescription();
  
      if (!isValid) {
        event.preventDefault();
      }
    });
  })
  