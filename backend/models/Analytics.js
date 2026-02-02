import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
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
  date: {
    type: Date,
    default: Date.now
  },
  metrics: {
    totalFollowers: { 
        type: Number, 
        default: 0 
    },
    newFollowers: { 
        type: Number, 
        default: 0 
    },
    impressions: { 
        type: Number, 
        default: 0 
    },
    engagementRate: { 
        type: Number, 
        default: 0 
    },
    totalLikes: { 
        type: Number, 
        default: 0 
    },
    totalComments: { 
        type: Number, 
        default: 0 
    },
    totalShares: { 
        type: Number, 
        default: 0 
    },
    clicks: { 
        type: Number, 
        default: 0 
    },
    conversions: { 
        type: Number, 
        default: 0  
    }
  },
  postPerformance: [{
    postId: mongoose.Schema.Types.ObjectId,
    likes: Number,
    comments: Number,
    shares: Number,
    impressions: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

analyticsSchema.index({ userId: 1, date: -1 });
analyticsSchema.index({ userId: 1, platform: 1, date: -1 });

export default mongoose.model('Analytics', analyticsSchema);
