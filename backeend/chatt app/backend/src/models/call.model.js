import mongoose from 'mongoose';

const callSchema = new mongoose.Schema({
    callerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['audio', 'video'],
        required: true
    },
    status: {
        type: String,
        enum: ['initiated', 'ringing', 'answered', 'declined', 'missed', 'ended'],
        default: 'initiated'
    },
    duration: {
        type: Number, // in seconds
        default: 0
    },
    startedAt: {
        type: Date
    },
    endedAt: {
        type: Date
    },
    callLog: [{
        event: String,
        timestamp: Date,
        metadata: mongoose.Schema.Types.Mixed
    }]
}, {
    timestamps: true
});

const Call = mongoose.model('Call', callSchema);
export default Call;