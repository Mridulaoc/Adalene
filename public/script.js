
   function updateProducts() {
       const sortByElement = document.getElementById('sortBy');
       const search = document.getElementById('search').value;
       const showOutOfStockElement = document.getElementById('showOutOfStock');

       if (!sortByElement) {
           console.error('Sort by element not found');
           return;
       }
       const sortBy = sortByElement.value;
       const excludeOutOfStock = showOutOfStockElement ? showOutOfStockElement.checked : false;
       
       const order = 'asc';
       const currentPage = new URLSearchParams(window.location.search).get('page') || 1;
       const category = window.location.pathname.split('/').pop();

       window.location.href = `/${category}?page=${currentPage}&sortBy=${sortBy}&order=${order}&search=${search}&excludeOutOfStock=${excludeOutOfStock}`;
   }

 
   window.updateProducts = updateProducts;

//    Code for toastify 

   function showToast(message) {
    Toastify({
        text: message,
        duration: 3000, // Duration in milliseconds
        close: true,
        gravity: "top", // `top` or `bottom`
        position: "right", // `left`, `center` or `right`
        backgroundColor: "linear-gradient(to right, #00b09b, #96c93d)", // Custom background color
        stopOnFocus: true, // Prevents dismissing of toast on hover
    }).showToast();
}


