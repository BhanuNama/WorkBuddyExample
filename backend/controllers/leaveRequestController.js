const LeaveRequest = require('../models/leaveRequestModel');

const getAllLeaveRequests = async (req, res) => {
  try {
    const { page = 1, pageSize = 5, searchValue = '', sortValue = 'asc', statusFilter, sortBy = 'createdOn' } = req.body;

    const query = {};
    if (searchValue) query.reason = { $regex: searchValue, $options: 'i' };
    if (statusFilter) query.status = statusFilter;

    const skip = (page - 1) * pageSize;
    const sortOrder = sortValue === 'asc' ? 1 : -1;

    const data = await LeaveRequest.find(query)
      .populate('userId', 'userName email mobile role')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(pageSize);

    const total = await LeaveRequest.countDocuments(query);

    res.status(200).json({ data, total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLeaveRequestById = async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id)
      .populate('userId', 'userName email mobile role');
    if (!leaveRequest) return res.status(404).json({ message: 'Leave Request Not Found' });
    res.status(200).json(leaveRequest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addLeaveRequest = async (req, res) => {
  try {
    await LeaveRequest.create(req.body);
    res.status(200).json({ message: 'Leave Request Added Successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateLeaveRequest = async (req, res) => {
  try {
    const updatedLeaveRequest = await LeaveRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedLeaveRequest) return res.status(404).json({ message: 'Leave Request Not Found' });
    res.status(200).json({ message: 'Leave Request Updated Successfully', leaveRequest: updatedLeaveRequest });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLeaveRequestsByUserId = async (req, res) => {
  try {
    const leaveRequests = await LeaveRequest.find({ userId: req.params.userId })
      .populate('userId', 'userName email mobile role');
    res.status(200).json(leaveRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteLeaveRequest = async (req, res) => {
  try {
    const deletedLeaveRequest = await LeaveRequest.findByIdAndDelete(req.params.id);
    if (!deletedLeaveRequest) return res.status(404).json({ message: 'Leave Request Not Found' });
    res.status(200).json({ message: 'Leave Request Deleted Successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAllLeaveRequests, getLeaveRequestById, addLeaveRequest, updateLeaveRequest, getLeaveRequestsByUserId, deleteLeaveRequest };

