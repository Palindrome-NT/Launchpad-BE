import mongoose, { Document, Schema } from 'mongoose';

export interface IPost extends Document {
  content: string;
  authorId: mongoose.Types.ObjectId;
  likesCount: number;
  commentsCount: number;
  isDeleted: boolean;
  media?: string[];
  mediaType?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    media: [{
      type: String, // URLs to uploaded media files
    }],
    mediaType: [{
      type: String,
      enum: ['image', 'video'],
    }],
  },
  {
    timestamps: true,
    collection: 'posts',
  }
);

postSchema.pre('save', function(next) {
  if (this.media && this.media.length > 0) {
    const videoCount = this.mediaType?.filter(type => type === 'video').length || 0;
    const imageCount = this.mediaType?.filter(type => type === 'image').length || 0;
    
    if (videoCount > 1) {
      return next(new Error('Maximum 1 video allowed per post'));
    }
    
    if (imageCount > 3) {
      return next(new Error('Maximum 3 images allowed per post'));
    }
    
    if (this.media.length !== this.mediaType?.length) {
      return next(new Error('Media and mediaType arrays must have the same length'));
    }
  }
  next();
});

postSchema.index({ authorId: 1, isDeleted: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });

export const Post = mongoose.models.Post || mongoose.model<IPost>('Post', postSchema);
