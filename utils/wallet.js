document.addEventListener("DOMContentLoaded", () => {
  fetchWalletBalance();
  fetchTransactions();
});

function fetchWalletBalance() {
  fetch("/my-wallet/balance")
    .then((response) => response.json())
    .then((data) => {
      document.getElementById("walletBalance").textContent =
        data.balance.toFixed(2);
    })
    .catch((error) => console.error("Error:", error));
}

function fetchTransactions() {
  fetch("/my-wallet/transactions")
    .then((response) => response.json())
    .then((data) => {
      const transactionBody = document.getElementById("transactionBody");
      transactionBody.innerHTML = "";
      data.transactions.forEach((transaction) => {
        const row = `
                    <tr>
                        <td>${new Date(
                          transaction.date
                        ).toLocaleDateString()}</td>
                        <td>${transaction.type}</td>
                        <td>₹${transaction.amount.toFixed(2)}</td>
                        <td>${transaction.description}</td>
                    </tr>
                `;
        transactionBody.innerHTML += row;
      });
    })
    .catch((error) => console.error("Error:", error));
}
