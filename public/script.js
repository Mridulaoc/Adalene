
   function updateProducts() {
       const sortByElement = document.getElementById('sortBy');
       const search = document.getElementById('search').value;

       if (!sortByElement) {
           console.error('Sort by element not found');
           return;
       }
       const sortBy = sortByElement.value;
       const order = 'asc';
       const currentPage = new URLSearchParams(window.location.search).get('page') || 1;

       window.location.href = `?page=${currentPage}&sortBy=${sortBy}&order=${order}&search=${search}`;
   }

   // Expose the function to the global scope
   window.updateProducts = updateProducts;

