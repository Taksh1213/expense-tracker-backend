import { Expense } from "../models/Expense.js";
import { User } from "../models/Users.js";
import Income from "../models/Income.js";

// ✅ Get all expenses of the logged-in user
export const getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Add expense
export const addExpense = async (req, res) => {
  try {
    const { title, amount, category, date, description } = req.body;

    const expense = new Expense({
      user: req.user._id,
      title,
      amount,
      category,
      date,
      description,
    });

    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    console.error("Error adding expense:", error);
    res.status(400).json({ message: error.message });
  }
};

// ✅ Delete expense
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!expense) return res.status(404).json({ message: "Expense not found" });

    res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Update expense
export const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense)
      return res.status(404).json({ message: "Expense not found" });

    if (expense.user.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });

    const { title, category, amount, date, description } = req.body;

    expense.title = title || expense.title;
    expense.category = category || expense.category;
    expense.amount = amount || expense.amount;
    expense.date = date || expense.date;
    expense.description = description || expense.description;

    const updatedExpense = await expense.save();
    res.status(200).json(updatedExpense);
  } catch (err) {
    console.error("Error updating expense:", err);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Summary route (total income, total expenses, balance)
export const getSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch all expenses and incomes for this user
    const expenses = await Expense.find({ user: userId });
    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

    const incomes = await Income.find({ user: userId });
    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);

    res.json({
      income: totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    });
  } catch (err) {
    console.error("Summary fetch error:", err);
    res.status(500).json({ message: "Error generating summary" });
  }
};

// ✅ Recent transactions
export const getRecentExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json(expenses);
  } catch (error) {
    console.error("Error fetching recent expenses:", error);
    res.status(500).json({ message: "Failed to fetch recent expenses" });
  }
};

// ✅ Category breakdown (for pie chart)
export const getCategoryBreakdown = async (req, res) => {
  try {
    const expenses = await Expense.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
    ]);
    res.status(200).json(expenses);
  } catch (error) {
    console.error("Error aggregating categories:", error);
    res.status(500).json({ message: "Error fetching category breakdown" });
  }
};

// ✅ Get single expense by ID
export const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    // Ensure the expense belongs to the logged-in user
    if (expense.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.status(200).json(expense);
  } catch (error) {
    console.error("Error fetching expense:", error);
    res.status(500).json({ message: "Server error while fetching expense" });
  }
};
