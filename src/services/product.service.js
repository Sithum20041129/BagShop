const productRepository = require('../repositories/product.repository');

class ProductService {
  getAllProducts(queryParams = {}) {
    let products = productRepository.findAll();
    const { category, search, sort, tag, isNew, isBestSeller, isFeatured, minPrice, maxPrice } = queryParams;

    // Filter by Category
    if (category && category !== 'All') {
      products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    // Filter by Tag
    if (tag) {
      products = products.filter(p => p.tags && p.tags.includes(tag.toLowerCase()));
    }

    // Filter by Badges
    if (isNew === 'true') {
      products = products.filter(p => p.isNew);
    }
    if (isBestSeller === 'true') {
      products = products.filter(p => p.isBestSeller);
    }
    if (isFeatured === 'true') {
      products = products.filter(p => p.isFeatured);
    }

    // Filter by Price Range
    if (minPrice) {
      products = products.filter(p => p.price >= Number(minPrice));
    }
    if (maxPrice) {
      products = products.filter(p => p.price <= Number(maxPrice));
    }

    // Search Keyword
    if (search) {
      const term = search.toLowerCase().trim();
      products = products.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        p.subcategory.toLowerCase().includes(term) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(term)))
      );
    }

    // Sorting
    if (sort === 'price-low') {
      products.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-high') {
      products.sort((a, b) => b.price - a.price);
    } else if (sort === 'rating') {
      products.sort((a, b) => b.rating - a.rating);
    } else if (sort === 'newest') {
      products.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    } else {
      // Default: bestsellers & featured first
      products.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
    }

    return products;
  }

  getProductById(id) {
    const product = productRepository.findById(id);
    if (!product) return null;

    const allProducts = productRepository.findAll();
    const related = allProducts
      .filter(p => p.category === product.category && p.id !== product.id)
      .slice(0, 4);

    return { product, related };
  }

  getCategories() {
    const products = productRepository.findAll();
    const categoryMap = {};

    products.forEach(p => {
      if (!categoryMap[p.category]) {
        categoryMap[p.category] = {
          name: p.category,
          count: 0,
          image: p.images[0]
        };
      }
      categoryMap[p.category].count += 1;
    });

    return Object.values(categoryMap);
  }

  createProduct(data) {
    if (!data.name || !data.category || !data.price) {
      const error = new Error('Product name, category, and price are required.');
      error.statusCode = 400;
      throw error;
    }

    const price = Number(data.price);
    const originalPrice = data.originalPrice ? Number(data.originalPrice) : Math.round(price * 1.25);
    const discount = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

    // Standardize images
    let images = data.images;
    if (typeof images === 'string') {
      images = [images];
    }
    if (!Array.isArray(images) || images.length === 0 || !images[0]) {
      images = ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80'];
    }

    // Standardize colors
    let colors = data.colors;
    if (!Array.isArray(colors) || colors.length === 0) {
      colors = [{ name: 'Classic Black', hex: '#1a1a1a' }];
    }

    const newProduct = {
      id: `bb-${Date.now().toString().slice(-4)}`,
      name: data.name.trim(),
      category: data.category.trim(),
      subcategory: data.subcategory ? data.subcategory.trim() : 'Premium Edition',
      brand: data.brand ? data.brand.trim() : 'Bright Buy Signature',
      price,
      originalPrice,
      discountPercent: discount,
      rating: 5.0,
      reviewCount: 1,
      isNew: true,
      isBestSeller: Boolean(data.isBestSeller),
      isFeatured: Boolean(data.isFeatured),
      inStock: true,
      stockCount: Number(data.stockCount) || 20,
      images,
      colors,
      description: data.description ? data.description.trim() : 'Handcrafted premium bag designed with attention to durability and contemporary style.',
      features: Array.isArray(data.features) && data.features.length > 0
        ? data.features
        : [
            'Premium reinforced materials',
            'Smooth gliding heavy-duty zippers',
            'Water-resistant protective coating',
            'Signature Bright Buy islandwide guarantee'
          ],
      specs: data.specs || {
        dimensions: data.dimensions || '35cm x 26cm x 12cm',
        material: data.material || 'Genuine / Vegan Leather',
        weight: '750g',
        warranty: '1 Year Islandwide Guarantee'
      },
      tags: Array.isArray(data.tags) ? data.tags : [data.category.toLowerCase(), 'new', 'bags']
    };

    return productRepository.create(newProduct);
  }

  deleteProduct(id) {
    const success = productRepository.delete(id);
    if (!success) {
      const error = new Error(`Product with ID "${id}" not found.`);
      error.statusCode = 404;
      throw error;
    }
    return true;
  }
}

module.exports = new ProductService();
