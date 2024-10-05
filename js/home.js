// Update cart count when a product is added to the cart
const apiKey = "AIzaSyCM5Csk-fsX5pkykvImbE8Ma37op-J3z9w"; // Your Firebase API key
const projectId = "ecommerce-43f8f";
const baseUrlCarts = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/carts`;


let cartCount = 0;
let currentUserId = localStorage.getItem('loggedInUserId'); // Replace with actual user ID fetching logic
let cart = [];

async function fetchCartItems() {
    const response = await fetch(`${baseUrlCarts}?pageSize=1000`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch cart items');
    }

    const data = await response.json();
    
    console.log('Cart Items Data:', data); // Log the response

    // Check if documents exist in the response
    if (!data.documents) {
        console.error('No documents found in the response.');
        return [];
    }

    // Filter cart items for the current user
    const userCartItems = data.documents.filter(doc => {
        return doc.fields && 
               doc.fields.userId && 
               doc.fields.userId.stringValue === currentUserId;
    });

    return userCartItems;
}


// Function to update the cart count on the UI
async function updateCartCount() {
    try {
        let totalQuantity = 0;
        const cartItems = await fetchCartItems();

        cartItems.forEach(item => {
        // Assuming the quantity is stored in a field called 'quantity'
        if (item.fields && item.fields.quantity) {
            const quantityString = item.fields.quantity.integerValue; // Get the string value
            totalQuantity += [...quantityString].reduce((sum, char) => sum + parseInt(char, 10), 0); // Convert each char to a number and sum
        }
    }); // Assuming quantity is stored
        const cartCountElement = document.getElementById('cart-count');
        cartCountElement.textContent = totalQuantity;
    } catch (error) {
        console.error('Error fetching cart items:', error);
    }
}

// Call the updateCartCount function when the page loads
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
});


async function fetchUserCart() {
    if (!currentUserId) return [];

    try {
        const response = await fetch(`${baseUrlCarts}?key=${apiKey}`);
        const data = await response.json();

        if (data.documents) {
            // Filter cart items to only show those that belong to the current user
            return data.documents
                .map(doc => doc.fields)
                .filter(item => item.userId.stringValue === currentUserId);
        }

        return [];
    } catch (error) {
        console.error('Error fetching cart items:', error);
        return [];
    }
}

// Function to add a product to the cart
async function addToCart(productId) {

    if (!currentUserId) {
        alert("Please log in to add items to your cart.");
        return;
    }

    const documentId = `${currentUserId}_${productId}`; // Create a unique document ID
    try {
        // Check if the product is already in the user's cart
        const cartItemRef = `${baseUrlCarts}/${documentId}?key=${apiKey}`;
        const existingCartItem = await fetch(cartItemRef);

        // If the response status is 404, it means the item is not in the cart, so create a new document
        if (existingCartItem.status === 404) {
            const productRef = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/products/${productId}?key=${apiKey}`;
            const productResponse = await fetch(productRef);
            const productData = await productResponse.json();

            if (productData.fields) {
                const cartItemData = {
                    userId: currentUserId,
                    productId: productId,
                    quantity: 1,
                    name: productData.fields.Title.stringValue,
                    price: productData.fields.Price.doubleValue,
                    description: productData.fields.Description.stringValue,
                    imageUrl: productData.fields.ImageURL.stringValue,
                };

                // Store the cart item in Firestore under the carts collection
                await fetch(`${baseUrlCarts}/${documentId}?key=${apiKey}`, {
                    method: "PATCH", // Use PATCH to create or update the document
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        fields: {
                            userId: { stringValue: currentUserId },
                            productId: { integerValue: productId },
                            quantity: { integerValue: 1 },
                            name: { stringValue: cartItemData.name },
                            price: { doubleValue: cartItemData.price },
                            description: { stringValue: cartItemData.description },
                            imageUrl: { stringValue: cartItemData.imageUrl }
                        }
                    })
                });

                // Update cart button to indicate the item was added
                const button = document.querySelector(`button[onclick="addToCart('${productId}')"]`);
                button.textContent = "Added to Cart";
                button.disabled = true; // Disable the button after adding
            }
        } else {
            // If the item already exists in the cart, alert the user
            alert("Item is already in your cart!");
        }
    } catch (error) {
        console.error('Error adding item to cart:', error);
    }
}

// Function to fetch products and display them
async function fetchProducts() {
    try {
        const response = await fetch(`${baseUrlProducts}?key=${apiKey}`);
        const data = await response.json();

        // Fetch the user's cart to disable "Add to Cart" buttons for already added items
        cart = await fetchUserCart();
        displayProducts(data.documents);
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const productShowcase = document.getElementById('product-showcase');
    const categorySelect = document.getElementById('category-select');
    let cartCount = 0;
    let cart = []; // To track cart items

    // Fetch products from Firestore
    async function fetchProducts() {
        const apiKey = "AIzaSyCM5Csk-fsX5pkykvImbE8Ma37op-J3z9w"; // Your Firebase API key
        const projectId = "ecommerce-43f8f";
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/products?key=${apiKey}`;

        try {
            const response = await fetch(firestoreUrl);
            const data = await response.json();
            return data.documents; // Return the products for further use
        } catch (error) {
            console.error("Error fetching products:", error);
            return []; // Return an empty array on error
        }
    }

    // Fetch categories from Firestore
    async function fetchCategories() {
        const apiKey = "AIzaSyCM5Csk-fsX5pkykvImbE8Ma37op-J3z9w"; // Your Firebase API key
        const projectId = "ecommerce-43f8f";
        const baseFirestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/Category?key=${apiKey}`;

        try {
            const response = await fetch(baseFirestoreUrl);
            const data = await response.json();

            // Clear existing options
            categorySelect.innerHTML = '<option value="">Select Category</option>';

            // Iterate over the categories and create option elements
            data.documents.forEach(doc => {
                const categoryName = doc.fields.Name.stringValue; // Adjust based on your Firestore document structure
                const categoryId = doc.name.split('/').pop(); // Get the document ID (CatID)

                const option = document.createElement('option');
                option.value = categoryId; // Use CatID
                option.textContent = categoryName;

                categorySelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    }

    // Display products in the product showcase
    async function displayProducts(products) {
        productShowcase.innerHTML = ""; // Clear existing products

        products.forEach(product => {
            const productData = product.fields;
            const productId = product.name.split('/').pop(); // Get product ID from Firestore document name
            const isInCart = cart.some(item => item.productId === productId); // Check if item is already in the cart

            const productElement = document.createElement('div');
            productElement.className = 'product';
            productElement.innerHTML = `
                <div class="product-image">
                    <img src="${productData.ImageURL.stringValue}" alt="${productData.Title.stringValue}">
                </div>
                <div class="product-details">
                    <h3>${productData.Title.stringValue}</h3>
                    <p>${productData.Description.stringValue}</p>
                    <p style="color: ${productData.Quantity.integerValue > 0 ? 'black' : 'red'};">
                        ${productData.Quantity.integerValue > 0 ? `$${productData.Price.doubleValue.toFixed(2)}` : "Out of Stock!!"}
                    </p>
                    <button class="add-to-cart" 
                            style="display: ${productData.Quantity.integerValue > 0 ? 'visible' : 'none'};"
                            onclick="${productData.Quantity.integerValue > 0 ? `addToCart('${productId}')` : `alert('This item is out of stock and cannot be added to the cart.')`}"
                            ${productData.Quantity.integerValue > 0 ? '' : 'disabled'}>
                        ${productData.Quantity.integerValue > 0 && !isInCart ? 'Add to Cart' : 'Added to Cart'}
                    </button>
                </div>
            `;
            productShowcase.appendChild(productElement);
        });

        // Update the add to cart buttons after products are loaded
        const addToCartButtons = document.querySelectorAll('.add-to-cart');
        addToCartButtons.forEach(button => {
            button.addEventListener('click', function () {
                cartCount += 1;
                updateCartCount();
            });
        });
    }

    // Handle search functionality
    async function handleSearch() {
        const query = document.getElementById('search-bar').value.toLowerCase();
        const category = categorySelect.value;

        const products = await fetchProducts(); // Fetch products again
        const filteredProducts = products.filter(doc => {
            const productTitle = doc.fields.Title.stringValue.toLowerCase();
            const productCategory = doc.fields.CatID.stringValue; // Assuming your product has a category field

            const matchesTitle = query ? productTitle.includes(query) : true; // Check if title matches if query is provided
            const matchesCategory = category ? productCategory === category : true; // Check if category matches if category is selected

            return matchesTitle && matchesCategory; // Return true if both conditions are satisfied
        });

        displayProducts(filteredProducts); // Display filtered products
    }

    // Initialize the app by fetching products and categories
    async function initialize() {
        const products = await fetchProducts();
        displayProducts(products);
        fetchCategories();
    }

    // Initialize the app
    initialize();

    document.getElementById('search-btn').addEventListener('click', handleSearch);

});

// Check user login state on page load
document.addEventListener('DOMContentLoaded', function() {
    const currentUserId = localStorage.getItem('loggedInUserId'); // Assume this is set on login
    const profileIcon = document.getElementById('profile-icon');
    const loginButton = document.getElementById('login-button');
    const logoutIcon = document.getElementById('logout-icon');
    const profileSection = document.getElementById('profile-section');
    const loginSection = document.getElementById('login-section');
    const logoutSection = document.getElementById('logout-section');

    if (currentUserId) {
        // User is logged in
        profileIcon.style.display = 'block'; // Show profile icon
        loginButton.style.display = 'none'; // Hide login button
        logoutSection.style.display = 'block'; // Show logout icon

        // Event listener for profile icon
        profileIcon.addEventListener('click', async () => {
            const userDetails = await fetchUserDetails(currentUserId);
            showUserDetails(userDetails); // Function to display user details
        });

        // Event listener for logout icon
        logoutIcon.addEventListener('click', () => {
            logoutUser(); // Function to handle user logout
        });
    } else {
        // User is not logged in
        profileIcon.style.display = 'none'; // Hide profile icon
        loginButton.style.display = 'block'; // Show login button
        logoutSection.style.display = 'none'; // Hide logout icon
    }
});

// Function to fetch user details
// Define the base URL for users
const baseUrlUsers = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users`;

// Function to fetch user details
async function fetchUserDetails() {
    // Retrieve logged-in user ID from local storage
    const loggedInUserId = localStorage.getItem('loggedInUserId');

    if (loggedInUserId) {
        console.log(`Fetching user details for ID: ${loggedInUserId}`);

        try {
            // Fetch user document using the Firestore REST API
            const response = await fetch(`${baseUrlUsers}/${loggedInUserId}?key=${apiKey}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Error fetching user details: ${response.status} ${response.statusText}`);
            }

            const userData = await response.json();

            // Check if the user document exists
            if (userData.fields) {
                // Extract user details
                const firstName = userData.fields.firstName.stringValue;
                const lastName = userData.fields.lastName.stringValue;
                const email = userData.fields.email.stringValue;
                const creditLimit = userData.fields.creditLimit.integerValue; // Assuming there's a creditLimit field

                console.log(`User Data:`, userData);

                // Update the HTML with the user details
                document.getElementById('loggedUserFName').innerText = firstName;
                document.getElementById('loggedUserLName').innerText = lastName;
                document.getElementById('loggedUserEmail').innerText = email;
                document.getElementById('loggedUserCreditLimit').innerText = `Credit Limit: ${creditLimit}`;

                // Open the modal after user data is fetched
                openModal();
            } else {
                console.log("No document found matching the ID.");
            }
        } catch (error) {
            console.error('Error fetching document:', error);
        }
    } else {
        console.log("User ID not found in local storage.");
    }
}

// Function to open a modal (you need to implement this)
function openModal() {
    // Your modal opening logic here
    const modal = document.getElementById('userDetailsModal'); // Example modal ID
    modal.style.display = 'block'; // Show the modal
}

// Example function to close the modal
function closeModal() {
    const modal = document.getElementById('userDetailsModal'); // Example modal ID
    modal.style.display = 'none'; // Hide the modal
}

// Call fetchUserDetails when needed, e.g., when the profile icon is clicked
document.getElementById('profile-icon').addEventListener('click', fetchUserDetails);


// Function to handle user logout
function logoutUser() {
    localStorage.removeItem('loggedInUserId'); // Clear user session
    window.location.href = 'home.html'; // Redirect to home page
}

const API_KEY = "AIzaSyCM5Csk-fsX5pkykvImbE8Ma37op-J3z9w"; // Your Firebase API key
const PROJECT_ID = "ecommerce-43f8f";
const ORDERS_COLLECTION_ID = "orders"; // Replace with your actual orders collection ID

async function fetchUserOrderHistory(userId) {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${ORDERS_COLLECTION_ID}?key=${API_KEY}`;
    
    try {
        const response = await fetch(url);

        // Check for HTTP errors
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Check if documents are present
        if (data.documents) {
            // Filter orders for the specific user
            return data.documents
                .map(doc => {
                    const fields = doc.fields;

                    return {
                        orderId: fields.orderId.stringValue,
                        userId: fields.userId.stringValue,
                        date: new Date(fields.date.stringValue), // Convert string to Date object
                        paymentMethod: fields.paymentMethod.stringValue,
                        items: fields.items.arrayValue.values.map(item => ({
                            name: item.mapValue.fields.name.stringValue,
                            quantity: item.mapValue.fields.quantity.integerValue,
                            price: item.mapValue.fields.price.doubleValue,
                            productId: item.mapValue.fields.productId.stringValue
                        }))
                    };
                })
                .filter(order => order.userId === userId); // Filter by userId
        } else {
            console.log("No documents found.");
        }
    } catch (error) {
        console.error('Error fetching user order history:', error);
    }
    
    return []; // Return an empty array if fetching fails or no documents are found
}

// Example usage
async function displayUserOrderHistory() {
    const loggedInUserId = localStorage.getItem('loggedInUserId'); // Get logged-in user ID
    const userOrders = await fetchUserOrderHistory(loggedInUserId);

    // Get the order history container
    const orderHistoryContainer = document.getElementById('order-history');

    // Clear previous entries
    orderHistoryContainer.innerHTML = '<h2>Your Order History</h2>';

    if (userOrders.length === 0) {
        orderHistoryContainer.innerHTML += '<p>No orders found.</p>';
        return; // Exit if no orders
    }

    // Loop through userOrders to render them in your HTML
    userOrders.forEach(order => {
        // Create a div for each order
        const orderDiv = document.createElement('div');
        orderDiv.className = 'order';

        // Create an inner HTML for order details
        orderDiv.innerHTML = `
            <h3>Order ID: ${order.orderId}</h3>
            <p>Date: ${order.date.toLocaleDateString()}</p>
            <p>Payment Method: ${order.paymentMethod}</p>
            <h4>Items:</h4>
            <ul>
                ${order.items.map(item => `
                    <li>
                        ${item.name} - Quantity: ${item.quantity}, Price: $${item.price.toFixed(2)}
                    </li>
                `).join('')}
            </ul>
        `;

        // Append the order div to the container
        orderHistoryContainer.appendChild(orderDiv);
    });
}


// Call the display function
displayUserOrderHistory();

// Event listener for order history button
document.getElementById('orderHistoryBtn').addEventListener('click', () => {
    const loggedInUserId = localStorage.getItem('loggedInUserId');
    if (loggedInUserId) {
        fetchUserOrderHistory(loggedInUserId);
    } else {
        console.log('No user is logged in.');
    }
});
