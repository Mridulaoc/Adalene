document.addEventListener("DOMContentLoaded", () => {
  const dateRangeDropdown = document.getElementById("dateRangeDropdown");
  const fetchSalesDataBtn = document.getElementById("fetchSalesDataBtn");
  const exportCsvBtn = document.getElementById("exportCsvBtn");
  const salesDataTableBody = document.getElementById("salesDataTableBody");
  const overallSalesElem = document.getElementById("overallSales");
  const overallOrderAmountElem = document.getElementById("overallOrderAmount");
  const overallDiscountElem = document.getElementById("overallDiscount");

  const dateRanges = {
    "1day": {
      startDate: new Date(new Date().setDate(new Date().getDate() - 1)),
      endDate: new Date(),
    },
    "1week": {
      startDate: new Date(new Date().setDate(new Date().getDate() - 7)),
      endDate: new Date(),
    },
    "1month": {
      startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      endDate: new Date(),
    },
    "1year": {
      startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
      endDate: new Date(),
    },
  };

  async function fetchSalesData(dateRange) {
    try {
      const response = await fetch(
        `admin/salesReport?startDate=${dateRange.startDate.toISOString()}&endDate=${dateRange.endDate.toISOString()}`
      );
      console.log("Fetching from URL:", response);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching sales data:", error);
      alert(
        "There was an error fetching the sales data. Please try again later."
      );
      throw error;
    }
  }

  function populateSalesTable(data) {
    salesDataTableBody.innerHTML = "";

    data.salesData.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
<td>${new Date(row.date).toLocaleDateString()}</td>
<td>${row.orderId}</td>
<td>${row.product}</td>
<td>${row.quantity}</td>
<td>${row.coupon}</td>
<td>$${row.discount.toFixed(2)}</td>
<td>$${row.total.toFixed(2)}</td>
`;
      salesDataTableBody.appendChild(tr);
    });

    // Update overall statistics
    overallSalesElem.textContent = `Overall Sales: $${data.overallSales.toFixed(
      2
    )}`;
    overallOrderAmountElem.textContent = `Overall Order Amount: ${data.overallOrderAmount}`;
    overallDiscountElem.textContent = `Overall Discount: $${data.overallDiscount.toFixed(
      2
    )}`;
  }

  function exportToCSV(data) {
    const headers = [
      "Date",
      "Order ID",
      "Product",
      "Quantity",
      "Coupon",
      "Discount",
      "Total",
    ];
    const csvRows = [headers.join(",")];

    data.salesData.forEach((row) => {
      const values = [
        new Date(row.date).toLocaleDateString(),
        row.orderId,
        row.product,
        row.quantity,
        row.coupon,
        row.discount.toFixed(2),
        row.total.toFixed(2),
      ];
      csvRows.push(values.join(","));
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", "sales_report.csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  fetchSalesDataBtn.addEventListener("click", async () => {
    const selectedRange = dateRangeDropdown.value;
    const dateRange = dateRanges[selectedRange];
    const data = await fetchSalesData(dateRange);
    populateSalesTable(data);
  });

  exportCsvBtn.addEventListener("click", async () => {
    const selectedRange = dateRangeDropdown.value;
    const dateRange = dateRanges[selectedRange];
    const data = await fetchSalesData(dateRange);
    exportToCSV(data);
  });
});
