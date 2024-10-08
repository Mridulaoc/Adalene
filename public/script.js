

function updateProducts(selectedCategory = "") {
  const sortByElement = document.getElementById("sortBy");
  const searchElement = document.getElementById("search");
  const showOutOfStockElement = document.getElementById("showOutOfStock");
  const priceRangeElement = document.getElementById("priceRange");
  const colorElements = document.querySelectorAll('input[name="color"]');

  if (
    !sortByElement ||
    !searchElement ||
    !showOutOfStockElement ||
    !priceRangeElement
  ) {
    console.error("One or more required elements not found");
    return;
  }

  const sortBy = sortByElement.value;
  const search = searchElement.value;
  const excludeOutOfStock = showOutOfStockElement
    ? showOutOfStockElement.checked
    : false;
  const maxPrice = priceRangeElement.value;
  let selectedColor = "";
  colorElements.forEach((radio) => {
    if (radio.checked) {
      selectedColor = radio.value;
    }
  });

  // Get the current URL parameters
  const urlParams = new URLSearchParams(window.location.search);

  // Update or add the new parameters
  urlParams.set("sortBy", sortBy);
  urlParams.set("search", search);
  urlParams.set("excludeOutOfStock", excludeOutOfStock);
  urlParams.set("maxPrice", maxPrice);
  urlParams.set("color", selectedColor);
  urlParams.set("page", "1"); // Reset to first page when updating filters
  if(selectedCategory){
    urlParams.set("category", selectedCategory);
  }


  // Construct the new URL
  const newUrl = `${window.location.pathname}?${urlParams.toString()}`;

  window.location.href = newUrl;
}

function updatePriceValue(value) {
    document.getElementById('priceValue').textContent = `₹${value}`;
}

document.addEventListener('DOMContentLoaded', () => {
    const priceRangeElement = document.getElementById('priceRange');
    updatePriceValue(priceRangeElement.value);
    const urlParams = new URLSearchParams(window.location.search);
    const excludeOutOfStock = urlParams.get('excludeOutOfStock') === 'true';
    document.getElementById('showOutOfStock').checked = excludeOutOfStock;
});
function updateCartCount(count) {
  const cartCountElement = document.getElementById('cartItemCount');
  cartCountElement.textContent = count;
  cartCountElement.style.display = count > 0 ? 'inline-block' : 'none';
}
document.addEventListener('DOMContentLoaded', () => {
  const cartCountElement = document.getElementById('cartItemCount');
  const count = parseInt(cartCountElement.textContent) || 0;
  updateCartCount(count);
})

window.updateCartCount = updateCartCount;
window.updateProducts = updateProducts;
window.updatePriceValue = updatePriceValue;