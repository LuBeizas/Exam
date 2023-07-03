const express = require('express');
const mysql = require('mysql2');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { authenticate } = require('./middleware');
require('dotenv').config();

const server = express();
server.use(express.json());
server.use(cors());
server.use(cookieParser());

const mysqlConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Lukas123',
  database: 'accounts',
};

const userSchema = Joi.object({
  full_name: Joi.string().trim(),
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().required(),
});

const groupSchema = Joi.object({
  name: Joi.string().trim().required(),
});

const dbPool = mysql.createPool(mysqlConfig).promise();

let authToken;

server.get('/', authenticate, (req, res) => {
  console.log(req.user);
  res.status(200).send({ message: 'Authorized' });
});

server.post('/login', async (req, res) => {
  let payload = req.body;

  try {
    payload = await userSchema.validateAsync(payload);
  } catch (error) {
    console.error(error);

    return res.status(400).send({ error: 'All fields are required' });
  }

  try {
    const [data] = await dbPool.execute(
      `
          SELECT * FROM users
          WHERE email = ?
      `,
      [payload.email]
    );

    if (!data.length) {
      return res.status(400).send({ error: 'Email or password did not match' });
    }

    const isPasswordMatching = await bcrypt.compare(
      payload.password,
      data[0].password
    );

    if (isPasswordMatching) {
      const token = jwt.sign(
        {
          email: data[0].email,
          id: data[0].id,
        },
        process.env.JWT_SECRET
      );
      authToken = token; // Store the token in the variable
      return res.status(200).send({ token: authToken, id: data[0].id });
    }

    return res.status(400).send({ error: 'Email or password did not match' });
  } catch (error) {
    console.error(error);
    return res.status(500).end();
  }
});

server.post('/register', async (req, res) => {
  let payload = req.body;

  try {
    payload = await userSchema.validateAsync(payload);
  } catch (error) {
    console.error(error);

    return res.status(400).send({ error: 'All fields are required' });
  }

  try {
    const encryptedPassword = await bcrypt.hash(payload.password, 10);
    const [response] = await dbPool.execute(
      `
                INSERT INTO users (full_name, email, password)
                VALUES (?, ?, ?)
            `,
      [payload.full_name, payload.email, encryptedPassword]
    );
    const token = jwt.sign(
      {
        email: payload.email,
        id: response.insertId,
        full_name: payload.full_name,
      },
      process.env.JWT_SECRET
    );
    authToken = token; // Store the token in the variable
    return res.status(201).json({ token: authToken });
  } catch (error) {
    console.error(error);
    return res.status(500).end();
  }
});

server.post('/accounts', authenticate, async (req, res) => {
  try {
    const groupId = req.body.groupId;
    const userId = req.user.id;

    const [groupData] = await dbPool.execute(
      `
          SELECT * FROM \`groups\` WHERE id = ?
        `,
      [groupId]
    );

    if (!groupData.length) {
      return res.status(404).send({ error: 'Group not found' });
    }

    const [accountData] = await dbPool.execute(
      `
          INSERT INTO accounts (user_id, group_id)
          VALUES (?, ?)
        `,
      [userId, groupId]
    );

    if (accountData.affectedRows === 1) {
      return res.status(201).send({ message: 'Group added successfully' });
    } else {
      return res.status(500).send({ error: 'Failed to add group to account' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).end();
  }
});

server.post('/groups', authenticate, async (req, res) => {
  let payload = req.body;

  try {
    payload = await groupSchema.validateAsync(payload);
  } catch (error) {
    console.error(error);

    return res.status(400).send({ error: 'All fields are required' });
  }

  try {
    const [response] = await dbPool.execute(
      `
            INSERT INTO groups (name)
            VALUES (?)
        `,
      [payload.name]
    );

    return res.status(201).json({ id: response.insertId, name: payload.name });
  } catch (error) {
    console.error(error);
    return res.status(500).end();
  }
});

server.get('/groups', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const [groupData] = await dbPool.execute(
      `
        SELECT g.id, g.name FROM groups AS g
        INNER JOIN user_groups AS ug ON g.id = ug.group_id
        WHERE ug.user_id = ?
        `,
      [userId]
    );

    res.status(200).send({ groups: groupData });
  } catch (error) {
    console.error(error);
    return res.status(500).end();
  }
});

server.listen(8080, () => {
  console.log('Server is running on port 8080');
});
