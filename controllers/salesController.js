const Order = require('../models/order');

const getSalesPage = async(req,res)=>{
    try {
        res.render('salesReport')
    } catch (error) {
        console.log(error)
    }
}

const getSalesReport = async (req, res) => {
    const { startDate, endDate } = req.query;
    console.log(startDate, endDate)
    try {
        const orders = await Order.find({
            orderDate: {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            },
            status: 'Delivered', // Assuming you want to include only delivered orders
        }).populate('products.product', 'name');

        const salesData = orders.flatMap(order => 
            order.products.map(p => ({
                date: order.orderDate,
                orderId: order.orderId,
                product: p.product.name,
                quantity: p.quantity,
                price: p.price,
                coupon: order.coupon || 'N/A',
                discount: order.discount || 0,
                total: order.total
            }))
        );

        const overallSales = orders.reduce((sum, order) => sum + order.total, 0);
        const overallOrderAmount = orders.length;
        const overallDiscount = orders.reduce((sum, order) => sum + (order.discount || 0), 0);

        res.json({ overallSales, overallOrderAmount, overallDiscount, salesData });
    } catch (error) {
        console.error('Error fetching sales data:', error);
        res.status(500).json({ message: 'Error fetching sales data', error: error.message });
    }
};

module.exports = {
    getSalesReport,
    getSalesPage
}