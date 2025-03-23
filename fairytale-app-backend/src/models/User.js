const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config/env');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Imię jest wymagane'],
    trim: true,
    maxlength: [50, 'Imię nie może być dłuższe niż 50 znaków']
  },
  email: {
    type: String,
    required: [true, 'Email jest wymagany'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Podaj prawidłowy adres email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Hasło jest wymagane'],
    minlength: [8, 'Hasło musi mieć minimum 8 znaków'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hashowanie hasła przed zapisem
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Metoda generowania tokenu JWT
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRE }
  );
};

// Metoda porównywania hasła
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);