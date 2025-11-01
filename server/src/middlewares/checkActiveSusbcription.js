const { Subscription } = require("../models");

const checkActiveSubscription = async (userId) => {
    const subscription = await Subscription.findOne({
        where: { userId, status: 'active', endDate: { [Op.gte]: new Date() } }
    });
    if(!subscription) throw new Error("Access Denied");
    return subscription;
};

module.exports = { checkActiveSubscription };