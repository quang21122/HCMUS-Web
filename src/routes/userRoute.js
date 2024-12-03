import userController from '../controllers/userController.js';

const handler = async (req, res) => {
    if (req.url.startsWith('/import') && req.method === 'POST') {
        return userController.importUsers(req, res);
    }
    
    if (req.method === 'POST') {
        return userController.createUser(req, res);
    }

    if (req.method === 'GET') {
        return userController.findUser(req, res);
    }

    if (req.method === 'PUT') {
        return userController.updateUser(req, res);
    }

    if (req.method === 'DELETE') {
        return userController.deleteUser(req, res);
    }
}

export default handler;