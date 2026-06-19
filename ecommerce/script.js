document.addEventListener('DOMContentLoaded', () => {
    const productGrid = document.querySelector('.product-grid');

    const products = [
        {
            id: 1,
            name: 'Product Name 3',
            description: 'Description of Product 3.',
            price: 24.99,
            image: 'https://via.placeholder.com/150'
        },
        {
            id: 2,
            name: 'Product Name 4',
            description: 'Description of Product 4.',
            price: 34.99,
            image: 'https://via.placeholder.com/150'
        }
    ];

    function renderProducts() {
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.classList.add('product-card');
            productCard.innerHTML = `
                <img src="${product.image}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <span class="price">$${product.price.toFixed(2)}</span>
                <button data-product-id="${product.id}">Add to Cart</button>
            `;
            productGrid.appendChild(productCard);
        });
    }

    renderProducts();

    productGrid.addEventListener('click', (event) => {
        if (event.target.tagName === 'BUTTON' && event.target.textContent === 'Add to Cart') {
            const productId = event.target.dataset.productId;
            alert(`Product ${productId} added to cart! (This is a placeholder action)`);
        }
    });
});
