const mongoose = require('mongoose');
const { isEmail } = require('validator');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter a name'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please enter a email address'],
      unique: [true, 'email address already exists'],
      lowercase: true,
      trim: true,
      validate: [isEmail, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Please enter a password'],
      trim: true,
      minlength: [6, 'Please enter at least 6 characters'],
    },
    gender: {
      type: String,
      enum: ['Male', 'Female'],
      default: 'Male'
    }
  }
);

// fire a function before docoument saved to the database
userSchema.pre('save', async function (next) {
  // Generate a salt and hash the user's password before saving
  const salt = await bcrypt.genSalt();

  // Hashes the user password before saving it to the database using bcrypt algorithm
  this.password = await bcrypt.hash(this.password, salt);

  next();
})

userSchema.statics.login = async function (email, password) {
  const user = await this.findOne({ email });

  // Check if user with given email exists in database
  if (user) {
    const auth = await bcrypt.compare(password, user.password);
    // Check if provided password matches the one in the database
    if (auth) {
      return user;
    }
    throw new Error('Incorrect password');
  }
  throw new Error('Incorrect email');
}
// Incorrect email or password

const User = mongoose.model('User', userSchema);

module.exports = User;