const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
    seatNumber: {
        type: Number,
        required: true,
        unique: true,
        min: 1,
        max: 80
    },
    booked: {
        type: Boolean,
        default: false
    },
    bookedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('Seat', seatSchema);