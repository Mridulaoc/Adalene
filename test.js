<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Movies</title>
  <script>
    // Step 2: Fetch data from the backend
    async function fetchMovies(page = 1, limit = 5, search = "", sort = "rating", genre = "All") {
      try {
        const response = await fetch(`/movies?page=${page}&limit=${limit}&search=${search}&sort=${sort}&genre=${genre}`);
        const data = await response.json();
        if (!data.error) {
          renderMovies(data.movies);
        } else {
          console.error(data.message);
        }
      } catch (error) {
        console.error('Error fetching movies:', error);
      }
    }

    // Step 3: Render the movies in the HTML
    function renderMovies(movies) {
      const moviesContainer = document.getElementById('movies-container');
      moviesContainer.innerHTML = movies.map(movie => `
        <div class="movie">
          <h3>${movie.name}</h3>
          <p>Genre: ${movie.genre.join(', ')}</p>
          <p>Rating: ${movie.rating}</p>
        </div>
      `).join('');
    }

    // Step 4: Setup filter controls
    function setupFilters() {
      const searchInput = document.getElementById('search');
      const sortSelect = document.getElementById('sort');
      const genreSelect = document.getElementById('genre');

      document.getElementById('filter-form').addEventListener('submit', event => {
        event.preventDefault();
        const search = searchInput.value;
        const sort = sortSelect.value;
        const genre = genreSelect.value;
        fetchMovies(1, 5, search, sort, genre);
      });
    }

    // Initialize the filters and fetch the initial set of movies
    window.onload = () => {
      setupFilters();
      fetchMovies();
    };
  </script>
</head>
<body>
  <h1>Movies</h1>
  <form id="filter-form">
    <input type="text" id="search" placeholder="Search by name">
    <select id="sort">
      <option value="rating">Rating</option>
      <option value="name">Name</option>
    </select>
    <select id="genre">
      <option value="All">All</option>
      <option value="Action">Action</option>
      <option value="Romance">Romance</option>
      <!-- Add other genres here -->
    </select>
    <button type="submit">Filter</button>
  </form>
  <div id="movies-container">
    <!-- Movies will be rendered here -->
  </div>
</body>
</html>
