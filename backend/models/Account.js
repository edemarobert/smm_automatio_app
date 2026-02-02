import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    enum: ['instagram', 'twitter', 'facebook', 'linkedin'],
    required: true
  },
  accountName: {
    type: String,
    required: true
  },
  accountHandle: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    required: true
  },
  accessTokenSecret: {
    type: String,
    default: null // For Twitter refresh token
  },
  refreshToken: {
    type: String,
    default: null
  },
  profileImage: {
    type: String,
    default: null
  },
  followerCount: {
    type: Number,
    default: 0
  },
  // Platform-specific fields
  pageId: {
    type: String,
    default: null // For Facebook pages
  },
  businessAccountId: {
    type: String,
    default: null // For Instagram business accounts
  },
  personUrn: {
    type: String,
    default: null // For LinkedIn profile URN
  },
  isConnected: {
    type: Boolean,
    default: true
  },
  connectedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

accountSchema.index({ userId: 1, platform: 1 }, { unique: true });

export default mongoose.model('Account', accountSchema);
