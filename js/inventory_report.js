const API_KEY = "AIzaSyCM5Csk-fsX5pkykvImbE8Ma37op-J3z9w"; 
const PROJECT_ID = "ecommerce-43f8f";  
const PRODUCTS_COLLECTION_ID = "products";
const CATEGORIES_COLLECTION_ID = "Category";

// Fetch the inventory data (products)
async function fetchInventoryData() {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${PRODUCTS_COLLECTION_ID}?key=${API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.documents) {
            return data.documents.map(doc => {
                const fields = doc.fields;
                return {
                    title: fields.Title.stringValue,
                    catId: fields.CatID.stringValue || fields.CatID.integerValue,
                    quantity: fields.Quantity.integerValue,
                    price: fields.Price.doubleValue,
                    description: fields.Description.stringValue,
                    imageUrl: fields.ImageURL.stringValue
                };
            });
        }
    } catch (error) {
        console.error('Error fetching inventory data:', error);
    }
    return [];
}

// Fetch the category data
async function fetchCategoryData() {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${CATEGORIES_COLLECTION_ID}?key=${API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.documents) {
            return data.documents.reduce((map, doc) => {
                const fields = doc.fields;
                map[fields.CatID.integerValue] = fields.Name.stringValue;
                return map;
            }, {});
        }
    } catch (error) {
        console.error('Error fetching category data:', error);
    }
    return {};
}

// Map CatID to Category Name
async function mapProductsToCategories(products) {
    const categories = await fetchCategoryData();
    return products.map(product => ({
        ...product,
        categoryName: categories[product.catId] || 'Unknown Category'
    }));
}

function convertToCSV(data) {
    const header = ['Title', 'Category Name', 'Quantity', 'Price', 'Description', 'ImageURL'];
    const rows = data.map(item => [item.title, item.categoryName, item.quantity, item.price, item.description, item.imageUrl]);
    return [header, ...rows].map(e => e.join(",")).join("\n");
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    a.click();
}

async function downloadCurrentStock(type) {
    const inventory = await fetchInventoryData();
    const productsWithCategories = await mapProductsToCategories(inventory);

    if (type === 'category') {
        const categories = productsWithCategories.reduce((acc, item) => {
            if (!acc[item.categoryName]) acc[item.categoryName] = [];
            acc[item.categoryName].push(item);
            return acc;
        }, {});

        for (const category in categories) {
            const csvContent = convertToCSV(categories[category]);
            downloadCSV(csvContent, `${category}_inventory.csv`);
        }
    } else {
        const csvContent = convertToCSV(productsWithCategories);
        downloadCSV(csvContent, 'all_inventory.csv');
    }
}

async function downloadStockReport(type) {
    const inventory = await fetchInventoryData();
    const productsWithCategories = await mapProductsToCategories(inventory);
    let filteredInventory;

    if (type === 'high') {
        filteredInventory = productsWithCategories.filter(item => item.quantity > 100);
    } else {
        filteredInventory = productsWithCategories.filter(item => item.quantity < 15);
    }

    const csvContent = convertToCSV(filteredInventory);
    const filename = type === 'high' ? 'high_stock_inventory.csv' : 'low_stock_inventory.csv';
    downloadCSV(csvContent, filename);
}
