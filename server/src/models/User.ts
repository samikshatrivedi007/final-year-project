import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'student' | 'faculty' | 'admin' | 'superadmin';

export interface IUser extends Document {
    username: string;
    passwordHash: string;
    role: UserRole;
    rollOrId: string;
    phone: string;
    createdAt: Date;
    comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
    {
        username: { type: String, required: true, trim: true },
        passwordHash: { type: String, required: true },
        role: { type: String, enum: ['student', 'faculty', 'admin', 'superadmin'], required: true },
        rollOrId: { type: String, required: true, unique: true, trim: true },
        phone: { type: String, required: true, trim: true },
    },
    { timestamps: true }
);

userSchema.pre('save', async function (next) {
    if (!this.isModified('passwordHash')) return next();
    this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
    next();
});

userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
};

export const User = mongoose.model<IUser>('User', userSchema);
