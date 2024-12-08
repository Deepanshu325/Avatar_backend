const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('./db/Users')
const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect("mongodb://localhost:27017/assignment", { useNewUrlParser: true, useUnifiedTopology: true });



app.get('/api/users', async (req, res) => {
  const { page = 1, limit = 20, search = '', domain, gender,available} = req.query;

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;

  const filter = {
    ...(search && { first_name : { $regex: search, $options: 'i' }}),
    ...(domain && { domain }),
    ...(gender && { gender }),
    ...(available && { available: available == 'true' }),
  };

  try {

    const users = await User.find(filter)
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .exec();

  
    const count = await User.countDocuments(filter);

    res.json({
      users,
      totalPages: Math.ceil(count / limitNum),
      currentPage: pageNum,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error });
  }
});

  
  app.get('/api/users/:id', async (req, res) => {
    const user = await User.findById(req.params.id);
    res.json(user);
  });
  
  app.post('/api/users', async (req, res) => {
    const user = new User(req.body);
    await user.save();
    res.send(user);
  });
  
  app.put('/api/users/:id', async (req, res) => {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(user);
  });
  
  app.delete('/api/users/:id', async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  });
  
  app.post('/api/team', async (req, res) => {
    const team = req.body.users;
    const uniqueDomains = new Set();
    for (const user of team) {
      if (!user.availability || uniqueDomains.has(user.domain)) {
        return res.status(400).json({ message: 'Users must have unique domains and be available' });
      }
      uniqueDomains.add(user.domain);
    }
    res.json({ message: 'Team created', team });
  });
  
  app.listen(5000, () => {
    console.log('Server is running on port 5000');
  });