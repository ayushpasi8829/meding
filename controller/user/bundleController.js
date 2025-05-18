const BundleSession = require("../../models/BundleSession");
const User = require("../../models/userModel");

exports.selectBundle = async (req, res) => {
  try {
    const { bundleType, totalAmount } = req.body;
    const userId = req.user?.id;

    // Validate and map session count
    let sessionCount = 5;
    // if (bundleType === "3-sessions") sessionCount = 3;
    // else if (bundleType === "5-sessions") sessionCount = 5;
    // else if (bundleType === "10-sessions") sessionCount = 10;
    // else return res.status(400).json({ message: "Invalid bundle type" });


    const installmentAmount = Math.ceil(totalAmount / 3);
    const remainingAmount = totalAmount - installmentAmount * 2;

    const installments = [
      {
        amount: installmentAmount,
        status: "pending",
        dueSessionNumber: 0,
      },
      {
        amount: installmentAmount,
        status: "pending",
        dueSessionNumber: 2,
      },
      {
        amount: remainingAmount,
        status: "pending",
        dueSessionNumber: sessionCount - 1,
      },
    ];

    const bundle = await BundleSession.create({
      user: userId,
      bundleType,
      totalSessions: sessionCount,
      usedSessions: 0,
      paymentPlan: {
        totalAmount,
        paidAmount: 0,
        installments,
      },
    });

    await User.findByIdAndUpdate(userId, { hasActiveBundle: true });

    return res.status(201).json({
      message: "Bundle created. First installment pending.",
      bundleId: bundle._id,
      firstInstallmentAmount: installmentAmount,
      totalSessions: sessionCount,
    });
  } catch (error) {
    console.error("Error selecting bundle:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

