import Income from "../models/Income.js";

// ✅ Add new income
export const addIncome = async (req, res) => {
  try {
    const { title, amount, category, date, description } = req.body;

    const income = await Income.create({
      user: req.user.id,
      title,
      amount,
      category,
      date,
      description,
    });

    res.status(201).json(income);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get all incomes for logged-in user
export const getIncomes = async (req, res) => {
  try {
    const incomes = await Income.find({ user: req.user.id }).sort({
      createdAt: -1,
    });
    res.status(200).json(incomes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Summary (total income)
export const getIncomeSummary = async (req, res) => {
  try {
    const incomes = await Income.find({ user: req.user.id });
    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    res.status(200).json({ totalIncome });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
