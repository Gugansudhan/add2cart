const apiKey = "AIzaSyCM5Csk-fsX5pkykvImbE8Ma37op-J3z9w"; // Your Firebase API key
const projectId = "ecommerce-43f8f";
const baseFirestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/products?key=${apiKey}`;
const baseStorageUrl = `https://firebasestorage.googleapis.com/v0/b/${projectId}.appspot.com/o`;
const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

export function loadReadFunction() {
    console.log("Read function loaded successfully.");
    setupReadSection();
}

// Function to load categories from Firestore
function setupReadSection() {
    console.log('Setting up the read section');
    
    // Populate categories and setup the HTML content
    populateCategories();
    renderReadHTML();
}

function renderReadHTML() {
    // HTML Content for Read Inventory
    document.getElementById('crudContent').innerHTML = `
        <div id="read-section" class="crud-section">
            <h1>View Inventory</h1>
            <div>
                <label for="read-method">Select Read Method:</label>
                <select id="read-method">
                    <option value="">Select category</option>
                    <option value="all">Read All Products</option>
                    <option value="name">Search by Name</option>
                    <option value="category">Search by Category</option>
                </select>
            </div>

            <div id="read-name" style="display:none;">
                <input type="text" id="search-name" placeholder="Enter product name" />
                <button id="search-by-name">Search</button>
            </div>

            <div id="read-category" style="display:none;">
                <label for="search-category">Select Category:</label>
                <select id="search-category">
                    <option value="">Select category</option>
                </select>
                <button id="search-by-category">Search</button>
            </div>

            <div class="product-grid" id="read-results"></div>

            <!-- Pagination Controls -->
            <div class="pagination">
                <input type="number" id="items-per-page" placeholder="Items per page" min="1" value="5"/>
                <button id="set-items-per-page">OK</button>
            </div>
            <div id="page-info"></div>
            <div class="pagination" style="text-align: center;">
                <button id="prev-page">Previous</button>
                <button id="next-page">Next</button>
            </div>

            <!-- Edit Product Modal -->
            <div id="edit-product-modal" style="display:none;">
                <h2>Edit Product</h2>
                <label for="edit-product-name">Product Name:</label>
                <input type="text" id="edit-product-name" placeholder="Product Name" />
                
                <label for="edit-product-description">Description:</label>
                <input type="text" id="edit-product-description" placeholder="Product Description" />
                
                <label for="edit-product-price">Product Price:</label>
                <input type="text" id="edit-product-price" placeholder="Product Price" />
                
                <label for="edit-product-quantity">Quantity:</label>
                <input type="text" id="edit-product-quantity" placeholder="Product Quantity" />
                
                <label for="edit-product-image">Change Image:</label>
                <input type="file" id="edit-product-image" accept="image/*" />
                
                <label for="edit-product-category">Category:</label>
                <select id="edit-product-category">
                    <option value="">Select category</option>
                    <!-- Categories will be populated dynamically -->
                </select>
                <br>
                <button id="save-product">Save</button>
                <button id="cancel-edit">Cancel</button>
            </div>
        </div>
    `;

    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    const readMethodSelect = document.getElementById('read-method');
    const readResults = document.getElementById('read-results');
    const readNameSection = document.getElementById('read-name');
    const readCategorySection = document.getElementById('read-category');
    const searchCategorySelect = document.getElementById('search-category');
    
    let products = [];
    let currentPage = 1;
    let itemsPerPage = 5; // Default items per page

    // Show the appropriate search section based on selection
    readMethodSelect.addEventListener('change', () => {
        const method = readMethodSelect.value;
        readNameSection.style.display = method === 'name' ? 'block' : 'none';
        readCategorySection.style.display = method === 'category' ? 'block' : 'none';

        if (method === 'all') {
            fetchAllProducts();
        }
    });

    // Fetch all products
    async function fetchAllProducts() {
        await showLoadingIndicator(async () => {
            try {
                const response = await fetch(`${baseFirestoreUrl}?key=${apiKey}`);
                if (!response.ok) throw new Error('Failed to fetch products');

                const productData = await response.json();
                products = productData.documents || [];
                displayProducts();
            } catch (error) {
                console.error("Error fetching all products: ", error);
                readResults.innerHTML = "<p>Error loading products. Please try again later.</p>";
            }
        });
    }

    // Fetch and display products by name
    document.getElementById('search-by-name').addEventListener('click', async () => {
        const productTitle = document.getElementById('search-name').value.trim();
        if (!productTitle) {
            alert('Please enter a product name to search.');
            return;
        }
        await fetchProductsByName(productTitle);
    });

    // Fetch products by name
    async function fetchProductsByName(title) {
        await showLoadingIndicator(async () => {
            try {
                const response = await fetch(`${baseFirestoreUrl}?key=${apiKey}`);
                if (!response.ok) throw new Error('Failed to fetch products');

                const productData = await response.json();
                products = (productData.documents || []).filter(doc => {
                    if (doc.fields && doc.fields.Title) {
                        return doc.fields.Title.stringValue.toLowerCase().includes(title.toLowerCase());
                    }
                    return false;
                });
                if (products.length === 0) {
                    readResults.innerHTML = "<p>No products found matching that name.</p>";
                } else {
                    currentPage = 1; // Reset to first page
                    displayProducts(); // Ensure this function is prepared to handle the products
                }
            } catch (error) {
                console.error("Error fetching products by name: ", error);
                readResults.innerHTML = "<p>Error searching for products. Please try again.</p>";
            }
        });
    }

    // Fetch and display products by category
    document.getElementById('search-by-category').addEventListener('click', async () => {
        const categoryId = searchCategorySelect.value;
        await fetchProductsByCategory(categoryId);
    });

    // Fetch products by category
    async function fetchProductsByCategory(categoryId) {
        await showLoadingIndicator(async () => {
            try {
                const response = await fetch(`${baseFirestoreUrl}?key=${apiKey}`);
                if (!response.ok) throw new Error('Failed to fetch products');
    
                const productData = await response.json();
                console.log("Raw product data:", productData); // Log the entire product data
    
                products = (productData.documents || []).filter(doc => {
                    // Check if doc.fields and doc.fields.CatID exist before accessing CatID
                    return doc.fields && doc.fields.CatID && 
                           doc.fields.CatID.stringValue == categoryId;
                });
    
                if (products.length === 0) {
                    readResults.innerHTML = "<p>No products found for this category.</p>";
                } else {
                    currentPage = 1; // Reset to first page
                    displayProducts(); // Ensure this function can handle the updated products array
                }
            } catch (error) {
                console.error("Error fetching products by category: ", error);
                readResults.innerHTML = "<p>Error searching for products. Please try again.</p>";
            }
        });
    }

    //Delete
    async function deleteProduct(productId) {
        if (confirm("Are you sure you want to delete this product?")) {
            try {
                const deleteUrl = `${firestoreUrl}/products/${productId}?key=${apiKey}`; // Correct URL without duplicates
                const response = await fetch(deleteUrl, {
                    method: 'DELETE',
                });
    
                if (!response.ok) throw new Error('Failed to delete product');
    
                // Remove the product from local array and refresh display
                products = products.filter(doc => doc.name.split('/').pop() !== productId);
                displayProducts(); // Refresh the display
            } catch (error) {
                console.error("Error deleting product: ", error);
                alert('Error deleting product. Please try again.');
            }
        }
    }

    let categories = [];

    // Fetch categories from Firestore (example, adjust according to your Firestore structure)
    async function loadCategories() {
        try {
            const response = await fetch(`${firestoreUrl}/Category?key=${apiKey}`);
            const data = await response.json();
            categories = data.documents.map(doc => ({
                id: doc.name.split('/').pop(), // Extract category ID from document path
                name: doc.fields.Name.stringValue // Assuming categories have a Name field
            }));
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    // Load categories once when the page loads
    window.addEventListener('DOMContentLoaded', loadCategories);

    //Update
    let currentEditProductId = null; // Store the current product ID being edited

    // Open the edit modal with pre-filled data
    function openEditModal(productId) {
        const productToEdit = products.find(doc => doc.name.split('/').pop() === productId);
        if (!productToEdit) return;
    
        const productFields = productToEdit.fields;
    
        document.getElementById('edit-product-name').value = productFields.Title?.stringValue || '';
        document.getElementById('edit-product-description').value = productFields.Description?.stringValue || '';
        document.getElementById('edit-product-price').value = productFields.Price?.integerValue || productFields.Price?.doubleValue || '';
        document.getElementById('edit-product-quantity').value = productFields.Quantity?.integerValue || '';
    
        // Populate the category dropdown and select the current category
        const categorySelect = document.getElementById('edit-product-category');
        categorySelect.innerHTML = ''; // Clear previous options
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            if (category.id === productFields.CatID?.stringValue) {
                option.selected = true;
            }
            categorySelect.appendChild(option);
        });
    
        currentEditProductId = productId;
        document.getElementById('edit-product-modal').style.display = 'block';
    }    

    // Save the edited product
    async function saveProduct() {
        const updatedProduct = {
            fields: {
                Title: { stringValue: document.getElementById('edit-product-name').value },
                Description: { stringValue: document.getElementById('edit-product-description').value },
                Price: { doubleValue: parseFloat(document.getElementById('edit-product-price').value) },
                Quantity: { integerValue: parseInt(document.getElementById('edit-product-quantity').value) },
                CatID: { stringValue: document.getElementById('edit-product-category').value },
            }
        };

        const imageInput = document.getElementById('edit-product-image');
        const imageFile = imageInput.files[0]; // Get the selected file

        try {

            if (imageFile) {
                const storageResponse = await fetch(`${baseStorageUrl}?uploadType=media&name=${encodeURIComponent(imageFile.name)}&key=${apiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': imageFile.type
                    },
                    body: imageFile
                });
        
                if (!storageResponse.ok) {
                    throw new Error("Failed to upload image");
                }
        
                const storageData = await storageResponse.json();
                const imageUrl = `${baseStorageUrl}/${encodeURIComponent(imageFile.name)}?alt=media&token=${storageData.downloadTokens}`;
    
                // Add ImageURL field to the updated product
                updatedProduct.fields.ImageURL = { stringValue: imageUrl };
            }

            const editUrl = `${firestoreUrl}/products/${currentEditProductId}?key=${apiKey}`;
            const response = await fetch(editUrl, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedProduct)
            });

            if (!response.ok) throw new Error('Failed to update product');

            // Update the product locally
            const index = products.findIndex(doc => doc.name.split('/').pop() === currentEditProductId);
            products[index].fields = updatedProduct.fields;

            // Refresh product display
            displayProducts();

            // Hide the modal
            document.getElementById('edit-product-modal').style.display = 'none';
        } catch (error) {
            console.error("Error updating product: ", error);
            alert('Error updating product. Please try again.');
        }
    }

    // Close the edit modal
    document.getElementById('cancel-edit').addEventListener('click', () => {
        document.getElementById('edit-product-modal').style.display = 'none';
    });

    // Save the product when the "Save" button is clicked
    document.getElementById('save-product').addEventListener('click', saveProduct);


    // Display products based on pagination
    function displayProducts() {
        readResults.innerHTML = ''; // Clear previous results

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentProducts = products.slice(startIndex, endIndex);

        if (currentProducts.length === 0) {
            readResults.textContent = "No products found.";
            return;
        }

        currentProducts.forEach((doc) => {
            const product = doc.fields || {};
            const productId = doc.name.split('/').pop();

            const title = product.Title?.stringValue || "No Title";
            const description = product.Description?.stringValue || "No Description";
            const categoryId = product.CatID?.stringValue || "No Category ID";
            const price = product.Price?.integerValue || product.Price?.doubleValue || "No Price";  // Ensure correct access
            const quantity = product.Quantity?.integerValue || "No Quantity";
            const imageUrl = product.ImageURL?.stringValue || ""; // Default to empty string if not found

            const productHtml = `
                <div class="product-item">
                    <h3 style="font-weight: bold;">${title}</h3>
                    <p><strong>Product ID:</strong> ${doc.name.split('/').pop()}</p>
                    <p><strong>Description:</strong> ${description}</p>
                    <p><strong>Category ID:</strong> ${categoryId}</p>
                    <p><strong>Price:</strong> $${price}</p>
                    <p><strong>Quantity:</strong> ${quantity}</p>
                    <img src="${imageUrl}" alt="Product Image" style="width: 100px;">
                    <div class="product-actions">
                        <button class="edit-button" data-id="${productId}">Edit</button>
                        <button class="delete-button" data-id="${productId}">Delete</button>
                    </div>
                </div>
            `;
            readResults.innerHTML += productHtml;
        });

        const deleteButtons = document.querySelectorAll('.delete-button');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const productId = event.target.getAttribute('data-id');
                deleteProduct(productId); // Call the deleteProduct function with the product ID
            });
        });

        const editButtons = document.querySelectorAll('.edit-button');
        editButtons.forEach(button => {
            button.addEventListener('click', async (event) => {
                const productId = event.target.getAttribute('data-id');
                
                if (categories.length === 0) {
                    await loadCategories(); // Load categories if they are not already loaded
                }
                
                openEditModal(productId); // Open the modal after ensuring categories are loaded
            });
        });

        // Update pagination buttons and info
        updatePagination();
    }

    // Update pagination buttons and info
    function updatePagination() {
        const totalPages = Math.ceil(products.length / itemsPerPage);
        document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages}`;

        document.getElementById('prev-page').style.display = currentPage > 1 ? 'inline-block' : 'none';
        document.getElementById('next-page').style.display = currentPage < totalPages ? 'inline-block' : 'none';
    }

    // Set items per page
    document.getElementById('set-items-per-page').addEventListener('click', () => {
        const itemsPerPageInput = document.getElementById('items-per-page').value;
        itemsPerPage = parseInt(itemsPerPageInput, 10) || 5; // Default to 5 if invalid
        currentPage = 1; // Reset to first page
        displayProducts();
    });

    // Handle previous page
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) currentPage--;
        displayProducts();
    });

    // Handle next page
    document.getElementById('next-page').addEventListener('click', () => {
        const totalPages = Math.ceil(products.length / itemsPerPage);
        if (currentPage < totalPages) currentPage++;
        displayProducts();
    });
    }

    // Function to populate categories from Firestore
    async function populateCategories() {
    try {
        const response = await fetch(`${firestoreUrl}/Category?key=${apiKey}`);
        if (!response.ok) throw new Error('Failed to fetch categories');

        const categoryData = await response.json();
        const categorySelect = document.getElementById('search-category');
        
        // Populate category options
        (categoryData.documents || []).forEach((doc) => {
            const categoryId = doc.fields.CatID?.integerValue;
            const categoryName = doc.fields.Name?.stringValue || "Unnamed Category";
            const option = document.createElement('option');
            option.value = categoryId;
            option.textContent = categoryName;
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error fetching categories: ", error);
        alert("Error loading categories. Please try again later.");
    }

    
    
    
}

// Loading indicator for async functions
async function showLoadingIndicator(callback) {
    const readResults = document.getElementById('read-results');
    readResults.innerHTML = '<p>Loading...</p>';
    await callback();
}



// loadReadFunction();
