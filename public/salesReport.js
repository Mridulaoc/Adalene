document.addEventListener('DOMContentLoaded', function() {
  const dateRangeDropdown = document.getElementById('dateRangeDropdown');
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  const fetchSalesDataBtn = document.getElementById('fetchSalesDataBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');

  dateRangeDropdown.addEventListener('change', function() {
      const today = new Date();
      let startDate = new Date();

      switch(this.value) {
          case '1day':
              startDate.setDate(today.getDate() - 1);
              break;
          case '1week':
              startDate.setDate(today.getDate() - 7);
              break;
          case '1month':
              startDate.setMonth(today.getMonth() - 1);
              break;
          case '1year':
              startDate.setFullYear(today.getFullYear() - 1);
              break;
      }

      startDateInput.value = startDate.toISOString().split('T')[0];
      endDateInput.value = today.toISOString().split('T')[0];
  });

  fetchSalesDataBtn.addEventListener('click', fetchSalesData);
  exportCsvBtn.addEventListener('click', exportCsv);
});

async function fetchSalesData() {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;

  if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
  }

  try {
      const response = await axios.get(`/salesReport?startDate=${startDate}&endDate=${endDate}`);
      const { salesReport, overallSales, overallOrderAmount, overallDiscount } = response.data;

      // Update summary
      document.getElementById('overallSales').textContent = `Overall Sales: $${overallSales.toFixed(2)}`;
      document.getElementById('overallOrderAmount').textContent = `Overall Order Amount: ${overallOrderAmount}`;
      document.getElementById('overallDiscount').textContent = `Overall Discount: $${overallDiscount.toFixed(2)}`;

      // Update table
      const tableBody = document.getElementById('salesDataTableBody');
      tableBody.innerHTML = '';
      salesReport.forEach(order => {
          const row = `
              <tr>
                  <td>${new Date(order.date).toLocaleDateString()}</td>
                  <td>${order.orderId}</td>
                  <td>${order.products}</td>
                  <td>${order.quantity}</td>
                  <td>${order.coupon}</td>
                  <td>$${order.discount.toFixed(2)}</td>
                  <td>$${order.total.toFixed(2)}</td>
              </tr>
          `;
          tableBody.innerHTML += row;
      });

      // Show the table, statistics, and export button
      document.getElementById('statistics').style.display = 'block';
      document.getElementById('salesTable').style.display = 'table';
      document.getElementById('exportCsvBtn').style.display = 'inline-block';
  } catch (error) {
      console.error('Error fetching sales data:', error);
      alert('An error occurred while fetching sales data');
  }
}

function exportCsv() {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  window.location.href = `/export-sales-report?startDate=${startDate}&endDate=${endDate}`;
}