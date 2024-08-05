// controllers/adminController.js
const User = require('../models/user');
const Referral = require('../models/referral');
const { get } = require('express/lib/response');

const getReferralList= async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const usersWithReferrals = await User.countDocuments({ 'referrals.0': { $exists: true } });
    const totalReferrals = await User.aggregate([
      { $project: { referralCount: { $size: '$referrals' } } },
      { $group: { _id: null, total: { $sum: '$referralCount' } } }
    ]);
    
    const topReferrers = await User.aggregate([
      { $project: { user_email: 1, user_name: 1, referralCount: { $size: '$referrals' } } },
      { $sort: { referralCount: -1 } },
      
    ]);

    const recentReferrals = await User.find({ referredBy: { $ne: null } })
      .populate('referredBy', 'user_email user_name')
      .sort('-created_on')
      .limit(20);

    const referrals = await Referral.findOne();

    res.render('admin/referralDashboard', {
      totalUsers,
      usersWithReferrals,
      totalReferrals: totalReferrals[0]?.total || 0,
      topReferrers,
      recentReferrals,
      currentNewUserReward: referrals?.referralProgram?.newUserReward || 100,
      currentReferrerReward: referrals?.referralProgram?.referrerReward || 200
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};

const getupdateReferralRewards = async (req,res)=>{
    try {
        res.render('updateRewards');
    } catch (error) {
        console.log(error);
    }
}

const updateReferralRewards = async (req, res) => {
  try {
    const { newUserReward, referrerReward } = req.body;
    
    await Referral.findOneAndUpdate({}, {
      'referralProgram.newUserReward': newUserReward,
      'referralProgram.referrerReward': referrerReward
    }, { upsert: true });

    res.redirect('/admin/referralOffer/update-rewards');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};

module.exports ={
    getReferralList,
    getupdateReferralRewards,
    updateReferralRewards

}