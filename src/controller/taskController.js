const Task = require("../models/Task");

// Create Task login user can create task
exports.createTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate, assignedTo } = req.body;

    if (req.user.role === "admin" || req.user.role === "manager") {
      const task = await Task.create({
        ...req.body,
        createdBy: req.user._id,
      });
      res.status(201).json(task);
    } else {
      const task = await Task.create({
        title,
        description,
        priority,
        dueDate,
        createdBy: req.user._id,
      });
      res.status(201).json(task);
    }
  } catch (err) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: err.message });
  }
};

// Get All Tasks (role-based)
exports.getTasks = async (req, res) => {
  let tasks;
  try {
    if (req.user.role === "admin" || req.user.role === "manager") {
      tasks = await Task.find().populate(
        "createdBy assignedTo",
        "name email role "
      );
    } else {
      tasks = await Task.find({
        $or: [{ createdBy: req.user._id }, { assignedTo: req.user._id }],
      }).populate("createdBy assignedTo", "name email role");
    }
    res.json(tasks);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: err.message });
  }
};

// Get Single Task
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (
      task.createdBy.toString() !== req.user._id.toString() &&
      task.assignedTo?.toString() !== req.user._id.toString() &&
      req.user.role === "user"
    ) {
      return res.json({ message: "Not authorized to see another user's task" });
    }
    res.json(task);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: err.message });
  }
};

// Update Task
exports.updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Permission: admin/manager OR creator of the task
    if (
      task.createdBy.toString() !== req.user._id.toString() &&
      task.assignedTo?.toString() !== req.user._id.toString() &&
      req.user.role === "user"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }
    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.json(task);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: err.message });
  }
};

// Delete Task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (
      req.user.role === "user" &&
      task.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await task.deleteOne();
    res.json({ message: "Task removed" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: err.message });
  }
};
