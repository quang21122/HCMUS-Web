import express from 'express';
import userController from '../../controllers/userController.js';

const router = express.Router();

// Import users
router.post('/import', userController.importUsers);

// Create a new user
router.post('/', userController.createUser);

// Read a specific user by ID
router.get('/', userController.findUser);

// Update a specific user by ID
router.put('/', userController.updateUser);

// Delete a specific user by ID
router.delete('/', userController.deleteUser);

export default router;