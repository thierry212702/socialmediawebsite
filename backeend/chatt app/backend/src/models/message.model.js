import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        default: ''
    },
    image: {
        url: String,
        publicId: String
    },
    voiceMessage: {
        url: String,
        duration: Number, // in seconds
        publicId: String
    },
    file: {
        url: String,
        filename: String,
        size: Number,
        type: String // 'pdf', 'doc', 'xls', etc.
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'voice', 'file', 'system'],
        default: 'text'
    },
    callData: {
        type: {
            type: String,
            enum: ['audio', 'video']
        },
        duration: Number, // in seconds
        status: {
            type: String,
            enum: ['missed', 'answered', 'declined']
        },
        startedAt: Date,
        endedAt: Date
    },
    read: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    }
}, {
    timestamps: true
});

const Message = mongoose.model('Message', messageSchema);
export default Message;