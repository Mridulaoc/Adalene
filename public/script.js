
   function updateProducts() {
       const sortBy = document.getElementById('sortBy').value;
       const search = document.getElementById('search').value;
       const showOutOfStockElement = document.getElementById('showOutOfStock');

       if (!sortByElement) {
           console.error('Sort by element not found');
           return;
       }
       
       const excludeOutOfStock = showOutOfStockElement ? showOutOfStockElement.checked : false;
       
       const order = 'asc';
       const currentPage = new URLSearchParams(window.location.search).get('page') || 1;
       const category = window.location.pathname.split('/').pop();

       window.location.href = `/${category}?page=${currentPage}&sortBy=${sortBy}&order=${order}&search=${search}&excludeOutOfStock=${excludeOutOfStock}`;
   }

 
   window.updateProducts = updateProducts;




