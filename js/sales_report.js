const API_KEY = "AIzaSyCM5Csk-fsX5pkykvImbE8Ma37op-J3z9w"; 
const PROJECT_ID = "ecommerce-43f8f";  
const ORDERS_COLLECTION_ID = "orders";
const CATEGORIES_COLLECTION_ID = "categories";

// Fetch the sales data (orders)
async function fetchSalesData() {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${ORDERS_COLLECTION_ID}?key=${API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.documents) {
            return data.documents.map(doc => {
                const fields = doc.fields;
                return {
                    orderId: fields.orderId.stringValue,
                    userId: fields.userId.stringValue,
                    date: new Date(fields.date.stringValue),
                    paymentMethod: fields.paymentMethod.stringValue,
                    items: fields.items.arrayValue.values.map(item => ({
                        name: item.mapValue.fields.name.stringValue,
                        quantity: item.mapValue.fields.quantity.integerValue,
                        price: item.mapValue.fields.price.doubleValue,
                        productId: item.mapValue.fields.productId.stringValue
                    }))
                };
            });
        }
    } catch (error) {
        console.error('Error fetching sales data:', error);
    }
    return [];
}

// Fetch the category data to map product to category
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

// Helper function to convert data to CSV format
function convertToCSV(data) {
    const header = Object.keys(data[0]).join(",");
    const rows = data.map(item => Object.values(item).join(","));
    return [header, ...rows].join("\n");
}

// Helper function to download CSV
function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    a.click();
}

// Function to filter sales by date range
function filterSalesByDate(sales, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return sales.filter(sale => sale.date >= start && sale.date <= end);
}

// Generate CSV report for all sales
async function downloadAllSalesReport(startDate, endDate) {
    const sales = await fetchSalesData();
    const filteredSales = filterSalesByDate(sales, startDate, endDate);

    const salesData = filteredSales.map(sale => ({
        orderId: sale.orderId,
        userId: sale.userId,
        date: sale.date.toISOString(),
        paymentMethod: sale.paymentMethod,
        totalItems: sale.items.length,
        totalAmount: sale.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    }));

    const csvContent = convertToCSV(salesData);
    downloadCSV(csvContent, 'all_sales_report.csv');
}

// Generate category-wise sales report
async function downloadCategoryWiseSalesReport(startDate, endDate) {
    const sales = await fetchSalesData();
    const categories = await fetchCategoryData();
    const filteredSales = filterSalesByDate(sales, startDate, endDate);

    const categorySales = {};
    filteredSales.forEach(sale => {
        sale.items.forEach(item => {
            const category = categories[item.productId.split('_')[0]] || 'Unknown';
            if (!categorySales[category]) categorySales[category] = 0;
            categorySales[category] += item.price * item.quantity;
        });
    });

    const salesData = Object.keys(categorySales).map(category => ({
        category,
        totalSales: categorySales[category]
    }));

    const csvContent = convertToCSV(salesData);
    downloadCSV(csvContent, 'category_sales_report.csv');
}

// Generate CSV report for cash or credit purchases
async function downloadPaymentWiseSalesReport(startDate, endDate, paymentMethod) {
    const sales = await fetchSalesData();
    const filteredSales = filterSalesByDate(sales, startDate, endDate).filter(sale => sale.paymentMethod === paymentMethod);

    const salesData = filteredSales.map(sale => ({
        orderId: sale.orderId,
        userId: sale.userId,
        date: sale.date.toISOString(),
        totalItems: sale.items.length,
        totalAmount: sale.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    }));

    const csvContent = convertToCSV(salesData);
    const filename = paymentMethod === 'cash-on-delivery' ? 'cash_sales_report.csv' : 'credit_sales_report.csv';
    downloadCSV(csvContent, filename);
}

// Generate CSV for top 10 and bottom 10 selling items
async function downloadTopBottomSalesReport(startDate, endDate, type) {
    const sales = await fetchSalesData();
    const filteredSales = filterSalesByDate(sales, startDate, endDate);

    const productSales = {};
    filteredSales.forEach(sale => {
        sale.items.forEach(item => {
            if (!productSales[item.name]) productSales[item.name] = 0;
            productSales[item.name] += item.quantity;
        });
    });

    const sortedSales = Object.entries(productSales).sort((a, b) => type === 'top' ? b[1] - a[1] : a[1] - b[1]);
    const limitedSales = sortedSales.slice(0, 10).map(([name, quantity]) => ({ name, quantity }));

    const csvContent = convertToCSV(limitedSales);
    const filename = type === 'top' ? 'top_10_sales_report.csv' : 'bottom_10_sales_report.csv';
    downloadCSV(csvContent, filename);
}
