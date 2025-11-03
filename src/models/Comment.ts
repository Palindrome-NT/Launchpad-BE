import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
  content: string;
  authorId: mongoose.Types.ObjectId;
  postId: mongoose.Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    content: {
      type: String,
      maxlength: 500,
      trim: true,
      required: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'comments',
  }
);

commentSchema.index({ postId: 1, isDeleted: 1, createdAt: -1 });
commentSchema.index({ authorId: 1, isDeleted: 1 });

export const Comment = mongoose.models.Comment || mongoose.model<IComment>('Comment', commentSchema);
