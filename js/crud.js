const apiKey = "AIzaSyCM5Csk-fsX5pkykvImbE8Ma37op-J3z9w"; // Your Firebase API key
const projectId = "ecommerce-43f8f";
const baseFirestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/products?key=${apiKey}`;
const baseStorageUrl = `https://firebasestorage.googleapis.com/v0/b/${projectId}.appspot.com/o`;
const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

// Function to load categories from Firestore
async function populateCategories() {
    const categorySelect = document.getElementById('category');
 
    // Check if the element exists
    if (!categorySelect) {
        console.error("Category select element not found");
        return; // Exit the function if the element doesn't exist
    }

    try {
        const categoryResponse = await fetch(`${firestoreUrl}/Category?key=${apiKey}`);
        const categoryData = await categoryResponse.json();
 
        const categories = categoryData.documents || [];
        categories.forEach((doc) => {
            const categoryId = doc.fields.CatID.integerValue; // Ensure this correctly references the CatId field
            const categoryName = doc.fields.Name.stringValue;
 
            const option = document.createElement('option');
            option.value = categoryId;
            option.textContent = categoryName;
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error fetching categories: ", error);
    }
}


// Call loadCategories on page load or when needed
document.addEventListener('DOMContentLoaded', () => {
    populateCategories();
});

document.addEventListener('DOMContentLoaded', () => {
    populateCategories();

    // Assign button click events
    document.querySelector('button[onclick="create()"]').addEventListener('click', () => showSection('create'));
    document.querySelector('button[onclick="readProduct()"]').addEventListener('click', () => showSection('read'));
});

// Function to show the selected section
function showSection(section) {
    const crudContent = document.getElementById('crudContent');
    crudContent.innerHTML = '';

    let isReadLoaded = false; // Flag to ensure read.js is loaded only once
    let readModule = null; // Store the loaded module

    switch (section) {
        case 'create':
            crudContent.innerHTML = `
                <h2>Create Item</h2>
                <form id="createForm">
                    <label for="title">Title:</label>
                    <input type="text" id="title" required><br><br>
                    <label for="category">Category:</label>
                    <select id="category" required>
                        <option value="">Select category</option>
                    </select><br><br>
                    <label for="price">Price:</label>
                    <input type="number" id="price" required><br><br>
                    <label for="quantity">Quantity:</label>
                    <input type="number" id="quantity" required><br><br>
                    <label for="description">Description:</label>
                    <textarea id="description" required></textarea><br><br>
                    <label for="imageFile">Image:</label>
                    <input type="file" id="imageFile" required /><br><br>
                    <button type="submit">Create</button>
                </form>
            `; 
            
            populateCategories();// Load categories when the create section is shown
            
            document.getElementById('createForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                await createProduct();
            });
            break;

        case 'read' :
            if (!isReadLoaded) {
                import('./read.js')
                    .then(module => {
                        // Store the loaded module in a global variable
                        readModule = module;
    
                        // Call the function after ensuring read.js is loaded
                        if (readModule && typeof readModule.loadReadFunction === 'function') {
                            readModule.loadReadFunction(); // Initialize read section
                            isReadLoaded = true; // Set flag to avoid re-loading
                        } else {
                            console.error('loadReadFunction is not defined in read.js');
                        }
                    })
                    .catch(err => {
                        console.error("Failed to load read.js", err);
                    });
            } else if (readModule && typeof readModule.loadReadFunction === 'function') {
                // Call the function if it's already loaded
                readModule.loadReadFunction();
            }
            break;
    
    }
}

async function getNextDocumentID() {
    try {
        const response = await fetch(`${firestoreUrl}/products?key=${apiKey}`);
        const productData = await response.json();
        const documents = productData.documents || [];

        if (documents.length === 0) {
            return 1; // If no documents exist, start with ID 1
        }

        // Get the highest numeric ID
        const lastId = Math.max(...documents.map(doc => parseInt(doc.name.split('/').pop())));
        return lastId + 1; // Increment for the next ID
    } catch (error) {
        console.error("Error fetching document IDs: ", error);
        return 1; // Fallback in case of error
    }
}

// Function to handle the creation of a new product
async function createProduct() {

    const title = document.getElementById('title').value;
    const selectedCategoryId = document.getElementById('category').value; // Get category ID directly
    const price = parseFloat(document.getElementById('price').value);
    const quantity = parseInt(document.getElementById('quantity').value);
    const description = document.getElementById('description').value;
    const imageFile = document.getElementById('imageFile').files[0];

    console.log("Creating product with Category ID:", selectedCategoryId);

    try {
        // Upload the image to Firebase Storage
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

        // Prepare the product data with Category ID
        const productData = {
            fields: {
                Title: { stringValue: title },
                CatID: { stringValue: selectedCategoryId }, // Directly using the selected category ID
                Price: { doubleValue: price },
                Quantity: { integerValue: quantity },
                Description: { stringValue: description },
                ImageURL: { stringValue: imageUrl }
            }
        };

        const nextId = await getNextDocumentID();
        const newProductUrl = `${firestoreUrl}/products/${nextId}`;

        // Save the product data to Firestore
        await fetch(newProductUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });

        alert('Product saved successfully');
        document.getElementById('createForm').reset();
    } catch (error) {
        console.error("Error saving product:", error);
        alert("Error saving product");
    }
}

window.onload = populateCategories;

// Function to fetch inventory and display it in the table
