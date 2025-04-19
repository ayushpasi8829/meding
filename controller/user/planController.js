const Plan = require("../../models/planModel");
const UserSelectedPlan = require("../../models/userSelectedPlan");
const addPlan = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required." });
    }

    const newPlan = new Plan({ title });
    await newPlan.save();

    res.status(201).json({
      message: "Plan added successfully",
      plan: newPlan,
    });
  } catch (error) {
    console.error("Error adding plan:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const selectPlan = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user?.id;
    if (!userId || !planId) {
      return res.status(400).json({
        success: false,
        message: "userId and planId are required",
      });
    }

    const existing = await UserSelectedPlan.findOne({ userId });

    if (existing) {
      existing.planId = planId;
      await existing.save();
      return res.status(200).json({
        success: true,
        message: "Plan selection updated successfully",
        data: existing,
      });
    }

    const newSelection = new UserSelectedPlan({ userId, planId });
    await newSelection.save();

    res.status(201).json({
      success: true,
      message: "Plan selected successfully",
      data: newSelection,
    });
  } catch (error) {
    console.error("Error selecting plan:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getSelectedPlan = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const selectedPlan = await UserSelectedPlan.findOne({ userId })
      .populate("planId")
      .populate("userId");

    if (!selectedPlan) {
      return res.status(404).json({
        success: false,
        message: "No selected plan found for this user",
      });
    }

    res.status(200).json({
      success: true,
      message: "Selected plan fetched successfully",
      data: selectedPlan,
    });
  } catch (error) {
    console.error("Error fetching selected plan:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getAllPlans = async (req, res) => {
  try {
    const plans = await Plan.find();

    res.status(200).json({
      success: true,
      message: "Plans fetched successfully",
      data: plans,
    });
  } catch (error) {
    console.error("Error fetching plans:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = { addPlan, selectPlan, getSelectedPlan, getAllPlans };
