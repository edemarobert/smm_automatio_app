import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2800
  },
  platforms: {
    instagram: { type: Boolean, default: false },
    twitter: { type: Boolean, default: false },
    facebook: { type: Boolean, default: false },
    linkedin: { type: Boolean, default: false }
  },
  images: [{
    url: String,
    alt: String
  }],
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published', 'failed'],
    default: 'draft'
  },
  scheduledFor: {
    type: Date,
    default: null
  },
  publishedAt: {
    type: Date,
    default: null
  },
  metrics: {
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 }
  },
  platformResults: [{
    platform: String,
    postId: String,
    url: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.model('Post', postSchema);
