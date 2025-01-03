import userService from "../services/userService.js";

const findUser = async (req, res) => {
  try {
    const id = req.query._id;

    // Kiểm tra nếu không có _id trong query
    if (!id) {
      return res.status(400).json({ error: "Missing _id parameter" });
    }
    const user = await userService.findUser(id);

    if (user.error) {
      return res.status(user.status).json(user.error);
    }

    return res.status(200).json({
      data: user,
    });
  } catch (err) {
    return res.status(400).json({
      message: err.message,
    });
  }
};

const createUser = async (req, res) => {
  try {
    const data = req.body;

    // Check if the request is for an array of articles
    if (Array.isArray(data)) {
      const results = await userService.createMultipleUsers(data);

      return res.status(201).json({
        data: results,
      });
    }

    const result = await userService.createUser(data);

    if (result.error) {
      return res.status(result.status).json(result.error);
    }

    return res.status(201).json({
      data: result,
    });
  } catch (err) {
    return res.status(400).json({
      message: err.message,
    });
  }
};

const importUsers = async (req, res) => {
  try {
    const results = await userService.importUsersFromLocal();

    return res.status(201).json({
      data: results,
    });
  } catch (err) {
    return res.status(400).json({
      message: err.message,
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const id = req.query._id;
    // Kiểm tra nếu không có _id trong query
    if (!id) {
      return res.status(400).json({ error: "Missing _id parameter" });
    }
    const data = req.body;

    const result = await userService.updateUser(id, data);

    if (result.error) {
      return res.status(result.status).json(result.error);
    }

    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({
      message: err.message,
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const id = req.query._id;

    // Kiểm tra nếu không có _id trong query
    if (!id) {
      return res.status(400).json({ error: "Missing _id parameter" });
    }
    const result = await userService.deleteUser(id);

    if (result.error) {
      return res.status(result.status).json(result.error);
    }

    return res.status(200).json({
      data: result,
    });
  } catch (err) {
    return res.status(400).json({
      message: err.message,
    });
  }
};

export default { createUser, importUsers, findUser, updateUser, deleteUser };
