const router = require("express").Router();
const { getAllEmployees, getUserByEmailAndPassword, addUser } = require("../controllers/userController");

router.post('/signup', addUser);
router.post('/login', getUserByEmailAndPassword);
router.get('/getAllEmployees', getAllEmployees);

module.exports = router;

