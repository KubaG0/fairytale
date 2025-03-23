const mongoose = require('mongoose');

const FairytaleSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    required: [true, 'Opis bajki jest wymagany'],
    trim: true
  },
  characters: {
    type: String,
    required: [true, 'Bohaterowie są wymagani'],
    trim: true
  },
  duration: {
    type: Number,
    required: [true, 'Czas trwania jest wymagany'],
    min: [10, 'Minimalny czas trwania to 10 sekund'],
    max: [180, 'Maksymalny czas trwania to 3 minuty']
  },
  textContent: {
    type: String,
    trim: true
  },
  audioUrl: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'generating', 'completed', 'failed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indeks do efektywnego wyszukiwania wg. użytkownika i daty
FairytaleSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Fairytale', FairytaleSchema);