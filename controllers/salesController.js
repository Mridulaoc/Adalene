const Order = require("../models/order");
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { CURSOR_FLAGS } = require("mongodb");

const getSalesReportPage = async (req, res) => {
  try {
    res.render("salesReport");
  } catch (error) {
    console.log(error);
  }
};


  const getSalesReport = async (req, res) => {
    try {
      const { startDate, endDate, page = 1, limit = 10 } = req.query;
      console.log(startDate)
      console.log(endDate)
  
      if (!startDate || !endDate) {
        return res
          .status(400)
          .json({ error: "Start date and end date are required" });
      }
  
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Set to end of day
      console.log(start)
      console.log(end)
  
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: "Invalid date format" });
      }
  
      const orders = await Order.find({
        orderDate: { $gte: start, $lte: end },
        status: "Delivered",
      })
        .populate("products.product")
        .sort({ orderDate: -1 })
        .skip((page-1)*limit)
        .limit(limit *1)
  
      const salesReport = orders.map((order) => ({
        date: order.orderDate,
        orderId: order.orderId,
        products: order.products.map(
          (p) => `${p.product.prod_name} (${p.quantity})`
        ),
        quantity: order.products.reduce((sum, p) => sum + p.quantity, 0),
        coupon: order.coupon || "Not Applied",
        discount: order.averageDiscountPercentage || 0,
        total: order.total,
      }));
  
      const overallSales = orders.reduce((sum, order) => sum + order.total, 0);
      const totalOrders = await Order.find({
        orderDate: { $gte: start, $lte: end },
        status: "Delivered",
      }).countDocuments();
      const overallDiscount = (orders.reduce(
        (sum, order) => sum + (order.averageDiscountPercentage || 0),
        0
      )/totalOrders).toFixed(2);
  
      res.json({
        salesReport,
        overallSales,
        totalOrders,
        overallDiscount,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalOrders / limit),
        
      });
    } catch (error) {
      console.error("Error in sales report:", error);
      res
        .status(500)
        .json({ error: "An error occurred while fetching sales data" });
    }
  };



const downloadPDFReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const salesData = await fetchSalesData(startDate, endDate);

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=sales_report_${startDate}_to_${endDate}.pdf`
    );

    doc.pipe(res);

    doc.fontSize(18).text("Sales Report", { align: "center" });
    doc.moveDown();
    doc
      .fontSize(12)
      .text(`From: ${startDate} To: ${endDate}`, { align: "center" });
    doc.moveDown();

    // Add summary
    doc.fontSize(14).text("Summary");
    doc
      .fontSize(12)
      .text(`Overall Sales: ₹ ${salesData.overallSales.toFixed(2)}`);
    doc.text(`Overall Order Count: ${salesData.totalOrders}`);
    doc.text(`Overall Discount: ${salesData.overallDiscount.toFixed(2)}%`);
    doc.moveDown();

    // Add table
    const tableTop = 200;
    const tableLeft = 50;
    const rowHeight = 30;
    const colWidths = [80, 80, 150, 50, 50, 50, 50];

    doc.fontSize(10);

    // Table headers
    const headers = [
      "Date",
      "Order ID",
      "Products",
      "Quantity",
      "Coupon",
      "Discount",
      "Total",
    ];
    headers.forEach((header, i) => {
      doc.text(
        header,
        tableLeft + colWidths.slice(0, i).reduce((a, b) => a + b, 0),
        tableTop
      );
    });

    // Table rows
    salesData.salesReport.forEach((order, index) => {
      const y = tableTop + rowHeight * (index + 1);
      doc.text(new Date(order.date).toLocaleDateString(), tableLeft, y);
      doc.text(order.orderId, tableLeft + colWidths[0], y);
      doc.text(order.products, tableLeft + colWidths[0] + colWidths[1], y, {
        width: colWidths[2],
      });
      doc.text(
        order.quantity.toString(),
        tableLeft + colWidths[0] + colWidths[1] + colWidths[2],
        y
      );
      doc.text(
        order.coupon,
        tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
        y
      );
      doc.text(
        `${order.discount.toFixed(2)}%`,
        tableLeft +
          colWidths[0] +
          colWidths[1] +
          colWidths[2] +
          colWidths[3] +
          colWidths[4],
        y
      );
      doc.text(
        `₹${order.total.toFixed(2)}`,
        tableLeft +
          colWidths[0] +
          colWidths[1] +
          colWidths[2] +
          colWidths[3] +
          colWidths[4] +
          colWidths[5],
        y
      );

      if (y > doc.page.height - 100) {
        doc.addPage();
        doc.fontSize(10);
        headers.forEach((header, i) => {
          doc.text(
            header,
            tableLeft + colWidths.slice(0, i).reduce((a, b) => a + b, 0),
            tableTop
          );
        });
      }
    });

    doc.end();
  } catch (error) {
    console.error("Error in PDF generation:", error);
    res
      .status(500)
      .json({ error: "An error occurred while generating the PDF" });
  }
};
async function fetchSalesData(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const orders = await Order.find({
    orderDate: { $gte: start, $lte: end },
    status: "Delivered",
  }).populate("products.product");

  const salesReport = orders.map((order) => ({
    date: order.orderDate,
    orderId: order.orderId,
    products: order.products
      .map((p) => `${p.product.prod_name} (${p.quantity})`)
      .join(", "),
    quantity: order.products.reduce((sum, p) => sum + p.quantity, 0),
    coupon: order.coupon || "Not Applied",
    discount: order.averageDiscountPercentage || 0,
    total: order.total,
  }));

  const overallSales = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = await Order.find({
    orderDate: { $gte: start, $lte: end },
    status: "Delivered",
  }).countDocuments();
  const overallDiscount = orders.reduce(
    (sum, order) => sum + (order.averageDiscountPercentage || 0),0)/totalOrders;

  return {
    salesReport,
    overallSales,
    totalOrders,
    overallDiscount,
  };
}
const downloadExcelReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const salesData = await fetchSalesData(startDate, endDate);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report");

    worksheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Order ID", key: "orderId", width: 15 },
      { header: "Products", key: "products", width: 30 },
      { header: "Quantity", key: "quantity", width: 10 },
      { header: "Coupon", key: "coupon", width: 15 },
      { header: "Discount", key: "discount", width: 15 },
      { header: "Total", key: "total", width: 15 },
    ];

    // Add summary
    worksheet.addRow(["Summary"]);
    worksheet.addRow([
      "Overall Sales",
      `₹${salesData.overallSales.toFixed(2)}`,
    ]);
    worksheet.addRow(["Overall Order Amount", salesData.totalOrders]);
    worksheet.addRow([
      "Overall Discount",
      `${salesData.overallDiscount.toFixed(2)}`,
    ]);
    worksheet.addRow([]);

    // Add sales data
    salesData.salesReport.forEach((order) => {
      worksheet.addRow({
        date: new Date(order.date).toLocaleDateString(),
        orderId: order.orderId,
        products: order.products,
        quantity: order.quantity,
        coupon: order.coupon,
        discount: `${order.discount.toFixed(2)}%`,
        total: `₹${order.total.toFixed(2)}`,
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=sales_report_${startDate}_to_${endDate}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error in Excel generation:", error);
    res
      .status(500)
      .json({ error: "An error occurred while generating the Excel file" });
  }
};

module.exports = {
  getSalesReportPage,
  getSalesReport,
  downloadPDFReport,
  downloadExcelReport,
};
