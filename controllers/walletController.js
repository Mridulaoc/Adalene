const Wallet = require("../models/wallet");
const User = require("../models/user");

const getWalletBalance = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ user: req.user.id });
    
    if (!wallet) {
      wallet = new Wallet({ user: req.user.id });
      await wallet.save();
    }
    res.json({ balance: wallet.balance });
  } catch (error) {
    res.status(500).json({ error: "Error fetching wallet balance" });
  }
};

const getWalletTransactions = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user.id });
    if (wallet) {
        wallet.transactions.sort((a, b) => b.date - a.date);
      }
    res.json({ transactions: wallet ? wallet.transactions : [] });
  } catch (error) {
    res.status(500).json({ error: "Error fetching wallet transactions" });
  }
};

const addToWallet = async (userId, amount, description) => {
  try {
    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      wallet = new Wallet({ user: userId });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) {
      throw new Error('Invalid amount: must be a valid number');
    }

    wallet.balance = Number(wallet.balance) + numericAmount;
   
    wallet.transactions.push({
      type: "CREDIT",
      amount:numericAmount,
      description,
    });
    await wallet.save();
    return wallet;
  } catch (error) {
    console.error("Error adding to wallet:", error);
    throw error;
  }
};

const loadMyWallet = async (req,res)=>{
    try {
        res.render('userWallet',{user:req.user})
    } catch (error) {
        console.log(error)
    }
}


const processWalletPayment = async (req, res) => {

}

module.exports = {
  getWalletBalance,
  getWalletTransactions,
  addToWallet,
  loadMyWallet
};
