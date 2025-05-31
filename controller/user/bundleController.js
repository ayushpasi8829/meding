const BundleSession = require("../../models/BundleSession");
const User = require("../../models/userModel");

exports.selectBundle = async (req, res) => {
  try {
    const { bundleType, totalAmount, sessionCount } = req.body;
    const userId = req.user?.id;

    // Validate input
    if (!sessionCount || isNaN(sessionCount) || sessionCount <= 0) {
      return res.status(400).json({ message: "Invalid or missing session count" });
    }

    // Calculate installments
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
        dueSessionNumber: Math.floor(sessionCount / 3),
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

