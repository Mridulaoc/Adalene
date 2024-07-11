// utils.js
function getSortOption(sortBy, order) {
    switch (sortBy) {
        case 'popularity':
            return { prod_rating: order === 'asc' ? 1 : -1 };
        case 'priceAsc':
            return { prod_price: 1 };
        case 'priceDesc':
            return { prod_price: -1 };
        case 'avgRating':
            return { prod_rating: order === 'asc' ? 1 : -1 };
        case 'featured':
            return { is_bestseller: -1 };
        case 'newArrivals':
            return { created_on: -1 };
        case 'aToZ':
            return { prod_name: 1 };
        case 'zToA':
            return { prod_name: -1 };
        default:
            return { prod_rating: -1 };
    }
}

module.exports = getSortOption;
