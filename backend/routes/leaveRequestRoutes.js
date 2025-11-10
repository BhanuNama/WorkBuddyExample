const router = require("express").Router();
const { getAllLeaveRequests, getLeaveRequestById, addLeaveRequest, updateLeaveRequest, getLeaveRequestsByUserId, deleteLeaveRequest } = require('../controllers/leaveRequestController');

router.post('/getAllLeaveRequests', getAllLeaveRequests);
router.get('/getLeaveRequestById/:id', getLeaveRequestById);
router.post('/addLeaveRequest', addLeaveRequest);
router.put('/updateLeaveRequest/:id', updateLeaveRequest);
router.get('/getLeaveRequestsByUserId/:userId', getLeaveRequestsByUserId);
router.delete('/deleteLeaveRequest/:id', deleteLeaveRequest);

module.exports = router;

