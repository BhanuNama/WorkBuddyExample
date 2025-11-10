const User = require('../models/userModel');
const { generateToken } = require("../authUtils");

const getUserByEmailAndPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = generateToken(user._id);
    const { userName, role, _id } = user;
    res.status(200).json({ userName, role, token, id: _id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

const addUser = async (req, res) => {
  try {
    await User.create(req.body);
    res.status(200).json({ message: 'Success' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

const getAllEmployees = async (_req, res) => {
  try {
    const users = await User.find({ role: "Employee" });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = { getUserByEmailAndPassword, addUser, getAllEmployees };

